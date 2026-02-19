import axiosInstance from './axiosInstance';
// import axios from 'axios'; // pour l'appel direct (évite l'intercepteur)

export const requestPasswordReset = async (email: string) => {
  try {
    const response = await axiosInstance.post('/api/v1/auth/request-password-reset', { email });
    return response.data;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error;
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const response = await axiosInstance.post('/api/v1/auth/reset-password', {
      token,
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

export const loginUser = async (credentials: { username: string; password: string; source?: string }) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    // Ajout du paramètre source si fourni
    if (credentials.source) {
      formData.append('source', credentials.source);
    }

    const response = await axiosInstance.post('/api/v1/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Email ou mot de passe incorrect');
    } else if (error.response?.status === 403) {
      // Message spécifique pour les utilisateurs non autorisés sur web
      throw new Error('Vous n\'êtes pas autorisé à accéder à l\'application web. Veuillez utiliser l\'application mobile.');
    } else if (error.response?.status === 404) {
      throw new Error('Endpoint non trouvé. Vérifiez l\'URL de l\'API.');
    } else {
      throw new Error('Échec de la connexion. Veuillez réessayer.');
    }
  }
};

export const registerUser = async (userData: { name: string; email: string; phone_number?: string; password: string }) => {
  try {
    const response = await axiosInstance.post('/api/v1/users/', userData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Erreur lors de la création du compte');
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await axiosInstance.get('/api/v1/users/me');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Non authentifié');
    }
    throw new Error('Erreur lors de la récupération des informations utilisateur');
  }
};

export const logoutUser = async (): Promise<void> => {
  const token = localStorage.getItem('ekklesia-token');
  if (!token) return;

  try {
    // Appel au backend pour invalider le token (si implémenté plus tard)
    await axiosInstance.post('/api/v1/auth/logout');
  } catch (error) {
    console.error('Erreur lors de la déconnexion côté serveur :', error);
  } finally {
    // Supprimer le token localement quoi qu'il arrive
    localStorage.removeItem('ekklesia-token');
  }
};