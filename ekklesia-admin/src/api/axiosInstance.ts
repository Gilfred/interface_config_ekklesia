import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000', // Remplacez par l'URL de votre API
});

// Intercepteur pour ajouter le token d'authentification
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ekklesia-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401 (token expiré ou invalide)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Supprimer le token local
      localStorage.removeItem('ekklesia-token');
      // Rediriger vers la page de connexion si on n'y est pas déjà
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;