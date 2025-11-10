import axiosInstance from './axiosInstance';

// Interface pour le rôle de l'utilisateur
export interface Role {
  id: number;
  name: string;
  description: string;
}

// Interface pour les données de l'utilisateur
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: Role;
}

/**
 * Récupère les données de l'utilisateur actuellement authentifié.
 * @returns Une promesse qui résout avec les données de l'utilisateur.
 */
export const getMe = async (): Promise<User> => {
  try {
    const response = await axiosInstance.get<User>('/api/v1/users/me');
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des données de l'utilisateur:", error);
    throw error;
  }
};
