import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Star, Camera, Globe, ArrowRight, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../hooks/useAuth';
import { InfluencerInfo, Profile } from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { useRoleAuth, useRoleValidation } from '../hooks/useRoleAuth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import ThreeBackground from './ThreeBackground';
import { toast } from 'sonner';

// Static options - defined outside component to prevent re-creation
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

// Form schema
const formSchema = z.object({
  // Step 1: Creator Metrics
  followerCount: z.string().min(1, 'Follower count is required').refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Must be a valid number greater than 0'),
  engagementRate: z.string().min(1, 'Engagement rate is required').refine(val => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, 'Must be between 0 and 100'),
  platforms: z.array(z.string()).min(1, 'Please select at least one platform'),
  averageViews: z.string().optional(),
  audienceDemographics: z.string().optional(),
  
  // Step 2: Content & Collaboration
  contentCategories: z.array(z.string()).min(1, 'Please select at least one content category'),
  collaborationTypes: z.array(z.string()),
  priceRange: z.string().optional(),
  portfolioLinks: z.array(z.string()),
  description: z.string().optional(),
  
  // Step 3: Profile Setup
  username: z.string().min(1, 'Username is required'),
  bio: z.string(),
  socialLinks: z.array(z.string()),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
});

type FormData = z.infer<typeof formSchema>;

interface InfluencerOnboardingFormProps {
  onRegistrationComplete: () => void;
}

const InfluencerOnboardingForm: React.FC<InfluencerOnboardingFormProps> = ({ onRegistrationComplete }) => {
  const navigate = useNavigate();
  const { isAuthenticated, principal } = useAuth();
  const { registerUser, loading } = useRoleAuth();
  const { validateInfluencerInfo } = useRoleValidation();
  
  const [step, setStep] = useState(1);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      followerCount: '',
      engagementRate: '',
      platforms: [],
      averageViews: '',
      audienceDemographics: '',
      contentCategories: [],
      collaborationTypes: [],
      priceRange: '',
      portfolioLinks: [],
      description: '',
      username: '',
      bio: '',
      socialLinks: [],
      terms: false
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Prepare influencer info
      const influencerInfo: InfluencerInfo = {
        followerCount: BigInt(parseInt(data.followerCount) || 0),
        engagementRate: parseFloat(data.engagementRate) || 0,
        contentCategories: data.contentCategories,
        portfolioLinks: data.portfolioLinks.filter(link => link.trim() !== ''),
        verificationStatus: { 'Pending': null }
      };

      // Validate influencer info
      const influencerValidationErrors = validateInfluencerInfo([influencerInfo]);
      if (influencerValidationErrors.length > 0) {
        toast.error("Validation Error", {
          description: influencerValidationErrors.join(', ')
        });
        return;
      }

      // Register user
      const profile: Profile = {
        username: data.username,
        bio: data.bio || data.description || '',
        socialLinks: data.socialLinks.filter(link => link.trim() !== ''),
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
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const addPortfolioLink = () => {
    const currentLinks = form.getValues('portfolioLinks');
    form.setValue('portfolioLinks', [...currentLinks, '']);
  };

  const removePortfolioLink = (index: number) => {
    const currentLinks = form.getValues('portfolioLinks');
    form.setValue('portfolioLinks', currentLinks.filter((_, i) => i !== index));
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
                        <FormField
                          control={form.control}
                          name="followerCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Total Follower Count *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  placeholder="Enter your total follower count"
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="engagementRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Average Engagement Rate (%) *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.1"
                                  placeholder="e.g., 3.5"
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="platforms"
                          render={() => (
                            <FormItem>
                              <FormLabel className="text-white">Primary Platforms *</FormLabel>
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                {platformOptions.map((platform) => (
                                  <FormField
                                    key={platform}
                                    control={form.control}
                                    name="platforms"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={platform}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(platform)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, platform])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== platform
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm text-gray-300 font-normal">
                                            {platform}
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
                          name="averageViews"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Average Views/Impressions</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., 50,000"
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="audienceDemographics"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Audience Demographics</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Describe your audience (age, location, interests)..."
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

                    {/* Step 2: Content & Collaboration */}
                    {step === 2 && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="contentCategories"
                          render={() => (
                            <FormItem>
                              <FormLabel className="text-white">Content Categories *</FormLabel>
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                {contentCategoryOptions.map((category) => (
                                  <FormField
                                    key={category}
                                    control={form.control}
                                    name="contentCategories"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={category}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(category)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, category])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== category
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm text-gray-300 font-normal">
                                            {category}
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
                          name="collaborationTypes"
                          render={() => (
                            <FormItem>
                              <FormLabel className="text-white">Collaboration Types</FormLabel>
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                {collaborationTypeOptions.map((type) => (
                                  <FormField
                                    key={type}
                                    control={form.control}
                                    name="collaborationTypes"
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
                                                        (value) => value !== type
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
                          name="priceRange"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Price Range (ICP per post)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                    <SelectValue placeholder="Select your price range" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-gray-800 border-gray-600">
                                  {priceRangeOptions.map((option) => (
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
                          name="portfolioLinks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Portfolio Links</FormLabel>
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
                                      onClick={() => removePortfolioLink(index)}
                                      className="border-gray-600 text-gray-300"
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={addPortfolioLink}
                                  className="w-full border-gray-600 text-gray-300"
                                >
                                  Add Portfolio Link
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Content Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Describe your content style and what makes you unique..."
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
                                  placeholder="Tell brands about yourself and your content..."
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

                        <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-500/20">
                          <h4 className="font-semibold mb-2 text-white">Profile Summary</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-purple-400">Followers:</span> <span className="text-gray-300">{form.watch('followerCount')}</span></p>
                            <p><span className="text-purple-400">Engagement Rate:</span> <span className="text-gray-300">{form.watch('engagementRate')}%</span></p>
                            <p><span className="text-purple-400">Platforms:</span> <span className="text-gray-300">{form.watch('platforms').join(', ')}</span></p>
                            <p><span className="text-purple-400">Content Categories:</span> <span className="text-gray-300">{form.watch('contentCategories').join(', ')}</span></p>
                            <p><span className="text-purple-400">Price Range:</span> <span className="text-gray-300">{form.watch('priceRange')} ICP</span></p>
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
                          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                        >
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button 
                          type="submit"
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
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default InfluencerOnboardingForm;
