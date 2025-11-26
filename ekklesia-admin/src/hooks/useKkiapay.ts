import { useState, useEffect } from 'react';

declare global {
  interface Window {
    Kkiapay: any;
  }
}

export const useKkiapay = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Éviter de charger plusieurs fois
    if (isLoading || isLoaded) return;

    const loadKkiapayScript = () => {
      setIsLoading(true);
      
      // Vérifier si le script est déjà présent
      if (document.querySelector('script[src*="kkiapay.me"]')) {
        console.log('📚 Script KkiaPay déjà présent');
        checkKkiapayAvailability();
        return;
      }

      // Charger le script dynamiquement
      const script = document.createElement('script');
      script.src = 'https://cdn.kkiapay.me/k.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ Script KkiaPay chargé avec succès');
        checkKkiapayAvailability();
      };
      
      script.onerror = () => {
        console.error('❌ Erreur lors du chargement du script KkiaPay');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    const checkKkiapayAvailability = () => {
      let attempts = 0;
      const maxAttempts = 50; // 5 secondes max (50 * 100ms)

      const check = () => {
        attempts++;
        
        if (window.Kkiapay) {
          console.log('✅ KkiaPay disponible');
          setIsLoaded(true);
          setIsLoading(false);
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(check, 100);
        } else {
          console.error('❌ KkiaPay non chargé après 5 secondes');
          setIsLoading(false);
        }
      };

      check();
    };

    loadKkiapayScript();

  }, [isLoaded, isLoading]);

  const openKkiapay = (config: any) => {
    if (!window.Kkiapay) {
      throw new Error('KkiaPay widget not loaded');
    }
    
    console.log('🎯 Ouverture du widget KkiaPay avec config:', config);
    return window.Kkiapay.open(config);
  };

  return { isLoaded, openKkiapay };
};