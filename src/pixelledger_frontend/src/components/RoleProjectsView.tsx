import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Project } from '../../../declarations/pixelledger_backend/pixelledger_backend.did';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { useBackendActor } from '../hooks/useBackendActor';
import ProjectCard from './ProjectCard';
import { toast } from 'sonner';

interface RoleProjectsViewProps {
  projects: Project[];
  onDataUpdate: () => void;
}

export const RoleProjectsView: React.FC<RoleProjectsViewProps> = ({ projects, onDataUpdate }) => {
  const { userAccount, isClient, isCreative } = useRoleAuth();
  const { backendActor } = useBackendActor();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'applied'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    budget: ''
  });

  if (!userAccount) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-2xl font-orbitron font-bold mb-2 text-gray-300">
            Authentication Required
          </h3>
          <p className="text-gray-400">Please register to view projects.</p>
        </motion.div>
      </div>
    );
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isClient()) {
      setError('Only clients can create projects');
      return;
    }

    if (!backendActor) {
      setError('Backend actor not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const projectInput = {
        title: newProject.title,
        description: newProject.description,
        budget: BigInt(newProject.budget)
      };

      const result = await backendActor.createProject(projectInput);
      if ('ok' in result) {
        setNewProject({ title: '', description: '', budget: '' });
        setShowCreateForm(false);
        onDataUpdate();
      } else {
        toast.error('Errr creating project')
      }
    } catch (error) {
      toast.error('Failed to create project' +  (error instanceof Error ? `: ${error.message}` : ''));
      setError('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (activeTab === 'all') return true;
    if (activeTab === 'my' && isClient()) {
      return project.owner === userAccount.principal;
    }
    if (activeTab === 'applied' && isCreative()) {
      // Check if user's principal is in the applicants array (Principal comparison)
      return project.applicants.some(applicant => 
        applicant === userAccount.principal
      );
    }
    return false;
  });

  return (
    <div className="min-h-screen bg-cyber-black">
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4">
            <span className="cyber-text-gradient">My</span> Projects
          </h1>
          <p className="text-xl text-gray-400">
            {isClient() ? 'Manage your projects and find creatives' : 'Track your applications and progress'}
          </p>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="neuro-card p-4 mb-6 border-l-4 border-red-500 bg-red-900/20"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Create Project Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-cyber-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="neuro-card p-6 w-full max-w-2xl"
            >
              <h3 className="text-2xl font-orbitron font-bold mb-6 cyber-text-gradient">Create New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Title</label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="w-full px-4 py-3 bg-cyber-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyber-teal focus:outline-none transition-colors"
                    placeholder="Enter project title..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-4 py-3 bg-cyber-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyber-teal focus:outline-none transition-colors"
                    rows={4}
                    placeholder="Describe your project requirements..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Payout (tokens)</label>
                  <input
                    type="number"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                    className="w-full px-4 py-3 bg-cyber-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyber-teal focus:outline-none transition-colors"
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="cyber-button flex-1 text-cyber-black font-medium"
                  >
                    {loading ? 'Creating...' : 'Create Project'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:border-gray-500 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Action Bar */}
        <div className="neuro-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              {/* Tab Navigation */}
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'all'
                    ? 'bg-cyber-teal text-cyber-black shadow-md'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                }`}
              >
                All Projects
              </button>
              {isClient() && (
                <button
                  onClick={() => setActiveTab('my')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'my'
                      ? 'bg-cyber-teal text-cyber-black shadow-md'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  My Projects
                </button>
              )}
              {isCreative() && (
                <button
                  onClick={() => setActiveTab('applied')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'applied'
                      ? 'bg-cyber-teal text-cyber-black shadow-md'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  Applied Projects
                </button>
              )}
            </div>
            
            {/* Brand-only: Create Project Button */}
            {isClient() && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="cyber-button text-cyber-black font-medium px-6 py-3"
              >
                Create Project
              </button>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="neuro-card p-16 text-center"
          >
            <div className="text-6xl mb-4">
              {activeTab === 'all' && '🚀'}
              {activeTab === 'my' && '📋'}
              {activeTab === 'applied' && '📝'}
            </div>
            <h3 className="text-2xl font-orbitron font-bold mb-2 text-gray-300">
              {activeTab === 'all' && 'No projects available'}
              {activeTab === 'my' && 'No projects created yet'}
              {activeTab === 'applied' && 'No applications yet'}
            </h3>
            <p className="text-gray-400">
              {activeTab === 'all' && 'Check back later for new opportunities'}
              {activeTab === 'my' && 'Create your first project to get started'}
              {activeTab === 'applied' && 'Start exploring and applying to projects'}
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ProjectCard 
                  project={project} 
                  onDataUpdate={onDataUpdate}
                  showActions={true}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
