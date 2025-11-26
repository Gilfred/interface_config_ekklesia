import React, { useEffect, useState, useMemo } from 'react';
import { getContributions } from '../api/contributions';
import { getCurrentUser } from '../api/auth';
import axiosInstance from '../api/axiosInstance';
import { useKkiapay } from '../hooks/useKkiapay';

export interface Contribution {
  id: number;
  user_id: number;
  type: 'don' | 'offrande' | 'dime';
  amount: number;
  payment_method_id: number;
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  delete_user_id?: number;
  delete_date?: string;
}

// Composant de formulaire de paiement intégré
interface KkiapayPaymentFormProps {
  onPaymentSuccess?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
  onClose: () => void;
}

// Interfaces pour Kkiapay
interface KkiapayPaymentInit {
  amount: number;
  phone_number: string;
  email?: string;
  fullname?: string;
  type: 'don' | 'offrande' | 'dime';
}

// Nouvelle interface pour la réponse du backend modifié
interface PaymentResponse {
  success: boolean;
  contribution_id: number;
  widget_data: {
    amount: number;
    public_key: string;
    sandbox: boolean;
    email: string;
    phone: string;
    name: string;
    callback: string;
    metadata: {
      contribution_id: number;
      user_id: number;
    };
  };
}

// Fonctions API pour Kkiapay
const initKkiapayPayment = async (paymentData: KkiapayPaymentInit): Promise<PaymentResponse> => {
  try {
    const response = await axiosInstance.post('/payments/init', paymentData);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Erreur lors de l\'initialisation du paiement');
  }
};

// Composant de formulaire de paiement
const KkiapayPaymentForm: React.FC<KkiapayPaymentFormProps> = ({ 
  onPaymentSuccess, 
  onPaymentError,
  onClose
}) => {
  const [formData, setFormData] = useState<KkiapayPaymentInit>({
    amount: 0,
    phone_number: '',
    type: 'don'
  });
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  
  // Hook pour KkiaPay
  const { isLoaded, openKkiapay } = useKkiapay();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        setFormData(prev => ({
          ...prev,
          email: user.email,
          fullname: user.name
        }));
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('1. Début de handleSubmit');
    
    if (formData.amount < 100) {
      alert('Le montant minimum est de 100 FCFA');
      return;
    }

    if (!formData.phone_number) {
      alert('Veuillez saisir votre numéro de téléphone');
      return;
    }

    console.log('2. Vérification de isLoaded:', isLoaded);
    if (!isLoaded) {
      alert('Le système de paiement est en cours de chargement, veuillez réessayer dans quelques secondes');
      return;
    }

    setLoading(true);
    setPaymentStatus('pending');

    try {
      console.log('3. Appel de initKkiapayPayment...');
      const response = await initKkiapayPayment(formData);
      console.log('4. Réponse de initKkiapayPayment:', response);
      
      if (response.success && response.widget_data) {
        const widgetData = response.widget_data;
        console.log('5. Données du widget:', widgetData);
        console.log('6. Ouverture du widget...');
        
        openKkiapay({
          amount: widgetData.amount,
          api_key: widgetData.public_key,
          sandbox: widgetData.sandbox,
          email: widgetData.email,
          phone: widgetData.phone,
          name: widgetData.name,
          data: widgetData.metadata,
          callback: (paymentResponse: any) => {
            console.log('7. Callback du widget appelé:', paymentResponse);
            
            if (paymentResponse.status === 'success') {
              setPaymentStatus('completed');
              setCurrentTransactionId(paymentResponse.transactionId);
              if (onPaymentSuccess) {
                onPaymentSuccess(paymentResponse.transactionId);
              }
            } else {
              setPaymentStatus('failed');
              if (onPaymentError) {
                onPaymentError('Le paiement a échoué');
              }
            }
            setLoading(false);
          }
        });
      } else {
        console.log('5. Erreur: réponse invalide', response);
        throw new Error('Réponse invalide du serveur');
      }
      
    } catch (error: any) {
      console.error('8. Erreur attrapée:', error);
      setPaymentStatus('failed');
      setLoading(false);
      if (onPaymentError) {
        onPaymentError(error.message || 'Erreur lors du paiement');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Nouvelle Contribution
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Indicateur de chargement du widget KkiaPay */}
      {!isLoaded && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            </div>
            <span className="text-yellow-800 dark:text-yellow-200 font-medium">
              Chargement du système de paiement...
            </span>
          </div>
        </div>
      )}

      {paymentStatus === 'completed' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-green-600 dark:text-green-400">✅</span>
            </div>
            <div>
              <p className="text-green-800 dark:text-green-200 font-medium">Paiement effectué avec succès !</p>
              <p className="text-green-600 dark:text-green-400 text-sm">Transaction: {currentTransactionId}</p>
            </div>
          </div>
        </div>
      )}
      
      {paymentStatus === 'failed' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <span className="text-red-600 dark:text-red-400">❌</span>
            </div>
            <p className="text-red-800 dark:text-red-200 font-medium">Le paiement a échoué. Veuillez réessayer.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Type de contribution
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
            >
              <option value="don">Don</option>
              <option value="offrande">Offrande</option>
              <option value="dime">Dîme</option>
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Montant (FCFA)
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              min="100"
              step="100"
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              placeholder="1000"
            />
            <small className="text-gray-500 dark:text-gray-400 text-sm mt-1 block">Montant minimum: 100 FCFA</small>
          </div>
        </div>

        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Numéro de téléphone
          </label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            placeholder="0197000000"
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
          />
          <small className="text-gray-500 dark:text-gray-400 text-sm mt-1 block">Format: 97000000 (numéro Bénin/Mobile Money)</small>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Nom complet
            </label>
            <input
              type="text"
              id="fullname"
              name="fullname"
              value={formData.fullname || ''}
              onChange={handleInputChange}
              placeholder="Votre nom complet"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || paymentStatus === 'pending' || !isLoaded}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Initialisation...</span>
            </div>
          ) : paymentStatus === 'pending' ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Paiement en cours...</span>
            </div>
          ) : (
            'Payer avec Kkiapay'
          )}
        </button>
      </form>

      {paymentStatus === 'pending' && currentTransactionId && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-blue-600 dark:text-blue-400">⏳</span>
            </div>
            <div>
              <p className="text-blue-800 dark:text-blue-200 font-medium">Paiement initialisé</p>
              <p className="text-blue-600 dark:text-blue-400 text-sm">Transaction: {currentTransactionId}</p>
              <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">Veuillez compléter le paiement dans la fenêtre ouverte...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant principal Contributions
const Contributions: React.FC = () => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState('');
  const [sortDate, setSortDate] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const data = await getContributions();
      setContributions(data);
    } catch (err) {
      setError('Erreur lors du chargement des contributions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, []);

  const sortedContributions = useMemo(() => {
    let sorted = [...contributions];
    if (sortType) {
      sorted = sorted.filter(c => c.type === sortType);
    }
    if (sortDate === 'asc') {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortDate === 'desc') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return sorted;
  }, [contributions, sortType, sortDate]);

  const handleReset = () => {
    setSortType('');
    setSortDate('');
  };

  // Gestion des succès de paiement
  const handlePaymentSuccess = (_transactionId: string) => {
    fetchContributions();
    setShowPaymentForm(false);
  };

  const handlePaymentError = (error: string) => {
    console.error('Erreur de paiement:', error);
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Fonction pour obtenir le texte du statut en français
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Complétée';
      case 'pending': return 'En attente';
      case 'failed': return 'Échouée';
      default: return status;
    }
  };

  // Fonction pour obtenir l'icône du type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'don': return '💰';
      case 'offrande': return '🙏';
      case 'dime': return '⛪';
      default: return '💳';
    }
  };

  // Fonction pour obtenir le texte du type en français
  const getTypeText = (type: string) => {
    switch (type) {
      case 'don': return 'Don';
      case 'offrande': return 'Offrande';
      case 'dime': return 'Dîme';
      default: return type;
    }
  };

  // Calcul des statistiques
  const stats = useMemo(() => {
    const total = contributions.reduce((sum, c) => sum + c.amount, 0);
    const completed = contributions.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.amount, 0);
    const pending = contributions.filter(c => c.status === 'pending').length;
    const failed = contributions.filter(c => c.status === 'failed').length;

    return { total, completed, pending, failed };
  }, [contributions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des contributions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Contributions
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Suivez toutes les contributions et dons de notre communauté
          </p>
          
          {/* Bouton pour ouvrir le formulaire de paiement */}
          <button
            onClick={() => setShowPaymentForm(true)}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-2xl transition-all duration-200 transform hover:scale-105 hover:shadow-2xl"
          >
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Faire une contribution
          </button>
        </div>

        {/* Modal pour le formulaire de paiement */}
        {showPaymentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <KkiapayPaymentForm
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                  onClose={() => setShowPaymentForm(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl mr-4">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Collecté</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total.toLocaleString('fr-FR')} Fcfa
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl mr-4">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Complétées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completed.toLocaleString('fr-FR')} Fcfa
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-xl mr-4">
                <span className="text-2xl">⏳</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En Attente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-xl mr-4">
                <span className="text-2xl">❌</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Échouées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.failed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-red-800 dark:text-red-200 font-medium">{error}</span>
              </div>
              <button
                onClick={fetchContributions}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Filtres et Tris</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sortedContributions.length} contribution{sortedContributions.length !== 1 ? 's' : ''} trouvée{sortedContributions.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="type-sort" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Type de contribution
                </label>
                <select
                  id="type-sort"
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                >
                  <option value="">Tous les types</option>
                  <option value="don">Don</option>
                  <option value="offrande">Offrande</option>
                  <option value="dime">Dîme</option>
                </select>
              </div>

              <div className="flex-1">
                <label htmlFor="date-sort" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Tri par date
                </label>
                <select
                  id="date-sort"
                  value={sortDate}
                  onChange={(e) => setSortDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                >
                  <option value="">Date par défaut</option>
                  <option value="asc">Plus ancienne</option>
                  <option value="desc">Plus récente</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium whitespace-nowrap"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {sortedContributions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-3xl">💸</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {contributions.length === 0 ? 'Aucune contribution' : 'Aucun résultat'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {contributions.length === 0 
                  ? "Aucune contribution n'a été enregistrée pour le moment." 
                  : "Aucune contribution ne correspond à vos critères de filtrage."
                }
              </p>
              {contributions.length === 0 && (
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
                >
                  Faire la première contribution
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contributeur
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Méthode Paiement
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedContributions.map((contribution) => (
                    <tr 
                      key={contribution.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{getTypeIcon(contribution.type)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {getTypeText(contribution.type)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {contribution.amount.toLocaleString('fr-FR')} Fcfa
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              {contribution.user_id.toString().slice(-2)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            #{contribution.user_id}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          #{contribution.payment_method_id}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contribution.status)}`}>
                          {getStatusText(contribution.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {contribution.transaction_id?.slice(0, 8) || 'N/A'}...
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(contribution.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(contribution.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {contributions.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Contributions totales</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {contributions.filter(c => c.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Contributions complétées</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {new Set(contributions.map(c => c.user_id)).size}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Contributeurs uniques</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.pending}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">En attente</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contributions;