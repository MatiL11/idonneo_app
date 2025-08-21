export interface Article {
  id: string;
  title: string;
  tag?: string;
  content?: string;
  image_url?: string;
  date?: string;
  read_time?: string;
  created_at?: string;
  updated_at?: string;
  saved?: boolean;
}
