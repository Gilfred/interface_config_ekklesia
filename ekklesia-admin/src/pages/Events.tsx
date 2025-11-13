import React, { useState, useEffect } from 'react';
import { getEvents, createEvent, deleteEvent } from '../api/events';

export interface Event {
  id: number;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  start_at: string;
  end_at: string;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State pour le formulaire d'ajout
  const [newEvent, setNewEvent] = useState<CreateEventData>({
    title: '',
    description: '',
    start_at: new Date().toISOString().slice(0, 16),
    end_at: new Date().toISOString().slice(0, 16)
  });
  const [showForm, setShowForm] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events', error);
      setError('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return;
    }
    
    try {
      await deleteEvent(id);
      setEvents(events.filter(event => event.id !== id));
    } catch (error) {
      console.error('Failed to delete event', error);
      setError('Erreur lors de la suppression de l\'événement');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEvent.title.trim()) {
      setError('Le titre de l\'événement est requis');
      return;
    }

    try {
      const createdEvent = await createEvent(newEvent);
      setEvents([...events, createdEvent]);
      setNewEvent({
        title: '',
        description: '',
        start_at: new Date().toISOString().slice(0, 16),
        end_at: new Date().toISOString().slice(0, 16)
      });
      setShowForm(false);
      setError(null);
    } catch (error) {
      console.error('Failed to add event', error);
      setError('Erreur lors de l\'ajout de l\'événement');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
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
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Événements</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Annuler' : 'Ajouter un événement'}
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
            Nouvel Événement
          </h4>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Titre de l'événement *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={newEvent.title}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={newEvent.description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_at" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Date de début *
                </label>
                <input
                  type="datetime-local"
                  id="start_at"
                  name="start_at"
                  value={newEvent.start_at}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="end_at" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Date de fin *
                </label>
                <input
                  type="datetime-local"
                  id="end_at"
                  name="end_at"
                  value={newEvent.end_at}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Créer l'événement
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md dark:bg-gray-800 overflow-x-auto">
        {events.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Aucun événement trouvé
          </div>
        ) : (
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Titre</th>
                <th scope="col" className="px-6 py-3">Début</th>
                <th scope="col" className="px-6 py-3">Fin</th>
                <th scope="col" className="px-6 py-3">Description</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {event.title}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(event.start_at).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(event.end_at).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    {event.description || 'Aucune description'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="font-medium text-red-600 dark:text-red-500 hover:underline"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Events;