import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Globe, Users, Target, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {UserRole, ClientInfo, CreativeInfo} from '../../../declarations/pixelledger_backend/pixelledger_backend.did';
import { useRoleAuth, useRoleValidation, ErrorDisplay } from '../hooks/useRoleAuth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import ThreeBackground from './ThreeBackground';
import { useToast } from '../hooks/use-toast';

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
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Please authenticate with Internet Identity to continue.</p>
      </div>
    );
  }

  // If user is already registered, they shouldn't see this form
  if (isRegistered && userAccount) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-600">Already Registered!</h2>
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-gray-700 mb-4">
            You are already registered as a <strong>{userAccount.role && 'Client' in userAccount.role ? 'Client' : 'Creative'}</strong>.
          </p>
          <p className="text-gray-600 mb-6">
            Redirecting you to the dashboard...
          </p>
          <button
            onClick={onRegistrationComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
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
    return (        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Role</h2>
        <ErrorDisplay error={error || undefined} />
        
        {/* Debug Info */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <div><strong>Debug Info:</strong></div>
          <div>Principal: {principal?.toString() || 'null'}</div>
          <div>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
          <div>Is Registered: {isRegistered ? 'Yes' : 'No'}</div>
          <div>User Account: {userAccount ? 'Found' : 'None'}</div>
          <div>Error: {error || 'None'}</div>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelection('Client')}
            className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🏢</div>
              <h3 className="text-lg font-semibold">Client</h3>
              <p className="text-gray-600 text-sm">Create projects and hire creative professionals</p>
            </div>
          </button>
          
          <button
            onClick={() => handleRoleSelection('Creative')}
            className="w-full p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🎨</div>
              <h3 className="text-lg font-semibold">Creative</h3>
              <p className="text-gray-600 text-sm">Apply to projects and showcase your creative work</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'client-info') {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Client Information</h2>
        <ErrorDisplay error={error || undefined} />
        
        {validationErrors.length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={registrationData.client.companyName}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                client: { ...prev.client, companyName: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry *
            </label>
            <input
              type="text"
              value={registrationData.client.industry}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                client: { ...prev.client, industry: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Fashion, Technology, Food"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website *
            </label>
            <input
              type="url"
              value={registrationData.client.website}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                client: { ...prev.client, website: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://yourcompany.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Information
            </label>
            <textarea
              value={registrationData.client.description}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                client: { ...prev.client, description: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Tell us more about your company..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep('role-selection')}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={validateAndRegister}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'creative-info') {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Creative Information</h2>
        <ErrorDisplay error={error || undefined} />
        
        {validationErrors.length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specializations *
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                id="specialization"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Graphic Design"
              />
              <button
                type="button"
                onClick={addSpecialization}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {registrationData.creative.specializations.map((specialization, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                >
                  {specialization}
                  <button
                    type="button"
                    onClick={() => removeSpecialization(index)}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experience Level *
            </label>
            <select
              value={registrationData.creative.experienceLevel}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                creative: { ...prev.creative, experienceLevel: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select experience level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
              <option value="master">Master</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Rate (ICP) - Optional
            </label>
            <input
              type="number"
              value={registrationData.creative.hourlyRate}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                creative: { ...prev.creative, hourlyRate: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="50"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portfolio Links
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                id="portfolioLink"
                type="url"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://your-portfolio.com"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPortfolioLink();
                  }
                }}
              />
              <button
                type="button"
                onClick={addPortfolioLink}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {registrationData.creative.portfolioLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm text-gray-700 truncate">{link}</span>
                  <button
                    type="button"
                    onClick={() => removePortfolioLink(index)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Information
            </label>
            <textarea
              value={registrationData.creative.description}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                creative: { ...prev.creative, description: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Tell us about your creative work and style..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setStep('role-selection')}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={validateAndRegister}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
