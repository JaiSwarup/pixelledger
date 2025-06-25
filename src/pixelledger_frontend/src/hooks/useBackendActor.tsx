import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createActor, pixelledger_backend } from 'declarations/pixelledger_backend';
import { useAuth } from './useAuth';
import { HttpAgentOptions } from '@dfinity/agent';
import { toast } from 'sonner';

interface BackendActorContextType {
  backendActor: typeof pixelledger_backend;
}

const BackendActorContext = createContext<BackendActorContextType | null>(null);

interface BackendActorProviderProps {
  children: ReactNode;
}

export function BackendActorProvider({ children }: BackendActorProviderProps) {
  const { identity, isAuthenticated, principal } = useAuth();
  const [backendActor, setBackendActor] = useState(pixelledger_backend);

  useEffect(() => {
    if (identity && isAuthenticated) {
      // Get canister ID from environment variables
      const canisterId = import.meta.env.CANISTER_ID_PIXELLEDGER_BACKEND 
                        || process.env.CANISTER_ID_PIXELLEDGER_BACKEND
                        || 'rdmx6-jaaaa-aaaaa-aaadq-cai'; // Default local development canister ID
      
      // console.log('BackendActorProvider: Creating actor with canister ID:', canisterId, 'for principal:', principal?.toString());

      try {
        const agentOptions: HttpAgentOptions = { identity };
        
        // Only set host for production environment
        if (import.meta.env.DFX_NETWORK === "ic") {
          agentOptions.host = "https://icp-api.io";
        }
        
        const actor = createActor(canisterId, {
          agentOptions,
        });
        setBackendActor(actor);
        // console.log('BackendActorProvider: Successfully created authenticated actor for principal:', principal?.toString());
      } catch (error) {
        if (error instanceof Error) {
          toast.error(`Failed to create backend actor: ${error.message}`)
        } else {
          toast.error('Failed to create backend actor: Unknown error');
        }
        // Fallback to default actor
        setBackendActor(pixelledger_backend);
      }
    } else {
      // console.log('BackendActorProvider: Using default actor (not authenticated)');
      setBackendActor(pixelledger_backend);
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
