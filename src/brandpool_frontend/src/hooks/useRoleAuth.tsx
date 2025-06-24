import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useBackendActor } from './useBackendActor';
import type { 
  UserAccount, 
  UserRole, 
  BrandInfo, 
  InfluencerInfo, 
  Profile, 
  VerificationStatus 
} from '../../../declarations/brandpool_backend/brandpool_backend.did';
import type { Principal } from '@dfinity/principal';

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

  const isBrand = () => {
    return userAccount?.role && 'Brand' in userAccount.role;
  };

  const isInfluencer = () => {
    return userAccount?.role && 'Influencer' in userAccount.role;
  };

  const canCreateCampaign = () => {
    return isBrand();
  };

  const canApplyToCampaign = () => {
    return isInfluencer();
  };

  const canViewCampaignApplicants = () => {
    return isBrand();
  };

  const canApproveCampaign = () => {
    return isBrand();
  };

  const canDepositToEscrow = () => {
    return isBrand();
  };

  const canWithdrawFromEscrow = () => {
    return isBrand();
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
    if (isBrand()) return 500;
    if (isInfluencer()) return 100;
    return 50; // Default for any other case
  };

  const getVotingPowerMultiplier = () => {
    if (isBrand()) return 1.5;
    if (isInfluencer()) return 1.2;
    return 1.0; // Default multiplier
  };

  const getRoleDisplayName = () => {
    if (!userAccount?.role) return 'Unknown';
    if ('Brand' in userAccount.role) return 'Brand';
    if ('Influencer' in userAccount.role) return 'Influencer';
    return 'Unknown';
  };

  const getVerificationStatus = (status?: VerificationStatus) => {
    if (!status) return 'Not verified';
    if ('Verified' in status) return 'Verified';
    if ('Pending' in status) return 'Pending';
    if ('Rejected' in status) return 'Rejected';
    return 'Unknown';
  };

  const registerUser = async (role: UserRole, brandInfo?: BrandInfo, influencerInfo?: InfluencerInfo, profile?: Profile) => {
    if (!backendActor) {
      const errorMessage = 'Backend actor not available';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      const result = await backendActor.registerUser({
        role,
        brandInfo: brandInfo ? [brandInfo] : [],
        influencerInfo: influencerInfo ? [influencerInfo] : [],
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
    isBrand,
    isInfluencer,
    canCreateCampaign,
    canApplyToCampaign,
    canViewCampaignApplicants,
    canApproveCampaign,
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
  const validateBrandInfo = (brandInfo?: [] | [BrandInfo]) => {
    const errors: string[] = [];
    
    const info = brandInfo && brandInfo.length > 0 ? brandInfo[0] : null;
    if (!info) {
      errors.push('Brand information is required');
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

  const validateInfluencerInfo = (influencerInfo?: [] | [InfluencerInfo]) => {
    const errors: string[] = [];
    
    const info = influencerInfo && influencerInfo.length > 0 ? influencerInfo[0] : null;
    if (!info) {
      errors.push('Influencer information is required');
      return errors;
    }

    if (info.followerCount <= 0) {
      errors.push('Follower count must be greater than 0');
    }

    if (!info.contentCategories || info.contentCategories.length === 0) {
      errors.push('At least one content category is required');
    }

    if (info.engagementRate < 0 || info.engagementRate > 100) {
      errors.push('Engagement rate must be between 0 and 100');
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

    if ('Brand' in role) {
      errors.push(...validateBrandInfo(profile.brandInfo));
    } else if ('Influencer' in role) {
      errors.push(...validateInfluencerInfo(profile.influencerInfo));
    }

    return errors;
  };

  const validateCampaignInput = (campaign: any) => {
    const errors: string[] = [];

    if (!campaign.title || campaign.title.trim() === '') {
      errors.push('Campaign title is required');
    }

    if (!campaign.description || campaign.description.trim() === '') {
      errors.push('Campaign description is required');
    }

    if (!campaign.payout || campaign.payout <= 0) {
      errors.push('Campaign payout must be greater than 0');
    }

    return errors;
  };

  return {
    validateBrandInfo,
    validateInfluencerInfo,
    validateProfileInput,
    validateCampaignInput
  };
};

export const RoleBasedComponent = ({ 
  allowedRoles, 
  userRole, 
  children, 
  fallback 
}: {
  allowedRoles: ('Brand' | 'Influencer')[];
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

export const getBrandInfo = (userAccount: UserAccount): BrandInfo | null => {
  return getOptionalValue(userAccount.brandInfo);
};

export const getInfluencerInfo = (userAccount: UserAccount): InfluencerInfo | null => {
  return getOptionalValue(userAccount.influencerInfo);
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
    const requiredRole = error.RoleRequired ? 'Brand' : 'Influencer';
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
