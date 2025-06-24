import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Globe, Users, Target, ArrowRight, ArrowLeft } from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../hooks/useAuth';
import { BrandInfo, Profile } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { useRoleAuth, useRoleValidation } from '../hooks/useRoleAuth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from './ui/form';
import ThreeBackground from './ThreeBackground';
import { toast } from 'sonner';

// Static options - defined outside component to prevent re-creation
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

// Form schema
const formSchema = z.object({
  // Step 1: Company Info
  companyName: z.string().min(1, 'Company name is required'),
  website: z.string().url('Please enter a valid URL'),
  industry: z.string().min(1, 'Industry is required'),
  companySize: z.string().optional(),
  description: z.string().optional(),
  
  // Step 2: Campaign Preferences
  budget: z.string().optional(),
  campaignTypes: z.array(z.string()),
  targetAudience: z.string().optional(),
  goals: z.array(z.string()),
  
  // Step 3: Profile Setup
  username: z.string().min(1, 'Username is required'),
  bio: z.string().optional(),
  socialLinks: z.array(z.string()),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
});

type FormData = z.infer<typeof formSchema>;

interface BrandOnboardingFormProps {
  onRegistrationComplete: () => void;
}

const BrandOnboardingForm: React.FC<BrandOnboardingFormProps> = ({ onRegistrationComplete }) => {
  const navigate = useNavigate();
  const { isAuthenticated, principal } = useAuth();
  const { registerUser, loading } = useRoleAuth();
  const { validateBrandInfo } = useRoleValidation();
  
  const [step, setStep] = useState(1);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      website: '',
      industry: '',
      companySize: '',
      description: '',
      budget: '',
      campaignTypes: [],
      targetAudience: '',
      goals: [],
      username: '',
      bio: '',
      socialLinks: [],
      terms: false
    }
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      // Prepare brand info
      const brandInfo: BrandInfo = {
        companyName: data.companyName,
        website: data.website,
        industry: data.industry,
        verificationStatus: { 'Pending': null }
      };

      // Validate brand info
      const brandValidationErrors = validateBrandInfo([brandInfo]);
      if (brandValidationErrors.length > 0) {
        toast.error("Validation Error", {
          description: brandValidationErrors.join(', ')
        });
        return;
      }

      // Register user
      const profile: Profile = {
        username: data.username,
        bio: data.bio || data.description || '',
        socialLinks: data.socialLinks.filter(link => link.trim() !== ''),
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
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const addSocialLink = () => {
    const currentLinks = form.getValues('socialLinks');
    form.setValue('socialLinks', [...currentLinks, '']);
  };

  const removeSocialLink = (index: number) => {
    const currentLinks = form.getValues('socialLinks');
    form.setValue('socialLinks', currentLinks.filter((_, i) => i !== index));
  };

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

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
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
                        <FormField
                
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Company Name *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter your company name"
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Website *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="https://your-website.com"
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Industry *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                    <SelectValue placeholder="Select your industry" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-gray-800 border-gray-600">
                                  {industryOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          name="companySize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Company Size</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                    <SelectValue placeholder="Select company size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-gray-800 border-gray-600">
                                  {companySizeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Company Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Tell us about your company and what you do..."
                                  className="bg-gray-800 border-gray-600 text-white"
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Step 2: Campaign Preferences */}
                    {step === 2 && (
                      <div className="space-y-4">
                        <FormField
                
                          name="budget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Monthly Campaign Budget (ICP)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                    <SelectValue placeholder="Select budget range" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-gray-800 border-gray-600">
                                  {budgetOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                
                          control={form.control}
                          name="campaignTypes"
                          render={() => (
                            <FormItem>
                              <FormLabel className="text-white">Preferred Campaign Types</FormLabel>
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                {campaignTypeOptions.map((type) => (
                                  <FormField
                                    key={type}
                        
                                    name="campaignTypes"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={type}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(type)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, type])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value: string) => value !== type
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm text-gray-300 font-normal">
                                            {type}
                                          </FormLabel>
                                        </FormItem>
                                      )
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                
                          control={form.control}
                          name="targetAudience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Target Audience</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Describe your ideal audience (age, interests, demographics)..."
                                  className="bg-gray-800 border-gray-600 text-white"
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                
                          control={form.control}
                          name="goals"
                          render={() => (
                            <FormItem>
                              <FormLabel className="text-white">Marketing Goals</FormLabel>
                              <div className="grid grid-cols-1 gap-3 mt-2">
                                {goalOptions.map((goal) => (
                                  <FormField
                                    key={goal}
                        
                          control={form.control}
                                    name="goals"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={goal}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(goal)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, goal])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== goal
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm text-gray-300 font-normal">
                                            {goal}
                                          </FormLabel>
                                        </FormItem>
                                      )
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Step 3: Profile Setup */}
                    {step === 3 && (
                      <div className="space-y-4">
                        <FormField
                
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Username *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Choose a unique username"
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Bio</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Tell the community about your brand..."
                                  className="bg-gray-800 border-gray-600 text-white"
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                
                          control={form.control}
                          name="socialLinks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Social Links</FormLabel>
                              <div className="space-y-2">
                                {field.value.map((link, index) => (
                                  <div key={index} className="flex gap-2">
                                    <Input
                                      value={link}
                                      onChange={(e) => {
                                        const newLinks = [...field.value];
                                        newLinks[index] = e.target.value;
                                        field.onChange(newLinks);
                                      }}
                                      placeholder="https://..."
                                      className="bg-gray-800 border-gray-600 text-white"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => removeSocialLink(index)}
                                      className="border-gray-600 text-gray-300"
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={addSocialLink}
                                  className="w-full border-gray-600 text-gray-300"
                                >
                                  Add Social Link
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="p-4 bg-gray-800/50 rounded-lg border border-blue-500/20">
                          <h4 className="font-semibold mb-2 text-white">Profile Summary</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-blue-400">Company:</span> <span className="text-gray-300">{form.watch('companyName')}</span></p>
                            <p><span className="text-blue-400">Industry:</span> <span className="text-gray-300">{form.watch('industry')}</span></p>
                            <p><span className="text-blue-400">Budget:</span> <span className="text-gray-300">{form.watch('budget')} ICP/month</span></p>
                            <p><span className="text-blue-400">Campaign Types:</span> <span className="text-gray-300">{form.watch('campaignTypes').join(', ')}</span></p>
                          </div>
                        </div>

                        <FormField
                
                          control={form.control}
                          name="terms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm text-gray-300">
                                  I agree to the Terms of Service and Privacy Policy
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6 border-t border-gray-700">
                      <Button
                        type="button"
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
                          type="button"
                          onClick={handleNext} 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button 
                          type="submit"
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
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default BrandOnboardingForm;
