import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MapPin, Globe, Calendar, Briefcase, Award, ExternalLink } from 'lucide-react';
import { Profile, Project } from 'declarations/pixelledger_backend/pixelledger_backend.did';
import { Principal } from '@dfinity/principal';
import { useBackendActor } from '../hooks/useBackendActor';
import { getOptionalValue } from '../hooks/useRoleAuth';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { LoadingScreen } from '../components/LoadingScreen';
import { toast } from 'sonner';

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { backendActor } = useBackendActor();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!id || !backendActor) return;

      try {
        setLoading(true);
        setError(null);

        const userPrincipal = Principal.fromText(id);
        
        // Load user profile and their projects
        const [profileResult, projectsResult] = await Promise.all([
          backendActor.getProfile(userPrincipal),
          backendActor.getProjects()
        ]);

        if ('ok' in profileResult) {
          setUserProfile(profileResult.ok);
          
          // Filter projects for this user (either as owner or applicant)
          const userRelatedProjects = projectsResult.filter(project => 
            project.owner.toString() === id ||
            project.applicants.some(applicant => applicant.toString() === id)
          );
          setUserProjects(userRelatedProjects);
        } else {
          setError(profileResult.err);
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setError('Failed to load user profile');
        toast.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [id, backendActor]);

  if (loading) {
    return <LoadingScreen message="Loading user profile..." submessage="Fetching profile information" />;
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-orbitron font-bold mb-2 text-gray-300">
            Profile Not Found
          </h3>
          <p className="text-gray-400 mb-6">
            {error || "This user's profile could not be found or is not available."}
          </p>
          <Link to="/projects">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const clientInfo = getOptionalValue(userProfile.clientInfo);
  const creativeInfo = getOptionalValue(userProfile.creativeInfo);
  
  const isClient = userProfile.role && 'Client' in userProfile.role;
  const isCreative = userProfile.role && 'Creative' in userProfile.role;

  const ownedProjects = userProjects.filter(p => p.owner.toString() === id);
  const appliedProjects = userProjects.filter(p => 
    p.applicants.some(applicant => applicant.toString() === id) && p.owner.toString() !== id
  );

  const getExperienceLevel = () => {
    if (!creativeInfo?.experienceLevel) return 'Not specified';
    return Object.keys(creativeInfo.experienceLevel)[0];
  };

  const getVerificationStatus = (status: any) => {
    if (!status) return 'Not verified';
    if ('Verified' in status) return 'Verified';
    if ('Pending' in status) return 'Pending';
    if ('Rejected' in status) return 'Rejected';
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-cyber-black py-8">
      <div className="container mx-auto px-6 space-y-8">
        {/* Back Button */}
        <Link to="/projects">
          <Button variant="outline" className="flex items-center gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Button>
        </Link>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neuro-card p-8"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-cyber-teal/30">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="bg-gradient-to-r from-cyber-teal to-cyber-pink text-cyber-black font-bold text-3xl">
                  {userProfile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {((isClient && clientInfo?.verificationStatus && 'Verified' in clientInfo.verificationStatus) ||
                (isCreative && creativeInfo?.verificationStatus && 'Verified' in creativeInfo.verificationStatus)) && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                  <Award className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4">
                <h1 className="text-3xl font-orbitron font-bold cyber-text-gradient mb-2">
                  {userProfile.username}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Badge variant={isClient ? "default" : "secondary"} className="font-orbitron">
                    {isClient ? "Client" : "Creative"}
                  </Badge>
                  {((isClient && clientInfo?.verificationStatus && 'Verified' in clientInfo.verificationStatus) ||
                    (isCreative && creativeInfo?.verificationStatus && 'Verified' in creativeInfo.verificationStatus)) && (
                    <Badge variant="outline" className="border-green-500 text-green-400">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {id?.slice(0, 8)}...{id?.slice(-8)}
                </p>
              </div>

              {/* Bio */}
              <p className="text-gray-300 mb-6 max-w-2xl">
                {userProfile.bio}
              </p>

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-6 text-sm">
                <div className="text-center">
                  <div className="text-xl font-bold cyber-text-gradient">{ownedProjects.length}</div>
                  <div className="text-gray-400">{isClient ? 'Projects Posted' : 'Projects Owned'}</div>
                </div>
                {isCreative && (
                  <div className="text-center">
                    <div className="text-xl font-bold cyber-text-gradient">{appliedProjects.length}</div>
                    <div className="text-gray-400">Applications</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-xl font-bold cyber-text-gradient">{userProfile.completedProjects?.length || 0}</div>
                  <div className="text-gray-400">Completed</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Role-specific Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Professional Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="neuro-card p-6"
          >
            <h3 className="text-xl font-orbitron font-bold mb-4 cyber-text-gradient">
              Professional Information
            </h3>
            
            {isClient && clientInfo && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-cyber-teal" />
                  <div>
                    <p className="text-sm text-gray-400">Company</p>
                    <p className="text-gray-200">{clientInfo.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-cyber-teal" />
                  <div>
                    <p className="text-sm text-gray-400">Industry</p>
                    <p className="text-gray-200">{clientInfo.industry}</p>
                  </div>
                </div>
                {clientInfo.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-cyber-teal" />
                    <div>
                      <p className="text-sm text-gray-400">Website</p>
                      <a 
                        href={clientInfo.website || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyber-teal hover:text-cyber-pink flex items-center gap-1"
                      >
                        {clientInfo.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isCreative && creativeInfo && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-cyber-teal" />
                  <div>
                    <p className="text-sm text-gray-400">Experience Level</p>
                    <p className="text-gray-200">{getExperienceLevel()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    {creativeInfo.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline" className="border-cyber-teal/50 text-cyber-teal">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
                {creativeInfo.hourlyRate && (
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm text-gray-400">Hourly Rate</p>
                      <p className="text-gray-200 font-bold">
                        ${Number(creativeInfo.hourlyRate)}/hour
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="neuro-card p-6"
          >
            <h3 className="text-xl font-orbitron font-bold mb-4 cyber-text-gradient">
              Social Links
            </h3>
            
            {userProfile.socialLinks && userProfile.socialLinks.length > 0 ? (
              <div className="space-y-3">
                {userProfile.socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-cyber-teal" />
                    <span className="text-gray-300 hover:text-cyber-teal">{link}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No social links provided</p>
            )}
          </motion.div>
        </div>

        {/* Projects Section */}
        {(ownedProjects.length > 0 || appliedProjects.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="neuro-card p-6"
          >
            <h3 className="text-xl font-orbitron font-bold mb-6 cyber-text-gradient">
              Projects
            </h3>
            
            {ownedProjects.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-4 text-cyber-teal">
                  {isClient ? 'Posted Projects' : 'Owned Projects'} ({ownedProjects.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ownedProjects.map((project) => (
                    <Link key={project.id} to={`/projects/${project.id}`}>
                      <div className="p-4 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-colors border border-gray-700/50">
                        <h5 className="font-semibold text-gray-200 mb-2">{project.title}</h5>
                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">{project.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-cyber-teal font-bold">${Number(project.budget)}</span>
                          <Badge variant={project.isCompleted ? "default" : "outline"}>
                            {project.isCompleted ? 'Completed' : 'Active'}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {isCreative && appliedProjects.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-4 text-cyber-pink">
                  Applied Projects ({appliedProjects.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appliedProjects.map((project) => (
                    <Link key={project.id} to={`/projects/${project.id}`}>
                      <div className="p-4 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-colors border border-gray-700/50">
                        <h5 className="font-semibold text-gray-200 mb-2">{project.title}</h5>
                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">{project.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-cyber-teal font-bold">${Number(project.budget)}</span>
                          <Badge variant={project.isCompleted ? "default" : "outline"}>
                            {project.isCompleted ? 'Completed' : 'Active'}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
