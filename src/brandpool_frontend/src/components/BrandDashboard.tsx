import React, { useState, useEffect } from 'react';
import { useRoleAuth, ErrorDisplay } from '../hooks/useRoleAuth';
import { useBackendActor } from '../hooks/useBackendActor';
import type { Campaign } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';

export const BrandDashboard: React.FC = () => {
  const { userAccount } = useRoleAuth();
  const { backendActor } = useBackendActor();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalApplicants: 0
  });

  useEffect(() => {
    fetchMyCampaigns();
  }, [userAccount]);

  const fetchMyCampaigns = async () => {
    if (!userAccount || !backendActor) return;

    try {
      setLoading(true);
      console.log('Fetching campaigns with authenticated backend actor...');
      const result = await backendActor.getCampaignsByOwner(userAccount.principal);
      
      setCampaigns(result); // result is now directly an array
      updateStats(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch campaigns');
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (campaignList: Campaign[]) => {
    const totalCampaigns = campaignList.length;
    const completedCampaigns = campaignList.filter(c => c.isCompleted).length;
    const activeCampaigns = totalCampaigns - completedCampaigns;
    const totalApplicants = campaignList.reduce((sum, c) => sum + c.applicants.length, 0);

    setStats({
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalApplicants
    });
  };

  const handleCreateCampaign = () => {
    setShowCreateForm(true);
  };

  const onCampaignCreated = () => {
    setShowCreateForm(false);
    fetchMyCampaigns();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading campaigns...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && <ErrorDisplay error={error} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📋</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Campaigns</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🟢</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
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
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Applicants</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalApplicants}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleCreateCampaign}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="mr-2">➕</span>
            Create New Campaign
          </button>
          <button
            onClick={fetchMyCampaigns}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="mr-2">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">My Campaigns</h3>
        </div>
        
        {campaigns.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first campaign.</p>
            <button
              onClick={handleCreateCampaign}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Campaign
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id.toString()}
                campaign={campaign}
                onUpdate={fetchMyCampaigns}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <CreateCampaignModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={onCampaignCreated}
        />
      )}
    </div>
  );
};

interface CampaignCardProps {
  campaign: Campaign;
  onUpdate: () => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onUpdate }) => {
  const { backendActor } = useBackendActor();
  const [showApplicants, setShowApplicants] = useState(false);
  const [applicants, setApplicants] = useState<string[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const fetchApplicants = async () => {
    if (showApplicants) {
      setShowApplicants(false);
      return;
    }

    if (!backendActor) {
      console.error('Backend actor not available');
      return;
    }

    try {
      setLoadingApplicants(true);
      console.log('Fetching campaign applicants with authenticated backend actor...');
      const result = await backendActor.getCampaignApplicants(campaign.id);
      
      if ('ok' in result) {
        setApplicants(result.ok.map(p => p.toString()));
        setShowApplicants(true);
      } else {
        console.error('Error fetching applicants:', result.err);
      }
    } catch (err) {
      console.error('Error fetching applicants:', err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <h4 className="text-lg font-medium text-gray-900">{campaign.title}</h4>
            <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              campaign.isCompleted 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {campaign.isCompleted ? 'Completed' : 'Active'}
            </span>
          </div>
          <p className="text-gray-600 mt-1">{campaign.description}</p>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <span>💰 {campaign.payout.toString()} ICP</span>
            <span className="mx-2">•</span>
            <span>👥 {campaign.applicants.length} applicants</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchApplicants}
            disabled={loadingApplicants}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
          >
            {loadingApplicants ? '...' : showApplicants ? 'Hide' : 'View'} Applicants
          </button>
        </div>
      </div>

      {/* Applicants List */}
      {showApplicants && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Applicants ({applicants.length})</h5>
          {applicants.length === 0 ? (
            <p className="text-sm text-gray-500">No applicants yet.</p>
          ) : (
            <div className="space-y-2">
              {applicants.map((applicant, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700 font-mono">
                    {applicant.slice(0, 8)}...{applicant.slice(-8)}
                  </span>
                  <button
                    onClick={async () => {
                      if (!backendActor) {
                        console.error('Backend actor not available');
                        return;
                      }
                      try {
                        console.log('Approving applicant with authenticated backend actor...');
                        const result = await backendActor.approveApplicant(campaign.id, Principal.fromText(applicant));
                        if ('ok' in result) {
                          onUpdate();
                        } else {
                          console.error('Error approving applicant:', result.err);
                        }
                      } catch (err) {
                        console.error('Error approving applicant:', err);
                      }
                    }}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface CreateCampaignModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ onClose, onSuccess }) => {
  const { backendActor } = useBackendActor();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    payout: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim() || !formData.description.trim() || !formData.payout) {
      setError('All fields are required');
      return;
    }

    const payout = parseInt(formData.payout);
    if (isNaN(payout) || payout <= 0) {
      setError('Payout must be a positive number');
      return;
    }

    if (!backendActor) {
      setError('Backend actor not available');
      return;
    }

    try {
      setLoading(true);
      console.log('Creating campaign with authenticated backend actor...');
      const result = await backendActor.createCampaign({
        title: formData.title,
        description: formData.description,
        payout: BigInt(payout)
      });

      if ('ok' in result) {
        onSuccess();
      } else {
        setError(result.err);
      }
    } catch (err) {
      setError('Failed to create campaign');
      console.error('Error creating campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create New Campaign</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <ErrorDisplay error={error || undefined} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Campaign title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe your campaign..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payout (ICP) *
            </label>
            <input
              type="number"
              value={formData.payout}
              onChange={(e) => setFormData(prev => ({ ...prev, payout: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100"
              min="1"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
