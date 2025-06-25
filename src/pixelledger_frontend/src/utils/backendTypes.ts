// Utility functions to handle backend optional field patterns
import type { 
  UserAccount, 
  UserRole, 
  ClientInfo, 
  CreativeInfo, 
  Profile, 
  Project as BackendProject,
  Proposal as BackendProposal,
  VerificationStatus 
} from 'declarations/pixelledger_backend/pixelledger_backend.did';
import { Principal } from '@dfinity/principal';

// Generic utility function to handle optional field patterns from backend
export const getOptionalValue = <T,>(optionalArray: [] | [T]): T | null => {
  return optionalArray.length > 0 && optionalArray[0] ? optionalArray[0] : null;
};

// Specific utility functions for UserAccount optional fields
export const getClientInfo = (userAccount: UserAccount): ClientInfo | null => {
  return getOptionalValue(userAccount.clientInfo);
};

export const getCreativeInfo = (userAccount: UserAccount): CreativeInfo | null => {
  return getOptionalValue(userAccount.creativeInfo);
};

export const getProfile = (userAccount: UserAccount): Profile | null => {
  return getOptionalValue(userAccount.profile);
};

// Type conversion helpers to bridge frontend types with backend types
export interface FrontendProject {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: number;
  creator: string;
  selectedCreatives?: string[];
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

// Convert backend Project to frontend Project
export const convertBackendProject = (backendProject: BackendProject): FrontendProject => {
  return {
    id: backendProject.id.toString(),
    title: backendProject.title,
    description: backendProject.description,
    budget: Number(backendProject.budget),
    deadline: Date.now() + 30 * 24 * 60 * 60 * 1000, // Default 30 days from now
    creator: backendProject.owner.toString(),
    selectedCreatives: [], // Backend doesn't have this field
    applicants: backendProject.applicants, // Already Principal[] from backend
    isCompleted: backendProject.isCompleted
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
export const isClientRole = (role: UserRole): boolean => {
  return 'Client' in role;
};

export const isCreativeRole = (role: UserRole): boolean => {
  return 'Creative' in role;
};

export const getRoleString = (role: UserRole): string => {
  if ('Client' in role) return 'Client';
  if ('Creative' in role) return 'Creative';
  return 'Unknown';
};
