import React, { useState, useEffect } from 'react';
import { getPrograms, createProgram, deleteProgram } from '../api/programs';

export interface Program {
  id: number;
  description: string;
  program_day: string;
  hours_start: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProgramData {
  description: string;
  program_day: string;
  hours_start: string;
}

const Programs: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State pour le formulaire d'ajout
  const [newProgram, setNewProgram] = useState<CreateProgramData>({
    description: '',
    program_day: 'Lundi',
    hours_start: '08:00'
  });
  const [showForm, setShowForm] = useState(false);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const data = await getPrograms();
      setPrograms(data);
    } catch (error) {
      console.error('Failed to fetch programs', error);
      setError('Erreur lors du chargement des programmes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      return;
    }  
    try {
      await deleteProgram(id);
      setPrograms(programs.filter(program => program.id !== id));
    } catch (error) {
      console.error('Failed to delete program', error);
      setError('Erreur lors de la suppression du programme');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProgram.program_day.trim()) {
      setError('Le jour du programme est requis');
      return;
    }

    try {
      const createdProgram = await createProgram(newProgram);
      setPrograms([...programs, createdProgram]);
      setNewProgram({
        description: '',
        program_day: 'Lundi',
        hours_start: '08:00'
      });
      setShowForm(false);
      setError(null);
    } catch (error) {
      console.error('Failed to add program', error);
      setError('Erreur lors de l\'ajout du programme');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProgram(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Liste des jours de la semaine
  const daysOfWeek = [
    'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'
  ];

  // Générer les heures de la journée
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  if (loading) {
    return <div className="flex justify-center items-center p-8">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Programmes</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Annuler' : 'Ajouter un programme'}
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
            Nouveau Programme
          </h4>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={newProgram.description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Description du programme..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="program_day" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Jour *
                </label>
                <select
                  id="program_day"
                  name="program_day"
                  value={newProgram.program_day}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="hours_start" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Heure *
                </label>
                <select
                  id="hours_start"
                  name="hours_start"
                  value={newProgram.hours_start}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Créer le programme
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md dark:bg-gray-800 overflow-x-auto">
        {programs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Aucun programme trouvé
          </div>
        ) : (
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Description</th>
                <th scope="col" className="px-6 py-3">Jour</th>
                <th scope="col" className="px-6 py-3">Heure</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program) => (
                <tr key={program.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4">
                    {program.description || 'Aucune description'}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {program.program_day}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {program.hours_start}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(program.id)}
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

export default Programs;