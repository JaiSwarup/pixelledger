import { useState, useEffect } from 'react';
import { Proposal } from '../../../declarations/pixelledger_backend/pixelledger_backend.did';
import { Principal } from '@dfinity/principal';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Vote, Users, TrendingUp, Clock, Shield, Zap, Settings } from 'lucide-react';

interface RoleGovernanceViewProps {
  proposals: Proposal[];
  userPrincipal: Principal | null;
  userBalance: bigint;
  onProposalsUpdate: () => void;
  backendActor: any;
}

export function RoleGovernanceView({ proposals, userPrincipal, userBalance, onProposalsUpdate, backendActor }: RoleGovernanceViewProps) {
  const { isClient, isCreative, userAccount } = useRoleAuth();
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
    if (isCreative() && userStake < BigInt(100)) {
      alert('Creatives must stake at least 100 tokens to create proposals.');
      return;
    }

    if (isClient() && userStake < BigInt(500)) {
      alert('Clients must stake at least 500 tokens to create proposals.');
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
    if (isClient()) return '500 tokens';
    if (isCreative()) return '100 tokens';
    return '50 tokens';
  };

  const getRoleBasedVotingPower = (stake: bigint) => {
    if (isClient()) return Number(stake) * 1.5;
    if (isCreative()) return Number(stake) * 1.2;
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
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
          <Card className="relative border-0 bg-black/40 backdrop-blur-xl shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500">
                    <Vote className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      DAO Governance
                    </CardTitle>
                    <CardDescription className="text-slate-300 text-lg">
                      Shape the future of PixelLedger protocol
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {userAccount && (
                    <Badge 
                      variant="outline" 
                      className={`border-0 text-white font-medium ${
                        isClient() 
                          ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-cyan-500/30' 
                          : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30'
                      }`}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      {isClient() ? 'Client' : 'Creative'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Available Balance</p>
                  <p className="text-3xl font-bold text-white mt-1">{userBalance.toString()}</p>
                  <p className="text-xs text-slate-500 mt-1">BPL Tokens</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all duration-300">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Staked Amount</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mt-1">
                    {userStake.toString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Min: {getMinimumStakeRequirement()}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 group-hover:from-cyan-500/30 group-hover:to-purple-500/30 transition-all duration-300">
                  <Zap className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Voting Power</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mt-1">
                    {getRoleBasedVotingPower(userStake).toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {isClient() ? '1.5x multiplier' : isCreative() ? '1.2x multiplier' : 'Base rate'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 group-hover:from-yellow-500/30 group-hover:to-orange-500/30 transition-all duration-300">
                  <Users className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Dialog open={showStakeForm} onOpenChange={setShowStakeForm}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 backdrop-blur-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Stake
              </Button>
            </DialogTrigger>
            <DialogContent className="border-0 bg-slate-900/95 backdrop-blur-xl text-white">
              <DialogHeader>
                <DialogTitle className="text-xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Manage Your Stake
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Stake tokens to participate in governance. Minimum required: {getMinimumStakeRequirement()}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleStake} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="stakeAmount" className="text-slate-300">Stake Amount</Label>
                  <Input
                    id="stakeAmount"
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Enter amount to stake"
                    required
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-400">
                    Current stake: {userStake.toString()} tokens
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  >
                    {isLoading ? 'Staking...' : 'Stake Tokens'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowStakeForm(false)}
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button 
                disabled={userStake === BigInt(0)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
              >
                <Vote className="h-4 w-4 mr-2" />
                Create Proposal
              </Button>
            </DialogTrigger>
            <DialogContent className="border-0 bg-slate-900/95 backdrop-blur-xl text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Create New Proposal
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Submit a proposal for the DAO to vote on
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProposal} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-300">Title</Label>
                  <Input
                    id="title"
                    type="text"
                    value={newProposal.title}
                    onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-300">Description</Label>
                  <textarea
                    id="description"
                    value={newProposal.description}
                    onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-slate-500"
                    rows={4}
                    placeholder="Describe your proposal in detail..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-slate-300">Voting Duration</Label>
                  <Select value={newProposal.votingDurationHours} onValueChange={(value) => setNewProposal({...newProposal, votingDurationHours: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                      <SelectItem value="72">72 hours</SelectItem>
                      <SelectItem value="168">1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isLoading ? 'Creating...' : 'Create Proposal'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Proposals Section */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border-slate-700">
            <TabsTrigger 
              value="active" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              Active Proposals
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              All Proposals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {proposals.filter(p => getProposalStatus(p) === 'active').length === 0 ? (
              <Card className="border-0 bg-slate-800/30 backdrop-blur-xl">
                <CardContent className="py-12 text-center">
                  <Vote className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No active proposals</p>
                  <p className="text-slate-500 text-sm mt-2">Create the first proposal to get started!</p>
                </CardContent>
              </Card>
            ) : (
              proposals
                .filter(p => getProposalStatus(p) === 'active')
                .map((proposal) => <ProposalCard key={proposal.id.toString()} proposal={proposal} />)
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {proposals.length === 0 ? (
              <Card className="border-0 bg-slate-800/30 backdrop-blur-xl">
                <CardContent className="py-12 text-center">
                  <Vote className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No proposals yet</p>
                  <p className="text-slate-500 text-sm mt-2">Be the first to create a proposal!</p>
                </CardContent>
              </Card>
            ) : (
              proposals.map((proposal) => <ProposalCard key={proposal.id.toString()} proposal={proposal} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  function ProposalCard({ proposal }: { proposal: Proposal }) {
    const status = getProposalStatus(proposal);
    const totalVotes = Number(proposal.votesFor) + Number(proposal.votesAgainst);
    const forPercentage = totalVotes > 0 ? (Number(proposal.votesFor) / totalVotes) * 100 : 0;
    const againstPercentage = totalVotes > 0 ? (Number(proposal.votesAgainst) / totalVotes) * 100 : 0;

    return (
      <Card className="border-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <CardTitle className="text-xl text-white group-hover:text-cyan-400 transition-colors duration-300">
                  {proposal.title}
                </CardTitle>
                <Badge 
                  variant="outline" 
                  className={`border-0 font-medium ${
                    status === 'active' 
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30' 
                      : 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-400 border-slate-500/30'
                  }`}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {status === 'active' ? 'Active' : 'Ended'}
                </Badge>
              </div>
              <CardDescription className="text-slate-300 text-base leading-relaxed">
                {proposal.description}
              </CardDescription>
              <div className="flex items-center space-x-4 text-sm text-slate-400 mt-3">
                <span>By: {proposal.proposer.toString().slice(0, 8)}...</span>
                <span>{formatTimeRemaining(proposal.votingDeadline)}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Voting Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Voting Results</span>
              <span className="text-sm text-slate-400">
                {totalVotes} total votes
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-400 font-medium">For</span>
                  <span className="text-slate-300">{proposal.votesFor.toString()} ({forPercentage.toFixed(1)}%)</span>
                </div>
                <Progress 
                  value={forPercentage} 
                  className="h-2 bg-slate-700"
                  style={{
                    background: 'linear-gradient(to right, rgb(34 197 94 / 0.2), rgb(34 197 94 / 0.1))'
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-400 font-medium">Against</span>
                  <span className="text-slate-300">{proposal.votesAgainst.toString()} ({againstPercentage.toFixed(1)}%)</span>
                </div>
                <Progress 
                  value={againstPercentage} 
                  className="h-2 bg-slate-700"
                  style={{
                    background: 'linear-gradient(to right, rgb(239 68 68 / 0.2), rgb(239 68 68 / 0.1))'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Voting Actions */}
          {status === 'active' && userStake > BigInt(0) && (
            <div className="flex space-x-3">
              <Button
                onClick={() => handleVote(proposal.id, true)}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-300"
              >
                Vote For
              </Button>
              <Button
                onClick={() => handleVote(proposal.id, false)}
                variant="outline"
                className="flex-1 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300"
              >
                Vote Against
              </Button>
            </div>
          )}

          {status === 'active' && userStake === BigInt(0) && (
            <div className="text-center py-4 space-y-3">
              <p className="text-slate-400">You need to stake tokens to participate in voting</p>
              <Button
                onClick={() => setShowStakeForm(true)}
                variant="outline"
                className="border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300"
              >
                Stake Tokens to Vote
              </Button>
            </div>
          )}

          {status === 'ended' && (
            <div className="text-center py-4">
              <p className="text-slate-400">Voting period has ended</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
}
