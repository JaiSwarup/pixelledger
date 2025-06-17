import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createActor, brandpool_backend } from '../../../declarations/brandpool_backend';
import { useAuth } from './useAuth';

interface BackendActorContextType {
  backendActor: typeof brandpool_backend;
}

const BackendActorContext = createContext<BackendActorContextType | null>(null);

interface BackendActorProviderProps {
  children: ReactNode;
}

export function BackendActorProvider({ children }: BackendActorProviderProps) {
  const { identity, isAuthenticated, principal } = useAuth();
  const [backendActor, setBackendActor] = useState(brandpool_backend);

  useEffect(() => {
    if (identity && isAuthenticated) {
      // Get canister ID from environment variables
      const canisterId = import.meta.env.CANISTER_ID_BRANDPOOL_BACKEND || 
                        'uxrrr-q7777-77774-qaaaq-cai'; // Hardcoded fallback for local development
      
      console.log('BackendActorProvider: Creating actor with canister ID:', canisterId, 'for principal:', principal?.toString());

      try {
        const agentOptions: any = { identity };
        
        // Only set host for production environment
        if (import.meta.env.DFX_NETWORK === "ic") {
          agentOptions.host = "https://icp-api.io";
        }
        
        const actor = createActor(canisterId, {
          agentOptions,
        });
        setBackendActor(actor);
        console.log('BackendActorProvider: Successfully created authenticated actor for principal:', principal?.toString());
      } catch (error) {
        console.error('BackendActorProvider: Error creating authenticated actor:', error);
        // Fallback to default actor
        setBackendActor(brandpool_backend);
      }
    } else {
      console.log('BackendActorProvider: Using default actor (not authenticated)');
      setBackendActor(brandpool_backend);
    }
  }, [identity, isAuthenticated, principal]);

  const value: BackendActorContextType = {
    backendActor
  };

  return (
    <BackendActorContext.Provider value={value}>
      {children}
    </BackendActorContext.Provider>
  );
}

export function useBackendActor(): BackendActorContextType {
  const context = useContext(BackendActorContext);
  if (!context) {
    throw new Error('useBackendActor must be used within a BackendActorProvider');
  }
  return context;
}
