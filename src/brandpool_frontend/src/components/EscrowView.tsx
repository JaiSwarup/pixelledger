import { useState } from 'react';
import { Campaign } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';

interface EscrowViewProps {
  campaigns: Campaign[];
  userPrincipal: Principal | null;
  userBalance: bigint;
  onBalanceUpdate: (principal: Principal) => void;
  backendActor: any;
}

export function EscrowView({ campaigns, userPrincipal, userBalance, onBalanceUpdate, backendActor }: EscrowViewProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDepositToEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrincipal || !selectedCampaign) return;

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

  const handleCompleteCampaign = async (campaignId: bigint, influencer: string) => {
    if (!userPrincipal) return;

    setIsLoading(true);
    try {
      const influencerPrincipal = Principal.fromText(influencer);
      const result = await backendActor.completeCampaign(campaignId, influencerPrincipal);
      if ('ok' in result) {
        alert('Campaign completed and payment released!');
        onBalanceUpdate(userPrincipal);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Escrow Management</h2>
        <p className="text-gray-600 mt-2">Manage campaign payments and escrow deposits</p>
      </div>

      {/* Deposit to Escrow */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Deposit to Escrow</h3>
        <form onSubmit={handleDepositToEscrow} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Campaign</label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Choose a campaign...</option>
              {campaigns.filter(c => !c.isCompleted).map((campaign) => (
                <option key={campaign.id.toString()} value={campaign.id.toString()}>
                  {campaign.title} (Required: {campaign.payout.toString()} tokens)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (Available: {userBalance.toString()} tokens)
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              min="1"
              max={userBalance.toString()}
              step="1"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !selectedCampaign}
            className="btn-primary w-full"
          >
            {isLoading ? 'Depositing...' : 'Deposit to Escrow'}
          </button>
        </form>
      </div>

      {/* Campaign Management */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Management</h3>
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id.toString()} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{campaign.title}</h4>
                  <p className="text-sm text-gray-600">Payout: {campaign.payout.toString()} tokens</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  campaign.isCompleted 
                    ? 'text-green-700 bg-green-100' 
                    : 'text-blue-700 bg-blue-100'
                }`}>
                  {campaign.isCompleted ? 'Completed' : 'Active'}
                </span>
              </div>

              {campaign.applicants.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Applicants:</p>
                  <div className="space-y-2">
                    {campaign.applicants.map((applicant, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{applicant}</span>
                        {!campaign.isCompleted && (
                          <button
                            onClick={() => handleCompleteCampaign(campaign.id, applicant)}
                            disabled={isLoading}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                          >
                            Complete & Pay
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {campaign.applicants.length === 0 && (
                <p className="text-sm text-gray-500">No applicants yet</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No campaigns found.</p>
        </div>
      )}
    </div>
  );
}
