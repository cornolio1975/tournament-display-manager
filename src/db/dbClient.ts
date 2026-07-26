import { DisplayPlaylist, DisplayPlaylistSlide } from './types';
import {
  getSponsors,
  saveSponsors,
  getTournaments,
  saveTournaments,
  getActiveTournament,
  broadcastDatabaseUpdate,
} from '@/lib/storage';
import { Sponsor, Tournament } from '@/lib/types';

const PLAYLISTS_STORAGE_KEY = 'ts_display_playlists';

export const DEFAULT_DISPLAY_PLAYLISTS: DisplayPlaylist[] = [
  {
    id: 'pl-main-arena',
    name: 'Main Arena Spectator Rotation',
    description: 'Full spectator display loop rotating through Kumite, Brackets, Medals, Schedule, and Kata displays.',
    tatami: 'All Tatamis',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    slides: [
      {
        id: 's-1',
        type: 'kumite_scoreboard',
        title: 'Live Kumite Spectator Scoreboard',
        duration_seconds: 20,
        tatami_filter: 'All',
        order: 1,
      },
      {
        id: 's-2',
        type: 'category_brackets',
        title: 'Tournament Category Brackets & Draws',
        duration_seconds: 15,
        tatami_filter: 'All',
        category_filter: 'Male Senior Kumite -75kg',
        order: 2,
      },
      {
        id: 's-3',
        type: 'medal_standings',
        title: 'Championship Medal Tally & Leaderboard',
        duration_seconds: 12,
        order: 3,
      },
      {
        id: 's-4',
        type: 'match_schedule',
        title: 'Live Match Schedule & Ring Queue',
        duration_seconds: 15,
        tatami_filter: 'All',
        order: 4,
      },
      {
        id: 's-5',
        type: 'kata_scoreboard',
        title: 'WKF 7-Judge Kata Scoreboard',
        duration_seconds: 20,
        tatami_filter: 'Tatami 2',
        order: 5,
      },
      {
        id: 's-6',
        type: 'announcement_sponsor',
        title: 'Official Championship Announcement',
        duration_seconds: 10,
        announcement_text: 'Welcome to the Karate Grand Prix Championship 2026! Athletes please check your bout schedule at Tatami 1 & 2.',
        sponsor_image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80',
        order: 6,
      },
    ],
  },
  {
    id: 'pl-tatami-1',
    name: 'Tatami 1 Live Loop',
    description: 'Dedicated ring display stream for Tatami 1 match scoring and bout queuing.',
    tatami: 'Tatami 1',
    is_active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    slides: [
      {
        id: 't1-s1',
        type: 'kumite_scoreboard',
        title: 'Tatami 1 Live Kumite Scoreboard',
        duration_seconds: 25,
        tatami_filter: 'Tatami 1',
        order: 1,
      },
      {
        id: 't1-s2',
        type: 'match_schedule',
        title: 'Tatami 1 Match Queue',
        duration_seconds: 15,
        tatami_filter: 'Tatami 1',
        order: 2,
      },
      {
        id: 't1-s3',
        type: 'announcement_sponsor',
        title: 'Official Arena Partners',
        duration_seconds: 10,
        announcement_text: 'Powered by KarateTech Display Engine & SP SportData Solution.',
        sponsor_image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
        order: 3,
      },
    ],
  },
];

const isClient = typeof window !== 'undefined';

function getStoredPlaylists(): DisplayPlaylist[] {
  if (!isClient) return DEFAULT_DISPLAY_PLAYLISTS;
  try {
    const raw = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(DEFAULT_DISPLAY_PLAYLISTS));
      return DEFAULT_DISPLAY_PLAYLISTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(DEFAULT_DISPLAY_PLAYLISTS));
      return DEFAULT_DISPLAY_PLAYLISTS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load display playlists from LocalStorage:', err);
    return DEFAULT_DISPLAY_PLAYLISTS;
  }
}

function saveStoredPlaylists(playlists: DisplayPlaylist[]): void {
  if (!isClient) return;
  try {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    broadcastDatabaseUpdate('playlist');
  } catch (err) {
    console.error('Failed to save display playlists to LocalStorage:', err);
  }
}

export const db = {
  // --- TOURNAMENT MANAGEMENT MODULE ---
  tournaments: {
    list(): Tournament[] {
      return getTournaments();
    },
    getActive(): Tournament | null {
      return getActiveTournament();
    },
    saveAll(tournaments: Tournament[]): void {
      saveTournaments(tournaments);
    },
    add(tournament: Omit<Tournament, 'id'>): Tournament {
      const list = getTournaments();
      const newT: Tournament = {
        ...tournament,
        id: `tourn-${Date.now()}`,
      };
      let updated = list;
      if (newT.active) {
        updated = list.map((t) => ({ ...t, active: false }));
      }
      updated = [newT, ...updated];
      saveTournaments(updated);
      return newT;
    },
    update(id: string, updates: Partial<Tournament>): Tournament | null {
      const list = getTournaments();
      const idx = list.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      let updated = list;
      if (updates.active) {
        updated = updated.map((t) => ({ ...t, active: t.id === id }));
      }
      const item = { ...updated[idx], ...updates };
      updated[idx] = item;
      saveTournaments(updated);
      return item;
    },
  },

  // --- SPONSOR MANAGEMENT MODULE ---
  sponsors: {
    list(): Sponsor[] {
      return getSponsors();
    },
    saveAll(sponsors: Sponsor[]): void {
      saveSponsors(sponsors);
    },
    add(sponsor: Omit<Sponsor, 'id'>): Sponsor {
      const list = getSponsors();
      const newS: Sponsor = {
        ...sponsor,
        id: `sp-${Date.now()}`,
      };
      const updated = [...list, newS];
      saveSponsors(updated);
      return newS;
    },
    update(id: string, updates: Partial<Sponsor>): Sponsor | null {
      const list = getSponsors();
      const idx = list.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      const updated = [...list];
      updated[idx] = { ...updated[idx], ...updates };
      saveSponsors(updated);
      return updated[idx];
    },
  },

  // --- DISPLAY PLAYLIST MODULE ---
  displayPlaylists: {
    list(): DisplayPlaylist[] {
      return getStoredPlaylists();
    },

    getById(id: string): DisplayPlaylist | null {
      const playlists = getStoredPlaylists();
      return playlists.find((p) => p.id === id) || null;
    },

    add(playlistData: Omit<DisplayPlaylist, 'id' | 'created_at' | 'updated_at'>): DisplayPlaylist {
      const playlists = getStoredPlaylists();
      const now = new Date().toISOString();
      const newPlaylist: DisplayPlaylist = {
        ...playlistData,
        id: `pl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        created_at: now,
        updated_at: now,
      };

      let updatedList = playlists;
      if (newPlaylist.is_active) {
        updatedList = playlists.map((p) => ({ ...p, is_active: false }));
      }

      updatedList = [newPlaylist, ...updatedList];
      saveStoredPlaylists(updatedList);
      return newPlaylist;
    },

    update(id: string, updates: Partial<DisplayPlaylist>): DisplayPlaylist | null {
      const playlists = getStoredPlaylists();
      const targetIndex = playlists.findIndex((p) => p.id === id);
      if (targetIndex === -1) return null;

      const now = new Date().toISOString();
      let updatedList = playlists;

      if (updates.is_active) {
        updatedList = updatedList.map((p) => ({ ...p, is_active: p.id === id }));
      }

      const updatedPlaylist: DisplayPlaylist = {
        ...updatedList[targetIndex],
        ...updates,
        updated_at: now,
      };

      updatedList[targetIndex] = updatedPlaylist;
      saveStoredPlaylists(updatedList);
      return updatedPlaylist;
    },

    delete(id: string): boolean {
      const playlists = getStoredPlaylists();
      const filtered = playlists.filter((p) => p.id !== id);
      if (filtered.length === playlists.length) return false;

      if (playlists.find((p) => p.id === id)?.is_active && filtered.length > 0) {
        filtered[0].is_active = true;
      }

      saveStoredPlaylists(filtered);
      return true;
    },

    setActive(id: string): DisplayPlaylist | null {
      return this.update(id, { is_active: true });
    },
  },
};
