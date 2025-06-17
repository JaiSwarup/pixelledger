import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";

module {
  // === USER ROLE TYPES ===
  
  public type UserRole = {
    #Brand;
    #Influencer;
  };

  public type UserAccount = {
    principal: Principal;
    role: UserRole;
    brandInfo: ?BrandInfo;
    influencerInfo: ?InfluencerInfo;
    profile: ?Profile;
    isActive: Bool;
    createdAt: Int;
  };

  public type RoleRegistration = {
    role: UserRole;
    brandInfo: ?BrandInfo;
    influencerInfo: ?InfluencerInfo;
    profile: ?Profile;
  };

  // === AUTHORIZATION TYPES ===
  
  public type AuthError = {
    #Unauthorized: Text;
    #InsufficientPermissions: Text;
    #RoleRequired: UserRole;
    #AccountNotFound;
    #AccountInactive;
    #InsufficientStake;
  };

  public type AuthResult<T> = Result.Result<T, AuthError>;

  // === CAMPAIGN TYPES ===
  
  public type Campaign = {
    id: Nat;
    title: Text;
    description: Text;
    payout: Nat;
    owner: Principal; // Who created the campaign
    applicants: [Principal]; // Array of applicant principals
    isCompleted: Bool; // Whether the campaign has been completed
  };

  public type CampaignInput = {
    title: Text;
    description: Text;
    payout: Nat;
  };

  // === PROFILE TYPES ===
  
  public type Profile = {
    username: Text;
    bio: Text;
    socialLinks: [Text]; // Array of social media links
    completedCampaigns: [Nat]; // Array of completed campaign IDs
    role: UserRole;
    // Role-specific fields
    brandInfo: ?BrandInfo; // Only for Brand users
    influencerInfo: ?InfluencerInfo; // Only for Influencer users
  };

  public type BrandInfo = {
    companyName: Text;
    industry: Text;
    website: Text;
    verificationStatus: VerificationStatus;
  };

  public type InfluencerInfo = {
    followerCount: Nat;
    engagementRate: Float;
    contentCategories: [Text];
    portfolioLinks: [Text];
    verificationStatus: VerificationStatus;
  };

  public type VerificationStatus = {
    #Pending;
    #Verified;
    #Rejected;
  };

  public type ProfileInput = {
    username: Text;
    bio: Text;
    socialLinks: [Text];
    // Role-specific inputs
    brandInfo: ?BrandInfo;
    influencerInfo: ?InfluencerInfo;
  };

  // === DAO TYPES ===

  public type VoteChoice = {
    #For;
    #Against;
  };

  public type Proposal = {
    id: Nat;
    title: Text;
    description: Text;
    proposer: Principal;
    createdAt: Int; // Timestamp
    votingDeadline: Int; // Timestamp
    votesFor: Nat;
    votesAgainst: Nat;
    totalVotingPower: Nat; // Total voting power that participated
    isExecuted: Bool;
    isActive: Bool;
  };

  public type ProposalInput = {
    title: Text;
    description: Text;
    votingDurationHours: Nat; // Duration in hours
  };

  public type Vote = {
    proposalId: Nat;
    voter: Principal;
    choice: VoteChoice;
    votingPower: Nat;
    timestamp: Int;
  };

  public type ProposalResult = {
    proposal: Proposal;
    totalVotes: Nat;
    participationRate: Float; // Percentage of total staked tokens that voted
    passed: Bool;
  };

  // === COMMON RESULT TYPES ===
  
  public type CampaignResult<T> = Result.Result<T, Text>;
  public type ProfileResult<T> = Result.Result<T, Text>;
  public type GovernanceResult<T> = Result.Result<T, Text>;
  public type EscrowResult<T> = Result.Result<T, Text>;
}
