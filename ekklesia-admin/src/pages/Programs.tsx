import React, { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { getPrograms, createProgram, deleteProgram, updateProgram } from '../api/programs';

import { format } from 'date-fns';

export interface Program {
  id: number;
  program_day: string; // Format YYYY-MM-DD
  hours_start: string;
  description: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramData {
  program_day: string; // Format YYYY-MM-DD
  hours_start: string;
  description: string;
}

const Programs: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProgram, setNewProgram] = useState<ProgramData>({
    program_day: format(new Date(), 'yyyy-MM-dd'),
    hours_start: '08:00',
    description: '',
  });
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
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

    if (!newProgram.description.trim()) {
      setError('La description du programme est requise');
      return;
    }

    try {
      const createdProgram = await createProgram(newProgram);
      setPrograms([...programs, createdProgram]);
      setNewProgram({
        program_day: format(new Date(), 'yyyy-MM-dd'),
        hours_start: '08:00',
        description: ''
      });
      setShowForm(false);
      setError(null);
    } catch (error) {
      console.error('Failed to add program', error);
      setError('Erreur lors de l\'ajout du programme');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;

    if (!editingProgram.description.trim()) {
      setError('La description du programme est requise');
      return;
    }

    try {
      const updated = await updateProgram(editingProgram.id, {
        program_day: editingProgram.program_day,
        hours_start: editingProgram.hours_start,
        description: editingProgram.description,
      });
      setPrograms(programs.map(p => (p.id === editingProgram.id ? updated : p)));
      setEditingProgram(null);
      setShowForm(false);
      setError(null);
    } catch (error) {
      console.error('Failed to update program', error);
      setError('Erreur lors de la mise à jour du programme');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingProgram) {
      setEditingProgram(prev => ({ ...prev!, [name]: value }));
    } else {
      setNewProgram(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setShowForm(true);
  };

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
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Programmes</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (editingProgram) {
              setEditingProgram(null); // Annuler le mode édition
            }
          }}
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
            {editingProgram ? 'Modifier le programme' : 'Nouveau Programme'}
          </h4>
          <form onSubmit={editingProgram ? handleUpdate : handleAdd} className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={editingProgram ? editingProgram.description : newProgram.description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Description du programme..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="program_day" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Date *
                </label>
                <input
                  type="date"
                  id="program_day"
                  name="program_day"
                  value={editingProgram ? editingProgram.program_day : newProgram.program_day}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="hours_start" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Heure de début *
                </label>
                <select
                  id="hours_start"
                  name="hours_start"
                  value={editingProgram ? editingProgram.hours_start : newProgram.hours_start}
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
              {editingProgram ? 'Mettre à jour le programme' : 'Créer le programme'}
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
                <th className="py-3 px-6 text-left">Jour</th>
                <th className="py-3 px-6 text-left">Heure de début</th>
                <th className="py-3 px-6 text-center">Description</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {programs.map((program) => (
                <tr key={program.id} className="border-b border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-600">
                  <td className="py-3 px-6 text-left whitespace-nowrap text-gray-900 dark:text-white">
                    {program.program_day}
                  </td>
                  <td className="py-3 px-6 text-left text-gray-900 dark:text-white">
                    {program.hours_start}
                  </td>
                  <td className="py-3 px-6 text-center text-gray-900 dark:text-white">
                    {program.description}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(program)}
                        className="text-gray-500 hover:text-blue-500"
                      >
                        <Pencil size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(program.id)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
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
