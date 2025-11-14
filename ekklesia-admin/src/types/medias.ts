export interface Media {
  id: number;
  title: string;
  type: 'image' | 'video';
  file_path: string;
  event_id: number;
  created_at: string;
  updated_at: string;
}

export interface MediaCreate {
  event_id: number;
  file: File;
  title?: string;
}
