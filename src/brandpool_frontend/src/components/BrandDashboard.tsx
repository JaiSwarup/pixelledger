import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRoleAuth, ErrorDisplay } from '../hooks/useRoleAuth';
import { useBackendActor } from '../hooks/useBackendActor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, Clock, DollarSign, Send, Users, BarChart3, TrendingUp, Plus, AlertTriangle } from 'lucide-react';
import type { Campaign } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

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
    totalApplicants: 0,
    pendingPayouts: 0,
    totalPaidOut: 0
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
    
    // Calculate mock payout data (in a real app, this would come from backend)
    const pendingPayouts = campaignList
      .filter(c => !c.isCompleted && c.applicants.length > 0)
      .reduce((sum, c) => sum + Number(c.payout), 0);
    
    const totalPaidOut = campaignList
      .filter(c => c.isCompleted)
      .reduce((sum, c) => sum + Number(c.payout), 0);

    setStats({
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalApplicants,
      pendingPayouts,
      totalPaidOut
    });
  };

  const handleMarkComplete = (campaignId: bigint) => {
    console.log('Marking campaign as complete:', campaignId);
    toast.success('Campaign marked as complete! Processing payouts...');
    // In a real app, this would call the backend to mark the campaign as complete
    fetchMyCampaigns(); // Refresh data
  };

  const handleProcessPayout = (campaignId: bigint) => {
    console.log('Processing payout for campaign:', campaignId);
    toast.success('Payout initiated! Blockchain transaction in progress...');
    // In a real app, this would call the backend to process payouts
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-blue-400 border-blue-400';
      case 'Ready to Complete': return 'text-yellow-400 border-yellow-400';
      case 'Completed': return 'text-green-400 border-green-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case 'Ready': return 'text-cyber-teal border-cyber-teal';
      case 'Processing': return 'text-yellow-400 border-yellow-400';
      case 'All Paid': return 'text-green-400 border-green-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getCampaignStatus = (campaign: Campaign) => {
    if (campaign.isCompleted) return 'Completed';
    if (campaign.applicants.length > 0) return 'Ready to Complete';
    return 'Active';
  };

  const getCampaignProgress = (campaign: Campaign) => {
    // Mock progress calculation - in real app, this would be based on actual completion data
    if (campaign.isCompleted) return 100;
    if (campaign.applicants.length > 0) return 80;
    return 20;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-3"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-teal"></div>
          <span className="text-gray-300 font-orbitron">Loading dashboard...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="neuro-card p-4 border-l-4 border-red-500 bg-red-900/20"
        >
          <p className="text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-orbitron font-bold mb-4">
          <span className="cyber-text-gradient">Campaign</span> Management
        </h1>
        <p className="text-gray-300 text-lg">
          Manage your campaigns and track performance
        </p>
      </motion.div>

      {/* Enhanced Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6"
      >
        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-cyber-teal">
              <CheckCircle className="w-5 h-5" />
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.activeCampaigns}</div>
          </CardContent>
        </Card>

        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              <Clock className="w-5 h-5" />
              Pending Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold cyber-text-gradient">${stats.pendingPayouts}</div>
          </CardContent>
        </Card>

        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-400">
              <DollarSign className="w-5 h-5" />
              Total Paid Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">${stats.totalPaidOut}</div>
          </CardContent>
        </Card>

        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-400">
              <Send className="w-5 h-5" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">{stats.completedCampaigns}</div>
          </CardContent>
        </Card>

        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-cyber-pink">
              <Users className="w-5 h-5" />
              Total Applicants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyber-pink">{stats.totalApplicants}</div>
          </CardContent>
        </Card>

        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <BarChart3 className="w-5 h-5" />
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{stats.totalCampaigns}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="neuro-card">
          <CardHeader>
            <CardTitle className="text-xl font-orbitron">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Link to="/campaigns">
                <Button className="cyber-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Campaign
                </Button>
              </Link>
              
              <Link to="/campaigns">
                <Button 
                  variant="outline" 
                  className="border-cyber-teal text-cyber-teal hover:bg-cyber-teal hover:text-cyber-black"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Manage Campaigns
                </Button>
              </Link>
              
              <Link to="/explore-campaigns">
                <Button 
                  variant="outline" 
                  className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Browse Influencers
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Campaign Management */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-orbitron font-bold text-white">Active Campaigns</h2>
        
        {campaigns.length === 0 ? (
          <Card className="neuro-card">
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-orbitron font-bold mb-2 text-gray-300">
                No campaigns yet
              </h3>
              <p className="text-gray-400 mb-6">Get started by creating your first campaign.</p>
              <Link to="/campaigns">
                <Button className="cyber-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign, index) => (
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
                    <div className="flex items-center gap-3">
                      <Badge className={`${getStatusColor(getCampaignStatus(campaign))} bg-transparent`}>
                        {getCampaignStatus(campaign)}
                      </Badge>
                      <Badge className={`${getPayoutStatusColor('Ready')} bg-transparent`}>
                        Ready
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Total Payout</p>
                      <p className="text-2xl font-bold cyber-text-gradient">${campaign.payout.toString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Applicants</p>
                      <p className="text-xl font-bold text-white">{campaign.applicants.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={getCampaignProgress(campaign)} className="flex-1 h-2" />
                        <span className="text-white font-medium">{getCampaignProgress(campaign)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Status</p>
                      <p className="text-xl font-bold text-white">{campaign.isCompleted ? 'Complete' : 'Active'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    {!campaign.isCompleted && campaign.applicants.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="cyber-button">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Complete
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="neuro-card">
                          <DialogHeader>
                            <DialogTitle className="cyber-text-gradient">Complete Campaign</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                <p className="text-yellow-400 font-medium">Confirmation Required</p>
                              </div>
                              <p className="text-gray-300 mt-2">
                                This will mark the campaign as complete and initiate payout process for all approved influencers.
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-gray-400 text-sm">Payout Summary:</p>
                              <div className="bg-cyber-dark/50 rounded-lg p-4">
                                <p className="text-white">Total Amount: <span className="cyber-text-gradient font-bold">${campaign.payout.toString()}</span></p>
                                <p className="text-white">Recipients: {campaign.applicants.length} influencers</p>
                                <p className="text-gray-400">Estimated gas fees: ~$25</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-3">
                              <Button 
                                className="cyber-button flex-1"
                                onClick={() => handleMarkComplete(campaign.id)}
                              >
                                Confirm & Complete
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {!campaign.isCompleted && (
                      <Button 
                        className="border-cyber-teal text-cyber-teal hover:bg-cyber-teal hover:text-cyber-black"
                        variant="outline"
                        onClick={() => handleProcessPayout(campaign.id)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Process Payouts
                      </Button>
                    )}
                    
                    <Link to={`/campaigns/${campaign.id}`}>
                      <Button variant="outline" className="border-gray-600 text-gray-400 hover:text-white">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};
