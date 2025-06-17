import { useState, useEffect } from 'react';
import { Proposal } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';
import { useRoleAuth } from '../hooks/useRoleAuth';

interface RoleGovernanceViewProps {
  proposals: Proposal[];
  userPrincipal: Principal | null;
  userBalance: bigint;
  onProposalsUpdate: () => void;
  backendActor: any;
}

export function RoleGovernanceView({ proposals, userPrincipal, userBalance, onProposalsUpdate, backendActor }: RoleGovernanceViewProps) {
  const { isBrand, isInfluencer, userAccount } = useRoleAuth();
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
  const [votingPowers, setVotingPowers] = useState<{[key: string]: bigint}>({});

  // Load user stake information
  useEffect(() => {
    if (userPrincipal && backendActor) {
      loadUserStake();
    }
  }, [userPrincipal, backendActor]);

  const loadUserStake = async () => {
    if (!userPrincipal || !backendActor) return;
    
    try {
      const stake = await backendActor.getUserStake(userPrincipal);
      setUserStake(stake);
    } catch (error) {
      console.error('Error loading user stake:', error);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrincipal) return;

    // Check if user has staked tokens
    if (userStake === BigInt(0)) {
      alert('You must stake tokens before creating proposals. Please stake tokens first.');
      setShowStakeForm(true);
      return;
    }

    // Role-based proposal creation rules
    if (isInfluencer() && userStake < BigInt(100)) {
      alert('Influencers must stake at least 100 tokens to create proposals.');
      return;
    }

    if (isBrand() && userStake < BigInt(500)) {
      alert('Brands must stake at least 500 tokens to create proposals.');
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

  const handleVote = async (proposalId: bigint, support: boolean) => {
    if (!userPrincipal) return;

    if (userStake === BigInt(0)) {
      alert('You must stake tokens before voting. Please stake tokens first.');
      setShowStakeForm(true);
      return;
    }

    try {
      const result = await backendActor.voteOnProposal(proposalId, support);
      if ('ok' in result) {
        onProposalsUpdate();
      } else {
        alert('Error voting: ' + result.err);
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error voting on proposal');
    }
  };

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrincipal) return;

    const amount = BigInt(stakeAmount);
    if (amount <= 0) {
      alert('Please enter a valid stake amount');
      return;
    }

    if (amount > userBalance) {
      alert('Insufficient balance');
      return;
    }

    setIsLoading(true);
    try {
      const result = await backendActor.stakeTokens(amount);
      if ('ok' in result) {
        setStakeAmount('');
        setShowStakeForm(false);
        loadUserStake();
        // Refresh balance would be handled by parent component
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

  const getMinimumStakeRequirement = () => {
    if (isBrand()) return '500 tokens';
    if (isInfluencer()) return '100 tokens';
    return '50 tokens';
  };

  const getRoleBasedVotingPower = (stake: bigint) => {
    // Brands get 1.5x voting power, Influencers get 1.2x
    if (isBrand()) return Number(stake) * 1.5;
    if (isInfluencer()) return Number(stake) * 1.2;
    return Number(stake);
  };

  const formatTimeRemaining = (endTime: bigint) => {
    const now = Date.now() / 1000; // Convert to seconds
    const remaining = Number(endTime) - now;
    
    if (remaining <= 0) return 'Voting ended';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const getProposalStatus = (proposal: Proposal) => {
    const now = Date.now() / 1000;
    if (Number(proposal.votingDeadline) < now) {
      return 'ended';
    }
    return 'active';
  };

  return (
    <div className="space-y-6">
      {/* Header with Role Information */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">DAO Governance</h2>
          <p className="text-gray-600 mt-1">
            Participate in protocol governance decisions
          </p>
          {userAccount && (
            <div className="mt-2 flex items-center space-x-4">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                isBrand() ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {isBrand() ? 'Brand Member' : 'Influencer Member'}
              </span>
              <span className="text-sm text-gray-600">
                Minimum stake required: {getMinimumStakeRequirement()}
              </span>
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowStakeForm(true)}
            className="btn-secondary"
          >
            Manage Stake
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
            disabled={userStake === BigInt(0)}
          >
            Create Proposal
          </button>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Your Balance</h3>
          <p className="text-2xl font-bold text-gray-900">{userBalance.toString()}</p>
          <p className="text-xs text-gray-500">Available tokens</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Your Stake</h3>
          <p className="text-2xl font-bold text-primary-600">{userStake.toString()}</p>
          <p className="text-xs text-gray-500">Staked tokens</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Voting Power</h3>
          <p className="text-2xl font-bold text-green-600">
            {getRoleBasedVotingPower(userStake).toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">
            {isBrand() ? '1.5x multiplier' : isInfluencer() ? '1.2x multiplier' : 'Base rate'}
          </p>
        </div>
      </div>

      {/* Stake Form Modal */}
      {showStakeForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Manage Stake</h3>
            <form onSubmit={handleStake} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stake Amount (minimum {getMinimumStakeRequirement()})
                </label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter amount to stake"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current stake: {userStake.toString()} tokens
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex-1"
                >
                  {isLoading ? 'Staking...' : 'Stake Tokens'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStakeForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Proposal Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">Create New Proposal</h3>
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
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voting Duration (hours)</label>
                <select
                  value={newProposal.votingDurationHours}
                  onChange={(e) => setNewProposal({...newProposal, votingDurationHours: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                  <option value="168">1 week</option>
                </select>
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
        <h3 className="text-lg font-semibold text-gray-900">Active Proposals</h3>
        {proposals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No proposals yet. Create the first one!
          </div>
        ) : (
          proposals.map((proposal) => (
            <div key={proposal.id.toString()} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{proposal.title}</h4>
                  <p className="text-gray-600 mb-3">{proposal.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Proposed by: {proposal.proposer.toString().slice(0, 8)}...</span>
                    <span>{formatTimeRemaining(proposal.votingDeadline)}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  getProposalStatus(proposal) === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {getProposalStatus(proposal) === 'active' ? 'Active' : 'Ended'}
                </span>
              </div>

              {/* Voting Results */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Results</span>
                  <span className="text-xs text-gray-500">
                    Total votes: {(Number(proposal.votesFor) + Number(proposal.votesAgainst)).toString()}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-green-600 w-12">For:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Number(proposal.votesFor) / Math.max(Number(proposal.votesFor) + Number(proposal.votesAgainst), 1) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16">{proposal.votesFor.toString()}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-red-600 w-12">Against:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{
                          width: `${Number(proposal.votesAgainst) / Math.max(Number(proposal.votesFor) + Number(proposal.votesAgainst), 1) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16">{proposal.votesAgainst.toString()}</span>
                  </div>
                </div>
              </div>

              {/* Voting Buttons */}
              {getProposalStatus(proposal) === 'active' && userStake > BigInt(0) && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleVote(proposal.id, true)}
                    className="btn-primary flex-1"
                  >
                    Vote For
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, false)}
                    className="btn-secondary flex-1"
                  >
                    Vote Against
                  </button>
                </div>
              )}

              {getProposalStatus(proposal) === 'active' && userStake === BigInt(0) && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500 mb-2">You need to stake tokens to vote</p>
                  <button
                    onClick={() => setShowStakeForm(true)}
                    className="btn-primary text-sm"
                  >
                    Stake Tokens
                  </button>
                </div>
              )}

              {getProposalStatus(proposal) === 'ended' && (
                <div className="text-center py-2 text-sm text-gray-500">
                  Voting has ended
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
