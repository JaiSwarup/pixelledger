import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useBackendActor } from './useBackendActor';
import type { 
  UserAccount, 
  UserRole, 
  ClientInfo, 
  CreativeInfo, 
  Profile, 
  VerificationStatus 
} from 'declarations/pixelledger_backend/pixelledger_backend.did';

export interface AuthError {
  Unauthorized?: string;
  InsufficientPermissions?: string;
  RoleRequired?: UserRole;
  AccountNotFound?: null;
  AccountInactive?: null;
}

export const useRoleAuth = () => {
  const { isAuthenticated, principal } = useAuth();
  const { backendActor } = useBackendActor();
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAccount = async () => {
      // Clear previous state when principal changes
      setUserAccount(null);
      setError(null);
      setLoading(true);

      if (!isAuthenticated || !principal || !backendActor) {
        console.log('useRoleAuth: Not authenticated, no principal, or no backend actor');
        setLoading(false);
        return;
      }

      console.log('useRoleAuth: Checking registration status for principal:', principal.toString());

      try {
        // First check if user is registered
        const isRegistered = await backendActor.isUserRegistered(principal);
        console.log('useRoleAuth: isUserRegistered result:', isRegistered);
        
        if (isRegistered) {
          // User is registered, fetch their account details
          const result = await backendActor.getMyAccount();
          console.log('useRoleAuth: getMyAccount result:', result);
          
          if ('ok' in result) {
            setUserAccount(result.ok);
            setError(null);
            console.log('useRoleAuth: Set user account:', result.ok);
          } else {
            // User is registered but can't fetch account (shouldn't happen)
            console.warn('useRoleAuth: User is registered but getMyAccount failed:', result.err);
            setError(result.err);
            setUserAccount(null);
          }
        } else {
          // User is not registered
          console.log('useRoleAuth: User is not registered');
          setUserAccount(null);
          setError(null);
        }
      } catch (err) {
        console.error('useRoleAuth: Failed to check user registration:', err);
        setError('Failed to check user registration');
        setUserAccount(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAccount();
  }, [isAuthenticated, principal, backendActor]);

  const isClient = () => {
    return userAccount?.role && 'Client' in userAccount.role;
  };

  const isCreative = () => {
    return userAccount?.role && 'Creative' in userAccount.role;
  };

  const canCreateProject = () => {
    return isClient();
  };

  const canApplyToProject = () => {
    return isCreative();
  };

  const canViewProjectApplicants = () => {
    return isClient();
  };

  const canApproveProject = () => {
    return isClient();
  };

  const canDepositToEscrow = () => {
    return isClient();
  };

  const canWithdrawFromEscrow = () => {
    return isClient();
  };

  const canStakeTokens = () => {
    return !!userAccount; // Any registered user can stake
  };

  const canCreateProposal = () => {
    return !!userAccount; // Any registered user with stake can create proposals
  };

  const canVoteOnProposal = () => {
    return !!userAccount; // Any registered user with stake can vote
  };

  const getMinimumStakeRequirement = () => {
    if (isClient()) return 500;
    if (isCreative()) return 100;
    return 50; // Default for any other case
  };

  const getVotingPowerMultiplier = () => {
    if (isClient()) return 1.5;
    if (isCreative()) return 1.2;
    return 1.0; // Default multiplier
  };

  const getRoleDisplayName = () => {
    if (!userAccount?.role) return 'Unknown';
    if ('Client' in userAccount.role) return 'Client';
    if ('Creative' in userAccount.role) return 'Creative';
    return 'Unknown';
  };

  const getVerificationStatus = (status?: VerificationStatus) => {
    if (!status) return 'Not verified';
    if ('Verified' in status) return 'Verified';
    if ('Pending' in status) return 'Pending';
    if ('Rejected' in status) return 'Rejected';
    return 'Unknown';
  };

  const registerUser = async (role: UserRole, clientInfo?: ClientInfo, creativeInfo?: CreativeInfo, profile?: Profile) => {
    if (!backendActor) {
      const errorMessage = 'Backend actor not available';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      const result = await backendActor.registerUser({
        role,
        clientInfo: clientInfo ? [clientInfo] : [],
        creativeInfo: creativeInfo ? [creativeInfo] : [],
        profile: profile ? [profile] : []
      });
      
      if ('ok' in result) {
        setUserAccount(result.ok);
        setError(null);
        return { success: true, data: result.ok };
      } else {
        setError(result.err);
        return { success: false, error: result.err };
      }
    } catch (err) {
      const errorMessage = 'Failed to register user';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    userAccount,
    loading,
    error,
    isClient,
    isCreative,
    canCreateProject,
    canApplyToProject,
    canViewProjectApplicants,
    canApproveProject,
    canDepositToEscrow,
    canWithdrawFromEscrow,
    canStakeTokens,
    canCreateProposal,
    canVoteOnProposal,
    getMinimumStakeRequirement,
    getVotingPowerMultiplier,
    getRoleDisplayName,
    getVerificationStatus,
    registerUser,
    isRegistered: !!userAccount
  };
};

export const useRoleValidation = () => {
  const validateClientInfo = (clientInfo?: [] | [ClientInfo]) => {
    const errors: string[] = [];
    
    const info = clientInfo && clientInfo.length > 0 ? clientInfo[0] : null;
    if (!info) {
      errors.push('Client information is required');
      return errors;
    }

    if (!info.companyName || info.companyName.trim() === '') {
      errors.push('Company name is required');
    }

    if (!info.industry || info.industry.trim() === '') {
      errors.push('Industry is required');
    }

    if (!info.website || info.website.trim() === '') {
      errors.push('Website is required');
    }

    return errors;
  };

  const validateCreativeInfo = (creativeInfo?: [] | [CreativeInfo]) => {
    const errors: string[] = [];
    
    const info = creativeInfo && creativeInfo.length > 0 ? creativeInfo[0] : null;
    if (!info) {
      errors.push('Creative information is required');
      return errors;
    }

    if (info?.specializations.length === 0) {
      errors.push('You must have atleast one specializaiton')
    }

    if (!info.experienceLevel) {
      errors.push('Experience Level is Required');
    }

    const hourlyRate = getOptionalValue(info.hourlyRate);
    if (hourlyRate !== null && Number(hourlyRate) < 0) {
      errors.push('Hourly rate must be greater than 0');
    }

    return errors;
  };

  const validateProfileInput = (role: UserRole, profile: Partial<Profile>) => {
    const errors: string[] = [];

    if (!profile.username || profile.username.trim() === '') {
      errors.push('Username is required');
    }

    if (!profile.bio || profile.bio.trim() === '') {
      errors.push('Bio is required');
    }

    if ('Client' in role) {
      errors.push(...validateClientInfo(profile.clientInfo));
    } else if ('Creative' in role) {
      errors.push(...validateCreativeInfo(profile.creativeInfo));
    }

    return errors;
  };

  const validateProjectInput = (project: any) => {
    const errors: string[] = [];

    if (!project.title || project.title.trim() === '') {
      errors.push('Project title is required');
    }

    if (!project.description || project.description.trim() === '') {
      errors.push('Project description is required');
    }

    if (project?.budget <= 0) {
      errors.push('Project budget must be greater than 0');
    }

    return errors;
  };

  return {
    validateClientInfo,
    validateCreativeInfo,
    validateProfileInput,
    validateProjectInput
  };
};

export const RoleBasedComponent = ({ 
  allowedRoles, 
  userRole, 
  children, 
  fallback 
}: {
  allowedRoles: ('Client' | 'Creative')[];
  userRole?: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  if (!userRole) {
    return fallback || <div>Please log in to access this feature.</div>;
  }

  const hasPermission = allowedRoles.some(role => role in userRole);

  if (!hasPermission) {
    return fallback || <div></div>;
  }

  return <>{children}</>;
};

// Utility functions to handle optional field patterns from backend
export const getOptionalValue = <T,>(optionalArray: [] | [T]): T | null => {
  return optionalArray.length > 0 ? optionalArray[0] ?? null : null;
};

export const getClientInfo = (userAccount: UserAccount): ClientInfo | null => {
  return getOptionalValue(userAccount.clientInfo);
};

export const getCreativeInfo = (userAccount: UserAccount): CreativeInfo | null => {
  return getOptionalValue(userAccount.creativeInfo);
};

export const getProfile = (userAccount: UserAccount): Profile | null => {
  return getOptionalValue(userAccount.profile);
};

export const ErrorDisplay = ({ error }: { error?: AuthError | string }) => {
  if (!error) return null;

  let errorMessage = '';
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error.Unauthorized) {
    errorMessage = `Unauthorized: ${error.Unauthorized}`;
  } else if (error.InsufficientPermissions) {
    errorMessage = `Insufficient permissions: ${error.InsufficientPermissions}`;
  } else if (error.RoleRequired) {
    const requiredRole = error.RoleRequired ? 'Client' : 'Creative';
    errorMessage = `This action requires ${requiredRole} role`;
  } else if (error.AccountNotFound) {
    errorMessage = 'Account not found. Please register first.';
  } else if (error.AccountInactive) {
    errorMessage = 'Account is inactive.';
  }

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p>{errorMessage}</p>
    </div>
  );
};
