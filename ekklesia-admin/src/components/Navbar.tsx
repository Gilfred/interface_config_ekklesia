import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsersMe } from '../api/users';
import { logoutUser } from '../api/auth';
import { LogOut, User, Settings, Bell, Search } from 'lucide-react';

interface User {
  email: string;
  role: {
    name: string;
  };
  // Ajoutez d'autres propriétés si nécessaire
}

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUsersMe();
        setUser(userData);
      } catch (error: any) {
        console.error('Failed to fetch user:', error);
        if (error.response && error.response.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await logoutUser(); // Appel à la fonction de déconnexion
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm dark:bg-gray-900/95 dark:border-gray-700">
      {/* Logo commenté */}
      {/* <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white dark:border-gray-700 bg-white shadow-md">
        <img src={logo} alt="logo de l'église" className="h-full w-full object-cover" />
      </div> */}

      {/* Section Centrale avec Titre et Barre de Recherche */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="text-center mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Eglise des assemblées de Dieu
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Temple Universitaire - Tableau de Bord
          </p>
        </div>
        
        <div className="relative">
          <Search 
            size={20} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
          <input
            type="text"
            placeholder="Rechercher dans le système..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     dark:bg-gray-800 dark:border-gray-600 dark:text-white
                     transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Section Utilisateur et Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white 
                          hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
        </button>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

        {/* Profil Utilisateur */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 
                     transition-all duration-200 group"
          >
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  {user?.email.split('@')[0]}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role.name}
                </span>
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 
                              flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <User size={20} className="text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full"></div>
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg 
                          border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in-0 zoom-in-95">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mt-1">
                  {user?.role.name}
                </p>
              </div>

              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  // Naviguer vers les paramètres du profil
                }}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
              >
                <Settings size={16} className="mr-3 text-gray-400" />
                Paramètres du compte
              </button>

              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 
                         hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
              >
                <LogOut size={16} className="mr-3" />
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay pour fermer le dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Navbar;