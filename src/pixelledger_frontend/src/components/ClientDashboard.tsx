import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { useBackendActor } from '../hooks/useBackendActor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, Clock, DollarSign, Send, Users, BarChart3, Plus, AlertTriangle } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Project } from 'declarations/pixelledger_backend/pixelledger_backend.did';

export const ClientDashboard: React.FC = () => {
  const { userAccount, isClient } = useRoleAuth();
  const { backendActor } = useBackendActor();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalApplicants: 0,
    pendingPayouts: 0,
    totalPaidOut: 0
  });

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    budget: ''
  });

  const [applicants, setApplicants] = useState<{ [key: string]: Principal[] }>({});
  const [approvedApplicants, setApprovedApplicants] = useState<{ [key: string]: Principal[] }>({});
  const [escrowBalances, setEscrowBalances] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (backendActor && userAccount && isClient()) {
      loadClientData();
    }
  }, [backendActor, userAccount]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!backendActor) return;

      // Get all projects for the client
      const myProjects = await backendActor.getMyClientProjects();
      setProjects(myProjects);

      // Calculate stats
      const activeProjects = myProjects.filter(p => !p.isCompleted);
      const completedProjects = myProjects.filter(p => p.isCompleted);
      
      let totalApplicants = 0;
      let totalPaidOut = 0;
      
      // Load detailed data for each project
      const newApplicants: { [key: string]: Principal[] } = {};
      const newApproved: { [key: string]: Principal[] } = {};
      const newEscrow: { [key: string]: number } = {};

      for (const project of myProjects) {
        try {
          // Get applicants
          const applicantResult = await backendActor.getProjectApplicants(project.id);
          if ('ok' in applicantResult) {
            newApplicants[project.id.toString()] = applicantResult.ok;
            totalApplicants += applicantResult.ok.length;
          }

          // Get approved applicants
          const approvedResult = await backendActor.getProjectApprovedApplicants(project.id);
          if ('ok' in approvedResult) {
            newApproved[project.id.toString()] = approvedResult.ok;
          }

          // Get escrow balance
          const escrowResult = await backendActor.getEscrowBalance(project.id);
          if ('ok' in escrowResult) {
            newEscrow[project.id.toString()] = Number(escrowResult.ok);
            if (project.isCompleted) {
              totalPaidOut += Number(escrowResult.ok);
            }
          }
        } catch (err) {
          toast.error(`Failed to load details for project ${project.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setError(`Failed to load details for project ${project.id}`);
        }
      }

      setApplicants(newApplicants);
      setApprovedApplicants(newApproved);
      setEscrowBalances(newEscrow);

      setStats({
        totalProjects: myProjects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        totalApplicants,
        pendingPayouts: Object.values(newEscrow).reduce((sum, balance) => sum + balance, 0),
        totalPaidOut
      });

    } catch (err) {
      toast.error('Failed to load client data: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!backendActor) {
      toast.error('Backend not connected');
      return;
    }

    try {
      const budget = parseInt(newProject.budget);
      if (isNaN(budget) || budget <= 0) {
        toast.error('Please enter a valid budget');
        return;
      }

      const result = await backendActor.createProject({
        title: newProject.title,
        description: newProject.description,
        budget: BigInt(budget)
      });

      if ('ok' in result) {
        toast.success('Project created successfully!');
        setNewProject({ title: '', description: '', budget: '' });
        setShowCreateForm(false);
        loadClientData(); // Reload data
      } else {
        toast.error(result.err);
      }
    } catch (err) {
      toast.error('Failed to create project' + (err instanceof Error ? `: ${err.message}` : ''));
    }
  };

  const handleApproveApplicant = async (projectId: number, applicant: Principal) => {
    if (!backendActor) return;

    try {
      const result = await backendActor.approveApplicant(BigInt(projectId), applicant);
      
      if ('ok' in result) {
        toast.success('Applicant approved successfully!');
        loadClientData(); // Reload to update approved list
      } else {
        toast.error(result.err);
      }
    } catch (err) {
      toast.error('Failed to approve applicant' +  (err instanceof Error ? `: ${err.message}` : ''));
    }
  };

  const handleDepositToEscrow = async (projectId: number, amount: number) => {
    if (!backendActor) return;

    try {
      const result = await backendActor.depositToEscrow(BigInt(projectId), BigInt(amount));
      
      if ('ok' in result) {
        toast.success('Funds deposited to escrow successfully!');
        loadClientData(); // Reload to update escrow balance
      } else {
        toast.error(result.err);
      }
    } catch (err) {
      toast.error('Failed to deposit to escrow' +  (err instanceof Error ? `: ${err.message}` : ''));
    }
  };

  const handleCompleteProject = async (projectId: number, creativeUser: Principal) => {
    if (!backendActor) return;

    try {
      const result = await backendActor.completeProject(BigInt(projectId), creativeUser);
      
      if ('ok' in result) {
        toast.success('Project completed successfully!');
        loadClientData(); // Reload data
      } else {
        toast.error(result.err);
      }
    } catch (err) {
      
      toast.error('Failed to complete project' + (err instanceof Error ? `: ${err.message}` : ''));
    }
  };

  const getProjectStatusBadge = (project: Project) => {
    if (project.isCompleted) {
      return <Badge className="bg-gradient-to-r from-green-500/20 to-green-400/20 text-green-400 border-green-500/30 font-medium">
        <CheckCircle className="mr-1 h-3 w-3" />
        Completed
      </Badge>;
    }
    
    const projectApplicants = applicants[project.id.toString()] || [];
    const projectApproved = approvedApplicants[project.id.toString()] || [];
    
    if (projectApproved.length > 0) {
      return <Badge className="bg-gradient-to-r from-cyber-teal/20 to-cyber-teal/10 text-cyber-teal border-cyber-teal/30 font-medium">
        <Clock className="mr-1 h-3 w-3" />
        In Progress
      </Badge>;
    } else if (projectApplicants.length > 0) {
      return <Badge className="bg-gradient-to-r from-yellow-500/20 to-yellow-400/20 text-yellow-400 border-yellow-500/30 font-medium">
        <Users className="mr-1 h-3 w-3" />
        Has Applicants
      </Badge>;
    } else {
      return <Badge className="bg-gradient-to-r from-gray-500/20 to-gray-400/20 text-gray-400 border-gray-500/30 font-medium">
        <AlertTriangle className="mr-1 h-3 w-3" />
        Open
      </Badge>;
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-teal"></div>
          <span className="text-gray-300 font-orbitron">Loading dashboard...</span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neuro-card p-6 border-l-4 border-red-500 bg-red-900/20 max-w-md"
        >
          <h3 className="text-red-400 font-orbitron font-bold mb-2">Dashboard Error</h3>
          <p className="text-red-300">Error loading dashboard: {error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-orbitron font-bold mb-2">
            <span className="cyber-text-gradient">Client</span> Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Manage your creative projects and find talented creatives</p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="cyber-button text-white font-semibold">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="neuro-card border-gray-800/50 bg-cyber-dark">
            <DialogHeader>
              <DialogTitle className="font-orbitron text-xl cyber-text-gradient">Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-cyber-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal text-white placeholder-gray-400"
                  placeholder="Enter project title..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-cyber-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal text-white placeholder-gray-400"
                  placeholder="Describe your project requirements..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Budget (ICP)
                </label>
                <input
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => setNewProject(prev => ({ ...prev, budget: e.target.value }))}
                  min="1"
                  className="w-full px-4 py-3 bg-cyber-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal text-white placeholder-gray-400"
                  placeholder="Enter budget amount..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button type="submit" className="cyber-button text-white font-semibold">
                  Create Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
      >
        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Projects</p>
                <p className="text-3xl font-bold cyber-text-gradient">{stats.totalProjects}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-cyber-teal/20 to-cyber-teal/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-cyber-teal" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Projects</p>
                <p className="text-3xl font-bold cyber-text-gradient">{stats.activeProjects}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Completed</p>
                <p className="text-3xl font-bold cyber-text-gradient">{stats.completedProjects}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Applicants</p>
                <p className="text-3xl font-bold cyber-text-gradient">{stats.totalApplicants}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-lg">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Pending Payments</p>
                <p className="text-3xl font-bold cyber-text-gradient">{stats.pendingPayouts}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-lg">
                <Send className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Paid</p>
                <p className="text-3xl font-bold cyber-text-gradient">{stats.totalPaidOut}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-cyber-pink/20 to-cyber-pink/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-cyber-pink" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Projects List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="neuro-card">
          <CardHeader>
            <CardTitle className="text-2xl font-orbitron cyber-text-gradient">Your Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyber-teal/20 to-cyber-pink/20 rounded-full flex items-center justify-center">
                    <Plus className="h-12 w-12 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-orbitron font-bold text-gray-300 mb-2">No Projects Yet</h3>
                    <p className="text-gray-500 mb-6">Start your creative journey by creating your first project</p>
                    <Button 
                      onClick={() => setShowCreateForm(true)}
                      className="cyber-button text-white font-semibold"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Project
                    </Button>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-6">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="neuro-card-mini hover:shadow-cyber-glow transition-all duration-300 group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-xl font-orbitron font-bold text-white group-hover:cyber-text-gradient transition-all duration-300">
                              {project.title}
                            </h3>
                            {getProjectStatusBadge(project)}
                          </div>
                          <p className="text-gray-400 mb-3 leading-relaxed">{project.description}</p>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-cyber-teal" />
                            <span className="text-sm text-gray-300">
                              Budget: <span className="font-semibold cyber-text-gradient">{Number(project.budget)} ICP</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-cyber-dark/30 rounded-lg border border-gray-800/50">
                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-lg mx-auto mb-2">
                            <Users className="h-6 w-6 text-blue-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-400">Applicants</p>
                          <p className="text-2xl font-bold cyber-text-gradient">{(applicants[project.id.toString()] || []).length}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-lg mx-auto mb-2">
                            <CheckCircle className="h-6 w-6 text-green-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-400">Approved</p>
                          <p className="text-2xl font-bold cyber-text-gradient">{(approvedApplicants[project.id.toString()] || []).length}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyber-pink/20 to-cyber-pink/10 rounded-lg mx-auto mb-2">
                            <DollarSign className="h-6 w-6 text-cyber-pink" />
                          </div>
                          <p className="text-sm font-medium text-gray-400">Escrow Balance</p>
                          <p className="text-2xl font-bold cyber-text-gradient">{escrowBalances[project.id.toString()] || 0} ICP</p>
                        </div>
                      </div>

                      {/* Project Actions */}
                      <div className="flex flex-wrap gap-3 mt-6">
                        {!project.isCompleted && (
                          <>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDepositToEscrow(Number(project.id), Number(project.budget))}
                                className="border-cyber-teal text-cyber-teal hover:bg-cyber-teal hover:text-cyber-black font-medium"
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Deposit to Escrow
                              </Button>
                            </motion.div>
                            {(approvedApplicants[project.id.toString()] || []).length > 0 && (
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCompleteProject(Number(project.id), approvedApplicants[project.id.toString()][0])}
                                  className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white font-medium"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Complete Project
                                </Button>
                              </motion.div>
                            )}
                          </>
                        )}
                        <Link to={`/projects/${project.id}`}>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700 font-medium">
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </motion.div>
                        </Link>
                      </div>

                      {/* Applicants List */}
                      {(applicants[project.id.toString()] || []).length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-800/50">
                          <h4 className="text-lg font-orbitron font-bold text-gray-300 mb-4 flex items-center">
                            <Users className="mr-2 h-5 w-5 text-cyber-teal" />
                            Project Applicants
                          </h4>
                          <div className="space-y-3">
                            {(applicants[project.id.toString()] || []).map((applicant, applicantIndex) => (
                              <motion.div 
                                key={applicant.toString()} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: applicantIndex * 0.1 }}
                                className="flex items-center justify-between bg-cyber-dark/50 p-4 rounded-lg border border-gray-800/30 hover:border-gray-700/50 transition-all duration-300"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-cyber-teal/20 to-cyber-pink/20 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-mono text-gray-300 bg-gray-800/50 px-3 py-1 rounded-md">
                                      {applicant.toString().slice(0, 20)}...
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {!(approvedApplicants[project.id.toString()] || []).find(a => a.toString() === applicant.toString()) ? (
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproveApplicant(Number(project.id), applicant)}
                                        className="cyber-button text-white font-medium"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                      </Button>
                                    </motion.div>
                                  ) : (
                                    <Badge className="bg-gradient-to-r from-green-500/20 to-green-400/20 text-green-400 border-green-500/30 font-medium">
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Approved
                                    </Badge>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
