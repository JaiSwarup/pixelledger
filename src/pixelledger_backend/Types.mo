import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";

module {
  // === USER ROLE TYPES ===
  
  public type UserRole = {
    #Client;
    #Creative;
  };

  public type UserAccount = {
    principal: Principal;
    role: UserRole;
    clientInfo: ?ClientInfo;
    creativeInfo: ?CreativeInfo;
    profile: ?Profile;
    isActive: Bool;
    createdAt: Int;
  };

  public type RoleRegistration = {
    role: UserRole;
    clientInfo: ?ClientInfo;
    creativeInfo: ?CreativeInfo;
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

  // === PROJECT TYPES ===
  
  public type Project = {
    id: Nat;
    title: Text;
    description: Text;
    budget: Nat;
    owner: Principal; // Who created the project
    applicants: [Principal]; // Array of applicant principals
    selectedCreative: ?Principal; // Selected creative for the project
    isCompleted: Bool; // Whether the project has been completed
  };

  public type ProjectInput = {
    title: Text;
    description: Text;
    budget: Nat;
  };

  // === PROFILE TYPES ===
  
  public type Profile = {
    username: Text;
    bio: Text;
    socialLinks: [Text]; // Array of social media links
    completedProjects: [Nat]; // Array of completed project IDs
    role: UserRole;
    // Role-specific fields
    clientInfo: ?ClientInfo; // Only for Client users
    creativeInfo: ?CreativeInfo; // Only for Creative users
  };

  public type ClientInfo = {
    companyName: Text;
    industry: Text;
    website: Text;
    verificationStatus: VerificationStatus;
  };

  public type CreativeInfo = {
    specializations: [Text]; // e.g., ["Graphic Design", "Web Development"]
    experienceLevel: ExperienceLevel;
    portfolioLinks: [Text];
    hourlyRate: ?Nat;
    verificationStatus: VerificationStatus;
  };

  public type ExperienceLevel = {
    #Beginner;
    #Intermediate;
    #Expert;
    #Master;
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
    clientInfo: ?ClientInfo;
    creativeInfo: ?CreativeInfo;
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
  
  public type ProjectResult<T> = Result.Result<T, Text>;
  public type ProfileResult<T> = Result.Result<T, Text>;
  public type GovernanceResult<T> = Result.Result<T, Text>;
  public type EscrowResult<T> = Result.Result<T, Text>;
}
