import React, { useState, useEffect } from 'react';
import { useRoleAuth, ErrorDisplay } from '../hooks/useRoleAuth';
import { useBackendActor } from '../hooks/useBackendActor';
import type { Campaign } from '../../../declarations/brandpool_backend/brandpool_backend.did';

export const InfluencerDashboard: React.FC = () => {
  const { userAccount } = useRoleAuth();
  const { backendActor } = useBackendActor();
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [appliedCampaigns, setAppliedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'applied'>('available');
  const [stats, setStats] = useState({
    totalApplications: 0,
    activeApplications: 0,
    completedCampaigns: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    if (userAccount) {
      fetchCampaigns();
    }
  }, [userAccount]);

  const fetchCampaigns = async () => {
    if (!userAccount || !backendActor) return;

    try {
      setLoading(true);
      
      console.log('Fetching campaigns with authenticated backend actor...');
      // Fetch all available campaigns
      const allCampaignsResult = await backendActor.getCampaigns();
      
      // Fetch campaigns I've applied to
      const appliedResult = await backendActor.getCampaignsAppliedTo();

      setAvailableCampaigns(allCampaignsResult); // result is now directly an array
      setAppliedCampaigns(appliedResult); // result is now directly an array
      updateStats(appliedResult);

    } catch (err) {
      setError('Failed to fetch campaigns');
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (appliedCampaignList: Campaign[]) => {
    const totalApplications = appliedCampaignList.length;
    const completedCampaigns = appliedCampaignList.filter(c => c.isCompleted).length;
    const activeApplications = totalApplications - completedCampaigns;
    const totalEarnings = appliedCampaignList
      .filter(c => c.isCompleted)
      .reduce((sum, c) => sum + Number(c.payout), 0);

    setStats({
      totalApplications,
      activeApplications,
      completedCampaigns,
      totalEarnings
    });
  };

  const handleApplyToCampaign = async (campaignId: bigint) => {
    if (!backendActor) {
      setError('Backend actor not available');
      return;
    }

    try {
      console.log('Applying to campaign with authenticated backend actor...');
      const result = await backendActor.applyToCampaign(campaignId);
      
      if ('ok' in result) {
        // Refresh campaigns to update the applied list
        await fetchCampaigns();
        setError(null);
      } else {
        setError(result.err);
      }
    } catch (err) {
      setError('Failed to apply to campaign');
      console.error('Error applying to campaign:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading campaigns...</span>
      </div>
    );
  }

  // Filter available campaigns to exclude those already applied to
  const filteredAvailableCampaigns = availableCampaigns.filter(campaign => 
    !appliedCampaigns.some(applied => applied.id === campaign.id)
  );

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && <ErrorDisplay error={error} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📝</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalApplications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">⏳</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeApplications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">💰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalEarnings} ICP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setActiveTab('available')}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
              activeTab === 'available'
                ? 'text-white bg-purple-600 hover:bg-purple-700'
                : 'text-purple-700 bg-purple-100 hover:bg-purple-200'
            }`}
          >
            <span className="mr-2">🔍</span>
            Browse Campaigns
          </button>
          <button
            onClick={() => setActiveTab('applied')}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
              activeTab === 'applied'
                ? 'text-white bg-purple-600 hover:bg-purple-700'
                : 'text-purple-700 bg-purple-100 hover:bg-purple-200'
            }`}
          >
            <span className="mr-2">📋</span>
            My Applications
          </button>
          <button
            onClick={fetchCampaigns}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <span className="mr-2">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {activeTab === 'available' ? 'Available Campaigns' : 'My Applications'}
          </h3>
        </div>

        {activeTab === 'available' ? (
          <AvailableCampaignsList 
            campaigns={filteredAvailableCampaigns}
            onApply={handleApplyToCampaign}
          />
        ) : (
          <AppliedCampaignsList campaigns={appliedCampaigns} />
        )}
      </div>
    </div>
  );
};

interface AvailableCampaignsListProps {
  campaigns: Campaign[];
  onApply: (campaignId: bigint) => Promise<void>;
}

const AvailableCampaignsList: React.FC<AvailableCampaignsListProps> = ({ campaigns, onApply }) => {
  const [applying, setApplying] = useState<string | null>(null);

  const handleApply = async (campaignId: bigint) => {
    setApplying(campaignId.toString());
    try {
      await onApply(campaignId);
    } finally {
      setApplying(null);
    }
  };

  if (campaigns.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No available campaigns</h3>
        <p className="text-gray-500">Check back later for new opportunities.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {campaigns.map((campaign) => (
        <div key={campaign.id.toString()} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <h4 className="text-lg font-medium text-gray-900">{campaign.title}</h4>
                <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  campaign.isCompleted 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {campaign.isCompleted ? 'Completed' : 'Open'}
                </span>
              </div>
              <p className="text-gray-600 mt-1">{campaign.description}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <span>💰 {campaign.payout.toString()} ICP</span>
                <span className="mx-2">•</span>
                <span>👥 {campaign.applicants.length} applicants</span>
                <span className="mx-2">•</span>
                <span className="font-mono text-xs">
                  By: {campaign.owner.toString().slice(0, 8)}...{campaign.owner.toString().slice(-8)}
                </span>
              </div>
            </div>
            <div className="ml-4">
              {campaign.isCompleted ? (
                <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-500 bg-gray-100 rounded">
                  Closed
                </span>
              ) : (
                <button
                  onClick={() => handleApply(campaign.id)}
                  disabled={applying === campaign.id.toString()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {applying === campaign.id.toString() ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Applying...
                    </>
                  ) : (
                    'Apply Now'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface AppliedCampaignsListProps {
  campaigns: Campaign[];
}

const AppliedCampaignsList: React.FC<AppliedCampaignsListProps> = ({ campaigns }) => {
  if (campaigns.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 text-4xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
        <p className="text-gray-500">Start by browsing available campaigns and applying to those that interest you.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {campaigns.map((campaign) => (
        <div key={campaign.id.toString()} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <h4 className="text-lg font-medium text-gray-900">{campaign.title}</h4>
                <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  campaign.isCompleted 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {campaign.isCompleted ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <p className="text-gray-600 mt-1">{campaign.description}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <span>💰 {campaign.payout.toString()} ICP</span>
                <span className="mx-2">•</span>
                <span>👥 {campaign.applicants.length} total applicants</span>
                <span className="mx-2">•</span>
                <span className="font-mono text-xs">
                  By: {campaign.owner.toString().slice(0, 8)}...{campaign.owner.toString().slice(-8)}
                </span>
              </div>
            </div>
            <div className="text-right">
              {campaign.isCompleted ? (
                <div className="text-sm">
                  <div className="text-green-600 font-medium">✅ Completed</div>
                  <div className="text-gray-500">Earned {campaign.payout.toString()} ICP</div>
                </div>
              ) : (
                <div className="text-sm">
                  <div className="text-yellow-600 font-medium">⏳ Pending</div>
                  <div className="text-gray-500">Awaiting review</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
