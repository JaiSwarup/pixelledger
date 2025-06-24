import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRoleAuth, ErrorDisplay } from '../hooks/useRoleAuth';
import { useBackendActor } from '../hooks/useBackendActor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, DollarSign, Send, Users, BarChart3, TrendingUp, Star, Search, Trophy } from 'lucide-react';
import type { Campaign } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { Link } from 'react-router-dom';

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
      <div className="min-h-screen bg-cyber-black flex items-center justify-center py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-3"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-pink"></div>
          <span className="text-gray-300 font-orbitron">Loading dashboard...</span>
        </motion.div>
      </div>
    );
  }

  // Filter available campaigns to exclude those already applied to
  const appliedCampaignIds = new Set(appliedCampaigns.map(c => c.id.toString()));
  const filteredAvailableCampaigns = availableCampaigns.filter(c => !appliedCampaignIds.has(c.id.toString()));

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
          <span className="cyber-text-gradient">Influencer</span> Dashboard
        </h1>
        <p className="text-gray-300 text-lg">
          Discover campaigns and track your applications
        </p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-cyber-pink">
              <Send className="w-5 h-5" />
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyber-pink">{stats.totalApplications}</div>
            <p className="text-gray-400 text-sm">All time</p>
          </CardContent>
        </Card>

        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <Clock className="w-5 h-5" />
              Active Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-400">{stats.activeApplications}</div>
            <p className="text-gray-400 text-sm">Pending review</p>
          </CardContent>
        </Card>

        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-400">
              <Trophy className="w-5 h-5" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{stats.completedCampaigns}</div>
            <p className="text-gray-400 text-sm">Successfully finished</p>
          </CardContent>
        </Card>

        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-cyber-teal">
              <DollarSign className="w-5 h-5" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold cyber-text-gradient">{stats.totalEarnings}</div>
            <p className="text-gray-400 text-sm">Tokens earned</p>
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
              <Link to="/explore-campaigns">
                <Button className="cyber-button">
                  <Search className="w-4 h-4 mr-2" />
                  Browse Campaigns
                </Button>
              </Link>
              
              <Link to="/campaigns">
                <Button 
                  variant="outline" 
                  className="border-cyber-pink text-cyber-pink hover:bg-cyber-pink hover:text-white"
                >
                  <Star className="w-4 h-4 mr-2" />
                  My Applications
                </Button>
              </Link>
              
              <Link to="/profile">
                <Button 
                  variant="outline" 
                  className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Campaigns Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="neuro-card">
          <CardHeader>
            <CardTitle className="text-xl font-orbitron">Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="available" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-cyber-gray/50">
                <TabsTrigger 
                  value="available" 
                  className="data-[state=active]:bg-cyber-teal data-[state=active]:text-cyber-black font-orbitron"
                >
                  Available ({filteredAvailableCampaigns.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="applied" 
                  className="data-[state=active]:bg-cyber-pink data-[state=active]:text-white font-orbitron"
                >
                  Applied ({appliedCampaigns.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="available" className="space-y-4 mt-6">
                {filteredAvailableCampaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-orbitron font-bold mb-2 text-gray-300">
                      No campaigns available
                    </h3>
                    <p className="text-gray-400 mb-6">Check back later for new opportunities.</p>
                    <Link to="/explore-campaigns">
                      <Button className="cyber-button">
                        <Search className="w-4 h-4 mr-2" />
                        Explore More
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAvailableCampaigns.slice(0, 5).map((campaign, index) => (
                      <motion.div
                        key={campaign.id.toString()}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="group"
                      >
                        <Card className="neuro-card-mini hover:shadow-cyber-glow transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-orbitron font-bold text-white group-hover:cyber-text-gradient transition-all duration-300">
                                  {campaign.title}
                                </h4>
                                <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                                  {campaign.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-cyber-teal font-medium">
                                    {campaign.payout.toString()} tokens
                                  </span>
                                  <span className="text-gray-400">
                                    {campaign.applicants.length} applicants
                                  </span>
                                  <Badge className="bg-green-500 text-white">
                                    Available
                                  </Badge>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                className="cyber-button"
                                onClick={() => handleApplyToCampaign(campaign.id)}
                              >
                                Apply
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="applied" className="space-y-4 mt-6">
                {appliedCampaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-orbitron font-bold mb-2 text-gray-300">
                      No applications yet
                    </h3>
                    <p className="text-gray-400 mb-6">Start applying to campaigns to see them here.</p>
                    <Link to="/explore-campaigns">
                      <Button className="cyber-button">
                        <Search className="w-4 h-4 mr-2" />
                        Browse Campaigns
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appliedCampaigns.map((campaign, index) => (
                      <motion.div
                        key={campaign.id.toString()}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="group"
                      >
                        <Card className="neuro-card-mini hover:shadow-cyber-glow transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-orbitron font-bold text-white group-hover:cyber-text-gradient transition-all duration-300">
                                  {campaign.title}
                                </h4>
                                <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                                  {campaign.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-cyber-teal font-medium">
                                    {campaign.payout.toString()} tokens
                                  </span>
                                  <span className="text-gray-400">
                                    {campaign.applicants.length} applicants
                                  </span>
                                  <Badge className={campaign.isCompleted ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}>
                                    {campaign.isCompleted ? 'Completed' : 'Pending'}
                                  </Badge>
                                </div>
                              </div>
                              <Link to={`/campaigns/${campaign.id}`}>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
                                >
                                  View
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
