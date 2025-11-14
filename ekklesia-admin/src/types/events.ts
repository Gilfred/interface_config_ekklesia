export interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  user_id: number;
}

export interface CreateEventData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
}
