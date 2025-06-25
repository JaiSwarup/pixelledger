import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Project } from '../../../declarations/pixelledger_backend/pixelledger_backend.did';
import { useRoleAuth } from '../hooks/useRoleAuth';
import ProjectCard from '../components/ProjectCard';
import FilterBar from '../components/FilterBar';

interface ProjectsPageProps {
  projects: Project[];
  onDataUpdate: () => void;
}

const ProjectsPage = ({ projects, onDataUpdate }: ProjectsPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const { isClient } = useRoleAuth();

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.owner.toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'All' || 
                         (selectedStatus === 'Open' && !project.isCompleted) ||
                         (selectedStatus === 'Completed' && project.isCompleted);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="neuro-card p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4">
            <span className="cyber-text-gradient">Active</span> Projects
          </h1>
          <p className="text-xl text-gray-400">
            {isClient() 
              ? 'Discover creatives and manage your projects' 
              : 'Find amazing creative opportunities with top clients'
            }
          </p>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        projects={projects}
      />

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="neuro-card p-16 text-center"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-orbitron font-bold mb-2 text-gray-300">
            No projects found
          </h3>
          <p className="text-gray-400">
            {searchTerm || selectedStatus !== 'All' 
              ? 'Try adjusting your search or filter criteria' 
              : 'No projects are currently available'
            }
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id.toString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProjectCard 
                project={project} 
                onDataUpdate={onDataUpdate}
                showActions={true}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Call to Action */}
      {isClient() && filteredProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neuro-card p-6 text-center"
        >
          <p className="text-gray-400 mb-4">
            Want to create your own project?
          </p>
          <Link to="/projects">
            <button className="cyber-button px-6 py-3 text-cyber-black font-medium">
              Go to My Projects
            </button>
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default ProjectsPage;
