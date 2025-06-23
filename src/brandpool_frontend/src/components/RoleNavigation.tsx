import { NavLink } from 'react-router-dom';
import { Profile } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { useAuth } from '../hooks/useAuth';
import { useRoleAuth } from '../hooks/useRoleAuth';

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
    if (isBrand()) return 'bg-blue-500';
    if (isInfluencer()) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <img src="/logo2.svg" alt="BrandPool" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-gray-900">BrandPool</h1>
            </div>
            
            <div className="hidden md:flex space-x-6">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                Dashboard
              </NavLink>
              
              <NavLink
                to="/campaigns"
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                {isBrand() ? 'My Campaigns' : 'Browse Campaigns'}
              </NavLink>
              
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                Profile
              </NavLink>
              
              {/* Governance is available to all users */}
              <NavLink
                to="/governance"
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                DAO Governance
              </NavLink>
              
              {/* Escrow is mainly for brands but influencers can view their earnings */}
              <NavLink
                to="/escrow"
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                {isBrand() ? 'Campaign Escrow' : 'Earnings'}
              </NavLink>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Balance: <span className="font-medium">{userBalance.toString()} tokens</span>
            </div>
            
            {userAccount && (
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 ${getRoleColor()} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-sm font-medium">
                    {getRoleDisplayName().charAt(0)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">
                    {userAccount.profile?.[0]?.username || 'User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getRoleDisplayName()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
            
            {!userAccount && userProfile && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userProfile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">{userProfile.username}</span>
                <button
                  onClick={handleLogout}
                  className="ml-2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
            
            {!userAccount && !userProfile && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">?</span>
                </div>
                <span className="text-sm text-gray-600">
                  {principal?.toString().slice(0, 8)}...
                </span>
                <button
                  onClick={handleLogout}
                  className="ml-2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
