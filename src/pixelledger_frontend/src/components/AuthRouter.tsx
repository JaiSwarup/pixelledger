import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { LoadingScreen } from './LoadingScreen';

// Public Pages
import LandingPage from '../pages/LandingPage';
import ForClients from '../pages/ForClients';
import ForCreatives from '../pages/ForCreatives';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ClientOnboardingPage from '../pages/ClientOnboardingPage';
import CreativeOnboardingPage from '../pages/CreativeOnboardingPage';
import ProjectsPage from '../pages/ProjectsPage';
import UserProfilePage from '../pages/UserProfilePage';

// Protected Components
import { RoleNavigation } from './RoleNavigation';
import { RoleDashboard } from './RoleDashboard';
import { RoleProjectsView } from './RoleProjectsView';
import { RoleProfileView } from './RoleProfileView';
import { RoleGovernanceView } from './RoleGovernanceView';
import { RoleEscrowView } from './RoleEscrowView';
import ProjectDetails from './ProjectDetails';
import { Profile, Project, Proposal } from 'declarations/pixelledger_backend/pixelledger_backend.did';
import { Principal } from '@dfinity/principal';
import { pixelledger_backend } from 'declarations/pixelledger_backend';

interface AuthRouterProps {
  projects: Project[];
  proposals: Proposal[];
  userProfile: Profile | null;
  userBalance: bigint;
  principal: Principal | null;
  backendActor: typeof pixelledger_backend;
  onDataUpdate: () => void;
  onUserDataUpdate: () => void;
}

export function AuthRouter({
  projects,
  proposals,
  userProfile,
  userBalance,
  principal,
  backendActor,
  onDataUpdate,
  onUserDataUpdate
}: AuthRouterProps) {
  const { isInitialized } = useAuth();

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <LoadingScreen 
          message="Initializing PixelLedger..."
          submessage="Setting up your connection to the Internet Computer"
        />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes - Always accessible */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/clients" element={<ForClients />} />
      <Route path="/creatives" element={<ForCreatives />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/onboarding/client" element={<ClientOnboardingPage />} />
      <Route path="/onboarding/creative" element={<CreativeOnboardingPage />} />
      
      {/* Protected Routes */}
      <Route 
        path="/*" 
        element={
          <ProtectedRoutes
            projects={projects}
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
  const { isAuthenticated } = useAuth();
  const { isRegistered, loading: roleLoading } = useRoleAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show loading while checking registration
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <LoadingScreen 
          message="Checking your account..."
          submessage="Verifying your registration status"
        />
      </div>
    );
  }

  // Show registration if not registered
  if (!isRegistered) {
    return <Navigate to="/register" replace />;
  }

  // Show loading if backend actor not ready or we don't have principal for authenticated users
  if (!props.backendActor || (isAuthenticated && !props.principal)) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <LoadingScreen 
          message="Connecting to backend..."
          submessage="Establishing secure connection"
        />
      </div>
    );
  }

  // Show authenticated app
  return (
    <div className="min-h-screen bg-cyber-black">
      <RoleNavigation userProfile={props.userProfile} userBalance={props.userBalance} />
      
      <main className="container mx-auto px-6 py-0">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<RoleDashboard />} />
          <Route 
            path="/projects" 
            element={
              <RoleProjectsView 
                projects={props.projects} 
                onDataUpdate={props.onDataUpdate}
              />
            } 
          />
          <Route 
            path="/explore-projects" 
            element={
              <ProjectsPage 
                projects={props.projects} 
                onDataUpdate={props.onDataUpdate}
              />
            } 
          />
          <Route 
            path="/projects/:id" 
            element={
              <ProjectDetails 
                projects={props.projects} 
                onDataUpdate={props.onDataUpdate}
              />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <RoleProfileView 
                userProfile={props.userProfile!} 
                userPrincipal={props.principal!}
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
                userPrincipal={props.principal!}
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
                projects={props.projects} 
                userPrincipal={props.principal!}
                userBalance={props.userBalance}
                onBalanceUpdate={props.onUserDataUpdate}
                backendActor={props.backendActor}
              />
            } 
          />
          <Route path="/users/:id" element={<UserProfilePage />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
