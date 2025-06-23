import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Globe, Users, Target, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {UserRole, BrandInfo, InfluencerInfo} from '../../../declarations/brandpool_backend/brandpool_backend.did';
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
  const { validateBrandInfo, validateInfluencerInfo } = useRoleValidation();
  
  const [selectedRole, setSelectedRole] = useState<'Brand' | 'Influencer' | null>(null);
  const [step, setStep] = useState<'role-selection' | 'brand-info' | 'influencer-info'>('role-selection');
  const [registrationData, setRegistrationData] = useState({
    brand: {
      companyName: '',
      industry: '',
      website: '',
      description: ''
    },
    influencer: {
      followerCount: '',
      engagementRate: '',
      contentCategories: [] as string[],
      portfolioLinks: [] as string[],
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
            You are already registered as a <strong>{userAccount.role && 'Brand' in userAccount.role ? 'Brand' : 'Influencer'}</strong>.
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

  const handleRoleSelection = (role: 'Brand' | 'Influencer') => {
    setSelectedRole(role);
    setStep(role === 'Brand' ? 'brand-info' : 'influencer-info');
  };

  const validateAndRegister = async () => {
    if (!selectedRole) return;

    setValidationErrors([]);

    if (selectedRole === 'Brand') {
      const brandInfo: BrandInfo = {
        companyName: registrationData.brand.companyName,
        industry: registrationData.brand.industry,
        website: registrationData.brand.website,
        verificationStatus: { Pending: null }
      };

      const errors = validateBrandInfo([brandInfo]);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      const role: UserRole = { Brand: null };
      const result = await registerUser(role, brandInfo, undefined, undefined);
      
      if (result.success) {
        onRegistrationComplete();
      }
    } else if (selectedRole === 'Influencer') {
      const influencerInfo: InfluencerInfo = {
        followerCount: BigInt(registrationData.influencer.followerCount || '0'),
        engagementRate: parseFloat(registrationData.influencer.engagementRate || '0'),
        contentCategories: registrationData.influencer.contentCategories,
        portfolioLinks: registrationData.influencer.portfolioLinks,
        verificationStatus: { Pending: null }
      };

      const errors = validateInfluencerInfo([influencerInfo]);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      const role: UserRole = { Influencer: null };
      const result = await registerUser(role, undefined, influencerInfo, undefined);

      if (result.success) {
        onRegistrationComplete();
      }
    }
  };

  const addContentCategory = () => {
    const input = document.getElementById('contentCategory') as HTMLInputElement;
    if (input && input.value.trim()) {
      setRegistrationData(prev => ({
        ...prev,
        influencer: {
          ...prev.influencer,
          contentCategories: [...prev.influencer.contentCategories, input.value.trim()]
        }
      }));
      input.value = '';
    }
  };

  const removeContentCategory = (index: number) => {
    setRegistrationData(prev => ({
      ...prev,
      influencer: {
        ...prev.influencer,
        contentCategories: prev.influencer.contentCategories.filter((_, i) => i !== index)
      }
    }));
  };

  const addPortfolioLink = () => {
    const input = document.getElementById('portfolioLink') as HTMLInputElement;
    if (input && input.value.trim()) {
      setRegistrationData(prev => ({
        ...prev,
        influencer: {
          ...prev.influencer,
          portfolioLinks: [...prev.influencer.portfolioLinks, input.value.trim()]
        }
      }));
      input.value = '';
    }
  };

  const removePortfolioLink = (index: number) => {
    setRegistrationData(prev => ({
      ...prev,
      influencer: {
        ...prev.influencer,
        portfolioLinks: prev.influencer.portfolioLinks.filter((_, i) => i !== index)
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
            onClick={() => handleRoleSelection('Brand')}
            className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🏢</div>
              <h3 className="text-lg font-semibold">Brand</h3>
              <p className="text-gray-600 text-sm">Create campaigns and hire influencers</p>
            </div>
          </button>
          
          <button
            onClick={() => handleRoleSelection('Influencer')}
            className="w-full p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">⭐</div>
              <h3 className="text-lg font-semibold">Influencer</h3>
              <p className="text-gray-600 text-sm">Apply to campaigns and showcase your work</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'brand-info') {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Brand Information</h2>
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
              value={registrationData.brand.companyName}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                brand: { ...prev.brand, companyName: e.target.value }
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
              value={registrationData.brand.industry}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                brand: { ...prev.brand, industry: e.target.value }
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
              value={registrationData.brand.website}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                brand: { ...prev.brand, website: e.target.value }
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
              value={registrationData.brand.description}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                brand: { ...prev.brand, description: e.target.value }
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

  if (step === 'influencer-info') {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Influencer Information</h2>
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
              Follower Count *
            </label>
            <input
              type="number"
              value={registrationData.influencer.followerCount}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                influencer: { ...prev.influencer, followerCount: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="10000"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Engagement Rate (%) *
            </label>
            <input
              type="number"
              step="0.1"
              value={registrationData.influencer.engagementRate}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                influencer: { ...prev.influencer, engagementRate: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="5.2"
              min="0"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content Categories *
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                id="contentCategory"
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Fashion, Travel, Tech"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addContentCategory();
                  }
                }}
              />
              <button
                onClick={addContentCategory}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {registrationData.influencer.contentCategories.map((category, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                >
                  {category}
                  <button
                    onClick={() => removeContentCategory(index)}
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
              Portfolio Links
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                id="portfolioLink"
                type="url"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://instagram.com/yourhandle"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPortfolioLink();
                  }
                }}
              />
              <button
                onClick={addPortfolioLink}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="space-y-1">
              {registrationData.influencer.portfolioLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm text-gray-700 truncate">{link}</span>
                  <button
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
              value={registrationData.influencer.description}
              onChange={(e) => setRegistrationData(prev => ({
                ...prev,
                influencer: { ...prev.influencer, description: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Tell us about your content style and audience..."
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
