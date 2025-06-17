import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Campaign, Profile, Proposal } from '../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';

// Authentication
import { AuthProvider, useAuth } from './hooks/useAuth';
import { BackendActorProvider, useBackendActor } from './hooks/useBackendActor';
import { useRoleAuth } from './hooks/useRoleAuth';

// Role-based Components
import { LoginView } from './components/LoginView';
import { RoleRegistration } from './components/RoleRegistration';
import { RoleNavigation } from './components/RoleNavigation';
import { RoleDashboard } from './components/RoleDashboard';
import { RoleCampaignsView } from './components/RoleCampaignsView';
import { RoleProfileView } from './components/RoleProfileView';
import { RoleGovernanceView } from './components/RoleGovernanceView';
import { RoleEscrowView } from './components/RoleEscrowView';

// Main authenticated app component
function AuthenticatedApp() {
  const { identity, principal, isAuthenticated } = useAuth();
  const { backendActor } = useBackendActor();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  
  const { isRegistered, loading: roleLoading, userAccount } = useRoleAuth();

  // Clear state when principal changes (user switches accounts)
  useEffect(() => {
    console.log('App: Principal changed to:', principal?.toString() || 'null');
    // Reset all app state when principal changes
    setCampaigns([]);
    setProposals([]);
    setUserProfile(null);
    setUserBalance(BigInt(0));
    setIsLoading(true);
  }, [principal]);

  // Handle registration completion
  const handleRegistrationComplete = () => {
    // Trigger a refresh by reloading the page
    window.location.reload();
  };

  // Load user data when we have a registered user
  useEffect(() => {
    if (principal && isRegistered) {
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
    }
  }, [principal, isRegistered]);

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
      const [campaignsResult, proposalsData] = await Promise.all([
        backendActor.getCampaigns(),
        backendActor.getAllProposals()
      ]);
      
      setCampaigns(campaignsResult); // campaignsResult is now directly an array
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

  // All conditional returns AFTER all hooks
  if (!isAuthenticated) {
    return <LoginView />;
  }

  if (isAuthenticated && !roleLoading && !isRegistered) {
    return <RoleRegistration onRegistrationComplete={() => window.location.reload()} />;
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking user registration...</p>
        </div>
      </div>
    );
  }

  if (isLoading || !backendActor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BrandPool...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RoleNavigation userProfile={userProfile} userBalance={userBalance} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<RoleDashboard />} />
          <Route 
            path="/campaigns" 
            element={
              <RoleCampaignsView 
                campaigns={campaigns} 
                onDataUpdate={handleDashboardDataUpdate}
              />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <RoleProfileView 
                userProfile={userProfile} 
                userPrincipal={principal}
                onProfileUpdate={handleUserDataUpdate}
                backendActor={backendActor}
              />
            } 
          />
          <Route 
            path="/governance" 
            element={
              <RoleGovernanceView 
                proposals={proposals} 
                userPrincipal={principal}
                userBalance={userBalance}
                onProposalsUpdate={handleDashboardDataUpdate}
                backendActor={backendActor}
              />
            } 
          />
          <Route 
            path="/escrow" 
            element={
              <RoleEscrowView 
                campaigns={campaigns} 
                userPrincipal={principal}
                userBalance={userBalance}
                onBalanceUpdate={handleUserDataUpdate}
                backendActor={backendActor}
              />
            } 
          />
        </Routes>
      </main>
    </div>
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
