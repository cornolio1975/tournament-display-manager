import { Sponsor, Tournament, PlaylistItem } from './types';
import { setIndexedDBItem, getIndexedDBItem } from './idb';

const SPONSORS_KEY = 'sp_tournament_sponsors_v2';
const TOURNAMENTS_KEY = 'sp_tournament_details_v2';
const PLAYLIST_KEY = 'sp_tournament_playlist_v2';

// Cross-tab & Multi-window Broadcast Channel for real-time DB sync across platforms
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('karatetech_db_sync_channel');
  } catch (err) {
    console.warn('BroadcastChannel initialization warning:', err);
  }
}

// Helper to notify all platforms and open tabs
export function broadcastDatabaseUpdate(type: 'sponsors' | 'tournaments' | 'playlist') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(`ts_${type}_updated`));
  window.dispatchEvent(new Event('storage'));
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, timestamp: Date.now() });
    } catch (e) {
      console.warn('Broadcast message error:', e);
    }
  }
}

// In-memory cache for IndexedDB media strings (base64 data URLs)
const mediaCache = new Map<string, string>();
const pendingHydrations = new Set<string>();

// Seed sample data for immediate visual impact
export const DEFAULT_SPONSORS: Sponsor[] = [
  {
    id: 'sp-1',
    name: 'SP SportData Solution',
    logo: '/sp_logo.jpg',
    website: 'https://spsportdatasolution.org',
    order: 1,
    active: true,
  },
  {
    id: 'sp-2',
    name: 'Senshi Martial Arts Gear',
    logo: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=300&auto=format&fit=crop&q=80',
    website: 'https://senshigear.example.com',
    order: 2,
    active: true,
  },
  {
    id: 'sp-3',
    name: 'Arax Energy Systems',
    logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop&q=80',
    website: 'https://araxenergy.example.com',
    order: 3,
    active: true,
  },
  {
    id: 'sp-4',
    name: 'Global Martial Tech',
    logo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80',
    website: 'https://globalmartialtech.org',
    order: 4,
    active: true,
  },
];

export const DEFAULT_TOURNAMENTS: Tournament[] = [
  {
    id: 'tourn-1',
    name: 'Karate Grand Prix Championship 2026',
    organizer: 'SP SportData & WKF Federation',
    date: '2026-08-15 - 2026-08-17',
    venue: 'National Sports Complex Arena',
    address: 'Bukit Jalil Sports City, 57000 Kuala Lumpur, Malaysia',
    description: 'Premier international karate competition featuring top elite athletes competing in Kumite and Kata categories.',
    logo: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&auto=format&fit=crop&q=80',
    contactPerson: 'Master Tan Sri Alex',
    phoneNumber: '+60 12-345 6789',
    email: 'info@spsportdatasolution.org',
    website: '/display',
    facebookInstagram: '@karategrandprix2026',
    active: true,
  },
  {
    id: 'tourn-2',
    name: 'Asian Junior Martial Arts Open',
    organizer: 'Senshi Karate Academy',
    date: '2026-11-10 - 2026-11-12',
    venue: 'Indoors Stadium Center',
    address: 'Persiaran Sukan, 40000 Shah Alam, Selangor',
    description: 'Regional championship showcasing young emerging talents across Asia.',
    logo: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=400&auto=format&fit=crop&q=80',
    contactPerson: 'Elena Rostova',
    phoneNumber: '+60 17-987 6543',
    email: 'contact@senshiopen.com',
    website: '/display',
    facebookInstagram: '@asianjuniorkarate',
    active: false,
  },
];

export const DEFAULT_PLAYLIST: PlaylistItem[] = [
  {
    id: 'media-1',
    title: 'SP SPORTDATA SOLUTION Official 20s Intro',
    type: 'video',
    url: '/sp_sportdata_promo_20s.mp4',
    duration: 20,
    order: 1,
    active: true,
  },
  {
    id: 'media-2',
    title: 'Championship Trophy & Medals Showcase',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=1200&auto=format&fit=crop&q=80',
    duration: 10,
    order: 2,
    active: true,
  },
  {
    id: 'media-3',
    title: 'Sensei Kata Demonstration Highlights',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 15,
    order: 3,
    active: true,
  },
  {
    id: 'media-4',
    title: 'Official Sponsors & Partners Wall',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80',
    duration: 8,
    order: 4,
    active: true,
  },
];

const isClient = typeof window !== 'undefined';

function hydrateMediaReference(idbKey: string) {
  if (!isClient || mediaCache.has(idbKey) || pendingHydrations.has(idbKey)) return;
  pendingHydrations.add(idbKey);
  getIndexedDBItem(idbKey)
    .then((resolvedUrl) => {
      pendingHydrations.delete(idbKey);
      if (resolvedUrl) {
        mediaCache.set(idbKey, resolvedUrl);
        window.dispatchEvent(new Event('storage'));
      }
    })
    .catch((err) => {
      pendingHydrations.delete(idbKey);
      console.error(`Failed to hydrate media key ${idbKey}:`, err);
    });
}

function processMediaForSave<T extends { url?: string; logo?: string; id: string }>(
  items: T[],
  field: 'url' | 'logo'
): T[] {
  return items.map((item) => {
    const val = item[field];
    if (typeof val === 'string' && val.startsWith('data:')) {
      const idbKey = `idb_media_${item.id}_${field}`;
      mediaCache.set(idbKey, val);
      setIndexedDBItem(idbKey, val);
      return { ...item, [field]: idbKey };
    }
    return item;
  });
}

function resolveMediaForLoad<T extends { url?: string; logo?: string }>(
  items: T[],
  field: 'url' | 'logo'
): T[] {
  return items.map((item) => {
    const val = item[field];
    if (typeof val === 'string' && val.startsWith('idb_media_')) {
      if (mediaCache.has(val)) {
        return { ...item, [field]: mediaCache.get(val)! };
      }
      hydrateMediaReference(val);
    }
    return item;
  });
}

// --- SPONSOR STORAGE ---
export function getSponsors(): Sponsor[] {
  if (!isClient) return DEFAULT_SPONSORS;
  try {
    const data = localStorage.getItem(SPONSORS_KEY);
    if (!data) {
      try {
        localStorage.setItem(SPONSORS_KEY, JSON.stringify(DEFAULT_SPONSORS));
      } catch (err) {
        console.warn('LocalStorage save initial sponsors warning:', err);
      }
      return DEFAULT_SPONSORS;
    }
    const parsed: Sponsor[] = JSON.parse(data);
    return resolveMediaForLoad(parsed, 'logo');
  } catch (err) {
    console.error('Failed to load sponsors:', err);
    return DEFAULT_SPONSORS;
  }
}

export function saveSponsors(sponsors: Sponsor[]): void {
  if (!isClient) return;
  try {
    const processed = processMediaForSave(sponsors, 'logo');
    localStorage.setItem(SPONSORS_KEY, JSON.stringify(processed));
    broadcastDatabaseUpdate('sponsors');
  } catch (err) {
    console.warn('LocalStorage full, offloading all logos to IndexedDB...', err);
    try {
      const forceProcessed = sponsors.map((s) => {
        if (s.logo && s.logo.length > 500) {
          const idbKey = `idb_media_${s.id}_logo`;
          mediaCache.set(idbKey, s.logo);
          setIndexedDBItem(idbKey, s.logo);
          return { ...s, logo: idbKey };
        }
        return s;
      });
      localStorage.setItem(SPONSORS_KEY, JSON.stringify(forceProcessed));
      broadcastDatabaseUpdate('sponsors');
    } catch (quotaErr) {
      console.error('Critical quota error saving sponsors:', quotaErr);
    }
  }
}

// --- TOURNAMENT STORAGE ---
export function getTournaments(): Tournament[] {
  if (!isClient) return DEFAULT_TOURNAMENTS;
  try {
    const data = localStorage.getItem(TOURNAMENTS_KEY);
    if (!data) {
      try {
        localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(DEFAULT_TOURNAMENTS));
      } catch (err) {
        console.warn('LocalStorage save initial tournaments warning:', err);
      }
      return DEFAULT_TOURNAMENTS;
    }
    const list: Tournament[] = JSON.parse(data);
    let modified = false;
    const sanitized = list.map((t) => {
      if (!t.website || t.website.includes('display.spsportdatasolution.org')) {
        modified = true;
        return { ...t, website: '/display' };
      }
      return t;
    });
    if (modified) {
      try {
        localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(sanitized));
      } catch (err) {
        console.warn('LocalStorage update tournament warning:', err);
      }
    }
    return resolveMediaForLoad(sanitized, 'logo');
  } catch (err) {
    console.error('Failed to load tournaments:', err);
    return DEFAULT_TOURNAMENTS;
  }
}

export function saveTournaments(tournaments: Tournament[]): void {
  if (!isClient) return;
  try {
    const processed = processMediaForSave(tournaments, 'logo');
    localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(processed));
    broadcastDatabaseUpdate('tournaments');
  } catch (err) {
    console.error('Failed to save tournaments:', err);
  }
}

export function getActiveTournament(): Tournament | null {
  const list = getTournaments().filter((t) => !t.isDeleted);
  return list.find((t) => t.active) || list[0] || null;
}

// --- PLAYLIST STORAGE ---
export function getPlaylist(): PlaylistItem[] {
  if (!isClient) return DEFAULT_PLAYLIST;
  try {
    const data = localStorage.getItem(PLAYLIST_KEY);
    if (!data) {
      try {
        localStorage.setItem(PLAYLIST_KEY, JSON.stringify(DEFAULT_PLAYLIST));
      } catch (err) {
        console.warn('LocalStorage save initial playlist warning:', err);
      }
      return DEFAULT_PLAYLIST;
    }
    const list: PlaylistItem[] = JSON.parse(data);
    if (!list.some((item) => item.url === '/sp_sportdata_promo_20s.mp4')) {
      const updated = [DEFAULT_PLAYLIST[0], ...list.filter((item) => item.id !== 'media-1')];
      try {
        localStorage.setItem(PLAYLIST_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage item update warning:', err);
      }
      return resolveMediaForLoad(updated, 'url');
    }
    return resolveMediaForLoad(list, 'url');
  } catch (err) {
    console.error('Failed to load playlist:', err);
    return DEFAULT_PLAYLIST;
  }
}

export function savePlaylist(items: PlaylistItem[]): void {
  if (!isClient) return;
  try {
    const processed = processMediaForSave(items, 'url');
    localStorage.setItem(PLAYLIST_KEY, JSON.stringify(processed));
    broadcastDatabaseUpdate('playlist');
  } catch (err) {
    console.warn('Quota warning saving playlist to LocalStorage. Offloading heavy URLs to IndexedDB...', err);
    try {
      const forceProcessed = items.map((item) => {
        if (item.url && item.url.length > 500) {
          const idbKey = `idb_media_${item.id}_url`;
          mediaCache.set(idbKey, item.url);
          setIndexedDBItem(idbKey, item.url);
          return { ...item, url: idbKey };
        }
        return item;
      });
      localStorage.setItem(PLAYLIST_KEY, JSON.stringify(forceProcessed));
      broadcastDatabaseUpdate('playlist');
    } catch (quotaErr) {
      console.error('Critical quota error saving playlist:', quotaErr);
    }
  }
}
