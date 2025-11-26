import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../api/auth';
import axiosInstance from '../api/axiosInstance';
import { useKkiapay } from '../hooks/useKkiapay';

// Toutes les interfaces dans le même fichier .tsx
interface KkiapayPaymentInit {
  amount: number;
  phone_number: string;
  email?: string;
  fullname?: string;
  type: 'don' | 'offrande' | 'dime';
}

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

interface KkiapayPaymentFormProps {
  onPaymentSuccess?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
}

// Fonctions API directement dans le composant
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

const KkiapayPaymentForm: React.FC<KkiapayPaymentFormProps> = ({ 
  onPaymentSuccess, 
  onPaymentError 
}) => {
  const [formData, setFormData] = useState<KkiapayPaymentInit>({
    amount: 0,
    phone_number: '',
    type: 'don'
  });
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  
  // CORRECTION : Déplacer le hook ici, à l'intérieur du composant
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
    
    if (formData.amount < 100) {
      alert('Le montant minimum est de 100 FCFA');
      return;
    }

    if (!formData.phone_number) {
      alert('Veuillez saisir votre numéro de téléphone');
      return;
    }

    if (!isLoaded) {
      alert('Le système de paiement est en cours de chargement, veuillez réessayer dans quelques secondes');
      return;
    }

    setLoading(true);
    setPaymentStatus('pending');

    try {
      const response = await initKkiapayPayment(formData);
      
      if (response.success && response.widget_data) {
        const widgetData = response.widget_data;
        
        openKkiapay({
          amount: widgetData.amount,
          api_key: widgetData.public_key,
          sandbox: widgetData.sandbox,
          email: widgetData.email,
          phone: widgetData.phone,
          name: widgetData.name,
          data: widgetData.metadata,
          callback: (paymentResponse: any) => {
            console.log('KkiaPay callback:', paymentResponse);
            
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
        throw new Error('Réponse invalide du serveur');
      }
      
    } catch (error: any) {
      console.error('Erreur de paiement:', error);
      setPaymentStatus('failed');
      setLoading(false);
      if (onPaymentError) {
        onPaymentError(error.message || 'Erreur lors du paiement');
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Faire un don avec Kkiapay</h3>
      
      {!isLoaded && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <span className="text-yellow-800">Chargement du système de paiement...</span>
          </div>
        </div>
      )}
      
      {paymentStatus === 'completed' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Paiement effectué avec succès !
        </div>
      )}
      
      {paymentStatus === 'failed' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ❌ Le paiement a échoué. Veuillez réessayer.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Type de contribution:
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="don">Don</option>
            <option value="offrande">Offrande</option>
            <option value="dime">Dîme</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Montant (FCFA):
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <small className="text-gray-500 dark:text-gray-400">Montant minimum: 100 FCFA</small>
        </div>

        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Numéro de téléphone:
          </label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            placeholder="Ex: 97000000"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <small className="text-gray-500 dark:text-gray-400">Format: 97000000 (numéro Bénin/Mobile Money)</small>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            placeholder="Votre email"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Nom complet:
          </label>
          <input
            type="text"
            id="fullname"
            name="fullname"
            value={formData.fullname || ''}
            onChange={handleInputChange}
            placeholder="Votre nom complet"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || paymentStatus === 'pending' || !isLoaded}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors duration-200"
        >
          {loading ? 'Initialisation...' : 
           paymentStatus === 'pending' ? 'Paiement en cours...' : 
           'Payer avec Kkiapay'}
        </button>
      </form>

      {paymentStatus === 'pending' && currentTransactionId && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <p>✅ Paiement initialisé - Transaction: {currentTransactionId}</p>
          <p>Veuillez compléter le paiement dans la fenêtre qui s'est ouverte...</p>
        </div>
      )}
    </div>
  );
};

export default KkiapayPaymentForm;