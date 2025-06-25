import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

interface AuthContextType {
  isAuthenticated: boolean;
  identity: Identity | null;
  principal: Principal | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean;
  loginError: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Initialize auth client on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const client = await AuthClient.create();
        setAuthClient(client);

        const isAuthenticated = await client.isAuthenticated();
        console.log('Auth initialization - isAuthenticated:', isAuthenticated);
        
        if (isAuthenticated) {
          const identity = client.getIdentity();
          const principal = identity.getPrincipal();
          
          console.log('=== EXISTING AUTH FOUND ===');
          console.log('Principal:', principal.toString());
          console.log('========================');
          
          setIsAuthenticated(true);
          setIdentity(identity);
          setPrincipal(principal);
        } else {
          console.log('No existing authentication found');
        }
      } catch (error) {
        console.error('Error initializing auth client:', error);
        setLoginError('Failed to initialize authentication');
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  const login = async () => {
    if (!authClient) return;

    setIsLoading(true);
    setLoginError(null);
    try {
      await authClient.login({
        // Use the Internet Identity canister for local development
        identityProvider: import.meta.env.DFX_NETWORK === "local" 
          ? `http://${import.meta.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943/`
          : "https://identity.ic0.app",
        onSuccess: () => {
          const identity = authClient.getIdentity();
          const principal = identity.getPrincipal();
          
          console.log('=== LOGIN SUCCESSFUL ===');
          console.log('Principal:', principal.toString());
          console.log('Principal toText():', principal.toText());
          console.log('Identity type:', typeof identity);
          console.log('========================');
          
          setIsAuthenticated(true);
          setIdentity(identity);
          setPrincipal(principal);
          setIsLoading(false);
          setLoginError(null);
        },
        onError: (error) => {
          console.error('Login error:', error);
          setLoginError('Failed to authenticate with Internet Identity');
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!authClient) return;

    setIsLoading(true);
    try {
      await authClient.logout();
      setIsAuthenticated(false);
      setIdentity(null);
      setPrincipal(null);
      
      // Force a page reload to clear all application state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    identity,
    principal,
    login,
    logout,
    isLoading,
    isInitialized,
    loginError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
