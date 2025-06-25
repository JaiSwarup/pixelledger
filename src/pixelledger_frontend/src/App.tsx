import { useState, useEffect } from 'react';
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

// Main authenticated app component
function AuthenticatedApp() {
  const { identity, principal, isAuthenticated, isInitialized } = useAuth();
  const { backendActor } = useBackendActor();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  
  const { isRegistered, loading: roleLoading, userAccount } = useRoleAuth();

  // Clear state when principal changes (user switches accounts)
  useEffect(() => {
    console.log('App: Principal changed to:', principal?.toString() || 'null');
    // Reset all app state when principal changes
    setProjects([]);
    setProposals([]);
    setUserProfile(null);
    setUserBalance(BigInt(0));
    setIsLoading(true);
  }, [principal]);

  // Load user data when we have a registered user
  useEffect(() => {
    if (principal && isAuthenticated && isRegistered && backendActor) {
      const initializeApp = async () => {
        setIsLoading(true);
        try {
          await Promise.all([
            loadUserData(principal),
            loadDashboardData()
          ]);
        } catch (error) {
          console.error('Error initializing app:', error);
        } finally {
          setIsLoading(false);
        }
      };

      initializeApp();
    } else if (isAuthenticated && !roleLoading && !isRegistered) {
      // User is authenticated but not registered
      setIsLoading(false);
    }
  }, [principal, isAuthenticated, isRegistered, backendActor, roleLoading]);

  const loadUserData = async (userPrincipal: Principal) => {
    if (!backendActor) return;
    
    try {
      // Use role-based profile loading
      const [profileResult, balance] = await Promise.all([
        backendActor.getProfile(userPrincipal),
        backendActor.getUserBalance(userPrincipal)
      ]);
      
      if ('ok' in profileResult) {
        setUserProfile(profileResult.ok);
      } else {
        setUserProfile(null);
      }
      
      setUserBalance(balance);
    } catch (error) {
      console.error('Error loading user data:', error);
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
      console.error('Error loading dashboard data:', error);
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

  // Show loading screen while initializing
  if (isLoading && isAuthenticated && isRegistered) {
    return (
      <LoadingScreen 
        message="Loading PixelLedger..."
        submessage="Fetching your data and projects"
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
      <BackendActorProvider>
        <Router>
          <AuthenticatedApp />
        </Router>
      </BackendActorProvider>
    </AuthProvider>
  );
}

export default App;
