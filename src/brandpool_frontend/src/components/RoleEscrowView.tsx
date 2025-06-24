import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Campaign } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, TrendingUp, Clock, CheckCircle, AlertCircle, DollarSign, Send, ArrowDown, ArrowUp } from 'lucide-react';
import ThreeBackground from './ThreeBackground';
import { toast } from 'sonner';

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
  const [stats, setStats] = useState({
    totalEscrowed: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    totalEarnings: 0,
    selectedCampaigns: 0,
    completedCampaigns: 0
  });

  // Mock transaction history for demonstration
  const [transactions] = useState([
    { id: '1', type: 'Deposit', amount: '5,000', date: '2024-06-01', status: 'Confirmed', txHash: '0x1234...5678' },
    { id: '2', type: 'Payout', amount: '1,250', date: '2024-06-15', status: 'Processing', txHash: '0x5678...9012' },
    { id: '3', type: 'Deposit', amount: '12,500', date: '2024-06-20', status: 'Confirmed', txHash: '0x9012...3456' },
  ]);

  // Filter campaigns based on user role
  useEffect(() => {
    if (userPrincipal && campaigns.length > 0) {
      if (isBrand()) {
        const ownedCampaigns = campaigns.filter(
          campaign => campaign.owner.toString() === userPrincipal.toString()
        );
        setUserCampaigns(ownedCampaigns);
        loadEscrowBalances(ownedCampaigns);
        updateBrandStats(ownedCampaigns);
      } else if (isInfluencer()) {
        const appliedToCampaigns = campaigns.filter(campaign =>
          campaign.applicants.some(applicant => 
            applicant.toString() === userPrincipal.toString()
          )
        );
        setAppliedCampaigns(appliedToCampaigns);
        updateInfluencerStats(appliedToCampaigns);
      }
    }
  }, [campaigns, userPrincipal, isBrand, isInfluencer]);

  const updateBrandStats = (campaignList: Campaign[]) => {
    const totalEscrowed = campaignList.reduce((sum, c) => sum + Number(c.payout), 0);
    const completedCampaigns = campaignList.filter(c => c.isCompleted).length;
    const pendingPayouts = campaignList.filter(c => !c.isCompleted).reduce((sum, c) => sum + Number(c.payout), 0);
    const completedPayouts = campaignList.filter(c => c.isCompleted).reduce((sum, c) => sum + Number(c.payout), 0);

    setStats({
      totalEscrowed,
      pendingPayouts,
      completedPayouts,
      totalEarnings: 0,
      selectedCampaigns: 0,
      completedCampaigns
    });
  };

  const updateInfluencerStats = (campaignList: Campaign[]) => {
    const selectedCampaigns = campaignList.filter(c => 
      c.applicants.some(applicant => applicant.toString() === userPrincipal?.toString())
    ).length;
    const completedCampaigns = campaignList.filter(c => c.isCompleted).length;
    const totalEarnings = campaignList.filter(c => c.isCompleted).reduce((sum, c) => sum + Number(c.payout), 0);

    setStats({
      totalEscrowed: 0,
      pendingPayouts: 0,
      completedPayouts: 0,
      totalEarnings,
      selectedCampaigns,
      completedCampaigns
    });
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

  const handleDepositToEscrow = async () => {
    if (!userPrincipal || !selectedCampaign) return;

    if (!isBrand()) {
      toast.error('Only brands can deposit funds to escrow');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    if (BigInt(Math.floor(amount)) > userBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsLoading(true);
    try {
      const result = await backendActor.depositToEscrow(
        BigInt(selectedCampaign), 
        BigInt(Math.floor(amount))
      );
      if ('ok' in result) {
        toast.success('Successfully deposited to escrow!');
        setDepositAmount('');
        setSelectedCampaign('');
        onBalanceUpdate(userPrincipal);
        loadEscrowBalances(userCampaigns);
      } else {
        toast.error('Error depositing to escrow: ' + result.err);
      }
    } catch (error) {
      console.error('Error depositing to escrow:', error);
      toast.error('Error depositing to escrow');
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
        toast.success('Funds released successfully!');
        loadEscrowBalances(userCampaigns);
      } else {
        toast.error('Error releasing funds: ' + result.err);
      }
    } catch (error) {
      console.error('Error releasing funds:', error);
      toast.error('Error releasing funds');
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
        toast.success('Funds withdrawn from escrow successfully!');
        onBalanceUpdate(userPrincipal);
        loadEscrowBalances(userCampaigns);
      } else {
        toast.error('Error withdrawing from escrow: ' + result.err);
      }
    } catch (error) {
      console.error('Error withdrawing from escrow:', error);
      toast.error('Error withdrawing from escrow');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Funded': return <CheckCircle className="w-4 h-4 text-cyber-teal" />;
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getEscrowBalance = (campaignId: bigint) => {
    return escrowBalances[campaignId.toString()] || BigInt(0);
  };

  const getCampaignStatus = (campaign: Campaign) => {
    if (campaign.isCompleted) return 'Completed';
    const balance = getEscrowBalance(campaign.id);
    if (balance > 0) return 'Funded';
    return 'Pending';
  };

  const getCampaignProgress = (campaign: Campaign) => {
    if (campaign.isCompleted) return 100;
    const balance = Number(getEscrowBalance(campaign.id));
    const required = Number(campaign.payout);
    return required > 0 ? Math.min((balance / required) * 100, 100) : 0;
  };

  // Brand View
  if (isBrand()) {
    return (
      <div className="min-h-screen relative">
        <ThreeBackground />
        
        <div className="relative z-10 container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-orbitron font-bold mb-4">
              <span className="cyber-text-gradient">Escrow</span> Management
            </h1>
            <p className="text-gray-300 text-lg">
              Monitor and manage blockchain escrow for all campaigns
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <Card className="neuro-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-cyber-teal">
                  <Wallet className="w-5 h-5" />
                  Total Escrowed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold cyber-text-gradient">{stats.totalEscrowed.toLocaleString()}</div>
                <p className="text-gray-400 text-sm">Across {userCampaigns.length} campaigns</p>
              </CardContent>
            </Card>

            <Card className="neuro-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-cyber-pink">
                  <TrendingUp className="w-5 h-5" />
                  Pending Payouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyber-pink">{stats.pendingPayouts.toLocaleString()}</div>
                <p className="text-gray-400 text-sm">Ready for release</p>
              </CardContent>
            </Card>

            <Card className="neuro-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  <CheckCircle className="w-5 h-5" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-400">{stats.completedPayouts.toLocaleString()}</div>
                <p className="text-gray-400 text-sm">Successfully paid out</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Deposit to Escrow */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="neuro-card">
              <CardHeader>
                <CardTitle className="text-xl font-orbitron flex items-center gap-2">
                  <ArrowDown className="w-5 h-5 text-cyber-teal" />
                  Deposit to Campaign Escrow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Select Campaign</Label>
                    <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                      <SelectTrigger className="neuro-input">
                        <SelectValue placeholder="Select a campaign..." />
                      </SelectTrigger>
                      <SelectContent className="neuro-card">
                        {userCampaigns.map((campaign) => (
                          <SelectItem key={campaign.id.toString()} value={campaign.id.toString()}>
                            {campaign.title} ({getCampaignStatus(campaign)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block">Amount (tokens)</Label>
                    <Input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="neuro-input"
                      placeholder="Enter amount"
                      min="1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleDepositToEscrow}
                      disabled={isLoading || !selectedCampaign || !depositAmount}
                      className="cyber-button w-full"
                    >
                      {isLoading ? 'Depositing...' : 'Deposit to Escrow'}
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  Your Balance: <span className="text-cyber-teal font-bold">{userBalance.toString()} tokens</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Campaign Escrow Status */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-orbitron font-bold text-white mb-6">Campaign Escrow Status</h2>
            
            {userCampaigns.length === 0 ? (
              <Card className="neuro-card">
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">🏦</div>
                  <h3 className="text-xl font-orbitron font-bold mb-2 text-gray-300">
                    No campaigns yet
                  </h3>
                  <p className="text-gray-400">Create campaigns to manage escrow funds.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {userCampaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign.id.toString()}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="neuro-card group hover:shadow-cyber-glow transition-all duration-300">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl group-hover:cyber-text-gradient transition-all duration-300">
                              {campaign.title}
                            </CardTitle>
                            <p className="text-gray-400 mt-1">{campaign.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(getCampaignStatus(campaign))}
                            <Badge className={`bg-transparent border-current ${
                              getCampaignStatus(campaign) === 'Completed' ? 'text-green-400' :
                              getCampaignStatus(campaign) === 'Funded' ? 'text-cyber-teal' :
                              'text-yellow-400'
                            }`}>
                              {getCampaignStatus(campaign)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-gray-400 text-sm">Escrow Balance</p>
                            <p className="text-2xl font-bold cyber-text-gradient">
                              {getEscrowBalance(campaign.id).toString()} tokens
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Required Amount</p>
                            <p className="text-xl font-bold text-white">{campaign.payout.toString()} tokens</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Applicants</p>
                            <p className="text-xl font-bold text-white">{campaign.applicants.length}</p>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 text-sm">Funding Progress</span>
                            <span className="text-white font-medium">{getCampaignProgress(campaign).toFixed(0)}%</span>
                          </div>
                          <Progress value={getCampaignProgress(campaign)} className="h-2" />
                        </div>
                        
                        <div className="flex gap-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="cyber-button">
                                Manage Escrow
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="neuro-card">
                              <DialogHeader>
                                <DialogTitle className="cyber-text-gradient">Escrow Management</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-gray-300">
                                  Manage escrow funds for <span className="text-cyber-teal font-medium">{campaign.title}</span>
                                </p>
                                <div className="bg-cyber-dark/50 rounded-lg p-4 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Current Balance:</span>
                                    <span className="text-cyber-teal font-bold">{getEscrowBalance(campaign.id).toString()} tokens</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Required:</span>
                                    <span className="text-white">{campaign.payout.toString()} tokens</span>
                                  </div>
                                </div>
                                <div className="flex gap-3">
                                  <Button 
                                    className="cyber-button flex-1"
                                    onClick={() => {
                                      setSelectedCampaign(campaign.id.toString());
                                    }}
                                  >
                                    <ArrowDown className="w-4 h-4 mr-2" />
                                    Deposit More
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    className="flex-1 border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                                    onClick={() => handleWithdrawEscrow(campaign.id)}
                                    disabled={getEscrowBalance(campaign.id) === BigInt(0)}
                                  >
                                    <ArrowUp className="w-4 h-4 mr-2" />
                                    Withdraw
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="outline" 
                            className="border-cyber-teal text-cyber-teal hover:bg-cyber-teal hover:text-cyber-black"
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Transaction History */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card className="neuro-card">
              <CardHeader>
                <CardTitle className="text-xl font-orbitron">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + index * 0.1 }}
                      className="flex justify-between items-center p-4 rounded-lg bg-cyber-dark/50 border border-gray-800/50 hover:border-cyber-teal/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-white flex items-center gap-2">
                          {tx.type === 'Deposit' ? <ArrowDown className="w-4 h-4 text-cyber-teal" /> : <ArrowUp className="w-4 h-4 text-cyber-pink" />}
                          {tx.type}
                        </p>
                        <p className="text-gray-400 text-sm">{tx.date}</p>
                        <p className="text-gray-500 text-xs">TX: {tx.txHash}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold cyber-text-gradient">{tx.amount} tokens</p>
                        <Badge className={`${tx.status === 'Confirmed' ? 'text-green-400 border-green-400' : 'text-yellow-400 border-yellow-400'} bg-transparent text-xs`}>
                          {tx.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Influencer View
  if (isInfluencer()) {
    return (
      <div className="min-h-screen relative">
        <ThreeBackground />
        
        <div className="relative z-10 container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-orbitron font-bold mb-4">
              <span className="cyber-text-gradient">Earnings</span> Dashboard
            </h1>
            <p className="text-gray-300 text-lg">
              Track payments and earnings from completed campaigns
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <Card className="neuro-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-cyber-teal">
                  <DollarSign className="w-5 h-5" />
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold cyber-text-gradient">{stats.totalEarnings.toLocaleString()}</div>
                <p className="text-gray-400 text-sm">From completed campaigns</p>
              </CardContent>
            </Card>

            <Card className="neuro-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-cyber-pink">
                  <Send className="w-5 h-5" />
                  Selected Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyber-pink">{stats.selectedCampaigns}</div>
                <p className="text-gray-400 text-sm">You've been chosen for</p>
              </CardContent>
            </Card>

            <Card className="neuro-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">{stats.completedCampaigns}</div>
                <p className="text-gray-400 text-sm">Successfully finished</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Applied Campaigns */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-orbitron font-bold text-white mb-6">Your Campaign Applications</h2>
            
            {appliedCampaigns.length === 0 ? (
              <Card className="neuro-card">
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-xl font-orbitron font-bold mb-2 text-gray-300">
                    No applications yet
                  </h3>
                  <p className="text-gray-400">Apply to campaigns to track your earnings here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {appliedCampaigns.map((campaign, index) => {
                  const isSelected = campaign.applicants?.some(
                    selected => selected.toString() === userPrincipal?.toString()
                  );
                  
                  return (
                    <motion.div
                      key={campaign.id.toString()}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className="neuro-card group hover:shadow-cyber-glow transition-all duration-300">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl group-hover:cyber-text-gradient transition-all duration-300">
                                {campaign.title}
                              </CardTitle>
                              <p className="text-gray-400 mt-1">{campaign.description}</p>
                            </div>
                            <Badge className={`bg-transparent border-current ${
                              campaign.isCompleted ? 'text-green-400' :
                              isSelected ? 'text-cyber-teal' : 'text-yellow-400'
                            }`}>
                              {campaign.isCompleted ? 'Completed' : isSelected ? 'Selected' : 'Applied'}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-400 text-sm">Payout Amount</p>
                              <p className="text-2xl font-bold cyber-text-gradient">{campaign.payout.toString()} tokens</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Status</p>
                              <p className="text-xl font-bold text-white">
                                {campaign.isCompleted ? 'Payment Released' : isSelected ? 'Work in Progress' : 'Under Review'}
                              </p>
                            </div>
                          </div>

                          {isSelected && !campaign.isCompleted && (
                            <div className="bg-cyber-teal/10 border border-cyber-teal/30 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-cyber-teal" />
                                <p className="text-cyber-teal font-medium">You've been selected!</p>
                              </div>
                              <p className="text-gray-300 mt-2 text-sm">
                                Complete the campaign requirements to receive your payment.
                              </p>
                            </div>
                          )}

                          {campaign.isCompleted && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <p className="text-green-400 font-medium">Payment Complete!</p>
                              </div>
                              <p className="text-gray-300 mt-2 text-sm">
                                Your payment has been released to your account.
                              </p>
                            </div>
                          )}

                          {!isSelected && !campaign.isCompleted && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-400" />
                                <p className="text-yellow-400 font-medium">Application Under Review</p>
                              </div>
                              <p className="text-gray-300 mt-2 text-sm">
                                The brand is currently reviewing applications for this campaign.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Current Balance */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="neuro-card">
              <CardHeader>
                <CardTitle className="text-xl font-orbitron flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-cyber-teal" />
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-6xl font-bold cyber-text-gradient mb-4">
                    {userBalance.toString()}
                  </div>
                  <p className="text-gray-400 text-lg">Tokens</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Available in your wallet
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Default view (if role is not determined yet)
  return (
    <div className="min-h-screen relative">
      <ThreeBackground />
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="text-center py-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center space-x-3 mb-8"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-teal"></div>
            <span className="text-gray-300 font-orbitron">Loading escrow system...</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
