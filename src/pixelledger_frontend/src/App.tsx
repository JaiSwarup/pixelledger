import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Project, Profile, Proposal } from '../../declarations/pixelledger_backend/pixelledger_backend.did';
import { Principal } from '@dfinity/principal';

// Authentication
import { AuthProvider, useAuth } from './hooks/useAuth';
import { BackendActorProvider, useBackendActor } from './hooks/useBackendActor';
import { useRoleAuth } from './hooks/useRoleAuth';

// Components
import { AuthRouter } from './components/AuthRouter';
import { LoadingScreen } from './components/LoadingScreen';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';

// Main authenticated app component
function AuthenticatedApp() {
  const { principal, isAuthenticated } = useAuth();
  const { backendActor } = useBackendActor();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  
  const { isRegistered, loading: roleLoading } = useRoleAuth();

  // Clear state when principal changes (user switches accounts)
  useEffect(() => {
    // console.log('App: Principal changed to:', principal?.toString() || 'null');
    // Reset all app state when principal changes
    setProjects([]);
    setProposals([]);
    setUserProfile(null);
    setUserBalance(BigInt(0));
    setIsLoading(true);
  }, [principal]);

  // Load user data when we have a registered user
  useEffect(() => {
    if (principal && isAuthenticated && backendActor && !roleLoading) {
      if (isRegistered) {
        // User is registered, load their data
        const initializeApp = async () => {
          setIsLoading(true);
          try {
            await Promise.all([
              loadUserData(principal),
              loadDashboardData()
            ]);
          } catch (error) {
            toast.error('Failed to load app data: ' + (error instanceof Error ? error.message : 'Unknown error'));
          } finally {
            setIsLoading(false);
          }
        };

        initializeApp();
      } else {
        // User is authenticated but not registered - stop loading
        setIsLoading(false);
      }
    }
  }, [principal, isAuthenticated, isRegistered, backendActor, roleLoading]);

  const loadUserData = async (userPrincipal: Principal) => {
    if (!backendActor) return;
    
    try {
      // Try to get profile and balance using getMyProfile for the user's own profile
      const [profileResult, balance] = await Promise.all([
        backendActor.getMyProfile(),
        backendActor.getUserBalance(userPrincipal)
      ]);
      
      if ('ok' in profileResult) {
        setUserProfile(profileResult.ok);
      } else {
        // Profile not found - user is registered but hasn't created a profile yet
        console.log('Profile not found for registered user:', profileResult.err);
        setUserProfile(null);
      }
      
      setUserBalance(balance);
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Don't show error toast for profile not found, it's expected for new users
      setUserProfile(null);
      setUserBalance(BigInt(0));
    }
  };

  const loadDashboardData = async () => {
    if (!backendActor) return;
    
    try {
      const [projectsResult, proposalsData] = await Promise.all([
        backendActor.getProjects(),
        backendActor.getAllProposals()
      ]);
      
      setProjects(projectsResult); // projectsResult is now directly an array
      setProposals(proposalsData);
    } catch (error) {
      toast.error('Failed to load dashboard data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleUserDataUpdate = () => {
    if (principal) {
      loadUserData(principal);
    }
  };

  const handleDashboardDataUpdate = () => {
    loadDashboardData();
  };

  // Show loading screen only when we're still determining authentication/registration status
  // or when a registered user's data is being loaded
  if (roleLoading || (isAuthenticated && isRegistered && isLoading)) {
    const message = roleLoading ? "Connecting to backend..." : "Initializing...";
    const submessage = roleLoading ? "Establishing secure connection" : "Setting up your account";
    
    return (
      <LoadingScreen 
        message={message}
        submessage={submessage}
      />
    );
  }

  return (
    <AuthRouter
      projects={projects}
      proposals={proposals}
      userProfile={userProfile}
      userBalance={userBalance}
      principal={principal}
      backendActor={backendActor}
      onDataUpdate={handleDashboardDataUpdate}
      onUserDataUpdate={handleUserDataUpdate}
    />
  );
}

// Main App component with Router and Auth Provider
function App() {
  return (
    <AuthProvider>
      <Toaster />
      <BackendActorProvider>
        <Router>
          <AuthenticatedApp />
        </Router>
      </BackendActorProvider>
    </AuthProvider>
  );
}

export default App;
