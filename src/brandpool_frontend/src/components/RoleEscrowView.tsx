import { useState, useEffect } from 'react';
import { Campaign } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';
import { useRoleAuth } from '../hooks/useRoleAuth';

interface RoleEscrowViewProps {
  campaigns: Campaign[];
  userPrincipal: Principal | null;
  userBalance: bigint;
  onBalanceUpdate: (principal: Principal) => void;
  backendActor: any;
}

export function RoleEscrowView({ campaigns, userPrincipal, userBalance, onBalanceUpdate, backendActor }: RoleEscrowViewProps) {
  const { isBrand, isInfluencer, userAccount } = useRoleAuth();
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [escrowBalances, setEscrowBalances] = useState<{[key: string]: bigint}>({});
  const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([]);
  const [appliedCampaigns, setAppliedCampaigns] = useState<Campaign[]>([]);

  // Filter campaigns based on user role
  useEffect(() => {
    if (userPrincipal && campaigns.length > 0) {
      if (isBrand()) {
        // Brands see their own campaigns
        const ownedCampaigns = campaigns.filter(
          campaign => campaign.owner.toString() === userPrincipal.toString()
        );
        setUserCampaigns(ownedCampaigns);
        loadEscrowBalances(ownedCampaigns);
      } else if (isInfluencer()) {
        // Influencers see campaigns they've applied to
        const appliedToCampaigns = campaigns.filter(campaign =>
          campaign.applicants.some(applicant => 
            applicant.toString() === userPrincipal.toString()
          )
        );
        setAppliedCampaigns(appliedToCampaigns);
      }
    }
  }, [campaigns, userPrincipal, isBrand, isInfluencer]);

  const getCampaignStatus = (campaign: Campaign) => {
    if (campaign.isCompleted) return 'completed';
    return 'active';
  };

  const formatTimeRemaining = (timestamp?: bigint) => {
    // Since we don't have deadline in Campaign, we'll show a placeholder
    return "Active";
  };

  const loadEscrowBalances = async (campaignsToCheck: Campaign[]) => {
    if (!backendActor) return;
    
    const balances: {[key: string]: bigint} = {};
    for (const campaign of campaignsToCheck) {
      try {
        const balance = await backendActor.getEscrowBalance(campaign.id);
        balances[campaign.id.toString()] = balance;
      } catch (error) {
        console.error(`Error loading escrow balance for campaign ${campaign.id}:`, error);
        balances[campaign.id.toString()] = BigInt(0);
      }
    }
    setEscrowBalances(balances);
  };

  const handleDepositToEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrincipal || !selectedCampaign) return;

    // Only brands can deposit to escrow
    if (!isBrand()) {
      alert('Only brands can deposit funds to escrow');
      return;
    }

    // Validate amount
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    if (BigInt(Math.floor(amount)) > userBalance) {
      alert('Insufficient balance');
      return;
    }

    setIsLoading(true);
    try {
      const result = await backendActor.depositToEscrow(
        BigInt(selectedCampaign), 
        BigInt(Math.floor(amount))
      );
      if ('ok' in result) {
        alert('Successfully deposited to escrow!');
        setDepositAmount('');
        setSelectedCampaign('');
        onBalanceUpdate(userPrincipal);
        // Reload escrow balances
        loadEscrowBalances(userCampaigns);
      } else {
        alert('Error depositing to escrow: ' + result.err);
      }
    } catch (error) {
      console.error('Error depositing to escrow:', error);
      alert('Error depositing to escrow');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseFunds = async (campaignId: bigint, influencerPrincipal: Principal) => {
    if (!userPrincipal || !isBrand()) return;

    setIsLoading(true);
    try {
      const result = await backendActor.releaseFunds(campaignId, influencerPrincipal);
      if ('ok' in result) {
        alert('Funds released successfully!');
        loadEscrowBalances(userCampaigns);
      } else {
        alert('Error releasing funds: ' + result.err);
      }
    } catch (error) {
      console.error('Error releasing funds:', error);
      alert('Error releasing funds');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawEscrow = async (campaignId: bigint) => {
    if (!userPrincipal || !isBrand()) return;

    setIsLoading(true);
    try {
      const result = await backendActor.withdrawFromEscrow(campaignId);
      if ('ok' in result) {
        alert('Funds withdrawn from escrow successfully!');
        onBalanceUpdate(userPrincipal);
        loadEscrowBalances(userCampaigns);
      } else {
        alert('Error withdrawing from escrow: ' + result.err);
      }
    } catch (error) {
      console.error('Error withdrawing from escrow:', error);
      alert('Error withdrawing from escrow');
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: UPDATE FROM THE BACKEND
//   const getCampaignStatus = (campaign: Campaign) => {
//     const now = Date.now() / 1000;
//     if (Number(campaign.) < now) {
//       return 'expired';
//     }
//     if (campaign.selectedInfluencers && campaign.selectedInfluencers.length > 0) {
//       return 'active';
//     }
//     return 'open';
//   };

  const getEscrowBalance = (campaignId: bigint) => {
    return escrowBalances[campaignId.toString()] || BigInt(0);
  };

  // Brand View
  if (isBrand()) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Campaign Escrow</h2>
            <p className="text-gray-600 mt-1">
              Manage funds for your campaigns and release payments to influencers
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Your Balance</p>
            <p className="text-2xl font-bold text-gray-900">{userBalance.toString()} tokens</p>
          </div>
        </div>

        {/* Deposit to Escrow Form */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deposit to Campaign Escrow</h3>
          <form onSubmit={handleDepositToEscrow} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Campaign</label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select a campaign...</option>
                {userCampaigns.map((campaign) => (
                  <option key={campaign.id.toString()} value={campaign.id.toString()}>
                    {/* {campaign.title} (Status: {getCampaignStatus(campaign)}) */}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (tokens)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter amount to deposit"
                min="1"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Depositing...' : 'Deposit to Escrow'}
            </button>
          </form>
        </div>

        {/* Campaign Escrow Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Campaigns</h3>
          {userCampaigns.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">
              You haven't created any campaigns yet.
            </div>
          ) : (
            userCampaigns.map((campaign) => (
              <div key={campaign.id.toString()} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{campaign.title}</h4>
                    <p className="text-gray-600 mb-2">{campaign.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Budget: {campaign.payout.toString()} tokens</span>
                      {/* <span>{formatTimeRemaining(campaign.deadline)}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        getCampaignStatus(campaign) === 'active' ? 'bg-green-100 text-green-800' :
                        getCampaignStatus(campaign) === 'open' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getCampaignStatus(campaign).charAt(0).toUpperCase() + getCampaignStatus(campaign).slice(1)}
                      </span> */}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Escrow Balance: {getEscrowBalance(campaign.id).toString()} tokens
                    </span>
                    <button
                      onClick={() => handleWithdrawEscrow(campaign.id)}
                      disabled={isLoading || getEscrowBalance(campaign.id) === BigInt(0)}
                      className="btn-secondary text-sm"
                    >
                      Withdraw
                    </button>
                  </div>

                  {/* Selected Influencers */}
                  {/* TODO: UPDATE FROM THE BACKEND */}
                  {/* {campaign.selectedInfluencers && campaign.selectedInfluencers.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Selected Influencers</h5>
                      <div className="space-y-2">
                        {campaign.selectedInfluencers.map((influencer, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-600">
                              {influencer.toString().slice(0, 8)}...{influencer.toString().slice(-8)}
                            </span>
                            <button
                              onClick={() => handleReleaseFunds(campaign.id, influencer)}
                              disabled={isLoading}
                              className="btn-primary text-xs"
                            >
                              Release Payment
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )} */}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Influencer View
  if (isInfluencer()) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Earnings</h2>
            <p className="text-gray-600 mt-1">
              Track payments and earnings from completed campaigns
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Your Balance</p>
            <p className="text-2xl font-bold text-gray-900">{userBalance.toString()} tokens</p>
          </div>
        </div>

        {/* Applied Campaigns */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Campaigns You've Applied To</h3>
          {appliedCampaigns.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">
              You haven't applied to any campaigns yet.
            </div>
          ) : (
            appliedCampaigns.map((campaign) => {
              const isSelected = campaign.applicants?.some(
                selected => selected.toString() === userPrincipal?.toString()
              );
            //   const status = getCampaignStatus(campaign);
              
              return (
                <div key={campaign.id.toString()} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">{campaign.title}</h4>
                      <p className="text-gray-600 mb-2">{campaign.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Budget: {campaign.payout.toString()} tokens</span>
                        {/* <span>{formatTimeRemaining(campaign.deadline)}</span> */}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          isSelected ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isSelected ? 'Selected' : 'Applied'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="border-t pt-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-green-800 font-medium mb-1">
                          🎉 You've been selected for this campaign!
                        </p>
                        <p className="text-xs text-green-700">
                          Your payment will be released by the brand upon campaign completion.
                        </p>
                      </div>
                    </div>
                  )}

                  {!isSelected && status === 'open' && (
                    <div className="border-t pt-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Your application is under review by the brand.
                        </p>
                      </div>
                    </div>
                  )}

                  {!isSelected && status === 'expired' && (
                    <div className="border-t pt-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">
                          This campaign has expired and selections have been made.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Earnings Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              {/* <p className="text-2xl font-bold text-gray-900">
                {appliedCampaigns.filter(c => 
                  c.selectedInfluencers?.some(s => s.toString() === userPrincipal?.toString())
                ).length}
              </p> */}
              <p className="text-sm text-gray-600">Selected Campaigns</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">{userBalance.toString()}</p>
              <p className="text-sm text-gray-600">Total Earnings</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {appliedCampaigns.filter(c => getCampaignStatus(c) === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Completed Campaigns</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default view (if role is not determined yet)
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Escrow System</h2>
        <p className="text-gray-600">Loading your role-specific view...</p>
      </div>
    </div>
  );
}
