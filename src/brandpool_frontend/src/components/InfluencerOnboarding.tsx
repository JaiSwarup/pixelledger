import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Star, Camera, Globe, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { InfluencerInfo, Profile } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { useRoleAuth, useRoleValidation, ErrorDisplay } from '../hooks/useRoleAuth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import ThreeBackground from './ThreeBackground';
import { toast } from 'sonner';

// Static options moved outside component to prevent recreation on every render
const contentCategoryOptions = [
  'Fashion & Beauty', 'Gaming', 'Technology', 'Health & Fitness',
  'Food & Cooking', 'Travel', 'Music', 'Art & Design',
  'Comedy & Entertainment', 'Education', 'Lifestyle', 'Sports'
];

const platformOptions = [
  'Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'Twitch', 
  'LinkedIn', 'Snapchat', 'Pinterest', 'Facebook', 'Discord'
];

const collaborationTypeOptions = [
  'Sponsored Posts', 'Product Reviews', 'Brand Ambassadorship',
  'Event Coverage', 'Tutorial Creation', 'Unboxing Videos',
  'Story Features', 'Live Streaming', 'Giveaways', 'Long-term Partnerships'
];

const priceRangeOptions = [
  { value: '10-50', label: '10 - 50 ICP' },
  { value: '50-100', label: '50 - 100 ICP' },
  { value: '100-500', label: '100 - 500 ICP' },
  { value: '500-1000', label: '500 - 1,000 ICP' },
  { value: '1000+', label: '1,000+ ICP' }
];

interface InfluencerOnboardingProps {
  onRegistrationComplete: () => void;
}

export const InfluencerOnboarding: React.FC<InfluencerOnboardingProps> = ({ onRegistrationComplete }) => {
  const navigate = useNavigate();
  const { isAuthenticated, principal } = useAuth();
  const { registerUser, loading, error } = useRoleAuth();
  const { validateInfluencerInfo } = useRoleValidation();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    followerCount: '',
    engagementRate: '',
    contentCategories: [] as string[],
    portfolioLinks: [] as string[],
    description: '',
    platforms: [] as string[],
    averageViews: '',
    audienceDemographics: '',
    collaborationTypes: [] as string[],
    priceRange: '',
    username: '',
    bio: '',
    socialLinks: [] as string[],
    terms: false
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Memoized form handlers to prevent recreation on every render
  const handleNext = useCallback(() => {
    if (step < 3) setStep(step + 1);
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  // Optimized input handlers
  const handleInputChange = useCallback((field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  }, []);

  const handleSelectChange = useCallback((field: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleCheckboxChange = useCallback((field: 'contentCategories' | 'platforms' | 'collaborationTypes') => (
    item: string,
    checked: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field], item]
        : prev[field].filter(t => t !== item)
    }));
  }, []);

  const handleTermsChange = useCallback((checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      terms: checked
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.terms) {
      toast.error("Terms Required", {
        description: "Please accept the terms and conditions to continue."
      });
      return;
    }

    // Validate required fields
    if (!formData.followerCount || !formData.engagementRate || !formData.username) {
      toast.error("Required Fields Missing", {
        description: "Please fill in all required fields."
      });
      return;
    }

    try {
      // Prepare influencer info
      const influencerInfo: InfluencerInfo = {
        followerCount: BigInt(parseInt(formData.followerCount) || 0),
        engagementRate: parseFloat(formData.engagementRate) || 0,
        contentCategories: formData.contentCategories,
        portfolioLinks: formData.portfolioLinks.filter(link => link.trim() !== ''),
        verificationStatus: { 'Pending': null }
      };

      // Validate influencer info
      const influencerValidationErrors = validateInfluencerInfo([influencerInfo]);
      if (influencerValidationErrors.length > 0) {
        setValidationErrors(influencerValidationErrors);
        toast.error("Validation Error", {
          description: "Please correct the errors in your influencer information."
        });
        return;
      }

      // Register user
      const profile: Profile = {
        username: formData.username,
        bio: formData.bio || formData.description,
        socialLinks: formData.socialLinks.filter(link => link.trim() !== ''),
        role: { 'Influencer': null },
        brandInfo: [],
        influencerInfo: [influencerInfo],
        completedCampaigns: []
      };

      const result = await registerUser({ 'Influencer': null }, undefined, influencerInfo, profile);

      if (result.success) {
        toast.success("Welcome to BrandPool!", {
          description: "Your influencer profile has been created successfully."
        });
        onRegistrationComplete();
      }
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error("Registration Failed", {
        description: "There was an error creating your profile. Please try again."
      });
    }
  }, [formData, validateInfluencerInfo, registerUser, onRegistrationComplete]);

  // Optimized portfolio link handlers
  const handlePortfolioLinkAdd = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      portfolioLinks: [...prev.portfolioLinks, '']
    }));
  }, []);

  const handlePortfolioLinkChange = useCallback((index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.map((link, i) => i === index ? value : link)
    }));
  }, []);

  const handlePortfolioLinkRemove = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((_, i) => i !== index)
    }));
  }, []);

  // Optimized social link handlers
  const handleSocialLinkAdd = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, '']
    }));
  }, []);

  const handleSocialLinkChange = useCallback((index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => i === index ? value : link)
    }));
  }, []);

  const handleSocialLinkRemove = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Please authenticate to continue with registration.</p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <ThreeBackground />
      
      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
                BrandPool
              </span>
            </Link>
            <h1 className="text-3xl font-bold mb-2">
              Influencer <span className="bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">Onboarding</span>
            </h1>
            <p className="text-gray-400">Step {step} of 3</p>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i <= step 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white' 
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {i}
                </div>
              ))}
            </div>
            <div className="h-2 bg-gray-700 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Error Display */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <p key={index} className="text-red-400 text-sm">{error}</p>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  {step === 1 && <Users className="w-6 h-6 text-purple-400" />}
                  {step === 2 && <Camera className="w-6 h-6 text-purple-400" />}
                  {step === 3 && <Star className="w-6 h-6 text-purple-400" />}
                  
                  {step === 1 && 'Creator Metrics'}
                  {step === 2 && 'Content & Collaboration'}
                  {step === 3 && 'Profile Setup'}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {step === 1 && 'Share your audience and engagement statistics'}
                  {step === 2 && 'Tell us about your content and collaboration preferences'}
                  {step === 3 && 'Complete your influencer profile setup'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Creator Metrics */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="followerCount" className="text-white">Total Follower Count *</Label>
                      <Input
                        id="followerCount"
                        type="number"
                        value={formData.followerCount}
                        onChange={handleInputChange('followerCount')}
                        placeholder="Enter your total follower count"
                        className="mt-1 bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="engagementRate" className="text-white">Average Engagement Rate (%) *</Label>
                      <Input
                        id="engagementRate"
                        type="number"
                        step="0.1"
                        value={formData.engagementRate}
                        onChange={handleInputChange('engagementRate')}
                        placeholder="e.g., 3.5"
                        className="mt-1 bg-gray-800 border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Primary Platforms</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {platformOptions.map((platform) => (
                          <div key={platform} className="flex items-center space-x-2">
                            <Checkbox
                              id={platform}
                              checked={formData.platforms.includes(platform)}
                              onCheckedChange={(checked) => handleCheckboxChange('platforms')(platform, !!checked)}
                            />
                            <Label htmlFor={platform} className="text-sm text-gray-300">{platform}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="averageViews" className="text-white">Average Views/Impressions</Label>
                      <Input
                        id="averageViews"
                        value={formData.averageViews}
                        onChange={handleInputChange('averageViews')}
                        placeholder="e.g., 50,000"
                        className="mt-1 bg-gray-800 border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="audienceDemographics" className="text-white">Audience Demographics</Label>
                      <Textarea
                        id="audienceDemographics"
                        value={formData.audienceDemographics}
                        onChange={handleInputChange('audienceDemographics')}
                        placeholder="Describe your audience (age, location, interests)..."
                        className="mt-1 bg-gray-800 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Content & Collaboration */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Content Categories</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {contentCategoryOptions.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={category}
                              checked={formData.contentCategories.includes(category)}
                              onCheckedChange={(checked) => handleCheckboxChange('contentCategories')(category, !!checked)}
                            />
                            <Label htmlFor={category} className="text-sm text-gray-300">{category}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Collaboration Types</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {collaborationTypeOptions.map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={type}
                              checked={formData.collaborationTypes.includes(type)}
                              onCheckedChange={(checked) => handleCheckboxChange('collaborationTypes')(type, !!checked)}
                            />
                            <Label htmlFor={type} className="text-sm text-gray-300">{type}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="priceRange" className="text-white">Price Range (ICP per post)</Label>
                      <Select onValueChange={handleSelectChange('priceRange')}>
                        <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Select your price range" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {priceRangeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white">Portfolio Links</Label>
                      <div className="space-y-2 mt-2">
                        {formData.portfolioLinks.map((link, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={link}
                              onChange={(e) => handlePortfolioLinkChange(index, e.target.value)}
                              placeholder="https://..."
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handlePortfolioLinkRemove(index)}
                              className="border-gray-600 text-gray-300"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePortfolioLinkAdd}
                          className="w-full border-gray-600 text-gray-300"
                        >
                          Add Portfolio Link
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-white">Content Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={handleInputChange('description')}
                        placeholder="Describe your content style and what makes you unique..."
                        className="mt-1 bg-gray-800 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Profile Setup */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username" className="text-white">Username *</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={handleInputChange('username')}
                        placeholder="Choose a unique username"
                        className="mt-1 bg-gray-800 border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio" className="text-white">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={handleInputChange('bio')}
                        placeholder="Tell brands about yourself and your content..."
                        className="mt-1 bg-gray-800 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label className="text-white">Social Links</Label>
                      <div className="space-y-2 mt-2">
                        {formData.socialLinks.map((link, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={link}
                              onChange={(e) => handleSocialLinkChange(index, e.target.value)}
                              placeholder="https://..."
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleSocialLinkRemove(index)}
                              className="border-gray-600 text-gray-300"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSocialLinkAdd}
                          className="w-full border-gray-600 text-gray-300"
                        >
                          Add Social Link
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-500/20">
                      <h4 className="font-semibold mb-2 text-white">Profile Summary</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-purple-400">Followers:</span> <span className="text-gray-300">{formData.followerCount}</span></p>
                        <p><span className="text-purple-400">Engagement Rate:</span> <span className="text-gray-300">{formData.engagementRate}%</span></p>
                        <p><span className="text-purple-400">Platforms:</span> <span className="text-gray-300">{formData.platforms.join(', ')}</span></p>
                        <p><span className="text-purple-400">Content Categories:</span> <span className="text-gray-300">{formData.contentCategories.join(', ')}</span></p>
                        <p><span className="text-purple-400">Price Range:</span> <span className="text-gray-300">{formData.priceRange} ICP</span></p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.terms}
                        onCheckedChange={handleTermsChange}
                      />
                      <Label htmlFor="terms" className="text-sm text-gray-300">
                        I agree to the Terms of Service and Privacy Policy
                      </Label>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t border-gray-700">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1}
                    className="border-gray-600 text-gray-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  {step < 3 ? (
                    <Button 
                      onClick={handleNext} 
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmit} 
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      {loading ? 'Creating Profile...' : 'Complete Setup'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InfluencerOnboarding;
