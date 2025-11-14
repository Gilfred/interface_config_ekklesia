import React, { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export interface Program {
  id: number;
  program_day: string;
  hours_start: string;
  description: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

const Programs: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        // Le backend n'est pas disponible, nous utilisons donc des données fictives pour le moment.
        // const data = await getPrograms();
        // setPrograms(data);
        const mockData: Program[] = [
          { id: 1, program_day: 'Lundi', hours_start: '18:00', description: 'Culte du soir', user_id: 1, created_at: '2023-01-01', updated_at: '2023-01-01' },
          { id: 2, program_day: 'Mercredi', hours_start: '19:00', description: 'Étude biblique', user_id: 1, created_at: '2023-01-02', updated_at: '2023-01-02' },
          { id: 3, program_day: 'Dimanche', hours_start: '10:00', description: 'Culte principal', user_id: 1, created_at: '2023-01-03', updated_at: '2023-01-03' },
        ];
        setPrograms(mockData);
      } catch {
        setError('Échec de la récupération des programmes');
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Programmes</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Ajouter un programme
        </button>
      </div>

      {loading && <p>Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="bg-white shadow-md rounded my-6">
          <table className="min-w-max w-full table-auto">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Jour</th>
                <th className="py-3 px-6 text-left">Heure de début</th>
                <th className="py-3 px-6 text-center">Description</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {programs.map((program) => (
                <tr key={program.id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {program.program_day}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {program.hours_start}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {program.description}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center space-x-2">
                      <button className="text-gray-500 hover:text-blue-500">
                        <Pencil size={20} />
                      </button>
                      <button className="text-gray-500 hover:text-red-500">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Programs;
