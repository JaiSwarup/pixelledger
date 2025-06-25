
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Project } from '../../../declarations/pixelledger_backend/pixelledger_backend.did';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { useBackendActor } from '../hooks/useBackendActor';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';

interface ProjectCardProps {
  project: Project;
  onDataUpdate?: () => void;
  showActions?: boolean;
}

const ProjectCard = ({ 
  project, 
  onDataUpdate, 
  showActions = true 
}: ProjectCardProps) => {
  const { userAccount, isClient, isCreative } = useRoleAuth();
  const { backendActor } = useBackendActor();
  const [loading, setLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);

  const status = project.isCompleted ? 'Completed' : 'Open';
  
  // Check if current user is approved for this project
  useEffect(() => {
    const checkApprovalStatus = async () => {
      if (!isCreative() || !backendActor || !userAccount) return;
      
      // Only check if user has applied
      const hasApplied = project.applicants.some(
        applicant => applicant.toString() === userAccount.principal.toString()
      );
      
      if (!hasApplied) return;
      
      setCheckingApproval(true);
      try {
        const result = await backendActor.isApplicantApproved(project.id, userAccount.principal);
        if ('ok' in result) {
          setIsApproved(result.ok);
        }
      } catch (error) {
        // Don't show error for this check, just assume not approved
        setIsApproved(false);
      } finally {
        setCheckingApproval(false);
      }
    };

    checkApprovalStatus();
  }, [project.id, project.applicants, isCreative, backendActor, userAccount]);
  
  const statusColors = {
    'Open': 'bg-cyber-teal text-cyber-black',
    'Completed': 'bg-gray-600 text-white',
    'In Progress': 'bg-cyber-pink text-white'
  };

  const handleApply = async () => {
    if (!isCreative() || !backendActor || !userAccount) return;

    setLoading(true);
    try {
      const result = await backendActor.applyToProject(project.id);
      if ('ok' in result) {
        onDataUpdate?.();
      } else {
        toast.error(`Error applying to project: ${result.err}`);
      }
    } catch (error) {
      toast.error(`Failed to apply: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyApplied = userAccount && project.applicants.some(
    applicant => applicant.toString() === userAccount.principal.toString()
  );

  const isOwner = userAccount && project.owner.toString() === userAccount.principal.toString();

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="neuro-card overflow-hidden group hover:shadow-cyber-glow transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-2">
            <Badge className={`${statusColors[status]} font-medium`}>
              {status}
            </Badge>
            <span className="text-sm text-gray-400">Project</span>
          </div>
          <h3 className="text-xl font-orbitron font-bold text-white group-hover:cyber-text-gradient transition-all duration-300">
            {project.title}
          </h3>
          <Link 
            to={`/users/${project.owner.toString()}`}
            className="text-cyber-teal font-medium hover:text-cyber-pink transition-colors duration-200"
          >
            Client: {project.owner.toString().slice(0, 8)}...{project.owner.toString().slice(-8)}
          </Link>
        </CardHeader>
        
        <CardContent className="pb-4">
          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
          
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>{project.applicants.length} applicants</span>
            <span>ID: {project.id.toString()}</span>
          </div>
        </CardContent>
        
        <CardFooter className="pt-4 border-t border-gray-800/50">
          <div className="flex justify-between items-center w-full">
            <div>
              <span className="text-2xl font-bold cyber-text-gradient">{project.budget.toString()}</span>
              <span className="text-gray-400 ml-1">tokens</span>
            </div>
            
            {showActions && (
              <div className="flex space-x-2">
                {/* Creative: Apply Button */}
                {isCreative() && !project.isCompleted && !isAlreadyApplied && (
                  <Button 
                    onClick={handleApply}
                    disabled={loading}
                    className="cyber-button text-cyber-black font-medium"
                  >
                    {loading ? 'Applying...' : 'Apply'}
                  </Button>
                )}

                {/* Creative: Already Applied */}
                {isCreative() && isAlreadyApplied && !isApproved && (
                  <span className="px-3 py-2 text-sm text-yellow-400 bg-yellow-900/20 rounded-md border border-yellow-400/30">
                    {checkingApproval ? 'Checking...' : 'Applied'}
                  </span>
                )}

                {/* Creative: Approved */}
                {isCreative() && isApproved && (
                  <span className="px-3 py-2 text-sm text-green-400 bg-green-900/20 rounded-md border border-green-400/30">
                    ✓ Approved
                  </span>
                )}

                {/* Client: View Details for own projects */}
                {isClient() && isOwner && (
                  <Link to={`/projects/${project.id}`}>
                    <Button className="cyber-button text-cyber-black font-medium">
                      Manage Project
                    </Button>
                  </Link>
                )}

                {/* General View Details for non-owners */}
                {!isOwner && (
                  <Link to={`/projects/${project.id}`}>
                    <Button 
                      variant="outline" 
                      className="border-cyber-teal text-cyber-teal hover:bg-cyber-teal hover:text-cyber-black"
                    >
                      View Details
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ProjectCard;
