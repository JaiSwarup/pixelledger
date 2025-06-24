import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User, Wallet, ChevronDown } from 'lucide-react';
import { Profile } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { useAuth } from '../hooks/useAuth';
import { useRoleAuth } from '../hooks/useRoleAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RoleNavigationProps {
  userProfile: Profile | null;
  userBalance: bigint;
}

export function RoleNavigation({ userProfile, userBalance }: RoleNavigationProps) {
  const { logout, principal } = useAuth();
  const { userAccount, isBrand, isInfluencer } = useRoleAuth();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  const getRoleDisplayName = () => {
    if (isBrand()) return 'Brand';
    if (isInfluencer()) return 'Influencer';
    return 'User';
  };

  const getRoleColor = () => {
    if (isBrand()) return 'from-blue-500 to-cyan-500';
    if (isInfluencer()) return 'from-purple-500 to-pink-500';
    return 'from-gray-500 to-gray-600';
  };

  const getRoleIcon = () => {
    if (isBrand()) return '🏢';
    if (isInfluencer()) return '⭐';
    return '👤';
  };

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-cyber-black border-b border-gray-800/50 backdrop-blur-sm sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative">
                <img src="/logo2.svg" alt="BrandPool" className="h-10 w-10 filter brightness-0 invert" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-teal to-cyber-pink opacity-20 rounded-full blur-sm"></div>
              </div>
              <h1 className="text-2xl font-orbitron font-bold cyber-text-gradient">
                BrandPool
              </h1>
            </motion.div>
            
            <div className="hidden md:flex space-x-2">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 font-orbitron ${
                    isActive 
                      ? 'bg-cyber-teal text-cyber-black shadow-lg' 
                      : 'text-gray-300 hover:text-cyber-teal hover:bg-gray-800/50'
                  }`
                }
              >
                Dashboard
              </NavLink>
              
              <NavLink
                to="/campaigns"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 font-orbitron ${
                    isActive 
                      ? 'bg-cyber-teal text-cyber-black shadow-lg' 
                      : 'text-gray-300 hover:text-cyber-teal hover:bg-gray-800/50'
                  }`
                }
              >
                {isBrand() ? 'My Campaigns' : 'My Applications'}
              </NavLink>
              
              <NavLink
                to="/explore-campaigns"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 font-orbitron ${
                    isActive 
                      ? 'bg-cyber-teal text-cyber-black shadow-lg' 
                      : 'text-gray-300 hover:text-cyber-teal hover:bg-gray-800/50'
                  }`
                }
              >
                Explore Campaigns
              </NavLink>
              
              {/* Governance is available to all users */}
              <NavLink
                to="/governance"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 font-orbitron ${
                    isActive 
                      ? 'bg-cyber-pink text-white shadow-lg' 
                      : 'text-gray-300 hover:text-cyber-pink hover:bg-gray-800/50'
                  }`
                }
              >
                Governance
              </NavLink>
              
              {/* Escrow is mainly for brands but influencers can view their earnings */}
              <NavLink
                to="/escrow"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 font-orbitron ${
                    isActive 
                      ? 'bg-purple-500 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-purple-400 hover:bg-gray-800/50'
                  }`
                }
              >
                {isBrand() ? 'Escrow' : 'Earnings'}
              </NavLink>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Balance Display */}
            <div className="hidden sm:block px-4 py-2 neuro-card-mini bg-cyber-gray/30 border border-gray-700/50">
              <div className="text-xs text-gray-400 mb-1">Balance</div>
              <div className="text-sm font-bold cyber-text-gradient">
                {userBalance.toString()} <span className="text-gray-400">tokens</span>
              </div>
            </div>
            
            {userAccount && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-3 hover:bg-gray-800/50 rounded-lg p-2 transition-colors">
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-sm font-medium text-white font-orbitron">
                      {userAccount.profile?.[0]?.username || 'User'}
                    </span>
                    <span className="text-xs cyber-text-gradient">
                      {getRoleDisplayName()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-cyber-gray border border-gray-700 shadow-lg">
                  <DropdownMenuLabel className="text-white font-orbitron">
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center text-gray-300 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {!userAccount && userProfile && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-3 hover:bg-gray-800/50 rounded-lg p-2 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyber-teal to-cyber-pink rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold font-orbitron">
                      {userProfile.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-sm font-medium text-white font-orbitron">
                      {userProfile.username}
                    </span>
                    <span className="text-xs text-gray-400">
                      User
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-cyber-gray border border-gray-700 shadow-lg">
                  <DropdownMenuLabel className="text-white font-orbitron">
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center text-gray-300 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {!userAccount && !userProfile && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-3 hover:bg-gray-800/50 rounded-lg p-2 transition-colors">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold font-orbitron">?</span>
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-sm text-gray-300 font-mono">
                      {principal?.toString().slice(0, 8)}...
                    </span>
                    <span className="text-xs text-gray-400">
                      Guest
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-cyber-gray border border-gray-700 shadow-lg">
                  <DropdownMenuLabel className="text-white font-orbitron">
                    Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center text-gray-300 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
