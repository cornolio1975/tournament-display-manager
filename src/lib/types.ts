export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  website: string;
  order: number;
  active: boolean;
  isDeleted?: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  organizer: string;
  date: string;
  venue: string;
  address: string;
  description: string;
  logo: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  website: string;
  facebookInstagram?: string;
  active: boolean;
  isDeleted?: boolean;
  /** UUID from KarateTech 2.0 tournaments table — set when synced from KarateTech */
  karateTechId?: string;
  /** ISO timestamp of last sync from KarateTech */
  karateTechSyncedAt?: string;
}

/**
 * Raw row shape from the KarateTech 2.0 Supabase `tournaments` table (flat columns only).
 * The full `data` blob is excluded to keep syncs lightweight.
 */
export interface KarateTechTournamentRow {
  id: string;
  name: string;
  organizer: string | null;
  date: string | null;
  date_iso: string | null;
  venue: string | null;
  city: string | null;
  discipline: string | null;
  status: string | null; // e.g. "Active", "Upcoming", "Completed"
  total_participants: number | null;
  total_clubs: number | null;
  pdf_url: string | null;
  deleted_at: string | null;
  created_at: string;
  last_modified: string | null;
}

export interface PlaylistItem {
  id: string;
  title: string;
  type: 'video' | 'image';
  url: string;
  duration: number; // in seconds
  order: number;
  active: boolean;
  isDeleted?: boolean;
}

export type ActiveTab = 'dashboard' | 'sponsors' | 'tournaments' | 'playlist';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

export type BridgeConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'ERROR';

export interface LiveMatchData {
  tournamentId?: string;
  matchId?: string;
  boutNo?: number | string;
  participantAId?: string;
  participantBId?: string;
  categoryId?: string;
  tatami?: string;
  category?: string;
  round?: string;
  status?: string;
  matchTime?: string;
  timerSeconds?: number;
  timerActive?: boolean;
  aka: {
    name: string;
    country?: string;
    club?: string;
    score: number;
    senshu: boolean;
    fouls?: string[];
  };
  ao: {
    name: string;
    country?: string;
    club?: string;
    score: number;
    senshu: boolean;
    fouls?: string[];
  };
  winner?: string;
  victoryMethod?: string;
  lastEvent?: string;
  lastMessageTime?: string;
  testMessage?: string;
}

