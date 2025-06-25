import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { useNavigate } from 'react-router-dom';

import ThreeBackground from '@/components/ThreeBackground';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Fingerprint, Loader2, Shield, Zap, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, isLoading, isAuthenticated, loginError } = useAuth();
  const { isRegistered, loading: roleLoading } = useRoleAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Navigate based on auth state
    if (isAuthenticated && !roleLoading) {
      if (isRegistered) {
        navigate('/dashboard');
      } else {
        navigate('/register');
      }
    }
  }, [isAuthenticated, isRegistered, roleLoading, navigate]);
  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure Authentication',
      description: 'Login with Internet Identity for maximum security'
    },
    {
      icon: <Fingerprint className="w-6 h-6" />,
      title: 'Biometric Support',
      description: 'Use your fingerprint or face ID for quick access'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Access',
      description: 'No passwords to remember, just secure Web3 auth'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ThreeBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center space-x-2">
                <motion.div 
                  className="w-12 h-12 bg-cyber-gradient rounded-lg"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="text-3xl font-orbitron font-bold cyber-text-gradient">
                  PixelLedger
                </span>
              </Link>
              <p className="text-gray-400 mt-2">Welcome to the future of influence</p>
            </div>

            {/* Error Message */}
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6"
              >
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Authentication Error</span>
                </div>
                <p className="text-red-300 text-sm mt-1">{loginError}</p>
              </motion.div>
            )}

            {/* Login Card */}
            <Card className="neuro-card">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-orbitron cyber-text-gradient">
                  Secure Login
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Connect with Internet Identity for Web3 authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button 
                  onClick={login}
                    disabled={isLoading}
                  className="w-full cyber-button text-lg py-6 group"
                  size="lg"
                >
                    {isLoading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Loading...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <Fingerprint className="w-6 h-6 mr-3" />
                        <span>Login with Internet Identity</span>
                      </span>
                    )}
                </Button>

                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/30"
                    >
                      <div className="text-cyber-teal">
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{feature.title}</h4>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400">
                    New to Web3? Internet Identity is a secure, decentralized way to authenticate without passwords.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <Link 
                to="/" 
                className="text-cyber-teal hover:text-cyber-pink transition-colors duration-300"
              >
                ← Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    );
}