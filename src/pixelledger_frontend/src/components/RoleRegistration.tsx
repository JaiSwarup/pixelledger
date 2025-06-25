import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {UserRole, ClientInfo, CreativeInfo} from '../../../declarations/pixelledger_backend/pixelledger_backend.did';
import { useRoleAuth, useRoleValidation, ErrorDisplay } from '../hooks/useRoleAuth';
import { Button } from './ui/button';
import ThreeBackground from './ThreeBackground';

interface RegistrationProps {
  onRegistrationComplete: () => void;
}

export const RoleRegistration: React.FC<RegistrationProps> = ({ onRegistrationComplete }) => {
  const { isAuthenticated, principal } = useAuth();
  const { registerUser, loading, error, userAccount, isRegistered } = useRoleAuth();
  const { validateClientInfo, validateCreativeInfo } = useRoleValidation();
  
  const [selectedRole, setSelectedRole] = useState<'Client' | 'Creative' | null>(null);
  const [step, setStep] = useState<'role-selection' | 'client-info' | 'creative-info'>('role-selection');
  const [registrationData, setRegistrationData] = useState({
    client: {
      companyName: '',
      industry: '',
      website: '',
      description: ''
    },
    creative: {
      specializations: [] as string[],
      experienceLevel: '',
      portfolioLinks: [] as string[],
      hourlyRate: '',
      description: ''
    }
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // All conditional returns AFTER all hooks
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center p-6">
        <ThreeBackground />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="neuro-card max-w-md w-full p-8 text-center relative z-10"
        >
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="text-2xl font-orbitron font-bold mb-4 cyber-text-gradient">Authentication Required</h2>
          <p className="text-gray-400 mb-6">Please authenticate with Internet Identity to continue your registration.</p>
          <div className="p-4 bg-cyber-dark/30 rounded-lg border border-gray-800/50">
            <p className="text-sm text-gray-300">
              Internet Identity provides secure, anonymous authentication without passwords or personal data.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // If user is already registered, they shouldn't see this form
  if (isRegistered && userAccount) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center p-6">
        <ThreeBackground />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="neuro-card max-w-md w-full p-8 text-center relative z-10"
        >
          <h2 className="text-3xl font-orbitron font-bold mb-6 cyber-text-gradient">Already Registered!</h2>
          <div className="space-y-6">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-gray-300 mb-4">
              You are already registered as a <strong className="cyber-text-gradient">{userAccount.role && 'Client' in userAccount.role ? 'Client' : 'Creative'}</strong>.
            </p>
            <p className="text-gray-400 mb-6">
              Redirecting you to the dashboard...
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onRegistrationComplete}
                className="cyber-button text-white font-semibold w-full"
              >
                Go to Dashboard
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Debug information display (visible in development)
  const showDebugInfo = process.env.NODE_ENV === 'development';

  const debugInfo = showDebugInfo && (
    <div className="max-w-md mx-auto mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Info:</h3>
      <div className="text-xs text-yellow-700 space-y-1">
        <div>Principal: {principal?.toString() || 'None'}</div>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>Registered: {isRegistered ? 'Yes' : 'No'}</div>
        <div>User Account: {userAccount ? 'Found' : 'None'}</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Error: {error || 'None'}</div>
      </div>
    </div>
  );

  const handleRoleSelection = (role: 'Client' | 'Creative') => {
    setSelectedRole(role);
    setStep(role === 'Client' ? 'client-info' : 'creative-info');
  };

  const validateAndRegister = async () => {
    if (!selectedRole) return;

    setValidationErrors([]);

    if (selectedRole === 'Client') {
      const clientInfo: ClientInfo = {
        companyName: registrationData.client.companyName,
        industry: registrationData.client.industry,
        website: registrationData.client.website,
        verificationStatus: { Pending: null }
      };

      const errors = validateClientInfo([clientInfo]);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      const role: UserRole = { Client: null };
      const result = await registerUser(role, clientInfo, undefined, undefined);
      
      if (result.success) {
        onRegistrationComplete();
      }
    } else if (selectedRole === 'Creative') {
      const creativeInfo: CreativeInfo = {
        specializations: registrationData.creative.specializations,
        experienceLevel: registrationData.creative.experienceLevel === 'beginner' ? { 'Beginner': null } :
                        registrationData.creative.experienceLevel === 'intermediate' ? { 'Intermediate': null } :
                        registrationData.creative.experienceLevel === 'expert' ? { 'Expert': null } : { 'Master': null },
        portfolioLinks: registrationData.creative.portfolioLinks,
        hourlyRate: registrationData.creative.hourlyRate ? [BigInt(registrationData.creative.hourlyRate)] : [],
        verificationStatus: { 'Pending': null }
      };

      const errors = validateCreativeInfo([creativeInfo]);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      const role: UserRole = { Creative: null };
      const result = await registerUser(role, undefined, creativeInfo, undefined);

      if (result.success) {
        onRegistrationComplete();
      }
    }
  };

  const addSpecialization = () => {
    const input = document.getElementById('specialization') as HTMLInputElement;
    if (input && input.value.trim()) {
      setRegistrationData(prev => ({
        ...prev,
        creative: {
          ...prev.creative,
          specializations: [...prev.creative.specializations, input.value.trim()]
        }
      }));
      input.value = '';
    }
  };

  const removeSpecialization = (index: number) => {
    setRegistrationData(prev => ({
      ...prev,
      creative: {
        ...prev.creative,
        specializations: prev.creative.specializations.filter((_, i) => i !== index)
      }
    }));
  };

  const addPortfolioLink = () => {
    const input = document.getElementById('portfolioLink') as HTMLInputElement;
    if (input && input.value.trim()) {
      setRegistrationData(prev => ({
        ...prev,
        creative: {
          ...prev.creative,
          portfolioLinks: [...prev.creative.portfolioLinks, input.value.trim()]
        }
      }));
      input.value = '';
    }
  };

  const removePortfolioLink = (index: number) => {
    setRegistrationData(prev => ({
      ...prev,
      creative: {
        ...prev.creative,
        portfolioLinks: prev.creative.portfolioLinks.filter((_, i) => i !== index)
      }
    }));
  };

  if (step === 'role-selection') {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center p-6">
        <ThreeBackground />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neuro-card max-w-lg w-full p-8 relative z-10"
        >
          <h2 className="text-3xl font-orbitron font-bold mb-8 text-center cyber-text-gradient">Choose Your Role</h2>
          <ErrorDisplay error={error || undefined} />
          
          {/* Debug Info */}
          {showDebugInfo && debugInfo}
          
          <div className="space-y-6">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelection('Client')}
              className="w-full p-6 neuro-card-mini hover:shadow-cyber-glow transition-all duration-300 group"
            >
              <div className="text-center">
                <div className="text-4xl mb-4 filter drop-shadow-lg">🏢</div>
                <h3 className="text-xl font-orbitron font-bold mb-2 group-hover:cyber-text-gradient transition-all duration-300 text-white">Client</h3>
                <p className="text-gray-400 text-sm">Create projects and hire creative professionals</p>
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(236, 72, 153, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelection('Creative')}
              className="w-full p-6 neuro-card-mini hover:shadow-cyber-glow transition-all duration-300 group"
            >
              <div className="text-center">
                <div className="text-4xl mb-4 filter drop-shadow-lg">🎨</div>
                <h3 className="text-xl font-orbitron font-bold mb-2 group-hover:cyber-text-gradient transition-all duration-300 text-white">Creative</h3>
                <p className="text-gray-400 text-sm">Apply to projects and showcase your creative work</p>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'client-info') {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center p-6">
        <ThreeBackground />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neuro-card max-w-lg w-full p-8 relative z-10"
        >
          <div className="flex items-center mb-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setStep('role-selection')}
              className="mr-4 p-2 rounded-full bg-cyber-dark/50 hover:bg-cyber-dark/70 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </motion.button>
            <h2 className="text-3xl font-orbitron font-bold cyber-text-gradient">Client Information</h2>
          </div>
          <ErrorDisplay error={error || undefined} />
          
          {validationErrors.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={registrationData.client.companyName}
                onChange={(e) => setRegistrationData(prev => ({
                  ...prev,
                  client: { ...prev.client, companyName: e.target.value }
                }))}
                className="w-full px-4 py-3 bg-cyber-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal text-white placeholder-gray-400"
                placeholder="Your company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Industry *
              </label>
              <input
                type="text"
                value={registrationData.client.industry}
                onChange={(e) => setRegistrationData(prev => ({
                  ...prev,
                  client: { ...prev.client, industry: e.target.value }
                }))}
                className="w-full px-4 py-3 bg-cyber-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal text-white placeholder-gray-400"
                placeholder="e.g., Fashion, Technology, Food"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website *
              </label>
              <input
                type="url"
                value={registrationData.client.website}
                onChange={(e) => setRegistrationData(prev => ({
                  ...prev,
                  client: { ...prev.client, website: e.target.value }
                }))}
                className="w-full px-4 py-3 bg-cyber-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal text-white placeholder-gray-400"
                placeholder="https://yourcompany.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Information
              </label>
              <textarea
                value={registrationData.client.description}
                onChange={(e) => setRegistrationData(prev => ({
                  ...prev,
                  client: { ...prev.client, description: e.target.value }
                }))}
                className="w-full px-4 py-3 bg-cyber-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal text-white placeholder-gray-400"
                rows={3}
                placeholder="Tell us more about your company..."
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                <Button
                  onClick={() => setStep('role-selection')}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                <Button
                  onClick={validateAndRegister}
                  disabled={loading}
                  className="w-full cyber-button text-white font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registering...
                    </div>
                  ) : (
                    <>
                      Register
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'creative-info') {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center p-6">
        <ThreeBackground />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neuro-card max-w-2xl w-full p-8 relative z-10 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center mb-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setStep('role-selection')}
              className="mr-4 p-2 rounded-full bg-cyber-dark/50 hover:bg-cyber-dark/70 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </motion.button>
            <h2 className="text-3xl font-orbitron font-bold cyber-text-gradient">Creative Information</h2>
          </div>
          <ErrorDisplay error={error || undefined} />
          
          {validationErrors.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Specializations *
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  id="specialization"
                  className="flex-1 px-4 py-3 bg-cyber-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-pink text-white placeholder-gray-400"
                  placeholder="e.g., Graphic Design, UI/UX, Photography"
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="button"
                    onClick={addSpecialization}
                    className="cyber-button text-white font-semibold px-6"
                  >
                    Add
                  </Button>
                </motion.div>
              </div>
              <div className="flex flex-wrap gap-2">
                {registrationData.creative.specializations.map((specialization, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gradient-to-r from-cyber-pink/20 to-cyber-teal/20 text-cyber-pink border border-cyber-pink/30"
                  >
                    {specialization}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(index)}
                      className="ml-2 text-cyber-pink hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Experience Level *
              </label>
              <select
                value={registrationData.creative.experienceLevel}
                onChange={(e) => setRegistrationData(prev => ({
                  ...prev,
                  creative: { ...prev.creative, experienceLevel: e.target.value }
                }))}
                className="w-full px-4 py-3 bg-cyber-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-pink text-white"
              >
                <option value="" className="bg-cyber-dark">Select experience level</option>
                <option value="beginner" className="bg-cyber-dark">Beginner</option>
                <option value="intermediate" className="bg-cyber-dark">Intermediate</option>
                <option value="expert" className="bg-cyber-dark">Expert</option>
                <option value="master" className="bg-cyber-dark">Master</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hourly Rate (ICP) - Optional
              </label>
              <input
                type="number"
                value={registrationData.creative.hourlyRate}
                onChange={(e) => setRegistrationData(prev => ({
                  ...prev,
                  creative: { ...prev.creative, hourlyRate: e.target.value }
                }))}
                className="w-full px-4 py-3 bg-cyber-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-pink text-white placeholder-gray-400"
                placeholder="50"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Portfolio Links
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  id="portfolioLink"
                  type="url"
                  className="flex-1 px-4 py-3 bg-cyber-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-pink text-white placeholder-gray-400"
                  placeholder="https://your-portfolio.com"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPortfolioLink();
                    }
                  }}
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="button"
                    onClick={addPortfolioLink}
                    className="cyber-button text-white font-semibold px-6"
                  >
                    Add
                  </Button>
                </motion.div>
              </div>
              <div className="space-y-2">
                {registrationData.creative.portfolioLinks.map((link, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-cyber-dark/50 px-4 py-3 rounded-lg border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300"
                  >
                    <span className="text-sm text-gray-300 truncate flex-1 mr-3">{link}</span>
                    <button
                      type="button"
                      onClick={() => removePortfolioLink(index)}
                      className="text-red-400 hover:text-red-300 ml-2 p-1 rounded-md hover:bg-red-900/20 transition-colors"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Information
              </label>
              <textarea
                value={registrationData.creative.description}
                onChange={(e) => setRegistrationData(prev => ({
                  ...prev,
                  creative: { ...prev.creative, description: e.target.value }
                }))}
                className="w-full px-4 py-3 bg-cyber-dark border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-pink text-white placeholder-gray-400"
                rows={4}
                placeholder="Tell us about your creative work and style..."
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                <Button
                  type="button"
                  onClick={() => setStep('role-selection')}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                <Button
                  type="button"
                  onClick={validateAndRegister}
                  disabled={loading}
                  className="w-full cyber-button text-white font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registering...
                    </div>
                  ) : (
                    <>
                      Register
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};
