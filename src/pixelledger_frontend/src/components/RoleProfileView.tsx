import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Star, DollarSign, Award, Settings, User, Briefcase, Globe, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Profile, Project } from '../../../declarations/pixelledger_backend/pixelledger_backend.did';
import { Principal } from '@dfinity/principal';
import { getClientInfo, getCreativeInfo, useRoleAuth } from '../hooks/useRoleAuth';
import { pixelledger_backend } from 'declarations/pixelledger_backend';
import { toast } from 'sonner';

interface RoleProfileViewProps {
  userProfile: Profile | null;
  userPrincipal: Principal | null;
  onProfileUpdate: (principal: Principal) => void;
  backendActor: typeof pixelledger_backend | null;
}

export function RoleProfileView({ userProfile, userPrincipal: _userPrincipal, onProfileUpdate: _onProfileUpdate, backendActor }: RoleProfileViewProps) {
  const { userAccount, isClient, loading, getRoleDisplayName } = useRoleAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState<Project[]>([]);

  // Load projects data
  useEffect(() => {
    const loadProjects = async () => {
      if (backendActor) {
        try {
          const result = await backendActor.getProjects();
          setProjects(result);
        } catch (error) {
          if (error instanceof Error) {
            toast.error(`Error loading projects: ${error.message}`);
          } else if (typeof error === 'string') {
            toast.error(`Error loading projects: ${error}`);
          } else {
            toast.error('An unknown error occurred while loading projects.');
          }
        }
      }
    };

    loadProjects();
  }, [backendActor]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-3"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-teal"></div>
          <span className="text-gray-300 font-orbitron">Loading profile...</span>
        </motion.div>
      </div>
    );
  }

  if (!userAccount || !userProfile) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-2xl font-orbitron font-bold mb-2 text-gray-300">
            Profile Not Found
          </h3>
          <p className="text-gray-400">Please complete your registration to view your profile.</p>
        </motion.div>
      </div>
    );
  }

  const clientInfo = getClientInfo(userAccount);
  const creativeInfo = getCreativeInfo(userAccount);

  // Calculate stats
  const userProjects = projects.filter(c => 
    isClient() ? c.owner.toString() === userAccount.principal.toString() : 
    c.applicants.some(applicant => applicant.toString() === userAccount.principal.toString())
  );
  
  const completedProjects = userProjects.filter(c => c.isCompleted);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500';
      case 'In Progress': return 'bg-cyber-pink';
      case 'Pending': return 'bg-yellow-500';
      case 'Open': return 'bg-cyber-teal';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black py-8">
      <div className="container mx-auto px-6 space-y-8">
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
              <Button 
                size="sm" 
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-cyber-teal hover:bg-cyber-teal/80"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-orbitron font-bold cyber-text-gradient mb-2">
                    {userProfile.username}
                  </h1>
                  <p className="text-cyber-teal font-medium mb-2">
                    {getRoleDisplayName()} • {userAccount.principal.toString().slice(0, 8)}...
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-400">
                    {creativeInfo && (
                      <>
                        <span>{creativeInfo.specializations.length} specialization{creativeInfo.specializations.length !== 1 ? 's' : ''}</span>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span>{creativeInfo.experienceLevel && Object.keys(creativeInfo.experienceLevel)[0]} level</span>
                        </div>
                      </>
                    )}
                    {clientInfo && (
                      <>
                        <span>{clientInfo.industry}</span>
                        <span>{clientInfo.website}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <Button className="cyber-button mt-4 md:mt-0">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
              
              <p className="text-gray-300 mb-6 max-w-2xl">
                {userProfile.bio || "No bio provided yet."}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-cyber-dark rounded-lg">
                  <div className="text-2xl font-orbitron font-bold cyber-text-gradient">
                    {userProjects.length}
                  </div>
                  <div className="text-sm text-gray-400">
                    {isClient() ? 'Projects Created' : 'Applications'}
                  </div>
                </div>
                <div className="text-center p-4 bg-cyber-dark rounded-lg">
                  <div className="text-2xl font-orbitron font-bold text-cyber-pink">
                    {completedProjects.length}
                  </div>
                  <div className="text-sm text-gray-400">Completed</div>
                </div>
                <div className="text-center p-4 bg-cyber-dark rounded-lg">
                  <div className="text-2xl font-orbitron font-bold text-purple-400">
                    {(() => {
                      const status = creativeInfo?.verificationStatus || clientInfo?.verificationStatus;
                      if (typeof status === 'object' && status) {
                        return Object.keys(status)[0] || 'Pending';
                      }
                      return status || 'Pending';
                    })()}
                  </div>
                  <div className="text-sm text-gray-400">Status</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-cyber-dark">
              <TabsTrigger value="overview" className="data-[state=active]:bg-cyber-teal data-[state=active]:text-cyber-black">
                <User className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-cyber-teal data-[state=active]:text-cyber-black">
                <Briefcase className="w-4 h-4 mr-2" />
                {isClient() ? 'My Projects' : 'Applications'}
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-cyber-teal data-[state=active]:text-cyber-black">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Profile Information */}
                <Card className="neuro-card">
                  <CardHeader>
                    <CardTitle className="font-orbitron">Profile Information</CardTitle>
                    <CardDescription>Your account details and information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Username</span>
                      <span className="text-white font-medium">{userProfile.username}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Role</span>
                      <Badge className="bg-cyber-teal text-cyber-black">{getRoleDisplayName()}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Principal ID</span>
                      <span className="text-white font-mono text-sm">
                        {userAccount.principal.toString().slice(0, 12)}...
                      </span>
                    </div>
                    {clientInfo && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Company</span>
                          <span className="text-white font-medium">{clientInfo.companyName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Industry</span>
                          <span className="text-white font-medium">{clientInfo.industry}</span>
                        </div>
                      </>
                    )}
                    {creativeInfo && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Experience Level</span>
                          <span className="text-white font-medium">
                            {creativeInfo.experienceLevel && Object.keys(creativeInfo.experienceLevel)[0]}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Hourly Rate</span>
                          <span className="text-white font-medium">
                            {creativeInfo.hourlyRate && creativeInfo.hourlyRate.length > 0 
                              ? `$${creativeInfo.hourlyRate[0]}` 
                              : 'Not set'
                            }
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Social Links */}
                <Card className="neuro-card">
                  <CardHeader>
                    <CardTitle className="font-orbitron">Social Links</CardTitle>
                    <CardDescription>Your connected social media accounts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userProfile.socialLinks.length > 0 ? (
                      userProfile.socialLinks.map((link, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Globe className="w-4 h-4 text-cyber-teal" />
                          <a 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-cyber-teal hover:text-cyber-pink transition-colors"
                          >
                            {link}
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400">No social links added yet.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Creative Specializations & Portfolio */}
                {creativeInfo && (
                  <Card className="neuro-card">
                    <CardHeader>
                      <CardTitle className="font-orbitron">Specializations & Portfolio</CardTitle>
                      <CardDescription>Your creative skills and portfolio</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <span className="text-gray-400 block mb-2">Specializations</span>
                        <div className="flex flex-wrap gap-2">
                          {creativeInfo.specializations.map((spec, index) => (
                            <Badge key={index} className="bg-cyber-teal/20 text-cyber-teal border-cyber-teal/50">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {creativeInfo.portfolioLinks.length > 0 && (
                        <div>
                          <span className="text-gray-400 block mb-2">Portfolio Links</span>
                          <div className="space-y-2">
                            {creativeInfo.portfolioLinks.map((link, index) => (
                              <div key={index} className="flex items-center space-x-3">
                                <Briefcase className="w-4 h-4 text-cyber-pink" />
                                <a 
                                  href={link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-cyber-pink hover:text-cyber-teal transition-colors"
                                >
                                  {link}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="projects">
              <div className="space-y-6">
                {userProjects.length > 0 ? (
                  userProjects.map((project, index) => (
                    <motion.div
                      key={project.id.toString()}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="neuro-card hover:shadow-cyber-glow transition-all duration-300">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl font-orbitron hover:cyber-text-gradient transition-all duration-300">
                                {project.title}
                              </CardTitle>
                              <CardDescription className="text-cyber-teal font-medium">
                                Owner: {project.owner.toString().slice(0, 8)}...
                              </CardDescription>
                            </div>
                            <Badge className={`${getStatusColor(project.isCompleted ? 'Completed' : 'Open')} text-white`}>
                              {project.isCompleted ? 'Completed' : 'Open'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-300 mb-4">{project.description}</p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-6 text-sm text-gray-400">
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                {project.budget.toString()} tokens
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {project.applicants.length} applicants
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-2xl font-orbitron font-bold mb-2 text-gray-300">
                      {isClient() ? 'No Projects Created' : 'No Applications Yet'}
                    </h3>
                    <p className="text-gray-400">
                      {isClient() 
                        ? 'Create your first project to get started' 
                        : 'Start exploring and applying to projects'
                      }
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="neuro-card">
                  <CardHeader>
                    <CardTitle className="font-orbitron">Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <User className="w-4 h-4 mr-2" />
                      Edit Profile Information
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Privacy Settings
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Award className="w-4 h-4 mr-2" />
                      Verification Status
                    </Button>
                  </CardContent>
                </Card>

                <Card className="neuro-card">
                  <CardHeader>
                    <CardTitle className="font-orbitron">Preferences</CardTitle>
                    <CardDescription>Configure your preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      Project Notifications
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Payment Notifications  
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Marketing Communications
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
 