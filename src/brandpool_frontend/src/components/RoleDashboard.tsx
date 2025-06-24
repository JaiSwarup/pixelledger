import React from 'react';
import { motion } from 'framer-motion';
import { useRoleAuth, RoleBasedComponent } from '../hooks/useRoleAuth';
import { BrandDashboard } from './BrandDashboard';
import { InfluencerDashboard } from './InfluencerDashboard';
import ThreeBackground from './ThreeBackground';

export const RoleDashboard: React.FC = () => {
  const { userAccount, loading, error, getRoleDisplayName } = useRoleAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-3"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-teal"></div>
          <span className="text-gray-300 font-orbitron">Loading dashboard...</span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neuro-card p-6 border-l-4 border-red-500 bg-red-900/20 max-w-md"
        >
          <h3 className="text-red-400 font-orbitron font-bold mb-2">Dashboard Error</h3>
          <p className="text-red-300">Error loading dashboard: {error}</p>
        </motion.div>
      </div>
    );
  }

  if (!userAccount) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-2xl font-orbitron font-bold mb-2 text-gray-300">
            Welcome to BrandPool
          </h3>
          <p className="text-gray-400">Please complete your registration to access the dashboard.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-cyber-black">
      <ThreeBackground />
      
      <div className="relative z-10 container mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neuro-card p-8 hover:shadow-cyber-glow transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-orbitron font-bold mb-2">
                <span className="cyber-text-gradient">Welcome</span> to BrandPool
              </h1>
              <p className="text-xl text-gray-400">
                {getRoleDisplayName()} Dashboard
              </p>
            </div>
            <div className="text-right">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyber-teal to-cyber-pink text-white shadow-lg"
              >
                {getRoleDisplayName()}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Role-specific Dashboard */}
        <RoleBasedComponent
          allowedRoles={['Brand']}
          userRole={userAccount.role}
        >
          <BrandDashboard />
        </RoleBasedComponent>

        <RoleBasedComponent
          allowedRoles={['Influencer']}
          userRole={userAccount.role}
        >
          <InfluencerDashboard />
        </RoleBasedComponent>
      </div>
    </div>
  );
};
