export type PhotoStatus = 'new' | 'tagged' | 'approved' | 'scheduled' | 'posted' | 'skipped';

export interface Photo {
  id: string;
  drive_file_id: string;
  file_name: string;
  drive_url: string;
  thumbnail_url?: string;
  status: PhotoStatus;
  created_at: string;
  updated_at?: string;
  tags?: string[];
}

export interface PhotoListResponse {
  photos: Photo[];
  total: number;
}

export interface PhotoStats {
  new: number;
  tagged: number;
  approved: number;
  scheduled: number;
  posted: number;
  skipped: number;
}

export interface Tag {
  id: string;
  photo_id: string;
  tag: string;
  created_at: string;
}

export interface ScheduledPin {
  id: string;
  photo_id: string;
  title?: string;
  description?: string;
  board_id: string;
  link_url?: string;
  position: number;
  scheduled_for?: string;
  posted_at?: string;
  pinterest_pin_id?: string;
  paused: boolean;
  created_at: string;
  photo_file_name?: string;
  photo_drive_url?: string;
  photo_thumbnail_url?: string;
  tags?: string[];
}

export interface QueueListResponse {
  pins: ScheduledPin[];
  total: number;
  next_post?: string;
  is_paused: boolean;
}

export interface Settings {
  id: string;
  drive_folder_id?: string;
  posting_interval_hours: number;
  default_post_time: string;
  google_connected: boolean;
  pinterest_connected: boolean;
}

export interface BoardMapping {
  id: string;
  category: string;
  board_id?: string;
  board_name: string;
  link_url?: string;
}

export interface BoardMappingListResponse {
  mappings: BoardMapping[];
}
