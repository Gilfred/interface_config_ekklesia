import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { getContributions, createContribution, Contribution, ContributionCreate } from '../api/contributions';
import { EkklesiaContributionType, PaymentStatus } from '../api/enums';


const PAGE_LIMIT = 10;

const Contributions: React.FC = () => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const { register, handleSubmit, reset } = useForm<ContributionCreate>();

  const fetchContributions = async (currentSkip: number) => {
    try {
      setLoading(true);
      const data = await getContributions(currentSkip, PAGE_LIMIT);
      setContributions(data);
    } catch (err) => {
      setError('Failed to fetch contributions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions(skip);
  }, [skip]);

  const onSubmit: SubmitHandler<ContributionCreate> = async (data) => {
    try {
      const submissionData = { ...data, amount: Number(data.amount) };
      await createContribution(submissionData);
      reset();
      fetchContributions(skip);
    } catch (err) {
      setError('Failed to create contribution');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Contributions</h3>

      <div className="mt-4 p-4 bg-white rounded-md shadow-md dark:bg-gray-800">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Create New Contribution</h4>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="number" placeholder="User ID" {...register('user_id', { required: true })} className="p-2 border rounded-md" />
          <select {...register('type', { required: true })} className="p-2 border rounded-md">
            {Object.values(EkklesiaContributionType).map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <input type="number" placeholder="Amount" {...register('amount', { required: true })} className="p-2 border rounded-md" />
          <input type="number" placeholder="Payment Method ID" {...register('payment_method_id', { required: true })} className="p-2 border rounded-md" />
          <input type="text" placeholder="Transaction ID (Optional)" {...register('transaction_id')} className="p-2 border rounded-md" />
          <select {...register('status')} className="p-2 border rounded-md">
            {Object.values(PaymentStatus).map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <button type="submit" className="md:col-span-3 p-2 bg-blue-500 text-white rounded-md">Create Contribution</button>
        </form>
      </div>

      <div className="mt-4">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">User ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {contributions.map((contribution) => (
              <tr key={contribution.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{contribution.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contribution.user_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contribution.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contribution.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contribution.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(contribution.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between mt-4">
          <button onClick={() => setSkip(Math.max(0, skip - PAGE_LIMIT))} disabled={skip === 0} className="p-2 bg-gray-300 rounded-md">Previous</button>
          <button onClick={() => setSkip(skip + PAGE_LIMIT)} disabled={contributions.length < PAGE_LIMIT} className="p-2 bg-gray-300 rounded-md">Next</button>
        </div>
      </div>
    </div>
  );
};

export default Contributions;
