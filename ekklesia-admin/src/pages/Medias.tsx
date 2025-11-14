import React, { useState, useEffect } from 'react';
import { getMedias, createMedia, deleteMedia } from '../api/medias';

export interface Media {
  id: number;
  title: string;
  type: 'image' | 'video';
  url: string;
  file_path: string;
  event_id: number;
  delete_user_id?: number | null;
  delete_date?: string | null;
  created_at: string;
  updated_at: string;
}

const Medias: React.FC = () => {
  const [medias, setMedias] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [showForm, setShowForm] = useState(false);
  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const fetchMedias = async () => {
    try {
      setLoading(true);
      const data = await getMedias();
      setMedias(data);
    } catch (error) {
      console.error('Failed to fetch medias', error);
      setError('Erreur lors du chargement des médias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedias();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) {
      return;
    }

    try {
      await deleteMedia(id);
      setMedias(medias.filter(media => media.id !== id));
    } catch (error) {
      console.error('Failed to delete media', error);
      setError('Erreur lors de la suppression du média');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !eventId) {
      setError('Veuillez fournir un ID d\'événement et un fichier.');
      return;
    }

    try {
      await createMedia(eventId, file);
      setEventId(0);
      setFile(null);
      setShowForm(false);
      setError(null);
      fetchMedias(); // Actualiser la liste
    } catch (error) {
      console.error('Failed to create media', error);
      setError('Erreur lors de l\'ajout du média');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Médiathèque</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Annuler' : 'Ajouter un média'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Uploader un média
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="event_id" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                ID de l'événement *
              </label>
              <input
                type="number"
                id="event_id"
                value={eventId}
                onChange={(e) => setEventId(parseInt(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="1"
                required
              />
            </div>
            <div>
              <label htmlFor="file_input" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Fichier *
              </label>
              <input
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                id="file_input"
                type="file"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Uploader le média
            </button>
          </form>
        </div>
      )}

      {medias.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white rounded-lg shadow-md dark:bg-gray-800">
          Aucun média trouvé
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {medias.map((media) => {
            const mediaUrl = `${backendUrl}/${media.file_path.replace('app/', '')}`;
            return (
              <div key={media.id} className="bg-white rounded-lg shadow-md dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700 transition-transform hover:scale-105">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {media.type === 'image' ? (
                    <img
                      src={mediaUrl}
                      alt={media.title || 'Media'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Image+Non+Disponible';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-300 dark:bg-gray-600">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎥</div>
                        <p className="text-sm">Vidéo</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h5 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {media.title || `Media ${media.id}`}
                  </h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{media.type}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Événement: {media.event_id}
                  </p>
                  <div className="mt-4 flex justify-end space-x-2">
                    <a
                      href={mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                    >
                      Voir
                    </a>
                    <button
                      onClick={() => handleDelete(media.id)}
                      className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Medias;
