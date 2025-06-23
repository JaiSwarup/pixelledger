import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Globe, Users, Target, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { BrandInfo, Profile } from '../../../declarations/brandpool_backend/brandpool_backend.did';
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
const campaignTypeOptions = [
  'Product Reviews', 'Brand Awareness', 'Product Launch', 
  'Event Promotion', 'Educational Content', 'User Generated Content'
];

const goalOptions = [
  'Increase Brand Awareness', 'Drive Sales', 'Build Community',
  'Launch New Product', 'Educate Audience', 'Generate Leads'
];

const industryOptions = [
  { value: 'technology', label: 'Technology' },
  { value: 'fashion', label: 'Fashion & Beauty' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'finance', label: 'Finance & Crypto' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' }
];

const companySizeOptions = [
  { value: 'startup', label: 'Startup (1-10 employees)' },
  { value: 'small', label: 'Small (11-50 employees)' },
  { value: 'medium', label: 'Medium (51-200 employees)' },
  { value: 'large', label: 'Large (200+ employees)' }
];

const budgetOptions = [
  { value: '500-1000', label: '500 - 1,000 ICP' },
  { value: '1000-5000', label: '1,000 - 5,000 ICP' },
  { value: '5000-10000', label: '5,000 - 10,000 ICP' },
  { value: '10000+', label: '10,000+ ICP' }
];

interface BrandOnboardingProps {
  onRegistrationComplete: () => void;
}

export const BrandOnboarding: React.FC<BrandOnboardingProps> = ({ onRegistrationComplete }) => {
  const navigate = useNavigate();
  const { isAuthenticated, principal } = useAuth();
  const { registerUser, loading, error } = useRoleAuth();
  const { validateBrandInfo } = useRoleValidation();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    industry: '',
    companySize: '',
    description: '',
    budget: '',
    campaignTypes: [] as string[],
    targetAudience: '',
    goals: [] as string[],
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

  const handleCheckboxChange = useCallback((field: 'campaignTypes' | 'goals') => (
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
    if (!formData.companyName || !formData.website || !formData.industry || !formData.username) {
      toast.error("Required Fields Missing", {
        description: "Please fill in all required fields."
      });
      return;
    }

    try {
      // Prepare brand info
      const brandInfo: BrandInfo = {
        companyName: formData.companyName,
        website: formData.website,
        industry: formData.industry,
        verificationStatus: { 'Pending': null }
      };

      // Validate brand info
      const brandValidationErrors = validateBrandInfo([brandInfo]);
      if (brandValidationErrors.length > 0) {
        setValidationErrors(brandValidationErrors);
        toast.error("Validation Error", {
          description: "Please correct the errors in your brand information."
        });
        return;
      }

      // Register user
      const profile: Profile = {
        username: formData.username,
        bio: formData.bio || formData.description,
        socialLinks: formData.socialLinks.filter(link => link.trim() !== ''),
        role: { 'Brand': null },
        brandInfo: [brandInfo],
        influencerInfo: [],
        completedCampaigns: []
      };

      const result = await registerUser({ 'Brand': null }, brandInfo, undefined, profile);

      if (result.success) {
        toast.success("Welcome to BrandPool!", {
          description: "Your brand profile has been created successfully."
        });
        onRegistrationComplete();
      }
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error("Registration Failed", {
        description: "There was an error creating your profile. Please try again."
      });
    }
  }, [formData, validateBrandInfo, registerUser, onRegistrationComplete]);

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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                BrandPool
              </span>
            </Link>
            <h1 className="text-3xl font-bold mb-2">
              Brand <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Onboarding</span>
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
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {i}
                </div>
              ))}
            </div>
            <div className="h-2 bg-gray-700 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
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
                  {step === 1 && <Building2 className="w-6 h-6 text-blue-400" />}
                  {step === 2 && <Target className="w-6 h-6 text-blue-400" />}
                  {step === 3 && <Users className="w-6 h-6 text-blue-400" />}
                  
                  {step === 1 && 'Company Information'}
                  {step === 2 && 'Campaign Preferences'}
                  {step === 3 && 'Profile Setup'}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {step === 1 && 'Tell us about your company and brand'}
                  {step === 2 && 'Define your campaign goals and preferences'}
                  {step === 3 && 'Complete your brand profile setup'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Company Info */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName" className="text-white">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange('companyName')}
                        placeholder="Enter your company name"
                        className="mt-1 bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="website" className="text-white">Website *</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={handleInputChange('website')}
                        placeholder="https://your-website.com"
                        className="mt-1 bg-gray-800 border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="industry" className="text-white">Industry *</Label>
                      <Select onValueChange={handleSelectChange('industry')}>
                        <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {industryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="companySize" className="text-white">Company Size</Label>
                      <Select onValueChange={handleSelectChange('companySize')}>
                        <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {companySizeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-white">Company Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={handleInputChange('description')}
                        placeholder="Tell us about your company and what you do..."
                        className="mt-1 bg-gray-800 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Campaign Preferences */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="budget" className="text-white">Monthly Campaign Budget (ICP)</Label>
                      <Select onValueChange={handleSelectChange('budget')}>
                        <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {budgetOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white">Preferred Campaign Types</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {campaignTypeOptions.map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={type}
                              checked={formData.campaignTypes.includes(type)}
                              onCheckedChange={(checked) => handleCheckboxChange('campaignTypes')(type, !!checked)}
                            />
                            <Label htmlFor={type} className="text-sm text-gray-300">{type}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="targetAudience" className="text-white">Target Audience</Label>
                      <Textarea
                        id="targetAudience"
                        value={formData.targetAudience}
                        onChange={handleInputChange('targetAudience')}
                        placeholder="Describe your ideal audience (age, interests, demographics)..."
                        className="mt-1 bg-gray-800 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label className="text-white">Marketing Goals</Label>
                      <div className="grid grid-cols-1 gap-3 mt-2">
                        {goalOptions.map((goal) => (
                          <div key={goal} className="flex items-center space-x-2">
                            <Checkbox
                              id={goal}
                              checked={formData.goals.includes(goal)}
                              onCheckedChange={(checked) => handleCheckboxChange('goals')(goal, !!checked)}
                            />
                            <Label htmlFor={goal} className="text-sm text-gray-300">{goal}</Label>
                          </div>
                        ))}
                      </div>
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
                        placeholder="Tell the community about your brand..."
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

                    <div className="p-4 bg-gray-800/50 rounded-lg border border-blue-500/20">
                      <h4 className="font-semibold mb-2 text-white">Profile Summary</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-blue-400">Company:</span> <span className="text-gray-300">{formData.companyName}</span></p>
                        <p><span className="text-blue-400">Industry:</span> <span className="text-gray-300">{formData.industry}</span></p>
                        <p><span className="text-blue-400">Budget:</span> <span className="text-gray-300">{formData.budget} ICP/month</span></p>
                        <p><span className="text-blue-400">Campaign Types:</span> <span className="text-gray-300">{formData.campaignTypes.join(', ')}</span></p>
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
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmit} 
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
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

export default BrandOnboarding;
