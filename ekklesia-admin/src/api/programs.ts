import axiosInstance from './axiosInstance';

// Les interfaces ont été déplacées vers Programs.tsx

export const getPrograms = async (): Promise<any[]> => {
  try {
    const response = await axiosInstance.get('/api/v1/programs');
    return response.data;
  } catch (error) {
    console.error('Error fetching programs:', error);
    throw error;
  }
};

export const createProgram = async (data: any): Promise<any> => {
  try {
    const response = await axiosInstance.post('/api/v1/programs', data);
    return response.data;
  } catch (error) {
    console.error('Error creating program:', error);
    throw error;
  }
};

export const deleteProgram = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/api/v1/programs/${id}`);
  } catch (error) {
    console.error('Error deleting program:', error);
    throw error;
  }
};
