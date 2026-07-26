'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  Trophy,
  Shield,
  Film,
  Sparkles,
  MapPin,
  Calendar,
  Repeat,
  SkipForward,
  SkipBack,
  Scaling,
  ZoomIn,
  ZoomOut,
  Layers,
  Clock,
  Radio,
  UserCheck,
  Award,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MonitorPlay,
  ListOrdered,
  ArrowDownCircle,
} from 'lucide-react';
import { getSponsors, getActiveTournament, getPlaylist } from '@/lib/storage';
import { Sponsor, Tournament, PlaylistItem } from '@/lib/types';
import { db } from '@/db/dbClient';
import { DisplayPlaylist, DisplayPlaylistSlide } from '@/db/types';
import { SpLogo } from '@/components/ui/SpLogo';
import { TournamentBannerModal } from '@/components/display/TournamentBannerModal';
import { DisplayPlaylistModal } from '@/components/playlist/DisplayPlaylistModal';

// --- SAMPLE REAL-TIME DEMO DATA FOR DISPLAY SLIDES ---
const DEMO_KUMITE = {
  category: 'Male Senior Kumite -75kg',
  round: 'FINALS - BOUT #42',
  tatami: 'Tatami 1',
  matchTime: '01:45',
  aka: {
    name: 'A. HAROUN',
    country: 'MAS',
    club: 'Senshi Karate Team',
    score: 4,
    senshu: true,
    fouls: ['C1', 'C2'],
  },
  ao: {
    name: 'K. STANISLAV',
    country: 'KAZ',
    club: 'Kazakhstan National',
    score: 2,
    senshu: false,
    fouls: ['C1'],
  },
};

const DEMO_KATA_JUDGES = [
  { name: 'J1 (JPN)', score: 8.4 },
  { name: 'J2 (FRA)', score: 8.2 },
  { name: 'J3 (ITA)', score: 8.6 },
  { name: 'J4 (TUR)', score: 8.0 },
  { name: 'J5 (MAS)', score: 8.4 },
  { name: 'J6 (ESP)', score: 8.6 },
  { name: 'J7 (USA)', score: 8.2 },
];

const DEMO_BRACKETS = [
  { id: 'b1', round: 'Quarterfinal 1', red: 'T. MORIMOTO (JPN)', blue: 'R. KAZIM (AZE)', score: '4 - 1', winner: 'red' },
  { id: 'b2', round: 'Quarterfinal 2', red: 'A. HAROUN (MAS)', blue: 'J. SMITH (USA)', score: '5 - 0', winner: 'red' },
  { id: 'b3', round: 'Quarterfinal 3', red: 'K. STANISLAV (KAZ)', blue: 'L. MARTINEZ (ARG)', score: '3 - 2', winner: 'red' },
  { id: 'b4', round: 'Quarterfinal 4', red: 'M. ROSSI (ITA)', blue: 'H. ALI (EGY)', score: '2 - 0', winner: 'red' },
  { id: 'b5', round: 'Semifinal 1', red: 'A. HAROUN (MAS)', blue: 'T. MORIMOTO (JPN)', score: '3 - 1', winner: 'red' },
  { id: 'b6', round: 'Semifinal 2', red: 'K. STANISLAV (KAZ)', blue: 'M. ROSSI (ITA)', score: '4 - 2', winner: 'red' },
  { id: 'b7', round: 'GOLD MEDAL MATCH', red: 'A. HAROUN (MAS)', blue: 'K. STANISLAV (KAZ)', score: '4 - 2 (LIVE)', winner: 'live' },
];

const DEMO_MEDALS = [
  { rank: 1, team: 'Malaysia National Karate Federation', gold: 6, silver: 4, bronze: 5, total: 15 },
  { rank: 2, team: 'Senshi Martial Arts Academy', gold: 5, silver: 4, bronze: 3, total: 12 },
  { rank: 3, team: 'Japan Elite Karate Team', gold: 4, silver: 6, bronze: 4, total: 14 },
  { rank: 4, team: 'Kazakhstan National Club', gold: 3, silver: 2, bronze: 6, total: 11 },
  { rank: 5, team: 'French Federation Karate', gold: 2, silver: 3, bronze: 4, total: 9 },
  { rank: 6, team: 'Italian Combat Sports Center', gold: 2, silver: 2, bronze: 5, total: 9 },
  { rank: 7, team: 'Spain National Team', gold: 1, silver: 3, bronze: 2, total: 6 },
];

const DEMO_SCHEDULE = [
  { bout: 36, category: 'Male Cadet Kata', red: 'S. KUMAR (IND)', blue: 'T. LEE (KOR)', tatami: 'Tatami 1', status: 'Completed' },
  { bout: 37, category: 'Female Junior Kumite -53kg', red: 'M. PETROVA (BUL)', blue: 'K. CHEN (TPE)', tatami: 'Tatami 2', status: 'Completed' },
  { bout: 38, category: 'Female Senior Kata', red: 'Y. SHIMIZU (JPN)', blue: 'L. SANCHEZ (ESP)', tatami: 'Tatami 2', status: 'Completed' },
  { bout: 39, category: 'Male Senior Kumite -67kg', red: 'C. DANIEL (MAS)', blue: 'V. CHEN (TPE)', tatami: 'Tatami 1', status: 'Completed' },
  { bout: 40, category: 'Female Kumite -55kg', red: 'S. GORANOVA (BUL)', blue: 'A. TERLIUGA (UKR)', tatami: 'Tatami 2', status: 'In Progress' },
  { bout: 41, category: 'Male Senior Kumite -75kg', red: 'A. HAROUN (MAS)', blue: 'K. STANISLAV (KAZ)', tatami: 'Tatami 1', status: 'ON DECK' },
  { bout: 42, category: 'Male Senior Kumite +84kg', red: 'T. KVESIC (CRO)', blue: 'G. ARKANia (GEO)', tatami: 'Tatami 1', status: 'Upcoming' },
  { bout: 43, category: 'Female Senior Kumite +68kg', red: 'E. QUIRICI (SUI)', blue: 'I. ZARETSKA (AZE)', tatami: 'Tatami 2', status: 'Upcoming' },
  { bout: 44, category: 'Male Senior Kata Final', red: 'K. MORIMOTO (JPN)', blue: 'D. QUINTERO (ESP)', tatami: 'Tatami 1', status: 'Upcoming' },
];

export default function PublicDisplayPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [legacyPlaylist, setLegacyPlaylist] = useState<PlaylistItem[]>([]);
  
  // Database Playlist State
  const [activeDisplayPlaylist, setActiveDisplayPlaylist] = useState<DisplayPlaylist | null>(null);
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [slideTimeRemaining, setSlideTimeRemaining] = useState<number>(15);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);

  // Playback & UI controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoopingAll, setIsLoopingAll] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  // Screen Sizing & Zoom Controls
  const [fitMode, setFitMode] = useState<'cover' | 'contain' | 'fill'>('cover');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Auto-scroll State
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      console.error(e);
    }
  }, []);

  const updateScreenConfig = (newFit?: 'cover' | 'contain' | 'fill', newZoom?: number) => {
    const targetFit = newFit !== undefined ? newFit : fitMode;
    const targetZoom = newZoom !== undefined ? newZoom : zoomLevel;
    if (newFit !== undefined) setFitMode(newFit);
    if (newZoom !== undefined) setZoomLevel(newZoom);
    try {
      localStorage.setItem('sp_display_screen_config', JSON.stringify({ fitMode: targetFit, zoomLevel: targetZoom }));
    } catch (e) {
      console.error(e);
    }
  };

  const cycleFitMode = () => {
    const modes: ('cover' | 'contain' | 'fill')[] = ['cover', 'contain', 'fill'];
    const nextIdx = (modes.indexOf(fitMode) + 1) % modes.length;
    updateScreenConfig(modes[nextIdx], zoomLevel);
  };

  const handleZoomIn = () => {
    if (zoomLevel < 180) updateScreenConfig(fitMode, zoomLevel + 10);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 50) updateScreenConfig(fitMode, zoomLevel - 10);
  };

  // Scroll Actions for Active Display Target
  const handleScrollDown = () => {
    if (slideContainerRef.current) {
      slideContainerRef.current.scrollBy({ top: 320, behavior: 'smooth' });
    }
  };

  const handleScrollUp = () => {
    if (slideContainerRef.current) {
      slideContainerRef.current.scrollBy({ top: -320, behavior: 'smooth' });
    }
  };

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
  const loadData = () => {
    const activeSps = getSponsors().filter((s) => !s.isDeleted && s.active);
    const activeTourn = getActiveTournament();
    const activeMedia = getPlaylist().filter((p) => !p.isDeleted && p.active);

    setSponsors(activeSps);
    setTournament(activeTourn);
    setLegacyPlaylist(activeMedia);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qPlaylistId = params.get('playlistId');
      const allPlaylists = db.displayPlaylists.list();

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

  // DISPLAY PLAYLIST ROTATION TIMER
  useEffect(() => {
    if (!activeDisplayPlaylist || activeDisplayPlaylist.slides.length === 0 || !isPlaying) {
      return;
    }

    const currentSlide = activeDisplayPlaylist.slides[slideIndex];
    if (!currentSlide) {
      setSlideIndex(0);
      return;
    }

    const totalSecs = currentSlide.duration_seconds || 15;
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

  // Toggle controls visibility on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.log(err));
        setIsFullscreen(false);
      }
    }
  };

  const currentSlide: DisplayPlaylistSlide | undefined = activeDisplayPlaylist?.slides[slideIndex];

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
                  <span className="px-3 py-1 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE KUMITE
                  </span>
                  <span className="text-sm font-black text-cyan-400 uppercase tracking-widest">
                    {currentSlide.tatami_filter || DEMO_KUMITE.tatami} — {currentSlide.category_filter || DEMO_KUMITE.category}
                  </span>
                </div>
                <div className="px-4 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-cyan-300 font-bold text-sm">
                  MATCH TIME: <span className="text-white text-base">{DEMO_KUMITE.matchTime}</span>
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
                    {DEMO_KUMITE.aka.senshu && (
                      <span className="px-3 py-1 rounded-full bg-yellow-500 text-black font-black text-xs tracking-wider shadow">
                        ★ SENSHU FIRST SCORE
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-4xl font-black text-white tracking-wide uppercase drop-shadow-md">
                      {DEMO_KUMITE.aka.name}
                    </h2>
                    <p className="text-sm font-extrabold text-red-300 mt-1">{DEMO_KUMITE.aka.club} ({DEMO_KUMITE.aka.country})</p>
                  </div>

                  <div className="flex items-end justify-between mt-8">
                    <div className="flex items-center gap-1.5">
                      {['C1', 'C2', 'C3', 'HC', 'H'].map((f) => (
                        <span
                          key={f}
                          className={`px-2.5 py-1 rounded-md text-xs font-black border ${
                            DEMO_KUMITE.aka.fouls.includes(f)
                              ? 'bg-red-600 border-red-400 text-white shadow'
                              : 'bg-slate-900/60 border-slate-800 text-slate-600'
                          }`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="text-8xl font-black text-white font-mono tracking-tighter drop-shadow-lg">
                      {DEMO_KUMITE.aka.score}
                    </div>
                  </div>
                </div>

                {/* VS CENTER BADGE */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center text-center py-4">
                  <span className="text-4xl font-black text-slate-600 tracking-tighter">VS</span>
                  <span className="text-xs font-bold text-cyan-400 mt-2 tracking-widest uppercase">{DEMO_KUMITE.round}</span>
                </div>

                {/* AO (BLUE ATHLETE) */}
                <div className="lg:col-span-5 bg-gradient-to-l from-blue-950/80 via-blue-900/40 to-slate-900/80 border-2 border-blue-500/60 rounded-3xl p-8 flex flex-col justify-between shadow-[0_0_50px_rgba(59,130,246,0.25)] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-4 py-1 rounded-lg bg-blue-600 font-black text-xs text-white uppercase tracking-wider">
                      AO (BLUE)
                    </span>
                    {DEMO_KUMITE.ao.senshu && (
                      <span className="px-3 py-1 rounded-full bg-yellow-500 text-black font-black text-xs tracking-wider shadow">
                        ★ SENSHU
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-4xl font-black text-white tracking-wide uppercase drop-shadow-md">
                      {DEMO_KUMITE.ao.name}
                    </h2>
                    <p className="text-sm font-extrabold text-blue-300 mt-1">{DEMO_KUMITE.ao.club} ({DEMO_KUMITE.ao.country})</p>
                  </div>

                  <div className="flex items-end justify-between mt-8">
                    <div className="flex items-center gap-1.5">
                      {['C1', 'C2', 'C3', 'HC', 'H'].map((f) => (
                        <span
                          key={f}
                          className={`px-2.5 py-1 rounded-md text-xs font-black border ${
                            DEMO_KUMITE.ao.fouls.includes(f)
                              ? 'bg-blue-600 border-blue-400 text-white shadow'
                              : 'bg-slate-900/60 border-slate-800 text-slate-600'
                          }`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="text-8xl font-black text-white font-mono tracking-tighter drop-shadow-lg">
                      {DEMO_KUMITE.ao.score}
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
                    WKF KATA SCOREBOARD (7 JUDGES)
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">Male Senior Kata Final Round</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 uppercase font-bold">Total Trimmed Score</span>
                  <div className="text-4xl font-black text-purple-400 font-mono">25.0</div>
                </div>
              </div>

              {/* 7 JUDGES GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 my-auto">
                {DEMO_KATA_JUDGES.map((j, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center justify-center gap-2 shadow-lg"
                  >
                    <span className="text-xs font-bold text-slate-400">{j.name}</span>
                    <span className="text-3xl font-black text-white font-mono">{j.score.toFixed(1)}</span>
                    <span className="text-[10px] text-purple-400 font-semibold uppercase">Counted</span>
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
                  <h2 className="text-2xl font-black text-white mt-1">Male Senior Kumite -75kg Bracket</h2>
                </div>
                <span className="text-xs text-slate-400 font-bold uppercase">LIVE BRACKET PROGRESSION</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-auto pb-8">
                {DEMO_BRACKETS.map((b) => (
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
                    CHAMPIONSHIP MEDAL STANDINGS
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">Overall Country & Club Tally</h2>
                </div>
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>

              <div className="w-full flex flex-col gap-3 my-auto pb-8">
                <div className="grid grid-cols-12 px-6 py-2 text-xs font-black text-slate-400 uppercase tracking-wider">
                  <span className="col-span-1">Rank</span>
                  <span className="col-span-6">Team / Country</span>
                  <span className="col-span-1 text-center text-amber-400">Gold</span>
                  <span className="col-span-1 text-center text-slate-300">Silver</span>
                  <span className="col-span-1 text-center text-amber-600">Bronze</span>
                  <span className="col-span-2 text-right text-cyan-400">Total</span>
                </div>

                {DEMO_MEDALS.map((m) => (
                  <div
                    key={m.rank}
                    className="grid grid-cols-12 px-6 py-4 rounded-2xl bg-slate-900/80 border border-slate-800 items-center font-bold text-sm"
                  >
                    <span className="col-span-1 text-lg font-black text-white">#{m.rank}</span>
                    <span className="col-span-6 text-white text-base font-extrabold">{m.team}</span>
                    <span className="col-span-1 text-center font-mono font-black text-amber-400 text-base">{m.gold}</span>
                    <span className="col-span-1 text-center font-mono font-black text-slate-300 text-base">{m.silver}</span>
                    <span className="col-span-1 text-center font-mono font-black text-amber-600 text-base">{m.bronze}</span>
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
                  <h2 className="text-2xl font-black text-white mt-1">Upcoming Matches ({currentSlide.tatami_filter || 'All Tatamis'})</h2>
                </div>
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>

              <div className="w-full flex flex-col gap-3 my-auto pb-8">
                {DEMO_SCHEDULE.map((s) => (
                  <div
                    key={s.bout}
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
          <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-cyan-500/30 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
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
                    <Layers className="w-3 h-3" /> {activeDisplayPlaylist.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SP SportData Branding Badge */}
          <div className="bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-slate-800 shadow-lg">
            <SpLogo size="sm" />
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

            {/* SCROLL BUTTON CONTROLLER FOR ACTIVE DISPLAY TARGET */}
            <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 gap-1" title="Scroll Up / Down active display target view">
              <button
                onClick={handleScrollUp}
                className="p-2 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
                title="Scroll Up Display View"
              >
                <ChevronUp className="w-4 h-4 text-cyan-400" />
              </button>
              <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase px-1">Scroll</span>
              <button
                onClick={handleScrollDown}
                className="p-2 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition"
                title="Scroll Down Display View"
              >
                <ChevronDown className="w-4 h-4 text-cyan-400" />
              </button>
            </div>

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

            {/* Slide Info */}
            <div className="px-3 text-xs font-mono text-cyan-300 truncate max-w-[180px] hidden md:block">
              {activeDisplayPlaylist && currentSlide ? (
                <span>
                  #{slideIndex + 1}/{activeDisplayPlaylist.slides.length}: {currentSlide.title}
                </span>
              ) : (
                <span>No Active Playlist</span>
              )}
            </div>

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

      {/* DISPLAY PLAYLIST MODAL OVERLAY */}
      <DisplayPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        onLaunchPlaylist={(id) => {
          setIsPlaylistModalOpen(false);
          const found = db.displayPlaylists.getById(id);
          if (found) {
            setActiveDisplayPlaylist(found);
            setSlideIndex(0);
          }
        }}
      />
    </div>
  );
}
