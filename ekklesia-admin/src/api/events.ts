import { axiosInstance } from './axiosInstance';

export interface Event {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  description: string;
  user_id: number;
}

export interface EventCreate {
  title: string;
  start_date: string;
  end_date: string;
  description: string;
}

export const getEvents = async (): Promise<Event[]> => {
  const response = await axiosInstance.get('/events');
  return response.data;
};

export const createEvent = async (eventData: EventCreate): Promise<Event> => {
  const response = await axiosInstance.post('/events', eventData);
  return response.data;
};
