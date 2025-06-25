import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { InlineLoadingSpinner } from './LoadingScreen';

const Header = () => {
  const { isAuthenticated, login, logout, isLoading, principal } = useAuth();
  const location = useLocation();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
    } else {
      login();
    }
  };

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="relative z-10 glass-effect border-b border-white/10"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <motion.div 
              className="w-8 h-8 bg-cyber-gradient rounded-lg"
              whileHover={{ scale: 1.1, rotate: 180 }}
              transition={{ duration: 0.3 }}
            />
            <span className="text-2xl font-orbitron font-bold cyber-text-gradient">
              PixelLedger
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/clients" 
              className={`transition-colors duration-200 ${
                location.pathname === '/clients' 
                  ? 'text-cyber-teal' 
                  : 'text-gray-300 hover:text-cyber-teal'
              }`}
            >
              For Clients
            </Link>
            <Link 
              to="/creatives" 
              className={`transition-colors duration-200 ${
                location.pathname === '/creatives' 
                  ? 'text-cyber-teal' 
                  : 'text-gray-300 hover:text-cyber-teal'
              }`}
            >
              For Creatives
            </Link>
            {isAuthenticated && (
              <Link 
                to="/dashboard" 
                className={`transition-colors duration-200 ${
                  location.pathname === '/dashboard' 
                    ? 'text-cyber-teal' 
                    : 'text-gray-300 hover:text-cyber-teal'
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated && principal && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-300">
                <User className="w-4 h-4" />
                <span className="font-mono">
                  {principal.toString().slice(0, 8)}...
                </span>
              </div>
            )}
            
            <Button 
              variant={isAuthenticated ? "outline" : "default"}
              size="sm" 
              onClick={handleAuthAction}
              disabled={isLoading}
              className={
                isAuthenticated 
                  ? "text-gray-300 border-gray-600 hover:text-cyber-teal hover:border-cyber-teal" 
                  : "cyber-button"
              }
            >
              {isLoading ? (
                <InlineLoadingSpinner size="sm" className="mr-2" />
              ) : isAuthenticated ? (
                <Wallet className="w-4 h-4 mr-2" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Loading...' : isAuthenticated ? 'Sign Out' : 'Sign In'}
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
