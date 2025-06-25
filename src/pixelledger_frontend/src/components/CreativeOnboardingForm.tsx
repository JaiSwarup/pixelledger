import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Star, ArrowRight, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../hooks/useAuth';
import { CreativeInfo, Profile } from '../../../declarations/pixelledger_backend/pixelledger_backend.did';
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
const specializationOptions = [
  'Logo Design', 'Web Design', 'Graphic Design', 'Digital Marketing',
  'Content Creation', 'Brand Identity', 'UI/UX Design', 'Video Production',
  'Photography', 'Animation', 'Social Media', 'Copywriting'
];

// Form schema
const formSchema = z.object({
  // Step 1: Creative Skills & Experience
  specializations: z.array(z.string()).min(1, 'Please select at least one specialization'),
  experienceLevel: z.string().min(1, 'Experience level is required'),
  portfolioLinks: z.array(z.string()).min(1, 'Please add at least one portfolio link'),
  hourlyRate: z.string().optional(),
  
  // Step 2: Profile Setup
  username: z.string().min(1, 'Username is required'),
  bio: z.string(),
  socialLinks: z.array(z.string()),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
});

type FormData = z.infer<typeof formSchema>;

interface CreativeOnboardingFormProps {
  onRegistrationComplete: () => void;
}

const CreativeOnboardingForm: React.FC<CreativeOnboardingFormProps> = ({ onRegistrationComplete }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { registerUser, loading } = useRoleAuth();
  const { validateCreativeInfo } = useRoleValidation();
  
  const [step, setStep] = useState(1);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      specializations: [],
      experienceLevel: '',
      portfolioLinks: [''],
      hourlyRate: '',
      username: '',
      bio: '',
      socialLinks: [''],
      terms: false
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Prepare creative info
      const creativeInfo: CreativeInfo = {
        specializations: data.specializations,
        experienceLevel: data.experienceLevel === 'beginner' ? { 'Beginner': null } :
                        data.experienceLevel === 'intermediate' ? { 'Intermediate': null } :
                        data.experienceLevel === 'expert' ? { 'Expert': null } : { 'Master': null },
        portfolioLinks: data.portfolioLinks.filter(link => link.trim() !== ''),
        hourlyRate: data.hourlyRate ? [BigInt(parseInt(data.hourlyRate))] : [],
        verificationStatus: { 'Pending': null }
      };

      // Validate creative info
      const creativeValidationErrors = validateCreativeInfo([creativeInfo]);
      if (creativeValidationErrors.length > 0) {
        toast.error("Validation Error", {
          description: creativeValidationErrors.join(', ')
        });
        return;
      }

      // Register user
      const profile: Profile = {
        username: data.username,
        bio: data.bio,
        socialLinks: data.socialLinks.filter(link => link.trim() !== ''),
        role: { 'Creative': null },
        clientInfo: [],
        creativeInfo: [creativeInfo],
        completedProjects: []
      };

      const result = await registerUser({ 'Creative': null }, undefined, creativeInfo, profile);

      if (result.success) {
        toast.success("Welcome to PixelLedger!", {
          description: "Your creative profile has been created successfully."
        });
        onRegistrationComplete();
      }
    } catch (error) {
      toast.error("Registration Error" +  (error instanceof Error ? `: ${error.message}` : ''));
    }
  };

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
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
                PixelLedger
              </span>
            </Link>
            <h1 className="text-3xl font-bold mb-2">
              Creative <span className="bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">Onboarding</span>
            </h1>
            <p className="text-gray-400">Step {step} of 2</p>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2].map((i) => (
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
                style={{ width: `${(step / 2) * 100}%` }}
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
                      {step === 2 && <Star className="w-6 h-6 text-purple-400" />}
                      
                      {step === 1 && 'Creative Skills & Experience'}
                      {step === 2 && 'Profile Setup'}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {step === 1 && 'Share your creative skills and professional experience'}
                      {step === 2 && 'Complete your creative profile setup'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Step 1: Creative Skills & Experience */}
                    {step === 1 && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="specializations"
                          render={() => (
                            <FormItem>
                              <FormLabel className="text-white">Specializations *</FormLabel>
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                {specializationOptions.map((specialization) => (
                                  <FormField
                                    key={specialization}
                                    control={form.control}
                                    name="specializations"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={specialization}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(specialization)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, specialization])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== specialization
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm text-gray-300 font-normal">
                                            {specialization}
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
                          name="experienceLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Experience Level *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                    <SelectValue placeholder="Select your experience level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="intermediate">Intermediate</SelectItem>
                                  <SelectItem value="expert">Expert</SelectItem>
                                  <SelectItem value="master">Master</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div>
                          <FormLabel className="text-white">Portfolio Links *</FormLabel>
                          {form.watch('portfolioLinks').map((_, index) => (
                            <div key={index} className="flex gap-2 mt-2">
                              <FormField
                                control={form.control}
                                name={`portfolioLinks.${index}`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="https://your-portfolio.com"
                                        className="bg-gray-800 border-gray-600 text-white"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              {form.watch('portfolioLinks').length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removePortfolioLink(index)}
                                  className="px-3"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addPortfolioLink}
                            className="mt-2"
                          >
                            Add Portfolio Link
                          </Button>
                        </div>

                        <FormField
                          control={form.control}
                          name="hourlyRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Hourly Rate (ICP) - Optional</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  placeholder="e.g., 50"
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Step 2: Profile Setup */}
                    {step === 2 && (
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
                                  placeholder="Enter your username"
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
                                  placeholder="Tell us about yourself and your creative journey..."
                                  className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div>
                          <FormLabel className="text-white">Social Links</FormLabel>
                          {form.watch('socialLinks').map((_, index) => (
                            <div key={index} className="flex gap-2 mt-2">
                              <FormField
                                control={form.control}
                                name={`socialLinks.${index}`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="https://twitter.com/username"
                                        className="bg-gray-800 border-gray-600 text-white"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              {form.watch('socialLinks').length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeSocialLink(index)}
                                  className="px-3"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addSocialLink}
                            className="mt-2"
                          >
                            Add Social Link
                          </Button>
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
                                  I accept the{' '}
                                  <Link to="/terms" className="text-purple-400 hover:underline">
                                    Terms and Conditions
                                  </Link>{' '}
                                  and{' '}
                                  <Link to="/privacy" className="text-purple-400 hover:underline">
                                    Privacy Policy
                                  </Link>
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>

                  {step < 2 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      {loading ? 'Creating Account...' : 'Complete Registration'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CreativeOnboardingForm;
