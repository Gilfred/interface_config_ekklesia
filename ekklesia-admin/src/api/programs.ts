import { axiosInstance } from './axiosInstance';

export const getPrograms = async () => {
  const response = await axiosInstance.get('/programs');
  return response.data;
};
