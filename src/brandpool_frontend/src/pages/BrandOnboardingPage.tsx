import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRoleAuth } from '../hooks/useRoleAuth';
import { useNavigate } from 'react-router-dom';
import { BrandOnboarding } from '../components/BrandOnboarding';
import { LoadingScreen } from '../components/LoadingScreen';

export default function BrandOnboardingPage() {
  const { isAuthenticated, isInitialized } = useAuth();
  const { isRegistered, loading: roleLoading } = useRoleAuth();
  const navigate = useNavigate();

  const handleRegistrationComplete = () => {
    navigate('/dashboard');
  };

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
    <BrandOnboarding onRegistrationComplete={handleRegistrationComplete} />
  );
}
