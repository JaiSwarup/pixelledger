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
import { Principal } from '@dfinity/principal';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const ClientDashboard: React.FC = () => {
  const { userAccount, isClient } = useRoleAuth();
  const { backendActor } = useBackendActor();
  const [projects, setProjects] = useState<any[]>([]);
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
          console.warn(`Failed to load details for project ${project.id}:`, err);
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
      console.error('Error loading client data:', err);
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
      console.error('Error creating project:', err);
      toast.error('Failed to create project');
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
      console.error('Error approving applicant:', err);
      toast.error('Failed to approve applicant');
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
      console.error('Error depositing to escrow:', err);
      toast.error('Failed to deposit to escrow');
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
      console.error('Error completing project:', err);
      toast.error('Failed to complete project');
    }
  };

  const getProjectStatusBadge = (project: any) => {
    if (project.isCompleted) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    }
    
    const projectApplicants = applicants[project.id.toString()] || [];
    const projectApproved = approvedApplicants[project.id.toString()] || [];
    
    if (projectApproved.length > 0) {
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
    } else if (projectApplicants.length > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">Has Applicants</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Open</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="text-gray-600">Manage your creative projects and find talented creatives</p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget (ICP)
                </label>
                <input
                  type="number"
                  value={newProject.budget}
                  onChange={(e) => setNewProject(prev => ({ ...prev, budget: e.target.value }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedProjects}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applicants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplicants}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingPayouts}</p>
              </div>
              <Send className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPaidOut}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't created any projects yet</p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{project.title}</h3>
                        {getProjectStatusBadge(project)}
                      </div>
                      <p className="text-gray-600 mb-2">{project.description}</p>
                      <p className="text-sm text-gray-500">
                        Budget: <span className="font-medium">{Number(project.budget)} ICP</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Applicants</p>
                      <p className="text-lg font-semibold">{(applicants[project.id.toString()] || []).length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Approved</p>
                      <p className="text-lg font-semibold">{(approvedApplicants[project.id.toString()] || []).length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Escrow Balance</p>
                      <p className="text-lg font-semibold">{escrowBalances[project.id.toString()] || 0} ICP</p>
                    </div>
                  </div>

                  {/* Project Actions */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {!project.isCompleted && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDepositToEscrow(project.id, Number(project.budget))}
                        >
                          Deposit to Escrow
                        </Button>
                        {(approvedApplicants[project.id.toString()] || []).length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteProject(project.id, approvedApplicants[project.id.toString()][0])}
                          >
                            Complete Project
                          </Button>
                        )}
                      </>
                    )}
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>

                  {/* Applicants List */}
                  {(applicants[project.id.toString()] || []).length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Applicants</h4>
                      <div className="space-y-2">
                        {(applicants[project.id.toString()] || []).map((applicant) => (
                          <div key={applicant.toString()} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm font-mono">{applicant.toString().slice(0, 20)}...</span>
                            {!(approvedApplicants[project.id.toString()] || []).find(a => a.toString() === applicant.toString()) && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveApplicant(project.id, applicant)}
                              >
                                Approve
                              </Button>
                            )}
                            {(approvedApplicants[project.id.toString()] || []).find(a => a.toString() === applicant.toString()) && (
                              <Badge className="bg-green-100 text-green-800">Approved</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
