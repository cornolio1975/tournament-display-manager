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
