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
import { Project } from '../../../declarations/pixelledger_backend/pixelledger_backend.did';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { useBackendActor } from '../hooks/useBackendActor';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

interface ProjectDetailsProps {
  projects: Project[];
  onDataUpdate: () => void;
}

const ProjectDetails = ({ projects, onDataUpdate }: ProjectDetailsProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userAccount, isClient, isCreative } = useRoleAuth();
  const { backendActor } = useBackendActor();
  
  const [applicationText, setApplicationText] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [approvedApplicants, setApprovedApplicants] = useState<Principal[]>([]);
  const [isCurrentUserApproved, setIsCurrentUserApproved] = useState(false);

  // Find the project by ID
  const project = projects.find(p => p.id.toString() === id);

  useEffect(() => {
    if (!project && projects.length > 0) {
      navigate('/projects');
    }
  }, [project, projects, navigate]);

  // Fetch approved applicants when project changes
  useEffect(() => {
    const fetchApprovedApplicants = async () => {
      if (project && backendActor) {
        try {
          // For project owners, get the full list of approved applicants
          const isOwner = userAccount && project.owner.toString() === userAccount.principal.toString();
          
          if (isClient() && isOwner) {
            const result = await backendActor.getProjectApprovedApplicants(project.id);
            if ('ok' in result) {
              setApprovedApplicants(result.ok);
            }
          }
          
          // For all users (including creatives), check if current user is approved
          if (userAccount) {
            const approvalResult = await backendActor.isApplicantApproved(project.id, userAccount.principal);
            if ('ok' in approvalResult) {
              setIsCurrentUserApproved(approvalResult.ok);
            }
          }
        } catch (error) {
          // Don't show error toast for approval check, just log it
          console.error('Error fetching approved applicants:', error);
        }
      }
    };

    fetchApprovedApplicants();
  }, [project, backendActor, userAccount]);

  if (!project) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-orbitron font-bold mb-2 text-gray-300">
            Project not found
          </h3>
          <p className="text-gray-400 mb-6">The project you&apos;re looking for doesn&apos;t exist.</p>
          <Link to="/projects">
            <Button className="cyber-button text-cyber-black font-medium">
              Back to Projects
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleApplication = async () => {
    if (!isCreative() || !backendActor || !userAccount) {
      setError('Only creatives can apply to projects');
      return;
    }

    if (!applicationText.trim()) {
      setError('Please provide your application details');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const result = await backendActor.applyToProject(project.id);
      if ('ok' in result) {
        setShowApplicationDialog(false);
        setApplicationText('');
        setPortfolioLink('');
        onDataUpdate();
      } else {
        setError('Error applying to project: ' + result.err);
      }
    } catch (error) {
      toast.error('Error applying to project: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsApplying(false);
    }
  };

  const handleSelectCreative = async (applicantPrincipal: Principal) => {
    if (!isClient() || !backendActor) return;

    setLoading(true);
    try {
      // Use the correct backend method name: approveApplicant
      const result = await backendActor.approveApplicant(project.id, applicantPrincipal);
      if ('ok' in result) {
        // Success - the creative has been approved
        toast.success('Creative approved successfully!');
        // Add to approved applicants list locally for immediate UI update
        setApprovedApplicants(prev => [...prev, applicantPrincipal]);
        
        // Update current user approved status if they were the one approved
        if (userAccount && applicantPrincipal.toString() === userAccount.principal.toString()) {
          setIsCurrentUserApproved(true);
        }
        
        onDataUpdate(); // Refresh the project data
      } else {
        // Error occurred
        setError('Failed to approve creative: ' + result.err);
      }
    } catch (error) {
      toast.error('Error approving creative: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const copyPrincipalId = () => {
    navigator.clipboard.writeText(project.id.toString());
    toast.success('Project ID copied to clipboard!');
  };

  const copyUserPrincipal = (principal: Principal) => {
    navigator.clipboard.writeText(principal.toString());
  };

  const statusColors = {
    'Open': 'bg-cyber-teal text-cyber-black',
    'Completed': 'bg-gray-600 text-white',
    'In Progress': 'bg-cyber-pink text-white'
  };

  const status = project.isCompleted ? 'Completed' : 'Open';
  const isOwner = userAccount && project.owner.toString() === userAccount.principal.toString();
  const isAlreadyApplied = userAccount && project.applicants.some(
    applicant => applicant.toString() === userAccount.principal.toString()
  );

  // Filter applicants to show pending (not yet approved) and approved separately
  const pendingApplicants = project.applicants.filter(applicant => 
    !approvedApplicants.some(approved => approved.toString() === applicant.toString())
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
            to="/projects" 
            className="inline-flex items-center text-cyber-teal hover:text-cyber-pink transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
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
                        {project.title}
                      </CardTitle>
                      <CardDescription className="text-cyber-teal text-lg font-medium">
                        <Link 
                          to={`/users/${project.owner.toString()}`}
                          className="hover:text-cyber-pink transition-colors"
                        >
                          Client: {project.owner.toString().slice(0, 8)}...{project.owner.toString().slice(-8)}
                        </Link>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold cyber-text-gradient mb-1">
                        {project.budget.toString()}
                      </div>
                      <div className="text-sm text-gray-400">tokens</div>
                      <div className="text-sm text-gray-400">{project.applicants.length} applicants</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-xl font-orbitron font-bold mb-3">Project Description</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {isClient() && isOwner && (pendingApplicants.length > 0 || approvedApplicants.length > 0) && (
                    <div className="space-y-6">
                      {/* Approved Applicants */}
                      {approvedApplicants.length > 0 && (
                        <div>
                          <h3 className="text-xl font-orbitron font-bold mb-3 text-green-400">
                            Approved Creatives ({approvedApplicants.length})
                          </h3>
                          <div className="space-y-3">
                            {approvedApplicants.map((applicant, index) => (
                              <motion.div
                                key={applicant.toString()}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="neuro-card p-4 bg-green-900/20 border border-green-400/30"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                      <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <Link 
                                        to={`/users/${applicant.toString()}`}
                                        className="font-medium text-white hover:text-green-300 transition-colors"
                                      >
                                        Approved Creative #{index + 1}
                                      </Link>
                                      <p className="text-sm text-gray-400 font-mono">
                                        {applicant.toString().slice(0, 12)}...{applicant.toString().slice(-8)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Link to={`/users/${applicant.toString()}`}>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-green-400/50 text-green-400 hover:border-green-400 hover:text-green-300"
                                      >
                                        View Profile
                                      </Button>
                                    </Link>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => copyUserPrincipal(applicant)}
                                      className="border-green-400/50 text-green-400 hover:border-green-400 hover:text-green-300"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                    <Badge className="bg-green-500 text-white">
                                      Approved
                                    </Badge>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pending Applicants */}
                      {pendingApplicants.length > 0 && (
                        <div>
                          <h3 className="text-xl font-orbitron font-bold mb-3 text-cyber-teal">
                            Pending Applications ({pendingApplicants.length})
                          </h3>
                          <div className="space-y-3">
                            {pendingApplicants.map((applicant, index) => (
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
                                      <Link 
                                        to={`/users/${applicant.toString()}`}
                                        className="font-medium text-white hover:text-cyber-teal transition-colors"
                                      >
                                        Applicant #{index + 1}
                                      </Link>
                                      <p className="text-sm text-gray-400 font-mono">
                                        {applicant.toString().slice(0, 12)}...{applicant.toString().slice(-8)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Link to={`/users/${applicant.toString()}`}>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-gray-600 text-gray-300 hover:border-cyber-teal hover:text-cyber-teal"
                                      >
                                        View Profile
                                      </Button>
                                    </Link>
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
                                      onClick={() => handleSelectCreative(applicant)}
                                      disabled={loading || project.isCompleted}
                                      className="cyber-button text-cyber-black font-medium"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isClient() && isOwner && project.applicants.length === 0 && (
                    <div className="neuro-card p-8 text-center bg-gray-800/30">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                      <h4 className="text-lg font-orbitron font-bold mb-2 text-gray-300">
                        No Applications Yet
                      </h4>
                      <p className="text-gray-400">
                        Your project is live! Creatives will start applying soon.
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
                  <CardTitle className="font-orbitron">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-gray-300">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-3 text-cyber-teal" />
                      <div>
                        <div className="font-medium">Project ID</div>
                        <div className="text-sm text-gray-400">{project.id.toString()}</div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={copyPrincipalId}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center text-gray-300">
                    <Users className="w-5 h-5 mr-3 text-cyber-pink" />
                    <div>
                      <div className="font-medium">Applicants</div>
                      <div className="text-sm text-gray-400">{project.applicants.length} applied</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-300">
                    <Wallet className="w-5 h-5 mr-3 text-purple-400" />
                    <div>
                      <div className="font-medium">Payout</div>
                      <div className="text-sm text-gray-400">{project.budget.toString()} tokens</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400 mb-2">Project Owner</div>
                    <div className="flex items-center justify-between p-2 bg-cyber-gray rounded text-xs font-mono">
                      <span>{project.owner.toString().slice(0, 20)}...</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyUserPrincipal(project.owner)}
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
              {isCreative() && !project.isCompleted && !isAlreadyApplied && (
                <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full cyber-button text-lg py-6 font-medium">
                      Apply to Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="neuro-card border-gray-700 text-white max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-orbitron text-xl">
                        Apply to {project.title}
                      </DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Submit your application for this project
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="pitch" className="text-white">Application Message</Label>
                        <Textarea
                          id="pitch"
                          placeholder="Why are you perfect for this project? Share your experience and vision..."
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

              {/* Creative: Already Applied but not approved */}
              {isCreative() && isAlreadyApplied && !isCurrentUserApproved && (
                <div className="w-full px-6 py-6 text-center text-yellow-400 bg-yellow-900/20 rounded-lg border border-yellow-400/30">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full border-2 border-yellow-400 flex items-center justify-center">
                    <span className="text-yellow-400">⏳</span>
                  </div>
                  <div className="font-medium">Application Submitted</div>
                  <div className="text-sm text-gray-400">Waiting for client approval</div>
                </div>
              )}

              {/* Creative: Approved */}
              {isCreative() && isCurrentUserApproved && (
                <div className="w-full px-6 py-6 text-center text-green-400 bg-green-900/20 rounded-lg border border-green-400/30">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-medium">Application Approved! ✨</div>
                  <div className="text-sm text-gray-400">You&apos;ve been selected for this project</div>
                </div>
              )}

              {/* Project Completed */}
              {project.isCompleted && (
                <div className="w-full px-6 py-6 text-center text-gray-400 bg-gray-800/30 rounded-lg border border-gray-600/30">
                  <XCircle className="w-8 h-8 mx-auto mb-2" />
                  <div className="font-medium">Project Completed</div>
                  <div className="text-sm">This project is no longer active</div>
                </div>
              )}

              {isClient() && isOwner && !project.isCompleted && (
                <Button className="w-full border border-cyber-teal text-cyber-teal hover:bg-cyber-teal hover:text-cyber-black transition-colors py-6">
                  Manage Project
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
