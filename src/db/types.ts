export type DisplaySlideType =
  | 'kumite_scoreboard'
  | 'kata_scoreboard'
  | 'category_brackets'
  | 'medal_standings'
  | 'match_schedule'
  | 'announcement_sponsor'
  | 'video'
  | 'image';

export interface DisplayPlaylistSlide {
  id: string;
  type: DisplaySlideType;
  title: string;
  duration_seconds: number;
  tatami_filter?: string; // e.g. "Tatami 1", "Tatami 2", "All"
  category_filter?: string; // e.g. "Male Kumite -75kg"
  announcement_text?: string;
  sponsor_image_url?: string;
  video_url?: string;
  order: number;
}

export interface DisplayPlaylist {
  id: string;
  name: string;
  description: string;
  tatami?: string;
  is_active: boolean;
  slides: DisplayPlaylistSlide[];
  created_at: string;
  updated_at: string;
}
