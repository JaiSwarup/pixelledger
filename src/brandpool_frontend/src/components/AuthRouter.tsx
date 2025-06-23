import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { LoadingScreen } from './LoadingScreen';

// Public Pages
import LandingPage from '../pages/LandingPage';
import ForBrands from '../pages/ForBrands';
import ForInfluencers from '../pages/ForInfluencers';
import Login from '../pages/Login';
import Register from '../pages/Register';
import BrandOnboardingPage from '../pages/BrandOnboardingPage';
import InfluencerOnboardingPage from '../pages/InfluencerOnboardingPage';

// Protected Components
import { RoleNavigation } from './RoleNavigation';
import { RoleDashboard } from './RoleDashboard';
import { RoleCampaignsView } from './RoleCampaignsView';
import { RoleProfileView } from './RoleProfileView';
import { RoleGovernanceView } from './RoleGovernanceView';
import { RoleEscrowView } from './RoleEscrowView';

interface AuthRouterProps {
  campaigns: any[];
  proposals: any[];
  userProfile: any;
  userBalance: bigint;
  principal: any;
  backendActor: any;
  onDataUpdate: () => void;
  onUserDataUpdate: () => void;
}

export function AuthRouter({
  campaigns,
  proposals,
  userProfile,
  userBalance,
  principal,
  backendActor,
  onDataUpdate,
  onUserDataUpdate
}: AuthRouterProps) {
  const { isAuthenticated, isInitialized, loginError } = useAuth();
  const { isRegistered, loading: roleLoading } = useRoleAuth();

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <LoadingScreen 
        message="Initializing BrandPool..."
        submessage="Setting up your connection to the Internet Computer"
      />
    );
  }

  return (
    <Routes>
      {/* Public Routes - Always accessible */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/brands" element={<ForBrands />} />
      <Route path="/influencers" element={<ForInfluencers />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/onboarding/brand" element={<BrandOnboardingPage />} />
      <Route path="/onboarding/influencer" element={<InfluencerOnboardingPage />} />
      
      {/* Protected Routes */}
      <Route 
        path="/*" 
        element={
          <ProtectedRoutes
            campaigns={campaigns}
            proposals={proposals}
            userProfile={userProfile}
            userBalance={userBalance}
            principal={principal}
            backendActor={backendActor}
            onDataUpdate={onDataUpdate}
            onUserDataUpdate={onUserDataUpdate}
          />
        } 
      />
    </Routes>
  );
}

function ProtectedRoutes(props: Omit<AuthRouterProps, 'onDataUpdate' | 'onUserDataUpdate'> & {
  onDataUpdate: () => void;
  onUserDataUpdate: () => void;
}) {
  const { isAuthenticated, loginError } = useAuth();
  const { isRegistered, loading: roleLoading } = useRoleAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show loading while checking registration
  if (roleLoading) {
    return (
      <LoadingScreen 
        message="Checking your account..."
        submessage="Verifying your registration status"
      />
    );
  }

  // Show registration if not registered
  if (!isRegistered) {
    return <Navigate to="/register" replace />;
  }

  // Show loading if backend actor not ready
  if (!props.backendActor) {
    return (
      <LoadingScreen 
        message="Connecting to backend..."
        submessage="Establishing secure connection"
      />
    );
  }

  // Show authenticated app
  return (
    <div className="min-h-screen bg-gray-50">
      <RoleNavigation userProfile={props.userProfile} userBalance={props.userBalance} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<RoleDashboard />} />
          <Route 
            path="/campaigns" 
            element={
              <RoleCampaignsView 
                campaigns={props.campaigns} 
                onDataUpdate={props.onDataUpdate}
              />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <RoleProfileView 
                userProfile={props.userProfile} 
                userPrincipal={props.principal}
                onProfileUpdate={props.onUserDataUpdate}
                backendActor={props.backendActor}
              />
            } 
          />
          <Route 
            path="/governance" 
            element={
              <RoleGovernanceView 
                proposals={props.proposals} 
                userPrincipal={props.principal}
                userBalance={props.userBalance}
                onProposalsUpdate={props.onDataUpdate}
                backendActor={props.backendActor}
              />
            } 
          />
          <Route 
            path="/escrow" 
            element={
              <RoleEscrowView 
                campaigns={props.campaigns} 
                userPrincipal={props.principal}
                userBalance={props.userBalance}
                onBalanceUpdate={props.onUserDataUpdate}
                backendActor={props.backendActor}
              />
            } 
          />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
