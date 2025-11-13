import React, { useState, useEffect } from 'react';
import { getMedias, createMedia, deleteMedia } from '../api/medias';
import { getEvents } from '../api/events';
import { Event } from './Events';

export interface Media {
  id: number;
  type: 'image' | 'video';
  file_path: string;
  event_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMediaData {
  type: 'image' | 'video';
  file_path: string;
  event_id?: number;
}

const Medias: React.FC = () => {
  const [medias, setMedias] = useState<Media[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State pour le formulaire d'ajout
  const [newMedia, setNewMedia] = useState<CreateMediaData>({
    type: 'image',
    file_path: ''
  });
  const [showForm, setShowForm] = useState(false);

  const fetchMediasAndEvents = async () => {
    try {
      setLoading(true);
      const [mediasData, eventsData] = await Promise.all([getMedias(), getEvents()]);
      setMedias(mediasData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMediasAndEvents();
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMedia.file_path.trim()) {
      setError('L\'URL du fichier est requise');
      return;
    }

    try {
      const createdMedia = await createMedia(newMedia);
      setMedias([...medias, createdMedia]);
      setNewMedia({
        type: 'image',
        file_path: ''
      });
      setShowForm(false);
      setError(null);
    } catch (error) {
      console.error('Failed to add media', error);
      setError('Erreur lors de l\'ajout du média');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewMedia(prev => ({
      ...prev,
      [name]: value
    }));
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
            Nouveau Média
          </h4>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={newMedia.type}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="image">Image</option>
                <option value="video">Vidéo</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="file_path" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                URL du fichier *
              </label>
              <input
                type="url"
                id="file_path"
                name="file_path"
                value={newMedia.file_path}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="https://example.com/image.jpg"
                required
              />
            </div>
            
            <div>
              <label htmlFor="event_id" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Événement (optionnel)
              </label>
              <select
                id="event_id"
                name="event_id"
                value={newMedia.event_id || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Aucun</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Ajouter le média
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
            const event = media.event_id ? events.find(e => e.id === media.event_id) : null;
            return (
              <div key={media.id} className="bg-white rounded-lg shadow-md dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700 transition-transform hover:scale-105">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {media.type === 'image' ? (
                    <img
                      src={media.file_path}
                      alt={event ? event.title : 'Média'}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{media.type}</p>
                  {event && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Événement : <span className="font-semibold">{event.title}</span>
                    </p>
                  )}
                  <div className="mt-4 flex justify-end space-x-2">
                    <a
                      href={media.file_path}
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