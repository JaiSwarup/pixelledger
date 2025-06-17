import React, { useState, useEffect } from 'react';
import { Campaign } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { useBackendActor } from '../hooks/useBackendActor';

interface RoleCampaignsViewProps {
  campaigns: Campaign[];
  onDataUpdate: () => void;
}

export const RoleCampaignsView: React.FC<RoleCampaignsViewProps> = ({ campaigns, onDataUpdate }) => {
  const { userAccount, isBrand, isInfluencer } = useRoleAuth();
  const { backendActor } = useBackendActor();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'applied'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    payout: ''
  });

  if (!userAccount) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please register to view campaigns.</p>
      </div>
    );
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBrand()) {
      setError('Only brands can create campaigns');
      return;
    }

    if (!backendActor) {
      setError('Backend actor not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating campaign with authenticated backend actor...');
      const campaignInput = {
        title: newCampaign.title,
        description: newCampaign.description,
        payout: BigInt(newCampaign.payout)
      };

      const result = await backendActor.createCampaign(campaignInput);
      if ('ok' in result) {
        setNewCampaign({ title: '', description: '', payout: '' });
        setShowCreateForm(false);
        onDataUpdate();
      } else {
        setError('Error creating campaign: ' + result.err);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToCampaign = async (campaignId: bigint) => {
    if (!isInfluencer()) {
      setError('Only influencers can apply to campaigns');
      return;
    }

    if (!backendActor) {
      setError('Backend actor not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Applying to campaign with authenticated backend actor...');
      const result = await backendActor.applyToCampaign(campaignId);
      if ('ok' in result) {
        onDataUpdate();
      } else {
        setError('Error applying to campaign: ' + result.err);
      }
    } catch (error) {
      console.error('Error applying to campaign:', error);
      setError('Failed to apply to campaign');
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (activeTab === 'all') return true;
    if (activeTab === 'my' && isBrand()) {
      return campaign.owner === userAccount.principal;
    }
    if (activeTab === 'applied' && isInfluencer()) {
      // Check if user's principal is in the applicants array (Principal comparison)
      return campaign.applicants.some(applicant => 
        applicant === userAccount.principal
      );
    }
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600 mt-1">
              {isBrand() ? 'Manage your campaigns and find influencers' : 'Discover and apply to campaigns'}
            </p>
          </div>
          
          {/* Brand-only: Create Campaign Button */}
          {isBrand() && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Create Campaign
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">Create New Campaign</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payout (tokens)</label>
                <input
                  type="number"
                  value={newCampaign.payout}
                  onChange={(e) => setNewCampaign({ ...newCampaign, payout: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="1"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Campaigns
            </button>
            {isBrand() && (
              <button
                onClick={() => setActiveTab('my')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'my'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Campaigns
              </button>
            )}
            {isInfluencer() && (
              <button
                onClick={() => setActiveTab('applied')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'applied'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Applied Campaigns
              </button>
            )}
          </nav>
        </div>

        {/* Campaigns List */}
        <div className="p-6">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {activeTab === 'all' && 'No campaigns available.'}
              {activeTab === 'my' && 'You haven\'t created any campaigns yet.'}
              {activeTab === 'applied' && 'You haven\'t applied to any campaigns yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id.toString()} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.title}</h3>
                      <p className="text-gray-600 mb-3">{campaign.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Payout: {campaign.payout.toString()} tokens</span>
                        <span>Owner: {campaign.owner.toString().slice(0, 8)}...{campaign.owner.toString().slice(-8)}</span>
                        <span>{campaign.applicants.length} applicants</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          campaign.isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {campaign.isCompleted ? 'Completed' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    {/* Influencer: Apply Button */}
                    {isInfluencer() && !campaign.isCompleted && !campaign.applicants.some(applicant => 
                      applicant.toString() === userAccount.principal.toString()
                    ) && (
                      <button
                        onClick={() => handleApplyToCampaign(campaign.id)}
                        disabled={loading}
                        className="btn-primary"
                      >
                        {loading ? 'Applying...' : 'Apply'}
                      </button>
                    )}

                    {/* Influencer: Already Applied */}
                    {isInfluencer() && campaign.applicants.some(applicant => 
                      applicant.toString() === userAccount.principal.toString()
                    ) && (
                      <span className="px-3 py-2 text-sm text-green-600 bg-green-50 rounded-md">
                        Applied
                      </span>
                    )}

                    {/* Brand: Manage Campaign */}
                    {isBrand() && campaign.owner === userAccount.principal && (
                      <div className="flex space-x-2">
                        <button className="btn-secondary text-sm">
                          View Applicants ({campaign.applicants.length})
                        </button>
                        {!campaign.isCompleted && (
                          <button className="btn-primary text-sm">
                            Manage Campaign
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
