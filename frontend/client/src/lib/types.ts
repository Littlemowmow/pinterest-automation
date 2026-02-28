export type PhotoStatus = 'new' | 'tagged' | 'approved' | 'scheduled' | 'posted' | 'skipped';

export interface Photo {
  id: string;
  drive_file_id: string;
  file_name: string;
  drive_url: string;
  thumbnail_url: string | null;
  storage_url: string | null;
  status: PhotoStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ScheduledPin {
  id: string;
  photo_id: string;
  title: string | null;
  description: string | null;
  board_id: string;
  board_name: string;
  link_url: string | null;
  position: number;
  scheduled_for: string | null;
  posted_at: string | null;
  pinterest_pin_id: string | null;
  paused: boolean;
  photo: Photo;
  tags: string[];
}

export interface Settings {
  drive_folder_id: string | null;
  posting_interval_hours: number;
  default_post_time: string;
  google_connected: boolean;
  pinterest_connected: boolean;
}

export interface BoardMapping {
  id: string;
  category: string;
  board_id: string | null;
  board_name: string;
  link_url: string | null;
}

export interface PhotoStats {
  new: number;
  tagged: number;
  approved: number;
  scheduled: number;
  posted: number;
  skipped: number;
}

export interface QueueResponse {
  pins: ScheduledPin[];
  next_post: string | null;
  is_paused: boolean;
}
