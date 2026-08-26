/**
 * KarateTech 2.0 Bridge Service
 *
 * Syncs tournament data and live match scoreboards from the shared KarateTech 2.0 Supabase instance
 * into the Display Manager's spectator screens.
 * Subscribes to Supabase Realtime (Postgres changes & Broadcast channels) for instant live updates.
 */

import { supabase } from './supabaseClient';
import { Tournament, KarateTechTournamentRow, LiveMatchData, BridgeConnectionStatus } from './types';
import { getTournaments, saveTournaments, broadcastDatabaseUpdate } from './storage';

// ── Mapper ────────────────────────────────────────────────────────────────────

/**
 * Converts a KarateTech 2.0 Supabase row into the Display Manager Tournament shape.
 * Preserves the `karateTechId` link so we can detect & update on future syncs.
 */
export function mapKtRowToTournament(
  row: KarateTechTournamentRow,
  existing?: Tournament
): Tournament {
  const now = new Date().toISOString();

  const participantInfo = row.total_participants
    ? `${row.total_participants} Participants`
    : '';
  const clubInfo = row.total_clubs ? `${row.total_clubs} Clubs` : '';
  const disciplineInfo = row.discipline || '';
  const descParts = [disciplineInfo, participantInfo, clubInfo].filter(Boolean);
  const description = descParts.join(' · ');

  return {
    // Preserve any display-manager-specific fields from an existing record
    contactPerson: existing?.contactPerson ?? '',
    phoneNumber: existing?.phoneNumber ?? '',
    email: existing?.email ?? '',
    facebookInstagram: existing?.facebookInstagram ?? '',
    logo:
      existing?.logo ||
      'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&auto=format&fit=crop&q=80',
    // Keep active flag from DM unless not set
    active: existing?.active ?? (row.status?.toLowerCase() === 'active'),

    // Synced from KarateTech
    id: existing?.id ?? row.id,
    name: row.name,
    organizer: row.organizer ?? '',
    date: row.date ?? (row.date_iso ? new Date(row.date_iso).toLocaleDateString() : ''),
    venue: row.venue ?? '',
    address: row.city ?? '',
    description,
    website: row.pdf_url ?? '',
    isDeleted: !!row.deleted_at,

    // Bridge metadata
    karateTechId: row.id,
    karateTechSyncedAt: now,
  };
}

// ── Sync ──────────────────────────────────────────────────────────────────────

/**
 * Refreshes tournament data from the shared Supabase table.
 */
export async function syncFromKarateTech(): Promise<{
  added: number;
  updated: number;
  error?: string;
}> {
  try {
    const { data: sourceRows, error: sourceError } = await supabase
      .from('tournaments')
      .select('id,name,organizer,date,date_iso,venue,city,discipline,status,total_participants,total_clubs,pdf_url,deleted_at,created_at,last_modified,settings');

    if (sourceError) {
      throw sourceError;
    }

    const source = (sourceRows ?? []) as KarateTechTournamentRow[];
    if (source.length === 0) return { added: 0, updated: 0 };

    const existing = await getTournaments();
    const existingByKarateTechId = new Map<string, Tournament>();
    for (const t of existing) {
      if (t.karateTechId) existingByKarateTechId.set(t.karateTechId, t);
      existingByKarateTechId.set(t.id, t);
    }

    const mapped = source.map((row) => mapKtRowToTournament(row, existingByKarateTechId.get(row.id)));
    await saveTournaments(mapped);

    const added = mapped.filter((t) => !existingByKarateTechId.has(t.karateTechId ?? t.id)).length;
    const updated = mapped.length - added;

    broadcastDatabaseUpdate('tournaments');
    return { added, updated };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[KarateTechBridge] Sync error:', err);
    return { added: 0, updated: 0, error: msg };
  }
}

/**
 * Loads the latest available bout row so the display starts with real data
 * before the first realtime event arrives.
 */
export async function getInitialLiveMatchData(): Promise<LiveMatchData | null> {
  const { data, error } = await supabase
    .from('bouts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !data || data.length === 0) return null;

  const rows = data as Array<Record<string, any>>;
  const scoreRow = (row: Record<string, any>) => {
    const status = String(row.status || '').toLowerCase();
    let score = 0;
    if (row.timer_active) score += 100;
    if (status.includes('progress') || status.includes('live') || status.includes('active') || status.includes('running')) score += 70;
    if ((row.score_a ?? 0) !== 0 || (row.score_b ?? 0) !== 0) score += 40;
    if (row.participant_a_id || row.participant_b_id) score += 25;
    if (row.senshu_a || row.senshu_b) score += 10;
    if (status === 'scheduled' || status === 'walkover') score -= 20;
    return score;
  };

  const ranked = [...rows]
    .map((row) => ({ row, priority: scoreRow(row) }))
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      const at = Date.parse(String(a.row.created_at || 0));
      const bt = Date.parse(String(b.row.created_at || 0));
      return bt - at;
    });

  if (!ranked[0] || ranked[0].priority <= 0) return null;

  const normalized = normalizeLiveMatchData(ranked[0].row);
  const enriched = await enrichLiveMatchData(normalized);
  lastReceivedEvent = 'BOUT_INITIAL_SNAPSHOT';
  lastReceivedTime = new Date().toLocaleTimeString();
  lastReceivedData = enriched;
  return enriched;
}

/**
 * Loads one specific bout by id so display can be pinned to the exact active match.
 */
export async function getLiveMatchDataByBoutId(boutId: string): Promise<LiveMatchData | null> {
  const { data, error } = await supabase
    .from('bouts')
    .select('*')
    .eq('id', boutId)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const normalized = normalizeLiveMatchData(data as Record<string, any>);
  const enriched = await enrichLiveMatchData(normalized);
  lastReceivedEvent = 'BOUT_EXACT_SNAPSHOT';
  lastReceivedTime = new Date().toLocaleTimeString();
  lastReceivedData = enriched;
  return enriched;
}

// ── Realtime Subscription (Tournaments) ───────────────────────────────────────

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

export function subscribeKarateTechRealtime(
  onUpdate: (counts: { added: number; updated: number }) => void
): () => void {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  realtimeChannel = supabase
    .channel('kt-bridge-tournaments')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tournaments' },
      async () => {
        const result = await syncFromKarateTech();
        if (!result.error) {
          onUpdate({ added: result.added, updated: result.updated });
        }
      }
    )
    .subscribe();

  return () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };
}

// ── Live Match Realtime Bridge Subscription ───────────────────────────────────

let liveMatchChannel: ReturnType<typeof supabase.channel> | null = null;
let currentConnectionStatus: BridgeConnectionStatus = 'DISCONNECTED';
let lastReceivedEvent: string = 'NONE';
let lastReceivedTime: string = '--:--:--';
let lastReceivedData: LiveMatchData | null = null;

type ParticipantIdentity = {
  name: string;
  club?: string;
  country?: string;
};

const participantIdentityCache = new Map<string, ParticipantIdentity>();
const clubNameCache = new Map<string, string>();
const categoryNameCache = new Map<string, string>();

export function getBridgeDiagnosticInfo() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wbwnnjfmfcpzjfbsyrvq.supabase.co';
  const wsUrl = supabaseUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/realtime/v1/websocket';
  
  return {
    supabaseUrl,
    wsUrl,
    status: currentConnectionStatus,
    lastReceivedEvent,
    lastReceivedTime,
    lastReceivedData,
  };
}

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

async function getClubName(clubId?: string | null): Promise<string | undefined> {
  if (!clubId) return undefined;
  const cached = clubNameCache.get(clubId);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', clubId)
    .limit(1);

  if (error || !data || data.length === 0) return undefined;

  const clubRow = data[0] as Record<string, any>;
  const clubName = String(clubRow.name || '').trim();
  if (clubName) {
    clubNameCache.set(clubId, clubName);
    return clubName;
  }
  return undefined;
}

async function getParticipantIdentity(participantId?: string | null): Promise<ParticipantIdentity | null> {
  if (!participantId) return null;
  const cached = participantIdentityCache.get(participantId);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('id', participantId)
    .limit(1);

  if (error || !data || data.length === 0) return null;

  const row = data[0] as Record<string, any>;
  const fullName = String(
    row.full_name ||
    row.name ||
    [row.first_name, row.last_name].filter(Boolean).join(' ') ||
    ''
  ).trim();

  const clubName = await getClubName((row.club_id as string | null) ?? null);
  const country = String(row.nationality_code || row.country || '').trim();

  if (!fullName) return null;

  const identity: ParticipantIdentity = {
    name: fullName,
    club: clubName,
    country: country || undefined,
  };

  participantIdentityCache.set(participantId, identity);
  return identity;
}

async function getCategoryName(categoryId?: string | null): Promise<string | undefined> {
  if (!categoryId) return undefined;
  const cached = categoryNameCache.get(categoryId);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .limit(1);

  if (error || !data || data.length === 0) return undefined;

  const row = data[0] as Record<string, any>;
  const label = String(row.name || row.category_name || row.title || '').trim();
  if (label) {
    categoryNameCache.set(categoryId, label);
    return label;
  }
  return undefined;
}

async function enrichLiveMatchData(data: LiveMatchData): Promise<LiveMatchData> {
  const [akaIdentity, aoIdentity, categoryName] = await Promise.all([
    getParticipantIdentity(data.participantAId),
    getParticipantIdentity(data.participantBId),
    getCategoryName(data.categoryId),
  ]);

  return {
    ...data,
    category: isPlaceholderCategory(data.category) ? (categoryName || data.category) : data.category,
    aka: {
      ...data.aka,
      name: isPlaceholderAthleteName(data.aka.name) ? (akaIdentity?.name || data.aka.name) : data.aka.name,
      club: data.aka.club || akaIdentity?.club || '',
      country: data.aka.country || akaIdentity?.country || '',
    },
    ao: {
      ...data.ao,
      name: isPlaceholderAthleteName(data.ao.name) ? (aoIdentity?.name || data.ao.name) : data.ao.name,
      club: data.ao.club || aoIdentity?.club || '',
      country: data.ao.country || aoIdentity?.country || '',
    },
  };
}

/**
 * Normalizes seconds into "mm:ss" match timer format
 */
function formatTimerSeconds(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '03:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Converts bout penalties flags into string list
 */
function extractFouls(payload: Record<string, any>, side: 'a' | 'b'): string[] {
  const fouls: string[] = [];
  if (payload[`penalties_c1_${side}`]) fouls.push('C1');
  if (payload[`penalties_c2_${side}`]) fouls.push('C2');
  if (payload[`penalties_c3_${side}`]) fouls.push('C3');
  if (payload[`penalties_hc_${side}`]) fouls.push('HC');
  if (payload[`penalties_h_${side}`]) fouls.push('H');
  
  if (fouls.length === 0 && Array.isArray(payload[`penalties_${side}`])) {
    return payload[`penalties_${side}`];
  }
  return fouls;
}

/**
 * Transforms incoming Supabase DB bout row or Realtime Broadcast payload into standardized LiveMatchData format
 */
export function normalizeLiveMatchData(payload: Record<string, any>): LiveMatchData {
  const now = new Date().toLocaleTimeString();
  
  // Broadcast format (e.g. { type: "SCORE_UPDATE", aka: { name: "...", score: 3 }, ... })
  if (payload.type === 'SCORE_UPDATE' || payload.type === 'TEST_LIVE_UPDATE' || payload.aka || payload.ao) {
    return {
      tournamentId: payload.tournamentId || payload.tournament_id || 'kt-tourn-live',
      matchId: payload.matchId || payload.bout_id || payload.id || 'bout-live',
      boutNo: payload.boutNo || payload.bout_no || 1,
      participantAId: payload.participant_a_id || payload.participantAId,
      participantBId: payload.participant_b_id || payload.participantBId,
      categoryId: payload.category_id || payload.categoryId,
      tatami: payload.tatamiId || payload.tatami || 'Tatami 1',
      category: payload.category || payload.category_name || 'Kumite Senior',
      round: payload.round || 'FINALS',
      status: payload.status || 'In Progress',
      matchTime: payload.matchTime || formatTimerSeconds(payload.timerSeconds),
      timerSeconds: payload.timerSeconds,
      timerActive: payload.timerActive,
      aka: {
        name: payload.aka?.name || payload.aka_name || 'AKA ATHLETE',
        club: payload.aka?.club || payload.aka_club || '',
        country: payload.aka?.country || payload.aka_country || '',
        score: typeof payload.aka?.score === 'number' ? payload.aka.score : (payload.score_a ?? 0),
        senshu: !!(payload.aka?.senshu ?? payload.senshu_a),
        fouls: payload.aka?.fouls || extractFouls(payload, 'a'),
      },
      ao: {
        name: payload.ao?.name || payload.ao_name || 'AO ATHLETE',
        club: payload.ao?.club || payload.ao_club || '',
        country: payload.ao?.country || payload.ao_country || '',
        score: typeof payload.ao?.score === 'number' ? payload.ao.score : (payload.score_b ?? 0),
        senshu: !!(payload.ao?.senshu ?? payload.senshu_b),
        fouls: payload.ao?.fouls || extractFouls(payload, 'b'),
      },
      winner: payload.winner || payload.winner_id,
      victoryMethod: payload.victoryMethod || payload.victory_method,
      lastEvent: payload.type || 'SCORE_UPDATE',
      lastMessageTime: now,
      testMessage: payload.message,
    };
  }

  // Flat DB row format from 'bouts' table
  return {
    tournamentId: payload.tournament_id || payload.tournamentId || 'kt-tourn-live',
    matchId: payload.id || `bout-#${payload.bout_no || 1}`,
    boutNo: payload.bout_no || 1,
    participantAId: payload.participant_a_id,
    participantBId: payload.participant_b_id,
    categoryId: payload.category_id,
    tatami: payload.tatami ? (payload.tatami.toLowerCase().includes('tatami') ? payload.tatami : `Tatami ${payload.tatami}`) : 'Tatami 1',
    category: payload.category_name || payload.category || 'Male Senior Kumite',
    round: payload.round_no ? `Round ${payload.round_no}` : 'FINALS',
    status: payload.status || 'In Progress',
    matchTime: formatTimerSeconds(payload.timer_seconds),
    timerSeconds: payload.timer_seconds,
    timerActive: payload.timer_active,
    aka: {
      name: payload.participant_a_name || payload.aka_name || 'AKA ATHLETE',
      club: payload.participant_a_club || '',
      country: payload.participant_a_country || '',
      score: payload.score_a ?? 0,
      senshu: !!payload.senshu_a,
      fouls: extractFouls(payload, 'a'),
    },
    ao: {
      name: payload.participant_b_name || payload.ao_name || 'AO ATHLETE',
      club: payload.participant_b_club || '',
      country: payload.participant_b_country || '',
      score: payload.score_b ?? 0,
      senshu: !!payload.senshu_b,
      fouls: extractFouls(payload, 'b'),
    },
    winner: payload.winner_id,
    victoryMethod: payload.victory_method,
    lastEvent: 'BOUT_UPDATE',
    lastMessageTime: now,
  };
}

/**
 * Subscribes to live match score updates from KarateTech Hybrid via Supabase Realtime.
 * Listens to both Postgres table changes on `bouts` AND Realtime Broadcast events.
 */
export function subscribeLiveMatchRealtime(
  onMatchUpdate: (data: LiveMatchData) => void,
  onStatusChange?: (status: BridgeConnectionStatus, info: { url: string; error?: string }) => void
): () => void {
  const { wsUrl } = getBridgeDiagnosticInfo();

  currentConnectionStatus = 'CONNECTING';
  if (onStatusChange) onStatusChange('CONNECTING', { url: wsUrl });

  console.log(`[BRIDGE] CONNECTING to ${wsUrl}`);

  if (liveMatchChannel) {
    supabase.removeChannel(liveMatchChannel);
    liveMatchChannel = null;
  }

  liveMatchChannel = supabase
    .channel('kt-live-matches', {
      config: {
        broadcast: { ack: true, self: true },
      },
    })
    // 1. Listen to Postgres table changes on 'bouts'
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bouts' },
      (payload) => {
        void (async () => {
          console.log('[BRIDGE] EVENT RECEIVED (bouts Postgres change):', payload.eventType, payload.new || payload.old);
          const matchData = await enrichLiveMatchData(normalizeLiveMatchData(payload.new || payload.old || {}));

          lastReceivedEvent = 'BOUT_POSTGRES_CHANGE';
          lastReceivedTime = new Date().toLocaleTimeString();
          lastReceivedData = matchData;

          console.log('[BRIDGE] EVENT BROADCAST -> Display Listener:', matchData);
          onMatchUpdate(matchData);
        })();
      }
    )
    // 2. Listen to Realtime Broadcast events 'SCORE_UPDATE'
    .on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
      void (async () => {
        console.log('[BRIDGE] EVENT RECEIVED (Broadcast SCORE_UPDATE):', payload);
        const matchData = await enrichLiveMatchData(normalizeLiveMatchData(payload));

        lastReceivedEvent = payload.type || 'SCORE_UPDATE';
        lastReceivedTime = new Date().toLocaleTimeString();
        lastReceivedData = matchData;

        console.log('[BRIDGE] EVENT BROADCAST -> Display Listener:', matchData);
        onMatchUpdate(matchData);
      })();
    })
    // 3. Listen to Realtime Broadcast events 'TEST_LIVE_UPDATE'
    .on('broadcast', { event: 'TEST_LIVE_UPDATE' }, ({ payload }) => {
      void (async () => {
        console.log('[BRIDGE] EVENT RECEIVED (Broadcast TEST_LIVE_UPDATE):', payload);
        const matchData = await enrichLiveMatchData(normalizeLiveMatchData(payload));

        lastReceivedEvent = 'TEST_LIVE_UPDATE';
        lastReceivedTime = new Date().toLocaleTimeString();
        lastReceivedData = matchData;

        console.log('[BRIDGE] EVENT BROADCAST -> Display Listener (Test Event):', matchData);
        onMatchUpdate(matchData);
      })();
    });

  liveMatchChannel.subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      currentConnectionStatus = 'CONNECTED';
      console.log('[BRIDGE] CONNECTED to Realtime channel kt-live-matches');
      if (onStatusChange) onStatusChange('CONNECTED', { url: wsUrl });
    } else if (status === 'TIMED_OUT') {
      currentConnectionStatus = 'RECONNECTING';
      console.warn('[BRIDGE] Realtime subscription timed out, reconnecting...');
      if (onStatusChange) onStatusChange('RECONNECTING', { url: wsUrl, error: 'Subscription timed out' });
    } else if (status === 'CLOSED') {
      currentConnectionStatus = 'DISCONNECTED';
      console.warn('[BRIDGE] Realtime subscription closed');
      if (onStatusChange) onStatusChange('DISCONNECTED', { url: wsUrl, error: 'Channel closed' });
    } else if (status === 'CHANNEL_ERROR') {
      currentConnectionStatus = 'ERROR';
      const errMsg = err ? (typeof err === 'string' ? err : JSON.stringify(err)) : 'Realtime Channel Error';
      console.error('[BRIDGE] Realtime channel error:', errMsg);
      if (onStatusChange) onStatusChange('ERROR', { url: wsUrl, error: errMsg });
    }
  });

  return () => {
    if (liveMatchChannel) {
      console.log('[BRIDGE] Unsubscribing from Realtime channel kt-live-matches');
      supabase.removeChannel(liveMatchChannel);
      liveMatchChannel = null;
      currentConnectionStatus = 'DISCONNECTED';
      if (onStatusChange) onStatusChange('DISCONNECTED', { url: wsUrl });
    }
  };
}

/**
 * Sends a Bridge Health Test message (TEST_LIVE_UPDATE or SCORE_UPDATE) to test real-time connectivity.
 */
export async function sendBridgeTestMessage(type: 'TEST_LIVE_UPDATE' | 'SCORE_UPDATE' = 'TEST_LIVE_UPDATE'): Promise<{
  success: boolean;
  message: string;
}> {
  const timestamp = new Date().toLocaleTimeString();
  
  const testPayload = type === 'TEST_LIVE_UPDATE' ? {
    type: 'TEST_LIVE_UPDATE',
    message: 'KarateTech Bridge Test',
    timestamp,
    tournamentId: 'kt-tourn-test-001',
    matchId: 'R1B3',
    tatamiId: 'Tatami 1',
    aka: { name: 'A. HAROUN (TEST)', score: 3, senshu: true, fouls: ['C1'] },
    ao: { name: 'K. STANISLAV (TEST)', score: 2, senshu: false, fouls: ['C1', 'C2'] },
  } : {
    type: 'SCORE_UPDATE',
    tournamentId: 'kt-tourn-live-100',
    matchId: 'R1B3',
    tatamiId: 'Tatami 1',
    category: 'Male Senior Kumite -75kg',
    round: 'FINALS - BOUT #42',
    matchTime: '01:45',
    aka: { name: 'A. HAROUN', country: 'MAS', club: 'Senshi Karate Team', score: 4, senshu: true, fouls: ['C1', 'C2'] },
    ao: { name: 'K. STANISLAV', country: 'KAZ', club: 'Kazakhstan National', score: 2, senshu: false, fouls: ['C1'] },
    timestamp,
  };

  console.log(`[BRIDGE] SENDING HEALTH TEST (${type})...`, testPayload);

  if (!liveMatchChannel) {
    liveMatchChannel = supabase.channel('kt-live-matches', {
      config: { broadcast: { ack: true, self: true } },
    });
    await liveMatchChannel.subscribe();
  }

  try {
    const result = await liveMatchChannel.send({
      type: 'broadcast',
      event: type,
      payload: testPayload,
    });

    if (result === 'ok') {
      console.log('[BRIDGE] EVENT BROADCAST SUCCESS:', testPayload);
      return { success: true, message: `Test message ${type} sent successfully at ${timestamp}` };
    } else {
      console.error('[BRIDGE] EVENT BROADCAST FAILURE:', result);
      return { success: false, message: `Broadcast failed with status: ${result}` };
    }
  } catch (err) {
    const errStr = err instanceof Error ? err.message : String(err);
    console.error('[BRIDGE] EVENT BROADCAST ERROR:', errStr);
    return { success: false, message: errStr };
  }
}
