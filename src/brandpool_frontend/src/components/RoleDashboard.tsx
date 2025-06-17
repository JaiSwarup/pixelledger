import React from 'react';
import { useRoleAuth, RoleBasedComponent } from '../hooks/useRoleAuth';
import { BrandDashboard } from './BrandDashboard';
import { InfluencerDashboard } from './InfluencerDashboard';

export const RoleDashboard: React.FC = () => {
  const { userAccount, loading, error, getRoleDisplayName } = useRoleAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>Error loading dashboard: {error}</p>
      </div>
    );
  }

  if (!userAccount) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please register to access the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome to BrandPool
            </h1>
            <p className="text-gray-600 mt-1">
              {getRoleDisplayName()} Dashboard
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {getRoleDisplayName()}
            </div>
          </div>
        </div>
      </div>

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
  );
};
