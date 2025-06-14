import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { brandpool_backend } from '../../declarations/brandpool_backend';
import { Campaign, Profile, Proposal } from '../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';

// Components
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { CampaignsView } from './components/CampaignsView';
import { ProfileView } from './components/ProfileView';
import { GovernanceView } from './components/GovernanceView';
import { EscrowView } from './components/EscrowView';

function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userPrincipal, setUserPrincipal] = useState<Principal | null>(null);
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);

  // Simulate user authentication (in real app, use Internet Identity)
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        // For demo purposes, using a default principal
        const defaultPrincipal = Principal.fromText('2vxsx-fae');
        setUserPrincipal(defaultPrincipal);
        
        await Promise.all([
          loadUserData(defaultPrincipal),
          loadDashboardData()
        ]);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const loadUserData = async (principal: Principal) => {
    try {
      const [profileResult, balance] = await Promise.all([
        brandpool_backend.getProfile(principal),
        brandpool_backend.getUserBalance(principal)
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
    try {
      const [campaignsData, proposalsData] = await Promise.all([
        brandpool_backend.getCampaigns(),
        brandpool_backend.getAllProposals()
      ]);
      setCampaigns(campaignsData);
      setProposals(proposalsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleUserDataUpdate = () => {
    if (userPrincipal) {
      loadUserData(userPrincipal);
    }
  };

  const handleDashboardDataUpdate = () => {
    loadDashboardData();
  };

  if (isLoading) {
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
    <Router>
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
                  userPrincipal={userPrincipal}
                  onCampaignsUpdate={handleDashboardDataUpdate}
                  backendActor={brandpool_backend}
                />
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProfileView 
                  userProfile={userProfile} 
                  userPrincipal={userPrincipal}
                  onProfileUpdate={handleUserDataUpdate}
                  backendActor={brandpool_backend}
                />
              } 
            />
            <Route 
              path="/governance" 
              element={
                <GovernanceView 
                  proposals={proposals} 
                  userPrincipal={userPrincipal}
                  userBalance={userBalance}
                  onProposalsUpdate={handleDashboardDataUpdate}
                    backendActor={brandpool_backend}
                />
              } 
            />
            <Route 
              path="/escrow" 
              element={
                <EscrowView 
                  campaigns={campaigns} 
                  userPrincipal={userPrincipal}
                  userBalance={userBalance}
                  onBalanceUpdate={handleUserDataUpdate}
                    backendActor={brandpool_backend}
                />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
