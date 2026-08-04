import { Sponsor, Tournament, PlaylistItem } from './types';
import { supabase } from './supabaseClient';

// Helper to notify all platforms and open tabs
export function broadcastDatabaseUpdate(type: 'sponsors' | 'tournaments' | 'playlist' | 'display_playlists') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(`ts_${type}_updated`));
}

// Set up Supabase Realtime listeners
if (typeof window !== 'undefined') {
  supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, () => {
      broadcastDatabaseUpdate('sponsors');
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => {
      broadcastDatabaseUpdate('tournaments');
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'playlist_items' }, () => {
      broadcastDatabaseUpdate('playlist');
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'display_playlists' }, () => {
      broadcastDatabaseUpdate('display_playlists');
    })
    .subscribe();
}

// Helper for Base64 image/video uploads to Supabase Storage
async function uploadMediaIfDataUrl(dataUrl: string, folder: string): Promise<string> {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl;
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return dataUrl;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    const ext = mime.split('/')[1] || 'bin';
    const filename = `${folder}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('media').upload(filename, blob, { contentType: mime });
    if (error) {
      console.error('Storage upload error:', error);
      return dataUrl;
    }
    const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(filename);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Media upload fallback error:', err);
    return dataUrl;
  }
}

// --- SPONSOR STORAGE ---
export async function getSponsors(): Promise<Sponsor[]> {
  const { data, error } = await supabase.from('sponsors').select('*').order('order', { ascending: true });
  if (error) {
    console.error('Failed to load sponsors:', error);
    return [];
  }
  return data || [];
}

export async function saveSponsors(sponsors: Sponsor[]): Promise<void> {
  const processed = await Promise.all(
    sponsors.map(async (s) => ({
      ...s,
      logo: await uploadMediaIfDataUrl(s.logo, 'sponsor'),
    }))
  );
  const { error } = await supabase.from('sponsors').upsert(processed);
  if (error) console.error('Failed to save sponsors:', error);
}

// --- TOURNAMENT STORAGE ---
export async function getTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Failed to load tournaments:', error);
    return [];
  }
  return data || [];
}

export async function saveTournaments(tournaments: Tournament[]): Promise<void> {
  const processed = await Promise.all(
    tournaments.map(async (t) => ({
      ...t,
      logo: await uploadMediaIfDataUrl(t.logo, 'tournament'),
    }))
  );
  const { error } = await supabase.from('tournaments').upsert(processed);
  if (error) console.error('Failed to save tournaments:', error);
}

export async function getActiveTournament(): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('active', true)
    .eq('is_deleted', false)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error loading active tournament:', error);
  }
  return data || null;
}

// --- PLAYLIST STORAGE ---
export async function getPlaylist(): Promise<PlaylistItem[]> {
  const { data, error } = await supabase.from('playlist_items').select('*').order('order', { ascending: true });
  if (error) {
    console.error('Failed to load playlist:', error);
    return [];
  }
  return data || [];
}

export async function savePlaylist(items: PlaylistItem[]): Promise<void> {
  const processed = await Promise.all(
    items.map(async (item) => ({
      ...item,
      url: await uploadMediaIfDataUrl(item.url, 'playlist'),
    }))
  );
  const { error } = await supabase.from('playlist_items').upsert(processed);
  if (error) console.error('Failed to save playlist:', error);
}
