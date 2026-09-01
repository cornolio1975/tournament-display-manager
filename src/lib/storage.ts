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
  return (data ?? []).map(({ is_deleted, ...sponsor }) => ({
    ...sponsor,
    isDeleted: is_deleted,
  }));
}

export async function saveSponsors(sponsors: Sponsor[]): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured. Restart the development server after updating .env.local.');
  }

  const now = new Date().toISOString();
  const processed = await Promise.all(
    sponsors.map(async ({ isDeleted, ...sponsor }) => {
      const sponsorWithTimestamp = sponsor as typeof sponsor & { created_at?: string };
      return {
        ...sponsor,
        created_at: sponsorWithTimestamp.created_at ?? now,
        updated_at: now,
        is_deleted: isDeleted ?? false,
        logo: await uploadMediaIfDataUrl(sponsor.logo, 'sponsor'),
      };
    })
  );
  const { error } = await supabase.from('sponsors').upsert(processed);
  if (error) {
    console.warn('Failed to save sponsors:', error.message);
    throw new Error(error.message || 'Supabase rejected the sponsor save request.');
  }
}

// --- DM settings helpers ---
// DM-specific fields are stored inside the `settings.dm` JSONB sub-object
// so they don't conflict with KarateTech's own tournament columns.

interface DmSettings {
  active?: boolean;
  isDeleted?: boolean;
  logo?: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  facebookInstagram?: string;
  address?: string;
  description?: string;
  karateTechId?: string;
  karateTechSyncedAt?: string;
}

/** Extract DM overlay fields from a raw Supabase tournament row */
function rowToTournament(row: Record<string, unknown>): Tournament {
  const dm = ((row.settings as Record<string, unknown>)?.dm ?? {}) as DmSettings;
  return {
    id: row.id as string,
    name: (row.name as string) ?? '',
    organizer: (row.organizer as string) ?? '',
    date: (row.date as string) ?? '',
    venue: (row.venue as string) ?? '',
    address: dm.address ?? (row.city as string) ?? '',
    description: dm.description ?? (row.discipline as string) ?? '',
    logo: dm.logo ?? '',
    contactPerson: dm.contactPerson ?? '',
    phoneNumber: dm.phoneNumber ?? '',
    email: dm.email ?? '',
    website: dm.website ?? (row.pdf_url as string) ?? '',
    facebookInstagram: dm.facebookInstagram ?? '',
    active: dm.active ?? false,
    isDeleted: dm.isDeleted ?? !!(row.deleted_at),
    karateTechId: dm.karateTechId ?? (row.id as string),
    karateTechSyncedAt: dm.karateTechSyncedAt,
  };
}

/** Build the Supabase upsert payload — only valid KT columns + settings.dm for DM fields */
async function tournamentToRow(t: Tournament): Promise<Record<string, unknown>> {
  const uploadedLogo = await uploadMediaIfDataUrl(t.logo, 'tournament');

  // Merge DM fields into settings.dm, preserving any existing KT settings
  const dmPayload: DmSettings = {
    active: t.active,
    isDeleted: t.isDeleted ?? false,
    logo: uploadedLogo,
    contactPerson: t.contactPerson,
    phoneNumber: t.phoneNumber,
    email: t.email,
    website: t.website,
    facebookInstagram: t.facebookInstagram,
    address: t.address,
    description: t.description,
    karateTechId: t.karateTechId,
    karateTechSyncedAt: t.karateTechSyncedAt,
  };

  const nowIso = new Date().toISOString();
  const dateStr = t.date || new Date().toLocaleDateString();

  return {
    // KT table columns with required NOT NULL constraints
    id: t.karateTechId ?? t.id,
    name: t.name || 'Tournament',
    organizer: t.organizer || null,
    date: dateStr,
    date_iso: nowIso,
    registration_close: dateStr,
    registration_close_iso: nowIso,
    status: t.active ? 'Active' : 'Upcoming',
    venue: t.venue || null,
    city: t.address || null,
    discipline: t.description || null,
    // Merge DM payload into settings.dm
    settings: { dm: dmPayload },
  };
}

// --- TOURNAMENT STORAGE ---
export async function getTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('id,name,organizer,date,venue,city,discipline,pdf_url,deleted_at,created_at,settings')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('Failed to load tournaments:', error.message || error);
    return [];
  }
  return (data ?? []).map((row) => rowToTournament(row as Record<string, unknown>));
}

export async function saveTournaments(tournaments: Tournament[]): Promise<void> {
  const rows = await Promise.all(tournaments.map(tournamentToRow));
  const { error } = await supabase.from('tournaments').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.warn('Failed to save tournaments:', error.message || error);
  }
}

export async function getActiveTournament(): Promise<Tournament | null> {
  // `active` is stored in settings.dm — fetch all and filter in JS
  const all = await getTournaments();
  return all.find((t) => t.active && !t.isDeleted) ?? null;
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
