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
import { supabase } from '@/lib/supabaseClient';

export const db = {
  // --- TOURNAMENT MANAGEMENT MODULE ---
  tournaments: {
    async list(): Promise<Tournament[]> {
      return getTournaments();
    },
    async getActive(): Promise<Tournament | null> {
      return getActiveTournament();
    },
    async saveAll(tournaments: Tournament[]): Promise<void> {
      await saveTournaments(tournaments);
    },
    async add(tournament: Omit<Tournament, 'id'>): Promise<Tournament> {
      const list = await getTournaments();
      const newT: Tournament = {
        ...tournament,
        id: `tourn-${Date.now()}`,
      };
      let updated = list;
      if (newT.active) {
        updated = list.map((t) => ({ ...t, active: false }));
      }
      updated = [newT, ...updated];
      await saveTournaments(updated);
      return newT;
    },
    async update(id: string, updates: Partial<Tournament>): Promise<Tournament | null> {
      const list = await getTournaments();
      const idx = list.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      let updated = list;
      if (updates.active) {
        updated = updated.map((t) => ({ ...t, active: t.id === id }));
      }
      const item = { ...updated[idx], ...updates };
      updated[idx] = item;
      await saveTournaments(updated);
      return item;
    },
  },

  // --- SPONSOR MANAGEMENT MODULE ---
  sponsors: {
    async list(): Promise<Sponsor[]> {
      return getSponsors();
    },
    async saveAll(sponsors: Sponsor[]): Promise<void> {
      await saveSponsors(sponsors);
    },
    async add(sponsor: Omit<Sponsor, 'id'>): Promise<Sponsor> {
      const list = await getSponsors();
      const newS: Sponsor = {
        ...sponsor,
        id: `sp-${Date.now()}`,
      };
      const updated = [...list, newS];
      await saveSponsors(updated);
      return newS;
    },
    async update(id: string, updates: Partial<Sponsor>): Promise<Sponsor | null> {
      const list = await getSponsors();
      const idx = list.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      const updated = [...list];
      updated[idx] = { ...updated[idx], ...updates };
      await saveSponsors(updated);
      return updated[idx];
    },
  },

  // --- DISPLAY PLAYLIST MODULE ---
  displayPlaylists: {
    async list(): Promise<DisplayPlaylist[]> {
      const { data, error } = await supabase.from('display_playlists').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching display playlists:', error);
        return [];
      }
      return data || [];
    },

    async getById(id: string): Promise<DisplayPlaylist | null> {
      const { data, error } = await supabase.from('display_playlists').select('*').eq('id', id).single();
      if (error) {
        console.error('Error fetching display playlist by id:', error);
        return null;
      }
      return data;
    },

    async add(playlistData: Omit<DisplayPlaylist, 'id' | 'created_at' | 'updated_at'>): Promise<DisplayPlaylist | null> {
      const now = new Date().toISOString();
      
      if (playlistData.is_active) {
        // Deactivate all others first
        await supabase.from('display_playlists').update({ is_active: false }).neq('id', '0');
      }

      const { data, error } = await supabase.from('display_playlists').insert([{
        ...playlistData,
        created_at: now,
        updated_at: now,
      }]).select().single();

      if (error) {
        console.error('Error adding display playlist:', error);
        return null;
      }
      
      return data;
    },

    async update(id: string, updates: Partial<DisplayPlaylist>): Promise<DisplayPlaylist | null> {
      const now = new Date().toISOString();
      
      if (updates.is_active) {
        await supabase.from('display_playlists').update({ is_active: false }).neq('id', '0');
      }

      const { data, error } = await supabase.from('display_playlists').update({
        ...updates,
        updated_at: now,
      }).eq('id', id).select().single();

      if (error) {
        console.error('Error updating display playlist:', error);
        return null;
      }
      
      return data;
    },

    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('display_playlists').delete().eq('id', id);
      if (error) {
        console.error('Error deleting display playlist:', error);
        return false;
      }
      return true;
    },

    async setActive(id: string): Promise<DisplayPlaylist | null> {
      return this.update(id, { is_active: true });
    },
  },
};
