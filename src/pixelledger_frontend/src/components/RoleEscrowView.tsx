import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Project } from '../../../declarations/pixelledger_backend/pixelledger_backend.did';
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
import { EscrowDemo } from './EscrowDemo';
import { pixelledger_backend } from 'declarations/pixelledger_backend';
import { toast } from 'sonner';

interface RoleEscrowViewProps {
  projects: Project[];
  userPrincipal: Principal | null;
  userBalance: bigint;
  onBalanceUpdate: (principal: Principal) => void;
  backendActor: typeof pixelledger_backend;
}

export function RoleEscrowView({ projects, userPrincipal, userBalance, onBalanceUpdate, backendActor }: RoleEscrowViewProps) {
  const { isClient, isCreative } = useRoleAuth();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [escrowBalances, setEscrowBalances] = useState<{[key: string]: bigint}>({});
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [appliedProjects, setAppliedProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalEscrowed: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    totalEarnings: 0,
    selectedProjects: 0,
    completedProjects: 0
  });

  // Mock transaction history for demonstration
  const [transactions, setTransactions] = useState([
    { id: '1', type: 'Deposit', amount: '5,000', date: '2024-06-01', status: 'Confirmed', txHash: '0x1234...5678' },
    { id: '2', type: 'Payout', amount: '1,250', date: '2024-06-15', status: 'Processing', txHash: '0x5678...9012' },
    { id: '3', type: 'Deposit', amount: '12,500', date: '2024-06-20', status: 'Confirmed', txHash: '0x9012...3456' },
  ]);
  const [testAmount, setTestAmount] = useState('10000');

  // Filter projects based on user role
  useEffect(() => {
    if (userPrincipal && projects.length > 0) {
      if (isClient()) {
        const ownedProjects = projects.filter(
          project => project.owner.toString() === userPrincipal.toString()
        );
        setUserProjects(ownedProjects);
        loadEscrowBalances(ownedProjects);
        updateClientStats(ownedProjects);
      } else if (isCreative()) {
        const appliedtoProjects = projects.filter(project =>
          project.applicants.some(applicant => 
            applicant.toString() === userPrincipal.toString()
          )
        );
        setAppliedProjects(appliedtoProjects);
        updateCreativeStats(appliedtoProjects);
      }
    }
  }, [projects, userPrincipal, isClient, isCreative]);

  const updateClientStats = (projectsList: Project[]) => {
    const totalEscrowed = projectsList.reduce((sum, c) => sum + Number(c.budget), 0);
    const completedProjects = projectsList.filter(c => c.isCompleted).length;
    const pendingPayouts = projectsList.filter(c => !c.isCompleted).reduce((sum, c) => sum + Number(c.budget), 0);
    const completedPayouts = projectsList.filter(c => c.isCompleted).reduce((sum, c) => sum + Number(c.budget), 0);

    setStats({
      totalEscrowed,
      pendingPayouts,
      completedPayouts,
      totalEarnings: 0,
      selectedProjects: 0,
      completedProjects
    });
  };

  const updateCreativeStats = (projectsList: Project[]) => {
    const selectedProjects = projectsList.filter(c => 
      c.selectedCreative?.toString() === userPrincipal?.toString()
    ).length;
    const completedProjects = projectsList.filter(c => 
      c.isCompleted && c.selectedCreative?.toString() === userPrincipal?.toString()
    ).length;
    const totalEarnings = projectsList.filter(c => 
      c.isCompleted && c.selectedCreative?.toString() === userPrincipal?.toString()
    ).reduce((sum, c) => sum + Number(c.budget), 0);

    setStats({
      totalEscrowed: 0,
      pendingPayouts: 0,
      completedPayouts: 0,
      totalEarnings,
      selectedProjects,
      completedProjects
    });
  };

  const loadEscrowBalances = async (ProjectsToCheck: Project[]) => {
    if (!backendActor) return;
    
    const balances: {[key: string]: bigint} = {};
    for (const project of ProjectsToCheck) {
      try {
        const result = await backendActor.getEscrowBalance(project.id);
        if ('ok' in result) {
          balances[project.id.toString()] = result.ok;
        } else {
          toast.error(`Error loading escrow balance for project ${project.id}:`);
          balances[project.id.toString()] = BigInt(0);
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error(`Error loading escrow balance for project ${project.id}: ${error.message}`);
        } else 
          toast.error(`Error loading escrow balance for project ${project.id}:`);
        balances[project.id.toString()] = BigInt(0);
      }
    }
    setEscrowBalances(balances);
  };

  const handleDepositToEscrow = async () => {
    if (!userPrincipal || !selectedProject) return;

    if (!isClient()) {
      toast.error('Only clients can deposit funds to escrow');
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
        BigInt(selectedProject), 
        BigInt(Math.floor(amount))
      );
      if ('ok' in result) {
        toast.success('Successfully deposited to escrow!');
        addTransaction('Deposit', amount.toString());
        setDepositAmount('');
        setSelectedProject('');
        onBalanceUpdate(userPrincipal);
        loadEscrowBalances(userProjects);
      } else {
        toast.error('Error depositing to escrow: ' + result.err);
      }
    } catch (error) {
      toast.error('Error depositing to escrow: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseFunds = async (projectId: bigint, creativePrincipal: Principal) => {
    if (!userPrincipal || !isClient()) return;

    setIsLoading(true);
    try {
      // Get the current escrow balance before releasing
      const balanceResult = await backendActor.getEscrowBalance(projectId);
      const escrowAmount = 'ok' in balanceResult ? balanceResult.ok.toString() : '0';
      
      const result = await backendActor.releaseFunds(projectId, creativePrincipal);
      if ('ok' in result) {
        toast.success('Funds released successfully!');
        addTransaction('Payout', escrowAmount);
        loadEscrowBalances(userProjects);
      } else {
        toast.error('Error releasing funds: ' + result.err);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Error releasing funds: ' + error.message);
      } else {
        toast.error('Error releasing funds');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawEscrow = async (projectId: bigint) => {
    if (!userPrincipal || !isClient()) return;

    setIsLoading(true);
    try {
      // Get the current escrow balance before withdrawing
      const balanceResult = await backendActor.getEscrowBalance(projectId);
      const escrowAmount = 'ok' in balanceResult ? balanceResult.ok.toString() : '0';
      
      const result = await backendActor.withdrawEscrow(projectId);
      if ('ok' in result) {
        toast.success('Funds withdrawn from escrow successfully!');
        addTransaction('Withdrawal', escrowAmount);
        onBalanceUpdate(userPrincipal);
        loadEscrowBalances(userProjects);
      } else {
        toast.error('Error withdrawing from escrow: ' + result.err);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Error withdrawing from escrow: ' + error.message);
      } else {
        toast.error('Error withdrawing from escrow');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTestBalance = async () => {
    if (!userPrincipal) return;

    const amount = parseFloat(testAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    setIsLoading(true);
    try {
      const result = await backendActor.addUserBalance(userPrincipal, BigInt(Math.floor(amount)));
      if ('ok' in result) {
        toast.success(`Successfully added ${amount} tokens to your balance!`);
        onBalanceUpdate(userPrincipal);
        setTestAmount('10000'); // Reset to default
      } else {
        toast.error('Error adding balance: ' + result.err);
      }
    } catch (error) {
      toast.error('Error adding test balance: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = (type: 'Deposit' | 'Payout' | 'Withdrawal', amount: string, status: 'Confirmed' | 'Processing' = 'Confirmed') => {
    const newTransaction = {
      id: Date.now().toString(),
      type,
      amount,
      date: new Date().toISOString().split('T')[0],
      status,
      txHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Funded': return <CheckCircle className="w-4 h-4 text-cyber-teal" />;
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getEscrowBalance = (projectId: bigint) => {
    return escrowBalances[projectId.toString()] || BigInt(0);
  };

  const getProjectStatus = (project: Project) => {
    if (project.isCompleted) return 'Completed';
    const balance = getEscrowBalance(project.id);
    if (balance > 0) return 'Funded';
    return 'Pending';
  };

  const getProjectProgress = (project: Project) => {
    if (project.isCompleted) return 100;
    const balance = Number(getEscrowBalance(project.id));
    const required = Number(project.budget);
    return required > 0 ? Math.min((balance / required) * 100, 100) : 0;
  };

  if (isClient()) {
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
              Monitor and manage blockchain escrow for all projects
            </p>
          </motion.div>

          {/* Demo Setup */}
          <EscrowDemo />

          {/* How It Works Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="neuro-card border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-xl font-orbitron flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  How Escrow Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span className="font-medium text-blue-400">Deposit Funds</span>
                    </div>
                    <p className="text-gray-300">Add tokens to your balance, then deposit them into project escrow for security.</p>
                  </div>
                  <div className="bg-cyber-teal/10 border border-cyber-teal/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-cyber-teal text-black rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span className="font-medium text-cyber-teal">Work Completion</span>
                    </div>
                    <p className="text-gray-300">Creatives complete project work. Funds remain secured in escrow.</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span className="font-medium text-green-400">Release Payment</span>
                    </div>
                    <p className="text-gray-300">Review work and release funds to creatives, or withdraw if needed.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                <p className="text-gray-400 text-sm">Across {userProjects.length} projects</p>
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
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">{stats.completedPayouts.toLocaleString()}</div>
                <p className="text-gray-400 text-sm">Successfully paid out</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Test Balance Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="neuro-card border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-xl font-orbitron flex items-center gap-2">
                  <ArrowUp className="w-5 h-5 text-yellow-400" />
                  Test Balance (For Development)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <Label className="text-gray-300 mb-2 block">Add Test Tokens</Label>
                    <Input
                      type="number"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="neuro-input"
                      placeholder="Enter amount"
                      min="1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddTestBalance}
                      disabled={isLoading || !testAmount}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
                    >
                      {isLoading ? 'Adding...' : 'Add Test Balance'}
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  ⚠️ This is for testing purposes only. Add tokens to your balance to test escrow deposits.
                </div>
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
                  Deposit to Project Escrow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Select Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger className="neuro-input">
                        <SelectValue placeholder="Select a project..." />
                      </SelectTrigger>
                      <SelectContent className="neuro-card">
                        {userProjects.map((project) => (
                          <SelectItem key={project.id.toString()} value={project.id.toString()}>
                            {project.title} ({getProjectStatus(project)})
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
                      disabled={isLoading || !selectedProject || !depositAmount}
                      className="cyber-button w-full"
                    >
                      {isLoading ? 'Depositing...' : 'Deposit to Escrow'}
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  Your Balance: <span className="text-cyber-teal font-bold">{userBalance.toString()} tokens</span>
                  {userBalance === BigInt(0) && (
                    <span className="block text-yellow-400 text-xs mt-1">
                      ⚠️ Add test balance above to deposit funds
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Project Escrow Status */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-orbitron font-bold text-white mb-6">Project Escrow Status</h2>
            
            {userProjects.length === 0 ? (
              <Card className="neuro-card">
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">🏦</div>
                  <h3 className="text-xl font-orbitron font-bold mb-2 text-gray-300">
                    No projects yet
                  </h3>
                  <p className="text-gray-400">Create projects to manage escrow funds.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {userProjects.map((project, index) => (
                  <motion.div
                    key={project.id.toString()}
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
                              {project.title}
                            </CardTitle>
                            <p className="text-gray-400 mt-1">{project.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(getProjectStatus(project))}
                            <Badge className={`bg-transparent border-current ${
                              getProjectStatus(project) === 'Completed' ? 'text-green-400' :
                              getProjectStatus(project) === 'Funded' ? 'text-cyber-teal' :
                              'text-yellow-400'
                            }`}>
                              {getProjectStatus(project)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-gray-400 text-sm">Escrow Balance</p>
                            <p className="text-2xl font-bold cyber-text-gradient">
                              {getEscrowBalance(project.id).toString()} tokens
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Required Amount</p>
                            <p className="text-xl font-bold text-white">{project.budget.toString()} tokens</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Applicants</p>
                            <p className="text-xl font-bold text-white">{project.applicants.length}</p>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 text-sm">Funding Progress</span>
                            <span className="text-white font-medium">{getProjectProgress(project).toFixed(0)}%</span>
                          </div>
                          <Progress value={getProjectProgress(project)} className="h-2" />
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
                                  Manage escrow funds for <span className="text-cyber-teal font-medium">{project.title}</span>
                                </p>
                                <div className="bg-cyber-dark/50 rounded-lg p-4 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Current Balance:</span>
                                    <span className="text-cyber-teal font-bold">{getEscrowBalance(project.id).toString()} tokens</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Required:</span>
                                    <span className="text-white">{project.budget.toString()} tokens</span>
                                  </div>
                                </div>
                                <div className="flex gap-3">
                                  <Button 
                                    className="cyber-button flex-1"
                                    onClick={() => {
                                      setSelectedProject(project.id.toString());
                                    }}
                                  >
                                    <ArrowDown className="w-4 h-4 mr-2" />
                                    Deposit More
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    className="flex-1 border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                                    onClick={() => handleWithdrawEscrow(project.id)}
                                    disabled={getEscrowBalance(project.id) === BigInt(0)}
                                  >
                                    <ArrowUp className="w-4 h-4 mr-2" />
                                    Withdraw
                                  </Button>
                                </div>
                                {project.selectedCreative && !project.isCompleted && getEscrowBalance(project.id) > BigInt(0) && (
                                  <div className="pt-3 border-t border-gray-600">
                                    <p className="text-sm text-gray-400 mb-3">
                                      Selected creative: {project.selectedCreative.toString().slice(0, 20)}...
                                    </p>
                                    <Button 
                                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => project.selectedCreative?.[0] && handleReleaseFunds(project.id, project.selectedCreative?.[0])}
                                      disabled={isLoading}
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      Release Funds to Creative
                                    </Button>
                                  </div>
                                )}
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
  if (isCreative()) {
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
              Track payments and earnings from completed projects
            </p>
          </motion.div>

          {/* How Earnings Work Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="neuro-card border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-xl font-orbitron flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                  How Earnings Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-yellow-500 text-black rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span className="font-medium text-yellow-400">Apply & Get Selected</span>
                    </div>
                    <p className="text-gray-300">Apply to projects and wait for client selection. Your applications are tracked here.</p>
                  </div>
                  <div className="bg-cyber-teal/10 border border-cyber-teal/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-cyber-teal text-black rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span className="font-medium text-cyber-teal">Complete Work</span>
                    </div>
                    <p className="text-gray-300">Deliver quality work according to project requirements. Funds are held in escrow.</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span className="font-medium text-green-400">Get Paid</span>
                    </div>
                    <p className="text-gray-300">Client releases payment to your account. Track your earnings history here.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                <p className="text-gray-400 text-sm">From completed projects</p>
              </CardContent>
            </Card>

            <Card className="neuro-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-cyber-pink">
                  <Send className="w-5 h-5" />
                  Selected Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyber-pink">{stats.selectedProjects}</div>
                <p className="text-gray-400 text-sm">You&apos;ve been chosen for</p>
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
                <div className="text-3xl font-bold text-green-400">{stats.completedProjects}</div>
                <p className="text-gray-400 text-sm">Successfully finished</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Applied Projects */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-orbitron font-bold text-white mb-6">Your Project Applications</h2>
            
            {appliedProjects.length === 0 ? (
              <Card className="neuro-card">
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-xl font-orbitron font-bold mb-2 text-gray-300">
                    No applications yet
                  </h3>
                  <p className="text-gray-400">Apply to projects to track your earnings here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {appliedProjects.map((project, index) => {
                  const isSelected = project.selectedCreative?.toString() === userPrincipal?.toString();
                  const hasApplied = project.applicants?.some(
                    applicant => applicant.toString() === userPrincipal?.toString()
                  );
                  
                  return (
                    <motion.div
                      key={project.id.toString()}
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
                                {project.title}
                              </CardTitle>
                              <p className="text-gray-400 mt-1">{project.description}</p>
                            </div>
                            <Badge className={`bg-transparent border-current ${
                              project.isCompleted ? 'text-green-400' :
                              isSelected ? 'text-cyber-teal' : 
                              hasApplied ? 'text-yellow-400' : 'text-gray-400'
                            }`}>
                              {project.isCompleted ? 'Completed' : 
                               isSelected ? 'Selected' : 
                               hasApplied ? 'Applied' : 'Not Applied'}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-400 text-sm">Payout Amount</p>
                              <p className="text-2xl font-bold cyber-text-gradient">{project.budget.toString()} tokens</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Status</p>
                              <p className="text-xl font-bold text-white">
                                {project.isCompleted ? 'Payment Released' : 
                                 isSelected ? 'Work in Progress' : 
                                 hasApplied ? 'Under Review' : 'Not Applied'}
                              </p>
                            </div>
                          </div>

                          {isSelected && !project.isCompleted && (
                            <div className="bg-cyber-teal/10 border border-cyber-teal/30 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-cyber-teal" />
                                <p className="text-cyber-teal font-medium">You&apos;ve been selected!</p>
                              </div>
                              <p className="text-gray-300 mt-2 text-sm">
                                Complete the project requirements to receive your payment.
                              </p>
                            </div>
                          )}

                          {project.isCompleted && (
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

                          {!isSelected && !project.isCompleted && hasApplied && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-400" />
                                <p className="text-yellow-400 font-medium">Application Under Review</p>
                              </div>
                              <p className="text-gray-300 mt-2 text-sm">
                                The client is currently reviewing applications for this project.
                              </p>
                            </div>
                          )}
                          
                          {!hasApplied && !project.isCompleted && (
                            <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-gray-400" />
                                <p className="text-gray-400 font-medium">Not Applied</p>
                              </div>
                              <p className="text-gray-300 mt-2 text-sm">
                                You haven&apos;t applied to this project yet.
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
