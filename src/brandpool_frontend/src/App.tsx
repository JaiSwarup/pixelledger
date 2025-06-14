import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createActor, brandpool_backend } from '../../declarations/brandpool_backend';
import { Campaign, Profile, Proposal } from '../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';

// Authentication
import { AuthProvider, useAuth } from './hooks/useAuth';

// Components
import { LoginView } from './components/LoginView';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { CampaignsView } from './components/CampaignsView';
import { ProfileView } from './components/ProfileView';
import { GovernanceView } from './components/GovernanceView';
import { EscrowView } from './components/EscrowView';

// Main authenticated app component
function AuthenticatedApp() {
  const { identity, principal, isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  const [backendActor, setBackendActor] = useState(brandpool_backend);

  // Create authenticated backend actor
  useEffect(() => {
    if (identity && isAuthenticated) {
      // Get canister ID from environment variables
      const canisterId = import.meta.env.CANISTER_ID_BRANDPOOL_BACKEND || 
                        'uxrrr-q7777-77774-qaaaq-cai'; // Hardcoded fallback for local development
      
      console.log('Creating actor with canister ID:', canisterId);
      console.log('Available env vars:', {
        CANISTER_ID_BRANDPOOL_BACKEND: import.meta.env.CANISTER_ID_BRANDPOOL_BACKEND,
        DFX_NETWORK: import.meta.env.DFX_NETWORK,
        all: import.meta.env
      });

      try {
        const actor = createActor(canisterId, {
          agentOptions: {
            identity,
            host: import.meta.env.DFX_NETWORK === "local" ? "http://localhost:4943" : "https://icp-api.io",
          },
        });
        setBackendActor(actor);
        console.log('Successfully created authenticated actor');
      } catch (error) {
        console.error('Error creating authenticated actor:', error);
        // Fallback to default actor
        setBackendActor(brandpool_backend);
      }
    }
  }, [identity, isAuthenticated]);

  // Load user data when we have an authenticated backend actor
  useEffect(() => {
    if (backendActor && principal) {
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
  }, [backendActor, principal]);

  const loadUserData = async (userPrincipal: Principal) => {
    if (!backendActor) return;
    
    try {
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
      const [campaignsData, proposalsData] = await Promise.all([
        backendActor.getCampaigns(),
        backendActor.getAllProposals()
      ]);
      setCampaigns(campaignsData);
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

  if (!isAuthenticated) {
    return <LoginView />;
  }

  if (isLoading || !backendActor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BrandPool...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userProfile={userProfile} userBalance={userBalance} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route 
            path="/" 
            element={
              <DashboardView 
                campaigns={campaigns} 
                proposals={proposals} 
                userProfile={userProfile}
              />
            } 
          />
          <Route 
            path="/campaigns" 
            element={
              <CampaignsView 
                campaigns={campaigns} 
                userPrincipal={principal}
                onCampaignsUpdate={handleDashboardDataUpdate}
                backendActor={backendActor}
              />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProfileView 
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
              <GovernanceView 
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
              <EscrowView 
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
      <Router>
        <AuthenticatedApp />
      </Router>
    </AuthProvider>
  );
}

export default App;
