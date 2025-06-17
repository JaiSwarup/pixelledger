// Utility functions to handle backend optional field patterns
import type { 
  UserAccount, 
  UserRole, 
  BrandInfo, 
  InfluencerInfo, 
  Profile, 
  Campaign as BackendCampaign,
  Proposal as BackendProposal,
  VerificationStatus 
} from '../../../declarations/brandpool_backend/brandpool_backend.did';
import { Principal } from '@dfinity/principal';

// Generic utility function to handle optional field patterns from backend
export const getOptionalValue = <T,>(optionalArray: [] | [T]): T | null => {
  return optionalArray.length > 0 && optionalArray[0] ? optionalArray[0] : null;
};

// Specific utility functions for UserAccount optional fields
export const getBrandInfo = (userAccount: UserAccount): BrandInfo | null => {
  return getOptionalValue(userAccount.brandInfo);
};

export const getInfluencerInfo = (userAccount: UserAccount): InfluencerInfo | null => {
  return getOptionalValue(userAccount.influencerInfo);
};

export const getProfile = (userAccount: UserAccount): Profile | null => {
  return getOptionalValue(userAccount.profile);
};

// Type conversion helpers to bridge frontend types with backend types
export interface FrontendCampaign {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: number;
  creator: string;
  selectedInfluencers?: string[];
  applicants: Principal[]; // Updated to use Principal array
  isCompleted: boolean;
}

export interface FrontendProposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  votingEnd: number;
  yesVotes: number;
  noVotes: number;
  isExecuted: boolean;
  isActive: boolean;
}

// Convert backend Campaign to frontend Campaign
export const convertBackendCampaign = (backendCampaign: BackendCampaign): FrontendCampaign => {
  return {
    id: backendCampaign.id.toString(),
    title: backendCampaign.title,
    description: backendCampaign.description,
    budget: Number(backendCampaign.payout),
    deadline: Date.now() + 30 * 24 * 60 * 60 * 1000, // Default 30 days from now
    creator: backendCampaign.owner.toString(),
    selectedInfluencers: [], // Backend doesn't have this field
    applicants: backendCampaign.applicants, // Already Principal[] from backend
    isCompleted: backendCampaign.isCompleted
  };
};

// Convert backend Proposal to frontend Proposal
export const convertBackendProposal = (backendProposal: BackendProposal): FrontendProposal => {
  return {
    id: backendProposal.id.toString(),
    title: backendProposal.title,
    description: backendProposal.description,
    proposer: backendProposal.proposer.toString(),
    votingEnd: Number(backendProposal.votingDeadline),
    yesVotes: Number(backendProposal.votesFor),
    noVotes: Number(backendProposal.votesAgainst),
    isExecuted: backendProposal.isExecuted,
    isActive: backendProposal.isActive
  };
};

// Check verification status helpers
export const isVerified = (status: VerificationStatus): boolean => {
  return 'Verified' in status;
};

export const isPending = (status: VerificationStatus): boolean => {
  return 'Pending' in status;
};

export const isRejected = (status: VerificationStatus): boolean => {
  return 'Rejected' in status;
};

export const getVerificationStatusString = (status: VerificationStatus): string => {
  if ('Verified' in status) return 'Verified';
  if ('Pending' in status) return 'Pending';
  if ('Rejected' in status) return 'Rejected';
  return 'Unknown';
};

// Role checking helpers
export const isBrandRole = (role: UserRole): boolean => {
  return 'Brand' in role;
};

export const isInfluencerRole = (role: UserRole): boolean => {
  return 'Influencer' in role;
};

export const getRoleString = (role: UserRole): string => {
  if ('Brand' in role) return 'Brand';
  if ('Influencer' in role) return 'Influencer';
  return 'Unknown';
};
