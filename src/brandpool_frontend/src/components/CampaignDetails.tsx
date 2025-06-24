import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Users, Wallet, Copy, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Campaign } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { useBackendActor } from '../hooks/useBackendActor';
import { Principal } from '@dfinity/principal';

interface CampaignDetailsProps {
  campaigns: Campaign[];
  onDataUpdate: () => void;
}

const CampaignDetails = ({ campaigns, onDataUpdate }: CampaignDetailsProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userAccount, isBrand, isInfluencer } = useRoleAuth();
  const { backendActor } = useBackendActor();
  
  const [applicationText, setApplicationText] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);

  // Find the campaign by ID
  const campaign = campaigns.find(c => c.id.toString() === id);

  useEffect(() => {
    if (!campaign && campaigns.length > 0) {
      navigate('/campaigns');
    }
  }, [campaign, campaigns, navigate]);

  if (!campaign) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-orbitron font-bold mb-2 text-gray-300">
            Campaign not found
          </h3>
          <p className="text-gray-400 mb-6">The campaign you're looking for doesn't exist.</p>
          <Link to="/campaigns">
            <Button className="cyber-button text-cyber-black font-medium">
              Back to Campaigns
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleApplication = async () => {
    if (!isInfluencer() || !backendActor || !userAccount) {
      setError('Only influencers can apply to campaigns');
      return;
    }

    if (!applicationText.trim()) {
      setError('Please provide your application details');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const result = await backendActor.applyToCampaign(campaign.id);
      if ('ok' in result) {
        setShowApplicationDialog(false);
        setApplicationText('');
        setPortfolioLink('');
        onDataUpdate();
      } else {
        setError('Error applying to campaign: ' + result.err);
      }
    } catch (error) {
      console.error('Error applying to campaign:', error);
      setError('Failed to apply to campaign');
    } finally {
      setIsApplying(false);
    }
  };

  const handleSelectInfluencer = async (applicantPrincipal: Principal) => {
    if (!isBrand() || !backendActor) return;

    setLoading(true);
    try {
      // This would be a backend method to select an influencer for the campaign
      // For now, we'll just show a success message
      console.log('Selecting influencer:', applicantPrincipal.toString());
      // await backendActor.selectInfluencer(campaign.id, applicantPrincipal);
      onDataUpdate();
    } catch (error) {
      console.error('Error selecting influencer:', error);
      setError('Failed to select influencer');
    } finally {
      setLoading(false);
    }
  };

  const copyPrincipalId = () => {
    navigator.clipboard.writeText(campaign.id.toString());
  };

  const copyUserPrincipal = (principal: Principal) => {
    navigator.clipboard.writeText(principal.toString());
  };

  const statusColors = {
    'Open': 'bg-cyber-teal text-cyber-black',
    'Completed': 'bg-gray-600 text-white',
    'In Progress': 'bg-cyber-pink text-white'
  };

  const status = campaign.isCompleted ? 'Completed' : 'Open';
  const isOwner = userAccount && campaign.owner.toString() === userAccount.principal.toString();
  const isAlreadyApplied = userAccount && campaign.applicants.some(
    applicant => applicant.toString() === userAccount.principal.toString()
  );

  return (
    <div className="min-h-screen bg-cyber-black">
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link 
            to="/campaigns" 
            className="inline-flex items-center text-cyber-teal hover:text-cyber-pink transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Link>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="neuro-card p-4 mb-6 border-l-4 border-red-500 bg-red-900/20"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="neuro-card">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <Badge className={`${statusColors[status]} mb-2`}>
                        {status}
                      </Badge>
                      <CardTitle className="text-3xl font-orbitron font-bold mb-2">
                        {campaign.title}
                      </CardTitle>
                      <CardDescription className="text-cyber-teal text-lg font-medium">
                        Owner: {campaign.owner.toString().slice(0, 8)}...{campaign.owner.toString().slice(-8)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold cyber-text-gradient mb-1">
                        {campaign.payout.toString()}
                      </div>
                      <div className="text-sm text-gray-400">tokens</div>
                      <div className="text-sm text-gray-400">{campaign.applicants.length} applicants</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-xl font-orbitron font-bold mb-3">Campaign Description</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {campaign.description}
                    </p>
                  </div>

                  {/* Brand Management: Applicants List */}
                  {isBrand() && isOwner && campaign.applicants.length > 0 && (
                    <div>
                      <h3 className="text-xl font-orbitron font-bold mb-3 text-cyber-teal">
                        Campaign Applicants ({campaign.applicants.length})
                      </h3>
                      <div className="space-y-3">
                        {campaign.applicants.map((applicant, index) => (
                          <motion.div
                            key={applicant.toString()}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="neuro-card p-4 bg-cyber-gray/30"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-cyber-teal to-cyber-pink rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">
                                    {index + 1}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-white">
                                    Applicant #{index + 1}
                                  </p>
                                  <p className="text-sm text-gray-400 font-mono">
                                    {applicant.toString().slice(0, 12)}...{applicant.toString().slice(-8)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyUserPrincipal(applicant)}
                                  className="border-gray-600 text-gray-300 hover:border-cyber-teal hover:text-cyber-teal"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSelectInfluencer(applicant)}
                                  disabled={loading || campaign.isCompleted}
                                  className="cyber-button text-cyber-black font-medium"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Select
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No applicants message for brands */}
                  {isBrand() && isOwner && campaign.applicants.length === 0 && (
                    <div className="neuro-card p-8 text-center bg-gray-800/30">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                      <h4 className="text-lg font-orbitron font-bold mb-2 text-gray-300">
                        No Applications Yet
                      </h4>
                      <p className="text-gray-400">
                        Your campaign is live! Influencers will start applying soon.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="neuro-card">
                <CardHeader>
                  <CardTitle className="font-orbitron">Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-gray-300">
                    <Calendar className="w-5 h-5 mr-3 text-cyber-teal" />
                    <div>
                      <div className="font-medium">Campaign ID</div>
                      <div className="text-sm text-gray-400">{campaign.id.toString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-300">
                    <Users className="w-5 h-5 mr-3 text-cyber-pink" />
                    <div>
                      <div className="font-medium">Applicants</div>
                      <div className="text-sm text-gray-400">{campaign.applicants.length} applied</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-300">
                    <Wallet className="w-5 h-5 mr-3 text-purple-400" />
                    <div>
                      <div className="font-medium">Payout</div>
                      <div className="text-sm text-gray-400">{campaign.payout.toString()} tokens</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400 mb-2">Campaign Owner</div>
                    <div className="flex items-center justify-between p-2 bg-cyber-gray rounded text-xs font-mono">
                      <span>{campaign.owner.toString().slice(0, 20)}...</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyUserPrincipal(campaign.owner)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              {/* Influencer: Apply Button */}
              {isInfluencer() && !campaign.isCompleted && !isAlreadyApplied && (
                <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full cyber-button text-lg py-6 font-medium">
                      Apply to Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="neuro-card border-gray-700 text-white max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-orbitron text-xl">
                        Apply to {campaign.title}
                      </DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Submit your application for this campaign
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="pitch" className="text-white">Application Message</Label>
                        <Textarea
                          id="pitch"
                          placeholder="Why are you perfect for this campaign? Share your experience and vision..."
                          value={applicationText}
                          onChange={(e) => setApplicationText(e.target.value)}
                          className="mt-1 bg-cyber-gray border-gray-600 text-white min-h-[120px]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="portfolio" className="text-white">Portfolio Link (Optional)</Label>
                        <Input
                          id="portfolio"
                          placeholder="https://your-portfolio.com"
                          value={portfolioLink}
                          onChange={(e) => setPortfolioLink(e.target.value)}
                          className="mt-1 bg-cyber-gray border-gray-600 text-white"
                        />
                      </div>

                      {error && (
                        <div className="text-red-400 text-sm">{error}</div>
                      )}
                      
                      <Button 
                        onClick={handleApplication}
                        disabled={isApplying}
                        className="w-full cyber-button py-3"
                      >
                        {isApplying ? 'Submitting...' : 'Submit Application'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Influencer: Already Applied */}
              {isInfluencer() && isAlreadyApplied && (
                <div className="w-full px-6 py-6 text-center text-green-400 bg-green-900/20 rounded-lg border border-green-400/30">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-medium">Application Submitted</div>
                  <div className="text-sm text-gray-400">You've applied to this campaign</div>
                </div>
              )}

              {/* Campaign Completed */}
              {campaign.isCompleted && (
                <div className="w-full px-6 py-6 text-center text-gray-400 bg-gray-800/30 rounded-lg border border-gray-600/30">
                  <XCircle className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-medium">Campaign Completed</div>
                  <div className="text-sm">This campaign is no longer active</div>
                </div>
              )}

              {/* Brand: Manage Campaign */}
              {isBrand() && isOwner && !campaign.isCompleted && (
                <Button className="w-full border border-cyber-teal text-cyber-teal hover:bg-cyber-teal hover:text-cyber-black transition-colors py-6">
                  Manage Campaign
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;
