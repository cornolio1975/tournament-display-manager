'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Maximize2,
  Minimize2,
  X,
  Trophy,
  MapPin,
  Calendar,
  SkipForward,
  SkipBack,
  Clock,
  Radio,
  ListOrdered,
  ArrowDownCircle,
  Activity,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
} from 'lucide-react';
import { getSponsors, getActiveTournament, getPlaylist } from '@/lib/storage';
import { Sponsor, Tournament, PlaylistItem, LiveMatchData, BridgeConnectionStatus } from '@/lib/types';
import {
  subscribeLiveMatchRealtime,
  getBridgeDiagnosticInfo,
  getInitialLiveMatchData,
  getLiveMatchDataByBoutId,
  sendBridgeTestMessage,
} from '@/lib/karateTechBridge';
import { db } from '@/db/dbClient';
import { DisplayPlaylist, DisplayPlaylistSlide } from '@/db/types';
import { SpLogo } from '@/components/ui/SpLogo';
import { DisplayPlaylistModal } from '@/components/playlist/DisplayPlaylistModal';
import { supabase } from '@/lib/supabaseClient';

// --- INITIAL LIVE KUMITE PLACEHOLDER STATE ---
const INITIAL_KUMITE: LiveMatchData = {
  category: 'Waiting for KarateTech live data',
  round: 'Standby',
  tatami: 'Tatami 1',
  matchTime: '03:00',
  aka: {
    name: 'AKA ATHLETE',
    country: '',
    club: '',
    score: 0,
    senshu: false,
    fouls: [],
  },
  ao: {
    name: 'AO ATHLETE',
    country: '',
    club: '',
    score: 0,
    senshu: false,
    fouls: [],
  },
  lastEvent: 'NO_LIVE_DATA_YET',
  lastMessageTime: '--:--:--',
};

type KataJudgeCell = {
  name: string;
  score: number | null;
};

type BracketRow = {
  id: string;
  round: string;
  red: string;
  blue: string;
  score: string;
  winner: 'red' | 'blue' | 'live' | 'none';
};

type StandingsRow = {
  rank: number;
  team: string;
  wins: number;
  played: number;
  scored: number;
  total: number;
};

type ScheduleRow = {
  id: string;
  bout: number;
  category: string;
  red: string;
  blue: string;
  tatami: string;
  status: string;
};

function isPlaceholderAthleteName(name?: string): boolean {
  if (!name) return true;
  const normalized = name.trim().toUpperCase();
  return normalized === 'AKA ATHLETE' || normalized === 'AO ATHLETE';
}

function isPlaceholderCategory(category?: string): boolean {
  if (!category) return true;
  const normalized = category.trim().toLowerCase();
  return normalized === 'kumite senior' || normalized === 'male senior kumite' || normalized === 'waiting for karatetech live data';
}

function mergeLiveMatchForSameMatch(previous: LiveMatchData, incoming: LiveMatchData): LiveMatchData {
  const sameMatch = !!previous.matchId && !!incoming.matchId && previous.matchId === incoming.matchId;
  if (!sameMatch) return incoming;

  return {
    ...previous,
    ...incoming,
    category: isPlaceholderCategory(incoming.category) ? previous.category : incoming.category,
    round: incoming.round || previous.round,
    tatami: incoming.tatami || previous.tatami,
    aka: {
      ...previous.aka,
      ...incoming.aka,
      name: isPlaceholderAthleteName(incoming.aka.name) ? previous.aka.name : incoming.aka.name,
      club: incoming.aka.club || previous.aka.club,
      country: incoming.aka.country || previous.aka.country,
      fouls: incoming.aka.fouls?.length ? incoming.aka.fouls : previous.aka.fouls,
    },
    ao: {
      ...previous.ao,
      ...incoming.ao,
      name: isPlaceholderAthleteName(incoming.ao.name) ? previous.ao.name : incoming.ao.name,
      club: incoming.ao.club || previous.ao.club,
      country: incoming.ao.country || previous.ao.country,
      fouls: incoming.ao.fouls?.length ? incoming.ao.fouls : previous.ao.fouls,
    },
  };
}

function hasMeaningfulPinnedData(data: LiveMatchData | null): data is LiveMatchData {
  if (!data) return false;
  const hasParticipantIds = !!data.participantAId || !!data.participantBId;
  const hasRealNames = !isPlaceholderAthleteName(data.aka.name) || !isPlaceholderAthleteName(data.ao.name);
  const hasLiveScore = (data.aka.score ?? 0) !== 0 || (data.ao.score ?? 0) !== 0;
  const hasTimerSignal = !!data.timerActive;
  return hasParticipantIds || hasRealNames || hasLiveScore || hasTimerSignal;
}

function normalizeTatamiLabel(raw?: string | null): string {
  if (!raw) return 'Tatami TBD';
  return raw.toLowerCase().includes('tatami') ? raw : `Tatami ${raw}`;
}

function getStatusPriority(status?: string): number {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('running') || normalized.includes('progress') || normalized.includes('live')) return 0;
  if (normalized.includes('on deck')) return 1;
  if (normalized.includes('scheduled') || normalized.includes('upcoming')) return 2;
  if (normalized.includes('completed')) return 3;
  if (normalized.includes('walkover')) return 4;
  return 5;
}

export default function PublicDisplayPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [legacyPlaylist, setLegacyPlaylist] = useState<PlaylistItem[]>([]);
  
  // Database Playlist State
  const [activeDisplayPlaylist, setActiveDisplayPlaylist] = useState<DisplayPlaylist | null>(null);
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [slideTimeRemaining, setSlideTimeRemaining] = useState<number>(15);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);

  // Live Match State & Diagnostics
  const [liveMatch, setLiveMatch] = useState<LiveMatchData>(INITIAL_KUMITE);
  const [hasLiveMatch, setHasLiveMatch] = useState<boolean>(false);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeConnectionStatus>('CONNECTING');
  // Safe static default — getBridgeDiagnosticInfo() reads process.env and must NOT be called
  // during useState() as that runs during SSR, causing server/client hydration mismatch.
  const [bridgeDiagnostic, setBridgeDiagnostic] = useState<ReturnType<typeof getBridgeDiagnosticInfo>>({
    supabaseUrl: '',
    wsUrl: '',
    status: 'CONNECTING' as BridgeConnectionStatus,
    lastReceivedEvent: 'NONE',
    lastReceivedTime: '--:--:--',
    lastReceivedData: null,
  });
  const [showDiagnosticPanel, setShowDiagnosticPanel] = useState<boolean>(false);
  const [testLogMessage, setTestLogMessage] = useState<string>('');

  // Playback & UI controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Screen Sizing & Zoom Controls
  const [fitMode, setFitMode] = useState<'cover' | 'contain' | 'fill'>('cover');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Auto-scroll State
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [forcedBoutId, setForcedBoutId] = useState<string | null>(null);
  const [enforceForcedBoutId, setEnforceForcedBoutId] = useState<boolean>(false);
  const [kataTitle, setKataTitle] = useState<string>('WKF KATA SCOREBOARD');
  const [kataAthlete, setKataAthlete] = useState<string>('Awaiting Kata Athlete');
  const [kataAthleteMeta, setKataAthleteMeta] = useState<string>('No judge feed exposed by source yet');
  const [kataJudges, setKataJudges] = useState<KataJudgeCell[]>(
    Array.from({ length: 7 }, (_, idx) => ({ name: `J${idx + 1}`, score: null }))
  );
  const [kataTotalScore, setKataTotalScore] = useState<number | null>(null);
  const [bracketTitle, setBracketTitle] = useState<string>('Live Category Brackets');
  const [bracketRows, setBracketRows] = useState<BracketRow[]>([]);
  const [standingsRows, setStandingsRows] = useState<StandingsRow[]>([]);
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide: DisplayPlaylistSlide | undefined = activeDisplayPlaylist?.slides[slideIndex];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qBoutId = params.get('boutId');
    setForcedBoutId(qBoutId || null);
  }, []);

  // Subscribe to KarateTech Realtime Live Match Broadcast & Table Updates
  useEffect(() => {
    let cancelled = false;

    // Populate bridgeDiagnostic on the client where process.env is safe to read
    setBridgeDiagnostic(getBridgeDiagnosticInfo());

    void (async () => {
      let initial: LiveMatchData | null = null;
      if (forcedBoutId) {
        const pinned = await getLiveMatchDataByBoutId(forcedBoutId);
        if (hasMeaningfulPinnedData(pinned)) {
          setEnforceForcedBoutId(true);
          initial = pinned;
        } else {
          setEnforceForcedBoutId(false);
          initial = await getInitialLiveMatchData();
        }
      } else {
        setEnforceForcedBoutId(false);
        initial = await getInitialLiveMatchData();
      }
      if (cancelled || !initial) return;
      setLiveMatch(initial);
      setHasLiveMatch(true);
      setBridgeDiagnostic(getBridgeDiagnosticInfo());
    })();

    const poll = setInterval(() => {
      void (async () => {
        let latest: LiveMatchData | null = null;
        if (forcedBoutId && enforceForcedBoutId) {
          const pinned = await getLiveMatchDataByBoutId(forcedBoutId);
          latest = hasMeaningfulPinnedData(pinned) ? pinned : await getInitialLiveMatchData();
        } else {
          latest = await getInitialLiveMatchData();
        }
        if (cancelled || !latest) return;

        if (forcedBoutId && enforceForcedBoutId && latest.matchId && latest.matchId !== forcedBoutId) {
          return;
        }

        const currentTatami = currentSlide?.tatami_filter || activeDisplayPlaylist?.tatami || 'ALL';
        if (currentTatami !== 'ALL' && latest.tatami && latest.tatami.toLowerCase() !== currentTatami.toLowerCase()) {
          return;
        }

        setLiveMatch((prev) => mergeLiveMatchForSameMatch(prev, latest));
        setHasLiveMatch(true);
        setBridgeDiagnostic(getBridgeDiagnosticInfo());
      })();
    }, 5000);

    console.info('[DISPLAY] Initializing KarateTech Realtime Live Match subscription...');
    
    const unsub = subscribeLiveMatchRealtime(
      (data: LiveMatchData) => {
        console.info('[DISPLAY] EVENT RECEIVED:', data);

        if (forcedBoutId && enforceForcedBoutId && data.matchId && data.matchId !== forcedBoutId) {
          console.info(`[DISPLAY] EVENT FILTERED OUT: match '${data.matchId}' does not match forced bout '${forcedBoutId}'`);
          setBridgeDiagnostic(getBridgeDiagnosticInfo());
          return;
        }
        
        // Filter by Tatami if slide has a specific filter
        const currentTatami = currentSlide?.tatami_filter || activeDisplayPlaylist?.tatami || 'ALL';
        console.info(`[DISPLAY] Filtering check: Incoming Tatami='${data.tatami}', Current Display Tatami='${currentTatami}'`);
        
        if (currentTatami !== 'ALL' && data.tatami && data.tatami.toLowerCase() !== currentTatami.toLowerCase()) {
          console.info(`[DISPLAY] EVENT FILTERED OUT: tatami '${data.tatami}' does not match '${currentTatami}'`);
          setBridgeDiagnostic(getBridgeDiagnosticInfo());
          return;
        }

        setLiveMatch((prev) => mergeLiveMatchForSameMatch(prev, data));
        setHasLiveMatch(true);
        setBridgeDiagnostic(getBridgeDiagnosticInfo());
        console.info('[DISPLAY] STATE UPDATED -> Scoreboard UI updated with live match data');
      },
      (status, info) => {
        setBridgeStatus(status);
        setBridgeDiagnostic(getBridgeDiagnosticInfo());
        console.info(`[DISPLAY] Bridge Connection Status Changed: ${status}`, info);
      }
    );

    return () => {
      cancelled = true;
      clearInterval(poll);
      console.info('[DISPLAY] Cleaning up KarateTech Realtime Live Match subscription');
      unsub();
    };
  }, [currentSlide, activeDisplayPlaylist, forcedBoutId, enforceForcedBoutId]);

  // Load screen config
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('sp_display_screen_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.fitMode) setFitMode(parsed.fitMode);
        if (parsed.zoomLevel) setZoomLevel(parsed.zoomLevel);
      }
    } catch (e) {
      console.error('[DISPLAY] Error loading screen config:', e);
    }
  }, []);

  // Auto-scroll loop for long schedule/bracket tables
  useEffect(() => {
    if (!isAutoScrolling) return;

    const interval = setInterval(() => {
      if (slideContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = slideContainerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 20) {
          slideContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          slideContainerRef.current.scrollBy({ top: 150, behavior: 'smooth' });
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isAutoScrolling]);

  // Reset scroll to top when slide changes
  useEffect(() => {
    if (slideContainerRef.current) {
      slideContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [slideIndex]);

  // Load data & handle localStorage sync across tabs
  const loadData = async () => {
    try {
      const activeSps = (await getSponsors()).filter((s) => !s.isDeleted && s.active);
      const activeTourn = await getActiveTournament();
      const activeMedia = (await getPlaylist()).filter((p) => !p.isDeleted && p.active);

      setSponsors(activeSps);
      setTournament(activeTourn);
      setLegacyPlaylist(activeMedia);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const qPlaylistId = params.get('playlistId');
        const allPlaylists = await db.displayPlaylists.list();

        if (qPlaylistId) {
          const found = allPlaylists.find((p) => p.id === qPlaylistId);
          if (found) {
            setActiveDisplayPlaylist(found);
            return;
          }
        }

        const activeDB = allPlaylists.find((p) => p.is_active) || allPlaylists[0] || null;
        setActiveDisplayPlaylist(activeDB);
      }
    } catch (err) {
      console.error('[DISPLAY] Error loading display data:', err);
    }
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ts_sponsors_updated', handleStorageChange);
    window.addEventListener('ts_tournaments_updated', handleStorageChange);
    window.addEventListener('ts_playlist_updated', handleStorageChange);
    window.addEventListener('ts_display_playlists_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ts_sponsors_updated', handleStorageChange);
      window.removeEventListener('ts_tournaments_updated', handleStorageChange);
      window.removeEventListener('ts_playlist_updated', handleStorageChange);
      window.removeEventListener('ts_display_playlists_updated', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDerivedSlidesData = async () => {
      try {
        const { data: bouts, error: boutsError } = await supabase
          .from('bouts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(300);

        if (boutsError || !bouts) return;

        const rows = bouts as Array<Record<string, any>>;
        const participantIds = Array.from(
          new Set(
            rows
              .flatMap((row) => [row.participant_a_id, row.participant_b_id])
              .filter((id): id is string => Boolean(id))
          )
        );
        const categoryIds = Array.from(
          new Set(rows.map((row) => row.category_id).filter((id): id is string => Boolean(id)))
        );

        const { data: participants } = participantIds.length
          ? await supabase.from('participants').select('id,full_name,club_id,nationality_code').in('id', participantIds)
          : { data: [] as Array<Record<string, any>> };

        const clubIds = Array.from(
          new Set((participants || []).map((p: any) => p.club_id).filter((id: any): id is string => Boolean(id)))
        );

        const { data: clubs } = clubIds.length
          ? await supabase.from('clubs').select('id,name').in('id', clubIds)
          : { data: [] as Array<Record<string, any>> };

        const { data: categories } = categoryIds.length
          ? await supabase.from('categories').select('id,name').in('id', categoryIds)
          : { data: [] as Array<Record<string, any>> };

        if (cancelled) return;

        const participantMap = new Map<string, Record<string, any>>((participants || []).map((p: any) => [p.id, p]));
        const clubMap = new Map<string, string>((clubs || []).map((c: any) => [c.id, c.name]));
        const categoryMap = new Map<string, string>((categories || []).map((c: any) => [c.id, c.name]));

        const formatFighter = (participantId?: string | null, fallback?: string) => {
          if (!participantId) return fallback || 'TBD ATHLETE';
          const p = participantMap.get(participantId);
          if (!p) return fallback || 'TBD ATHLETE';
          const name = String(p.full_name || fallback || 'TBD ATHLETE').toUpperCase();
          const country = String(p.nationality_code || '').trim();
          return country ? `${name} (${country})` : name;
        };

        const tatamiFilter = currentSlide?.tatami_filter || activeDisplayPlaylist?.tatami || 'ALL';
        const filteredByTatami = rows.filter((row) => {
          if (tatamiFilter === 'ALL') return true;
          if (!row.tatami) return false;
          return normalizeTatamiLabel(String(row.tatami)).toLowerCase() === tatamiFilter.toLowerCase();
        });

        const sortedForQueue = [...(filteredByTatami.length ? filteredByTatami : rows)].sort((a, b) => {
          const statusCompare = getStatusPriority(a.status) - getStatusPriority(b.status);
          if (statusCompare !== 0) return statusCompare;
          return Date.parse(String(b.created_at || 0)) - Date.parse(String(a.created_at || 0));
        });

        setScheduleRows(
          sortedForQueue.slice(0, 12).map((row) => ({
            id: String(row.id),
            bout: Number(row.bout_no || 0),
            category: categoryMap.get(String(row.category_id || '')) || 'Category TBD',
            red: formatFighter(row.participant_a_id),
            blue: formatFighter(row.participant_b_id),
            tatami: normalizeTatamiLabel(row.tatami),
            status: String(row.status || 'Scheduled'),
          }))
        );

        const selectedCategoryId = (() => {
          if (currentSlide?.category_filter) {
            const filter = currentSlide.category_filter.toLowerCase();
            const found = [...categoryMap.entries()].find(([, name]) => name.toLowerCase().includes(filter));
            if (found) return found[0];
          }
          if (liveMatch.categoryId) return liveMatch.categoryId;
          const running = rows.find((row) => getStatusPriority(row.status) === 0);
          return running?.category_id ? String(running.category_id) : null;
        })();

        const bracketSource = selectedCategoryId
          ? rows.filter((row) => String(row.category_id || '') === selectedCategoryId)
          : rows;

        const bracketSorted = [...bracketSource]
          .filter((row) => row.participant_a_id || row.participant_b_id || (row.score_a ?? 0) !== 0 || (row.score_b ?? 0) !== 0)
          .sort((a, b) => {
            const roundA = Number(a.round_no || 0);
            const roundB = Number(b.round_no || 0);
            if (roundA !== roundB) return roundA - roundB;
            return Number(a.bout_no || 0) - Number(b.bout_no || 0);
          });

        setBracketTitle(
          selectedCategoryId ? (categoryMap.get(selectedCategoryId) || 'Live Category Brackets') : 'Live Category Brackets'
        );
        setBracketRows(
          bracketSorted.slice(0, 16).map((row) => {
            const status = String(row.status || '').toLowerCase();
            const winner: 'red' | 'blue' | 'live' | 'none' =
              status.includes('running') || status.includes('progress')
                ? 'live'
                : row.winner_id && row.participant_a_id && row.winner_id === row.participant_a_id
                ? 'red'
                : row.winner_id && row.participant_b_id && row.winner_id === row.participant_b_id
                ? 'blue'
                : 'none';
            return {
              id: String(row.id),
              round: row.round_no ? `Round ${row.round_no}` : `Bout ${row.bout_no || '-'}`,
              red: formatFighter(row.participant_a_id),
              blue: formatFighter(row.participant_b_id),
              score: `${row.score_a ?? 0} - ${row.score_b ?? 0}${winner === 'live' ? ' (LIVE)' : ''}`,
              winner,
            };
          })
        );

        const kataCategoryIds = new Set(
          [...categoryMap.entries()]
            .filter(([, name]) => name.toLowerCase().includes('kata'))
            .map(([id]) => id)
        );

        const kataCandidates = rows
          .filter((row) => kataCategoryIds.has(String(row.category_id || '')))
          .sort((a, b) => {
            const statusCompare = getStatusPriority(a.status) - getStatusPriority(b.status);
            if (statusCompare !== 0) return statusCompare;
            return Date.parse(String(b.created_at || 0)) - Date.parse(String(a.created_at || 0));
          });

        const kataRow = kataCandidates.find((row) => row.participant_a_id || row.participant_b_id) || kataCandidates[0];
        if (kataRow) {
          const kataFighterId = String(kataRow.participant_a_id || kataRow.participant_b_id || '');
          const kataParticipant = participantMap.get(kataFighterId);
          const kataClub = kataParticipant?.club_id ? clubMap.get(String(kataParticipant.club_id)) : '';
          const categoryName = categoryMap.get(String(kataRow.category_id || '')) || 'WKF KATA SCOREBOARD';

          setKataTitle(categoryName);
          setKataAthlete(formatFighter(kataFighterId, 'Awaiting Kata Athlete'));
          setKataAthleteMeta(kataClub || 'No judge feed exposed by source yet');

          const history = Array.isArray(kataRow.points_aka_history)
            ? kataRow.points_aka_history.map((x: any) => Number(x)).filter((x: number) => Number.isFinite(x) && x > 0)
            : [];

          if (history.length >= 5) {
            const judgeScores = Array.from({ length: 7 }, (_, idx) => history[idx] ?? null);
            setKataJudges(judgeScores.map((score, idx) => ({ name: `J${idx + 1}`, score })));
            const numericScores = judgeScores.filter((v): v is number => typeof v === 'number');
            const total = numericScores.length >= 5
              ? numericScores.reduce((sum, val) => sum + val, 0) - Math.min(...numericScores) - Math.max(...numericScores)
              : null;
            setKataTotalScore(total);
          } else {
            setKataJudges(Array.from({ length: 7 }, (_, idx) => ({ name: `J${idx + 1}`, score: null })));
            setKataTotalScore(null);
          }
        }

        const clubStats = new Map<string, { team: string; wins: number; played: number; scored: number }>();
        for (const row of rows) {
          const participantA = participantMap.get(String(row.participant_a_id || ''));
          const participantB = participantMap.get(String(row.participant_b_id || ''));

          const clubAId = participantA?.club_id ? String(participantA.club_id) : '';
          const clubBId = participantB?.club_id ? String(participantB.club_id) : '';

          if (clubAId) {
            const team = clubMap.get(clubAId) || 'Unknown Club';
            const stats = clubStats.get(clubAId) || { team, wins: 0, played: 0, scored: 0 };
            stats.played += 1;
            stats.scored += Number(row.score_a || 0);
            if (row.winner_id && row.participant_a_id && row.winner_id === row.participant_a_id) stats.wins += 1;
            clubStats.set(clubAId, stats);
          }

          if (clubBId) {
            const team = clubMap.get(clubBId) || 'Unknown Club';
            const stats = clubStats.get(clubBId) || { team, wins: 0, played: 0, scored: 0 };
            stats.played += 1;
            stats.scored += Number(row.score_b || 0);
            if (row.winner_id && row.participant_b_id && row.winner_id === row.participant_b_id) stats.wins += 1;
            clubStats.set(clubBId, stats);
          }
        }

        const standings = [...clubStats.values()]
          .map((s) => ({
            ...s,
            total: s.wins * 3 + s.scored,
          }))
          .sort((a, b) => {
            if (b.total !== a.total) return b.total - a.total;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.scored - a.scored;
          })
          .slice(0, 12)
          .map((row, idx) => ({
            rank: idx + 1,
            team: row.team,
            wins: row.wins,
            played: row.played,
            scored: row.scored,
            total: row.total,
          }));

        setStandingsRows(standings);
      } catch (err) {
        console.error('[DISPLAY] Error loading derived slide data:', err);
      }
    };

    void loadDerivedSlidesData();
    const refresh = setInterval(() => {
      void loadDerivedSlidesData();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(refresh);
    };
  }, [activeDisplayPlaylist?.tatami, currentSlide?.category_filter, currentSlide?.tatami_filter, liveMatch.categoryId]);

  // DISPLAY PLAYLIST ROTATION TIMER
  useEffect(() => {
    if (!activeDisplayPlaylist || activeDisplayPlaylist.slides.length === 0 || !isPlaying) {
      return;
    }

    const current = activeDisplayPlaylist.slides[slideIndex];
    if (!current) {
      setSlideIndex(0);
      return;
    }

    const totalSecs = current.duration_seconds || 15;
    setSlideTimeRemaining(totalSecs);

    const interval = setInterval(() => {
      setSlideTimeRemaining((prev) => {
        if (prev <= 1) {
          handleNextSlide();
          return totalSecs;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeDisplayPlaylist, slideIndex, isPlaying]);

  const handleNextSlide = () => {
    if (!activeDisplayPlaylist || activeDisplayPlaylist.slides.length === 0) return;
    setSlideIndex((prev) => (prev + 1) % activeDisplayPlaylist.slides.length);
  };

  const handlePrevSlide = () => {
    if (!activeDisplayPlaylist || activeDisplayPlaylist.slides.length === 0) return;
    setSlideIndex((prev) => (prev - 1 + activeDisplayPlaylist.slides.length) % activeDisplayPlaylist.slides.length);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.error(err));
        setIsFullscreen(false);
      }
    }
  };

  const handleRunHealthTest = async (type: 'TEST_LIVE_UPDATE' | 'SCORE_UPDATE') => {
    setTestLogMessage(`Sending ${type}...`);
    const res = await sendBridgeTestMessage(type);
    setTestLogMessage(res.message);
    setBridgeDiagnostic(getBridgeDiagnosticInfo());
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen bg-[#060913] overflow-hidden font-sans text-white select-none"
    >
      {/* ========================================================================= */}
      {/* MULTI-SLIDE PRESENTATION PLAYER RENDERER ENGINE WITH SCROLLING SUPPORT */}
      {/* ========================================================================= */}

      {!currentSlide ? (
        /* FALLBACK EMPTY STATE */
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-slate-950 via-slate-900 to-black">
          <div className="p-6 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 mb-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] animate-pulse">
            <Trophy className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-wide">
            {tournament?.name || 'KarateTech Display Screen'}
          </h1>
          <p className="text-lg text-slate-400 mt-2 max-w-xl">
            No active display playlist configured. Click "Manage Playlists" in the bottom menu to configure live presentation loops.
          </p>
        </div>
      ) : (
        /* SCROLLABLE DISPLAY CONTAINER TARGET */
        <div
          ref={slideContainerRef}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden pt-28 pb-32 px-4 sm:px-8 custom-scrollbar scroll-smooth"
        >
          {currentSlide.type === 'kumite_scoreboard' ? (
            /* 1. LIVE KUMITE SPECTATOR SCOREBOARD */
            <div className="max-w-7xl mx-auto min-h-[calc(100vh-14rem)] flex flex-col justify-between py-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {hasLiveMatch ? (
                    <span className="px-3 py-1 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE KUMITE
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                      Waiting for Live Feed
                    </span>
                  )}
                  <span className="text-sm font-black text-cyan-400 uppercase tracking-widest">
                    {liveMatch.tatami || currentSlide.tatami_filter || 'Tatami 1'} — {liveMatch.category || currentSlide.category_filter || 'Kumite'}
                  </span>
                </div>
                <div className="px-4 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-cyan-300 font-bold text-sm">
                  MATCH TIME: <span className="text-white text-base">{liveMatch.matchTime || '03:00'}</span>
                </div>
              </div>

              {/* MAIN SCOREBOARD CENTER PIECE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto items-center">
                {/* AKA (RED ATHLETE) */}
                <div className="lg:col-span-5 bg-gradient-to-r from-red-950/80 via-red-900/40 to-slate-900/80 border-2 border-red-500/60 rounded-3xl p-8 flex flex-col justify-between shadow-[0_0_50px_rgba(239,68,68,0.25)] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-4 py-1 rounded-lg bg-red-600 font-black text-xs text-white uppercase tracking-wider">
                      AKA (RED)
                    </span>
                    {liveMatch.aka.senshu && (
                      <span className="px-3 py-1 rounded-full bg-yellow-500 text-black font-black text-xs tracking-wider shadow">
                        ★ SENSHU FIRST SCORE
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-4xl font-black text-white tracking-wide uppercase drop-shadow-md">
                      {liveMatch.aka.name}
                    </h2>
                    <p className="text-sm font-extrabold text-red-300 mt-1">
                      {liveMatch.aka.club || ''} {liveMatch.aka.country ? `(${liveMatch.aka.country})` : ''}
                    </p>
                  </div>

                  <div className="flex items-end justify-between mt-8">
                    <div className="flex items-center gap-1.5">
                      {['C1', 'C2', 'C3', 'HC', 'H'].map((f) => (
                        <span
                          key={f}
                          className={`px-2.5 py-1 rounded-md text-xs font-black border ${
                            liveMatch.aka.fouls?.includes(f)
                              ? 'bg-red-600 border-red-400 text-white shadow'
                              : 'bg-slate-900/60 border-slate-800 text-slate-600'
                          }`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="text-8xl font-black text-white font-mono tracking-tighter drop-shadow-lg">
                      {liveMatch.aka.score}
                    </div>
                  </div>
                </div>

                {/* VS CENTER BADGE */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center text-center py-4">
                  <span className="text-4xl font-black text-slate-600 tracking-tighter">VS</span>
                  <span className="text-xs font-bold text-cyan-400 mt-2 tracking-widest uppercase">{liveMatch.round || 'FINALS'}</span>
                </div>

                {/* AO (BLUE ATHLETE) */}
                <div className="lg:col-span-5 bg-gradient-to-l from-blue-950/80 via-blue-900/40 to-slate-900/80 border-2 border-blue-500/60 rounded-3xl p-8 flex flex-col justify-between shadow-[0_0_50px_rgba(59,130,246,0.25)] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-4 py-1 rounded-lg bg-blue-600 font-black text-xs text-white uppercase tracking-wider">
                      AO (BLUE)
                    </span>
                    {liveMatch.ao.senshu && (
                      <span className="px-3 py-1 rounded-full bg-yellow-500 text-black font-black text-xs tracking-wider shadow">
                        ★ SENSHU
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-4xl font-black text-white tracking-wide uppercase drop-shadow-md">
                      {liveMatch.ao.name}
                    </h2>
                    <p className="text-sm font-extrabold text-blue-300 mt-1">
                      {liveMatch.ao.club || ''} {liveMatch.ao.country ? `(${liveMatch.ao.country})` : ''}
                    </p>
                  </div>

                  <div className="flex items-end justify-between mt-8">
                    <div className="flex items-center gap-1.5">
                      {['C1', 'C2', 'C3', 'HC', 'H'].map((f) => (
                        <span
                          key={f}
                          className={`px-2.5 py-1 rounded-md text-xs font-black border ${
                            liveMatch.ao.fouls?.includes(f)
                              ? 'bg-blue-600 border-blue-400 text-white shadow'
                              : 'bg-slate-900/60 border-slate-800 text-slate-600'
                          }`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="text-8xl font-black text-white font-mono tracking-tighter drop-shadow-lg">
                      {liveMatch.ao.score}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : currentSlide.type === 'kata_scoreboard' ? (
            /* 2. WKF KATA 7-JUDGE SCOREBOARD */
            <div className="max-w-7xl mx-auto min-h-[calc(100vh-14rem)] flex flex-col justify-between py-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <span className="px-3 py-1 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 text-xs font-black uppercase tracking-wider">
                    WKF KATA SCOREBOARD (LIVE)
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">{kataTitle}</h2>
                  <p className="text-sm text-purple-200 mt-1 font-bold">{kataAthlete}</p>
                  <p className="text-xs text-purple-400 mt-0.5 font-semibold uppercase tracking-wide">{kataAthleteMeta}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 uppercase font-bold">Total Trimmed Score</span>
                  <div className="text-4xl font-black text-purple-400 font-mono">{kataTotalScore === null ? '--' : kataTotalScore.toFixed(1)}</div>
                </div>
              </div>

              {/* 7 JUDGES GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 my-auto">
                {kataJudges.map((j, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center justify-center gap-2 shadow-lg"
                  >
                    <span className="text-xs font-bold text-slate-400">{j.name}</span>
                    <span className="text-3xl font-black text-white font-mono">{j.score === null ? '--' : j.score.toFixed(1)}</span>
                    <span className="text-[10px] text-purple-400 font-semibold uppercase">{j.score === null ? 'Awaiting Feed' : 'Counted'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : currentSlide.type === 'category_brackets' ? (
            /* 3. CATEGORY BRACKETS & DRAWS */
            <div className="max-w-7xl mx-auto min-h-[calc(100vh-14rem)] flex flex-col py-4">
              <div className="border-b border-slate-800 pb-4 flex items-center justify-between mb-6">
                <div>
                  <span className="px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-black uppercase tracking-wider">
                    TOURNAMENT BRACKETS & DRAWS
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">{bracketTitle}</h2>
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase">LIVE BRACKET PROGRESSION</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-auto pb-8">
                {bracketRows.length === 0 && (
                  <div className="col-span-full p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 font-semibold">
                    No bracket rows available from live feed yet.
                  </div>
                )}
                {bracketRows.map((b) => (
                  <div key={b.id} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col gap-4">
                    <div className="text-xs font-black text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                      {b.round}
                    </div>
                    <div className="flex flex-col gap-2 text-sm font-bold">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-white">
                        <span>{b.red}</span>
                        <span className="font-mono font-black text-red-400">RED</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-white">
                        <span>{b.blue}</span>
                        <span className="font-mono font-black text-blue-400">BLUE</span>
                      </div>
                    </div>
                    <div className="text-center font-mono font-black text-cyan-300 text-sm mt-1">
                      SCORE: {b.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentSlide.type === 'medal_standings' ? (
            /* 4. MEDAL STANDINGS LEADERBOARD */
            <div className="max-w-6xl mx-auto min-h-[calc(100vh-14rem)] flex flex-col py-4">
              <div className="border-b border-slate-800 pb-4 flex items-center justify-between mb-6">
                <div>
                  <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-wider">
                    LIVE LEADERBOARD (DERIVED)
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">Club Performance from Bout Results</h2>
                </div>
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>

              <div className="w-full flex flex-col gap-3 my-auto pb-8">
                <div className="grid grid-cols-12 px-6 py-2 text-xs font-black text-slate-400 uppercase tracking-wider">
                  <span className="col-span-1">Rank</span>
                  <span className="col-span-6">Team / Country</span>
                  <span className="col-span-1 text-center text-amber-400">Wins</span>
                  <span className="col-span-1 text-center text-slate-300">Played</span>
                  <span className="col-span-1 text-center text-amber-600">Scored</span>
                  <span className="col-span-2 text-right text-cyan-400">Pts</span>
                </div>

                {standingsRows.length === 0 && (
                  <div className="px-6 py-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 font-semibold">
                    No standings could be derived from bout outcomes yet.
                  </div>
                )}
                {standingsRows.map((m) => (
                  <div
                    key={m.rank}
                    className="grid grid-cols-12 px-6 py-4 rounded-2xl bg-slate-900/80 border border-slate-800 items-center font-bold text-sm"
                  >
                    <span className="col-span-1 text-lg font-black text-white">#{m.rank}</span>
                    <span className="col-span-6 text-white text-base font-extrabold">{m.team}</span>
                    <span className="col-span-1 text-center font-mono font-black text-amber-400 text-base">{m.wins}</span>
                    <span className="col-span-1 text-center font-mono font-black text-slate-300 text-base">{m.played}</span>
                    <span className="col-span-1 text-center font-mono font-black text-amber-600 text-base">{m.scored}</span>
                    <span className="col-span-2 text-right font-mono font-black text-cyan-400 text-lg">{m.total}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : currentSlide.type === 'match_schedule' ? (
            /* 5. MATCH SCHEDULE QUEUE */
            <div className="max-w-6xl mx-auto min-h-[calc(100vh-14rem)] flex flex-col py-4">
              <div className="border-b border-slate-800 pb-4 flex items-center justify-between mb-6">
                <div>
                  <span className="px-3 py-1 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-black uppercase tracking-wider">
                    LIVE BOUT SCHEDULE & RING QUEUE
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">Upcoming Matches ({currentSlide.tatami_filter || activeDisplayPlaylist?.tatami || 'All Tatamis'})</h2>
                </div>
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>

              <div className="w-full flex flex-col gap-3 my-auto pb-8">
                {scheduleRows.length === 0 && (
                  <div className="px-6 py-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 font-semibold">
                    No schedule rows available from live feed yet.
                  </div>
                )}
                {scheduleRows.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-sm font-bold"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-xl bg-slate-800 text-cyan-400 font-mono font-black flex items-center justify-center">
                        #{s.bout}
                      </span>
                      <div>
                        <h3 className="text-white font-extrabold text-base">{s.category}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          <span className="text-red-400">{s.red}</span> vs <span className="text-blue-400">{s.blue}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs">{s.tatami}</span>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-black ${
                          s.status === 'ON DECK'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                            : s.status === 'In Progress'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentSlide.type === 'announcement_sponsor' ? (
            /* 6. ANNOUNCEMENT & SPONSOR SLIDE */
            <div className="max-w-5xl mx-auto min-h-[calc(100vh-14rem)] flex flex-col items-center justify-center py-4 text-center">
              <Radio className="w-16 h-16 text-cyan-400 mb-6 animate-pulse" />
              <h1 className="text-4xl font-black text-white tracking-wide max-w-3xl leading-tight">
                {currentSlide.announcement_text || 'Official Karate Championship Live Broadcast'}
              </h1>
              {currentSlide.sponsor_image_url && (
                <div className="mt-10 p-4 rounded-3xl bg-slate-900/80 border border-slate-800 max-w-2xl overflow-hidden shadow-2xl">
                  <img
                    src={currentSlide.sponsor_image_url}
                    alt={currentSlide.title}
                    className="max-h-72 w-full object-cover rounded-2xl"
                  />
                </div>
              )}
              <p className="text-sm font-bold text-cyan-400 mt-6 tracking-widest uppercase">
                POWERED BY KARATETECH & SP SPORTDATA SOLUTION
              </p>
            </div>
          ) : currentSlide.type === 'video' ? (
            /* 7. VIDEO MEDIA SLIDE */
            <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={currentSlide.video_url || '/sp_sportdata_promo_20s.mp4'}
                autoPlay
                muted={isMuted}
                playsInline
                onEnded={handleNextSlide}
                className="w-full h-full max-h-[80vh] object-contain rounded-2xl"
              />
            </div>
          ) : (
            /* 8. IMAGE SLIDE */
            <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center bg-slate-950">
              <img
                src={currentSlide.sponsor_image_url || 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=1200&auto=format&fit=crop&q=80'}
                alt={currentSlide.title}
                className="w-full h-full max-h-[80vh] object-contain rounded-2xl"
              />
            </div>
          )}
        </div>
      )}

      {/* TOP BROADCAST OVERLAY BANNER */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Tournament Logo & Name */}
          <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-cyan-500/30 shadow-[0_0_30px_rgba(0,240,255,0.15)] pointer-events-auto">
            {tournament?.logo ? (
              <img
                src={tournament.logo}
                alt={tournament.name}
                className="w-10 h-10 object-contain rounded-lg bg-black/60 p-1"
              />
            ) : (
              <Trophy className="w-8 h-8 text-cyan-400" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <h2 className="text-lg font-black tracking-wider text-white uppercase drop-shadow-md">
                  {tournament?.name || 'Live Tournament Display'}
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-cyan-300 font-semibold mt-0.5">
                {tournament?.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {tournament.venue}
                  </span>
                )}
                {activeDisplayPlaylist && (
                  <span className="flex items-center gap-1 border-l border-slate-700 pl-3 text-emerald-400">
                    {activeDisplayPlaylist.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* REALTIME BRIDGE CONNECTION STATUS BADGE */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => setShowDiagnosticPanel(!showDiagnosticPanel)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 shadow-lg transition ${
                bridgeStatus === 'CONNECTED'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900'
                  : bridgeStatus === 'CONNECTING'
                  ? 'bg-amber-950/80 text-amber-400 border-amber-500/40 animate-pulse'
                  : 'bg-red-950/80 text-red-400 border-red-500/40 hover:bg-red-900'
              }`}
              title="Click to toggle Live Bridge Diagnostic Panel"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>BRIDGE: {bridgeStatus}</span>
            </button>

            <div className="bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-slate-800 shadow-lg">
              <SpLogo size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* LOWER THIRD SPONSOR TICKER */}
      {sponsors.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pt-8 pb-4 pointer-events-none">
          <div className="bg-slate-900/90 border-y border-cyan-500/30 backdrop-blur-md py-2.5 overflow-hidden">
            <div className="flex items-center gap-6 animate-ticker">
              {[...sponsors, ...sponsors, ...sponsors].map((sp, idx) => (
                <div
                  key={`${sp.id}-${idx}`}
                  className="flex items-center gap-3 px-6 border-r border-slate-800/80 shrink-0"
                >
                  <img
                    src={sp.logo}
                    alt={sp.name}
                    className="h-9 max-w-[180px] object-contain filter brightness-110 drop-shadow"
                  />
                  <span className="text-xs font-bold text-slate-200 tracking-wide">{sp.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING PUBLIC DISPLAY CONTROLS */}
      {showControls && (
        <div className="absolute inset-x-0 bottom-16 z-30 flex justify-center pointer-events-auto transition-opacity duration-300">
          <div className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_0_30px_rgba(0,240,255,0.25)] flex-wrap max-w-full justify-center">
            {/* Skip Previous Slide */}
            <button
              onClick={handlePrevSlide}
              className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-700 transition"
              title="Previous Slide View"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black border border-cyan-500/40 transition"
              title={isPlaying ? 'Pause Playlist Rotation' : 'Resume Playlist Rotation'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Skip Next Slide */}
            <button
              onClick={handleNextSlide}
              className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-700 transition"
              title="Next Slide View"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block" />

            {/* DIAGNOSTIC PANEL TOGGLE BUTTON */}
            <button
              onClick={() => setShowDiagnosticPanel(!showDiagnosticPanel)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 transition ${
                showDiagnosticPanel
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'bg-slate-800 text-cyan-300 border-cyan-500/40 hover:bg-slate-700'
              }`}
              title="Toggle Diagnostic Panel Overlay"
            >
              <Activity className="w-4 h-4" />
              <span>Live Diagnostic Panel</span>
            </button>

            {/* AUTO-SCROLL TOGGLE BUTTON */}
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                isAutoScrolling
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title={isAutoScrolling ? 'Auto-Scroll Active (Click to Disable)' : 'Auto-Scroll Inactive (Click to Enable)'}
            >
              <ArrowDownCircle className={`w-4 h-4 ${isAutoScrolling ? 'animate-bounce text-emerald-400' : ''}`} />
              <span>Auto Scroll: {isAutoScrolling ? 'ON' : 'OFF'}</span>
            </button>

            <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block" />

            {/* SLIDE COUNTDOWN TIMER BADGE */}
            <div className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
              <Clock className="w-4 h-4 animate-spin-slow" />
              <span>{slideTimeRemaining}s Next</span>
            </div>

            {/* MANAGE PLAYLISTS BUTTON */}
            <button
              onClick={() => setIsPlaylistModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-cyan-950 hover:border-cyan-500/50 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition"
              title="Open Playlist Manager Modal"
            >
              <ListOrdered className="w-4 h-4 text-cyan-400" />
              <span>Manage Playlists</span>
            </button>

            <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block" />

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-700 transition"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            {/* Close window */}
            <button
              onClick={() => window.close()}
              className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/40 transition ml-1"
              title="Close Display Window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NON-INTRUSIVE DIAGNOSTIC PANEL OVERLAY */}
      {/* ========================================================================= */}
      {showDiagnosticPanel && (
        <div className="fixed top-24 right-6 z-50 w-96 bg-slate-950/95 backdrop-blur-2xl border-2 border-cyan-500/50 rounded-3xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-xs font-mono text-slate-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2 text-cyan-400 font-extrabold uppercase tracking-wider text-sm">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>LIVE CONNECTION</span>
            </div>
            <button
              onClick={() => setShowDiagnosticPanel(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Bridge:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                bridgeStatus === 'CONNECTED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'
              }`}>
                {bridgeStatus === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">WebSocket / Realtime:</span>
              <span className="font-bold text-cyan-300">{bridgeDiagnostic.status}</span>
            </div>

            <div className="py-1 border-b border-slate-900 truncate">
              <span className="text-slate-400 block mb-0.5">WebSocket URL:</span>
              <span className="text-[10px] text-slate-400 font-mono select-all block bg-slate-900 p-1 rounded overflow-hidden text-ellipsis">
                {bridgeDiagnostic.wsUrl}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Last Event:</span>
              <span className="font-bold text-amber-300">{liveMatch.lastEvent || bridgeDiagnostic.lastReceivedEvent || 'NONE'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Last Message:</span>
              <span className="font-bold text-emerald-300">{liveMatch.lastMessageTime || bridgeDiagnostic.lastReceivedTime || '--:--:--'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Tournament:</span>
              <span className="font-bold text-slate-200 truncate max-w-[180px]">{liveMatch.tournamentId || tournament?.id || 'GLOBAL'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Tatami:</span>
              <span className="font-bold text-cyan-300">{liveMatch.tatami || 'Tatami 1'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Match:</span>
              <span className="font-bold text-slate-200">{liveMatch.matchId || 'BOUT #1'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-center font-bold">
              <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300">
                <span className="block text-[10px] text-red-400 uppercase">AKA Score</span>
                <span className="text-xl font-mono text-white">{liveMatch.aka.score}</span>
              </div>
              <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-300">
                <span className="block text-[10px] text-blue-400 uppercase">AO Score</span>
                <span className="text-xl font-mono text-white">{liveMatch.ao.score}</span>
              </div>
            </div>

            {/* HEALTH TEST TRIGGER CONTROLS */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                Bridge Health Diagnostics:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleRunHealthTest('TEST_LIVE_UPDATE')}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] flex items-center justify-center gap-1 transition"
                >
                  <Send className="w-3 h-3" />
                  <span>Send TEST_LIVE</span>
                </button>

                <button
                  onClick={() => handleRunHealthTest('SCORE_UPDATE')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] flex items-center justify-center gap-1 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Send SCORE_UPD</span>
                </button>
              </div>

              {testLogMessage && (
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono">
                  {testLogMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DISPLAY PLAYLIST MODAL OVERLAY */}
      <DisplayPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onLaunchPlaylist={async (id) => {
          setIsPlaylistModalOpen(false);
          const found = await db.displayPlaylists.getById(id);
          if (found) {
            setActiveDisplayPlaylist(found);
            setSlideIndex(0);
          }
        }}
      />
    </div>
  );
}
