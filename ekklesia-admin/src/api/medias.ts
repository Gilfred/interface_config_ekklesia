import axiosInstance from './axiosInstance';
import { Media, MediaCreate } from '../pages/Medias';

export const getMedias = async (): Promise<Media[]> => {
  try {
    const response = await axiosInstance.get('/api/v1/medias');
    return response.data;
  } catch (error) {
    console.error('Error fetching medias:', error);
    throw error;
  }
};

export const createMedia = async (mediaData: MediaCreate): Promise<Media> => {
  const formData = new FormData();
  formData.append('event_id', mediaData.event_id.toString());
  formData.append('file', mediaData.file);

  if (mediaData.title) {
    formData.append('title', mediaData.title);
  }

  try {
    const response = await axiosInstance.post('/api/v1/medias/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating media:', error);
    throw error;
  }
};

export const deleteMedia = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/api/v1/medias/${id}`);
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
};
