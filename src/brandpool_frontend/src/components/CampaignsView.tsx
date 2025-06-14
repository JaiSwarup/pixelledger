import { useState } from 'react';
import { Campaign } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';

interface CampaignsViewProps {
  campaigns: Campaign[];
  userPrincipal: Principal | null;
  onCampaignsUpdate: () => void;
  backendActor: any;
}

export function CampaignsView({ campaigns, userPrincipal, onCampaignsUpdate, backendActor }: CampaignsViewProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    payout: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrincipal) return;

    setIsLoading(true);
    try {
      const campaignInput = {
        title: newCampaign.title,
        description: newCampaign.description,
        payout: BigInt(newCampaign.payout)
      };

      const result = await backendActor.createCampaign(campaignInput);
      if ('ok' in result) {
        setNewCampaign({ title: '', description: '', payout: '' });
        setShowCreateForm(false);
        onCampaignsUpdate();
      } else {
        alert('Error creating campaign: ' + result.err);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToCampaign = async (campaignId: bigint) => {
    if (!userPrincipal) return;

    setIsLoading(true);
    try {
      const result = await backendActor.applyToCampaign(campaignId, userPrincipal);
      if ('ok' in result) {
        alert('Successfully applied to campaign!');
        onCampaignsUpdate();
      } else {
        alert('Error applying to campaign: ' + result.err);
      }
    } catch (error) {
      console.error('Error applying to campaign:', error);
      alert('Error applying to campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveApplicant = async (campaignId: bigint, applicantPrincipal: string) => {
    if (!userPrincipal) return;

    setIsLoading(true);
    try {
      const result = await backendActor.approveApplicant(campaignId, applicantPrincipal);
      if ('ok' in result) {
        alert('Applicant approved successfully!');
        onCampaignsUpdate();
      } else {
        alert('Error approving applicant: ' + result.err);
      }
    } catch (error) {
      console.error('Error approving applicant:', error);
      alert('Error approving applicant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteCampaign = async (campaignId: bigint, influencerPrincipal: string) => {
    if (!userPrincipal) return;

    const confirmed = confirm('Are you sure you want to mark this campaign as complete? This will release the payment to the influencer.');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const result = await backendActor.completeCampaign(campaignId, Principal.fromText(influencerPrincipal));
      if ('ok' in result) {
        alert('Campaign completed successfully! Payment has been released.');
        onCampaignsUpdate();
      } else {
        alert('Error completing campaign: ' + result.err);
      }
    } catch (error) {
      console.error('Error completing campaign:', error);
      alert('Error completing campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = (campaign: Campaign) => {
    return userPrincipal && campaign.owner.toString() === userPrincipal.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Campaigns</h2>
          <p className="text-gray-600 mt-2">Browse and manage brand campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          Create Campaign
        </button>
      </div>

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Campaign</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payout (tokens)</label>
                <input
                  type="number"
                  value={newCampaign.payout}
                  onChange={(e) => setNewCampaign({...newCampaign, payout: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex-1"
                >
                  {isLoading ? 'Creating...' : 'Create Campaign'}
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

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id.toString()} className="card">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                {isOwner(campaign) && (
                  <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                    Owner
                  </span>
                )}
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                campaign.isCompleted 
                  ? 'text-green-700 bg-green-100' 
                  : 'text-blue-700 bg-blue-100'
              }`}>
                {campaign.isCompleted ? 'Completed' : 'Active'}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4">{campaign.description}</p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payout:</span>
                <span className="font-medium">{campaign.payout.toString()} tokens</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Applicants:</span>
                <span className="font-medium">{campaign.applicants.length}</span>
              </div>
            </div>
            
            {/* Show applicants if user is campaign owner */}
            {isOwner(campaign) && campaign.applicants.length > 0 && (
              <div className="border-t border-gray-200 pt-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Applicants ({campaign.applicants.length})
                </h4>
                <div className="space-y-2">
                  {campaign.applicants.map((applicant, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {applicant.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700 font-mono">
                          {applicant.slice(0, 8)}...{applicant.slice(-4)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveApplicant(campaign.id, applicant)}
                          disabled={isLoading || campaign.isCompleted}
                          className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-2 py-1 rounded transition-colors"
                        >
                          {campaign.isCompleted ? 'Completed' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleCompleteCampaign(campaign.id, applicant)}
                          disabled={isLoading || campaign.isCompleted}
                          className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-2 py-1 rounded transition-colors"
                        >
                          Mark Complete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Apply button for non-owners */}
            {!campaign.isCompleted && !isOwner(campaign) && (
              <button
                onClick={() => handleApplyToCampaign(campaign.id)}
                disabled={isLoading}
                className="btn-primary w-full"
              >
                Apply to Campaign
              </button>
            )}
            
            {/* Owner message if no applicants */}
            {isOwner(campaign) && campaign.applicants.length === 0 && !campaign.isCompleted && (
              <div className="text-center py-3 text-gray-500 text-sm">
                No applicants yet. Share your campaign to get applications!
              </div>
            )}
            
            {/* Campaign management for owners */}
            {isOwner(campaign) && !campaign.isCompleted && campaign.applicants.length > 0 && (
              <div className="border-t border-gray-200 pt-3 mt-3">
                <p className="text-xs text-gray-500 mb-2">
                  Campaign Management: Use individual "Mark Complete" buttons above for specific applicants, or use the button below to complete the campaign.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No campaigns found. Create the first one!</p>
        </div>
      )}
    </div>
  );
}
