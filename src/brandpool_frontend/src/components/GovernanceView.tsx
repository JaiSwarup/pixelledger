import { useState, useEffect } from 'react';
import { Proposal } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';

interface GovernanceViewProps {
  proposals: Proposal[];
  userPrincipal: Principal | null;
  userBalance: bigint;
  onProposalsUpdate: () => void;
  backendActor: any;
}

export function GovernanceView({ proposals, userPrincipal, userBalance, onProposalsUpdate, backendActor }: GovernanceViewProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStakeForm, setShowStakeForm] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [userStake, setUserStake] = useState<bigint>(BigInt(0));
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    votingDurationHours: '24'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrincipal) return;

    // Check if user has staked tokens
    if (userStake === BigInt(0)) {
      alert('You must stake tokens before creating proposals. Please stake tokens first.');
      setShowStakeForm(true);
      return;
    }

    setIsLoading(true);
    try {
      const proposalInput = {
        title: newProposal.title,
        description: newProposal.description,
        votingDurationHours: BigInt(newProposal.votingDurationHours)
      };

      const result = await backendActor.createProposal(proposalInput);
      if ('ok' in result) {
        setNewProposal({ title: '', description: '', votingDurationHours: '24' });
        setShowCreateForm(false);
        onProposalsUpdate();
      } else {
        alert('Error creating proposal: ' + result.err);
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Error creating proposal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStakeTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrincipal) return;

    const amount = parseFloat(stakeAmount);
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
      const result = await backendActor.stake(BigInt(Math.floor(amount)));
      if ('ok' in result) {
        alert('Successfully staked tokens!');
        setStakeAmount('');
        setShowStakeForm(false);
        await fetchUserStake();
        // Update user balance in parent component
        if (userPrincipal) {
          onProposalsUpdate(); // This will trigger a refresh of user data
        }
      } else {
        alert('Error staking tokens: ' + result.err);
      }
    } catch (error) {
      console.error('Error staking tokens:', error);
      alert('Error staking tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetTestTokens = async () => {
    if (!userPrincipal) return;

    setIsLoading(true);
    try {
      const result = await backendActor.addUserBalance(userPrincipal, 1000);
      if ('ok' in result) {
        alert('Successfully added 1000 test tokens to your account!');
        // Update user balance in parent component
        onProposalsUpdate(); // This will trigger a refresh of user data
      } else {
        alert('Error getting test tokens: ' + result.err);
      }
    } catch (error) {
      console.error('Error getting test tokens:', error);
      alert('Error getting test tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStake = async () => {
    if (!userPrincipal) return;
    
    try {
      const stakeAmount = await backendActor.getUserStake(userPrincipal);
      setUserStake(BigInt(stakeAmount));
    } catch (error) {
      console.error('Error fetching user stake:', error);
    }
  };

  // Fetch user stake when component mounts or user changes
  useEffect(() => {
    if (userPrincipal) {
      fetchUserStake();
    }
  }, [userPrincipal]);

  const handleVote = async (proposalId: bigint, choice: 'For' | 'Against') => {
    if (!userPrincipal) return;

    setIsLoading(true);
    try {
      const voteChoice = choice === 'For';
      const result = await backendActor.vote(proposalId, voteChoice);
      if ('ok' in result) {
        alert('Vote submitted successfully!');
        onProposalsUpdate();
      } else {
        alert('Error voting: ' + result.err);
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error voting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">DAO Governance</h2>
        <p className="text-gray-600 mt-2">Create and vote on platform governance proposals</p>
      </div>

      {/* Staking Status and Actions */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Staking Status</h3>
            <p className="text-sm text-gray-600">
              Current Stake: <span className="font-medium text-green-600">{userStake.toString()} tokens</span>
            </p>
            <p className="text-sm text-gray-600">
              Available Balance: <span className="font-medium">{userBalance.toString()} tokens</span>
            </p>
          </div>
          <div className="flex space-x-3">
            {userBalance === BigInt(0) && (
              <button
                onClick={handleGetTestTokens}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Getting...' : 'Get Test Tokens'}
              </button>
            )}
            {userStake === BigInt(0) && (
              <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
                ⚠️ Stake tokens to create proposals
              </div>
            )}
            <button
              onClick={() => setShowStakeForm(true)}
              disabled={userBalance === BigInt(0)}
              className="btn-secondary"
            >
              {userStake === BigInt(0) ? 'Stake Tokens' : 'Add More Stake'}
            </button>
          </div>
        </div>
      </div>

      {/* Staking Modal */}
      {showStakeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stake Tokens</h3>
            <p className="text-sm text-gray-600 mb-4">
              Staking tokens allows you to create proposals and increases your voting power in the DAO.
            </p>
            {userBalance === BigInt(0) && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-600">
                  ⚠️ You don't have any tokens to stake. Please get test tokens first by clicking "Get Test Tokens" button.
                </p>
              </div>
            )}
            <form onSubmit={handleStakeTokens} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (Available: {userBalance.toString()} tokens)
                </label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  min="1"
                  max={userBalance > BigInt(0) ? userBalance.toString() : "1"}
                  step="1"
                  disabled={userBalance === BigInt(0)}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowStakeForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || userBalance === BigInt(0)}
                  className="flex-1 btn-primary"
                >
                  {isLoading ? 'Staking...' : 'Stake Tokens'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Active Proposals</h3>
        <div className="flex space-x-3">
          <div className="text-sm text-gray-600">
            Voting Power: <span className="font-medium">{userBalance.toString()}</span>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={userStake === BigInt(0)}
            className={`btn-primary ${userStake === BigInt(0) ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={userStake === BigInt(0) ? 'You must stake tokens before creating proposals' : 'Create a new proposal'}
          >
            Create Proposal
          </button>
        </div>
      </div>


      {/* Create Proposal Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Proposal</h3>
            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voting Duration (hours)</label>
                <input
                  type="number"
                  value={newProposal.votingDurationHours}
                  onChange={(e) => setNewProposal({...newProposal, votingDurationHours: e.target.value})}
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
                  {isLoading ? 'Creating...' : 'Create Proposal'}
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

      {/* Proposals List */}
      <div className="space-y-4">
        {proposals.map((proposal) => (
          <div key={proposal.id.toString()} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{proposal.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{proposal.description}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                proposal.isActive 
                  ? 'text-blue-700 bg-blue-100' 
                  : proposal.isExecuted
                  ? 'text-green-700 bg-green-100'
                  : 'text-gray-700 bg-gray-100'
              }`}>
                {proposal.isActive ? 'Active' : proposal.isExecuted ? 'Executed' : 'Closed'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-500">For Votes</span>
                <p className="font-medium text-green-600">{proposal.votesFor.toString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Against Votes</span>
                <p className="font-medium text-red-600">{proposal.votesAgainst.toString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Total Power</span>
                <p className="font-medium">{proposal.totalVotingPower.toString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Proposer</span>
                <p className="font-medium text-xs">{proposal.proposer.toString().slice(0, 8)}...</p>
              </div>
            </div>

            {proposal.isActive && (
              <div className="flex space-x-3">
                <button
                  onClick={() => handleVote(proposal.id, 'For')}
                  disabled={isLoading}
                  className="btn-primary flex-1"
                >
                  Vote For
                </button>
                <button
                  onClick={() => handleVote(proposal.id, 'Against')}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex-1"
                >
                  Vote Against
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {proposals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No proposals found. Create the first one!</p>
        </div>
      )}
    </div>
    </div>
  );
}
