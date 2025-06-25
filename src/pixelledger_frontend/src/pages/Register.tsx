import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { useNavigate, Link } from 'react-router-dom';
import { LoadingScreen } from '../components/LoadingScreen';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, Users } from 'lucide-react';
import ThreeBackground from '@/components/ThreeBackground';

export default function Register() {
  const { isAuthenticated, isInitialized } = useAuth();
  const { isRegistered, loading: roleLoading } = useRoleAuth();
  const navigate = useNavigate();

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <LoadingScreen 
        message="Initializing authentication..."
        submessage="Please wait while we set up your session"
      />
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Show loading while checking registration
  if (roleLoading) {
    return (
      <LoadingScreen 
        message="Checking your account..."
        submessage="Verifying your registration status"
      />
    );
  }

  // Redirect to dashboard if already registered
  if (isRegistered) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <ThreeBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                PixelLedger
              </span>
            </Link>
            <h1 className="text-3xl font-bold mb-2 text-white">
              Choose Your <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Path</span>
            </h1>
            <p className="text-gray-400">Select your role to get started with PixelLedger</p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Client Card */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">I&apos;m a Client</CardTitle>
                <CardDescription className="text-gray-400">
                  Connect with talented creatives to bring your projects to life
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-300 space-y-2 mb-6">
                  <li>• Create and manage projects</li>
                  <li>• Find the perfect creatives</li>
                  <li>• Track project performance</li>
                  <li>• Secure escrow payments</li>
                </ul>
                <Button 
                  onClick={() => navigate('/onboarding/client')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Start as Client
                </Button>
              </CardContent>
            </Card>

            {/* Creative Card */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-white">I&apos;m a Creative</CardTitle>
                <CardDescription className="text-gray-400">
                  Showcase your skills and connect with clients that value your creative work
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-300 space-y-2 mb-6">
                  <li>• Apply to exciting projects</li>
                  <li>• Showcase your portfolio</li>
                  <li>• Get paid securely</li>
                  <li>• Build client relationships</li>
                </ul>
                <Button 
                  onClick={() => navigate('/onboarding/creative')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  Start as Creative
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-400 text-sm">
              Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
