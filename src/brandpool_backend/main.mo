import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Debug "mo:base/Debug";

// Import our modules
import Types "./Types";
import Storage "./Storage";
import Campaign "./Campaign";
import Escrow "./Escrow";
import Governance "./Governance";
import Profile "./Profile";
import Authorization "./Authorization";

actor BrandPool {
  
  // Debug helper function
  private func debug_showRole(role: Types.UserRole) : Text {
    switch (role) {
      case (#Brand) { "Brand" };
      case (#Influencer) { "Influencer" };
    }
  };

  // Re-export types for external use
  public type Campaign = Types.Campaign;
  public type CampaignInput = Types.CampaignInput;
  public type Profile = Types.Profile;
  public type ProfileInput = Types.ProfileInput;
  public type VoteChoice = Types.VoteChoice;
  public type Proposal = Types.Proposal;
  public type ProposalInput = Types.ProposalInput;
  public type Vote = Types.Vote;
  public type ProposalResult = Types.ProposalResult;
  public type UserRole = Types.UserRole;
  public type UserAccount = Types.UserAccount;
  public type RoleRegistration = Types.RoleRegistration;
  public type AuthError = Types.AuthError;

  // Stable storage for upgrades
  private stable var campaignEntries : [(Nat, Types.Campaign)] = [];
  private stable var campaignApplicantEntries : [(Nat, [Principal])] = [];
  private stable var approvedApplicantEntries : [(Nat, [Principal])] = [];
  private stable var escrowBalanceEntries : [(Nat, Nat)] = [];
  private stable var userBalanceEntries : [(Principal, Nat)] = [];
  private stable var profileEntries : [(Principal, Types.Profile)] = [];
  private stable var userAccountEntries : [(Principal, Types.UserAccount)] = [];
  private stable var userStakeEntries : [(Principal, Nat)] = [];
  private stable var proposalEntries : [(Nat, Types.Proposal)] = [];
  private stable var voteEntries : [(Nat, [Types.Vote])] = [];
  private stable var userVoteEntries : [(Text, Bool)] = [];
  private stable var nextCampaignId : Nat = 1;
  private stable var nextProposalId : Nat = 1;

  // Initialize storage and managers
  private let storage = Storage.createStorage();
  private let authManager = Authorization.AuthorizationManager(storage);
  private let campaignManager = Campaign.CampaignManager(storage, authManager);
  private let escrowManager = Escrow.EscrowManager(storage, authManager);
  private let governanceManager = Governance.GovernanceManager(storage, authManager);
  private let profileManager = Profile.ProfileManager(storage, authManager);

  // Upgrade hooks
  system func preupgrade() {
    let stableStorage = Storage.toStable(storage);
    campaignEntries := stableStorage.campaignEntries;
    campaignApplicantEntries := stableStorage.campaignApplicantEntries;
    approvedApplicantEntries := stableStorage.approvedApplicantEntries;
    escrowBalanceEntries := stableStorage.escrowBalanceEntries;
    userBalanceEntries := stableStorage.userBalanceEntries;
    profileEntries := stableStorage.profileEntries;
    userAccountEntries := stableStorage.userAccountEntries;
    userStakeEntries := stableStorage.userStakeEntries;
    proposalEntries := stableStorage.proposalEntries;
    voteEntries := stableStorage.voteEntries;
    userVoteEntries := stableStorage.userVoteEntries;
    nextCampaignId := stableStorage.nextCampaignId;
    nextProposalId := stableStorage.nextProposalId;
  };

  system func postupgrade() {
    let stableStorage : Storage.StableStorage = {
      campaignEntries = campaignEntries;
      campaignApplicantEntries = campaignApplicantEntries;
      approvedApplicantEntries = approvedApplicantEntries;
      escrowBalanceEntries = escrowBalanceEntries;
      userBalanceEntries = userBalanceEntries;
      profileEntries = profileEntries;
      userAccountEntries = userAccountEntries;
      userStakeEntries = userStakeEntries;
      proposalEntries = proposalEntries;
      voteEntries = voteEntries;
      userVoteEntries = userVoteEntries;
      nextCampaignId = nextCampaignId;
      nextProposalId = nextProposalId;
    };
    
    Storage.restoreFromStable(storage, stableStorage);
  };

  // === AUTHENTICATION & AUTHORIZATION ===

  // Register user with role
  public shared(msg) func registerUser(registration: RoleRegistration) : async Result.Result<UserAccount, Text> {
    switch (authManager.registerUser(msg.caller, registration)) {
      case (#ok(account)) { #ok(account) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Get current user's account info
  public shared(msg) func getMyAccount() : async Result.Result<UserAccount, Text> {
    Debug.print("getMyAccount called by principal: " # Principal.toText(msg.caller));
    switch (authManager.getUserAccount(msg.caller)) {
      case (#ok(account)) { 
        Debug.print("Found account for principal: " # Principal.toText(msg.caller) # " with role: " # debug_showRole(account.role));
        #ok(account) 
      };
      case (#err(error)) { 
        Debug.print("No account found for principal: " # Principal.toText(msg.caller));
        #err(authManager.authErrorToText(error)) 
      };
    }
  };

  // Check if user is registered
  public query func isUserRegistered(user: Principal) : async Bool {
    authManager.isRegistered(user)
  };

  // Get user role
  public shared(msg) func getMyRole() : async Result.Result<UserRole, Text> {
    switch (authManager.getUserRole(msg.caller)) {
      case (#ok(role)) { #ok(role) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // === ROLE-BASED ACCESS HELPERS ===

  // Check if user has a specific role
  public query func getUserRole(user: Principal) : async ?UserRole {
    switch (authManager.getUserRole(user)) {
      case (#ok(role)) { ?role };
      case (#err(_)) { null };
    }
  };

  // Check if user is a brand
  public query func isBrand(user: Principal) : async Bool {
    authManager.isBrand(user)
  };

  // Check if user is an influencer
  public query func isInfluencer(user: Principal) : async Bool {
    authManager.isInfluencer(user)
  };

  // Get campaigns by owner (useful for brands to see their campaigns)
  public shared(msg) func getCampaignsByOwner(owner: Principal) : async [Campaign] {
    switch (campaignManager.getCampaignsByOwner(msg.caller, owner)) {
      case (#ok(campaigns)) { campaigns };
      case (#err(_)) { [] }; // Return empty array on error
    }
  };

  // Get campaigns where user has applied (useful for influencers)
  public shared(msg) func getCampaignsAppliedTo() : async [Campaign] {
    switch (campaignManager.getCampaignsAppliedTo(msg.caller)) {
      case (#ok(campaigns)) { campaigns };
      case (#err(_)) { [] }; // Return empty array on error
    }
  };

  // === CAMPAIGN FUNCTIONALITY ===

  // Create a new campaign - only Brands can create campaigns
  public shared(msg) func createCampaign(input: CampaignInput) : async Result.Result<Campaign, Text> {
    Debug.print("createCampaign called by principal: " # Principal.toText(msg.caller));
    switch (campaignManager.createCampaign(msg.caller, input)) {
      case (#ok(campaign)) { 
        Debug.print("Campaign created successfully by: " # Principal.toText(msg.caller));
        #ok(campaign) 
      };
      case (#err(error)) { 
        Debug.print("Campaign creation failed for: " # Principal.toText(msg.caller) # " Error: " # authManager.authErrorToText(error));
        #err(authManager.authErrorToText(error)) 
      };
    }
  };

  // Get all campaigns - any authenticated user can view
  public shared(msg) func getCampaigns() : async [Campaign] {
    switch (campaignManager.getCampaigns(msg.caller)) {
      case (#ok(campaigns)) { campaigns };
      case (#err(_)) { [] }; // Return empty array on error
    }
  };

  // Get a specific campaign by ID - any authenticated user can view
  public shared(msg) func getCampaignById(id: Nat) : async Result.Result<Campaign, Text> {
    switch (campaignManager.getCampaignById(msg.caller, id)) {
      case (#ok(campaign)) { #ok(campaign) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Apply to a campaign - only Influencers can apply
  public shared(msg) func applyToCampaign(campaignId: Nat) : async Result.Result<Text, Text> {
    switch (campaignManager.applyToCampaign(msg.caller, campaignId)) {
      case (#ok(message)) { #ok(message) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Get applicants for a specific campaign - only campaign owner can view
  public shared(msg) func getCampaignApplicants(campaignId: Nat) : async Result.Result<[Principal], Text> {
    switch (campaignManager.getCampaignApplicants(msg.caller, campaignId)) {
      case (#ok(applicants)) { #ok(applicants) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Approve an applicant for a campaign - only campaign owner can approve
  public shared(msg) func approveApplicant(campaignId: Nat, applicant: Principal) : async Result.Result<Text, Text> {
    switch (campaignManager.approveApplicant(msg.caller, campaignId, applicant)) {
      case (#ok(message)) { #ok(message) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Get approved applicants for a specific campaign - only campaign owner can view
  public shared(msg) func getCampaignApprovedApplicants(campaignId: Nat) : async Result.Result<[Principal], Text> {
    switch (campaignManager.getCampaignApprovedApplicants(msg.caller, campaignId)) {
      case (#ok(approved)) { #ok(approved) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Check if applicant is approved for a campaign - any authenticated user can check
  public shared(msg) func isApplicantApproved(campaignId: Nat, applicant: Principal) : async Result.Result<Bool, Text> {
    switch (campaignManager.isApplicantApproved(msg.caller, campaignId, applicant)) {
      case (#ok(isApproved)) { #ok(isApproved) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // === ESCROW FUNCTIONALITY ===

  // Deposit ICP into escrow for a campaign (simulation)
  public shared(msg) func depositToEscrow(campaignId: Nat, amount: Nat) : async Result.Result<Text, Text> {
    escrowManager.depositToEscrow(msg.caller, campaignId, amount)
  };

  // Get escrow balance for a campaign
  public query func getEscrowBalance(campaignId: Nat) : async Result.Result<Nat, Text> {
    escrowManager.getEscrowBalance(campaignId)
  };

  // Get user balance (simulation)
  public query func getUserBalance(user: Principal) : async Nat {
    escrowManager.getUserBalance(user)
  };

  // Add balance to user (for testing simulation)
  public func addUserBalance(user: Principal, amount: Nat) : async Result.Result<Text, Text> {
    escrowManager.addUserBalance(user, amount)
  };

  // Complete campaign and release funds to approved applicants - only campaign owner
  public shared(msg) func completeCampaign(campaignId: Nat, applicant: Principal) : async Result.Result<Text, Text> {
    // First check if applicant is approved through authorization system
    switch (campaignManager.isApplicantApproved(msg.caller, campaignId, applicant)) {
      case (#ok(isApproved)) {
        switch (escrowManager.completeCampaign(msg.caller, campaignId, applicant, isApproved)) {
          case (#ok(message)) {
            // Mark campaign as completed in campaign manager
            switch (campaignManager.markCampaignCompleted(msg.caller, campaignId)) {
              case (#ok(_)) {
                // Add completed campaign to user's profile
                let _ = profileManager.addCompletedCampaignToProfile(applicant, campaignId);
                #ok(message)
              };
              case (#err(error)) { #err(authManager.authErrorToText(error)) };
            }
          };
          case (#err(error)) { #err(error) };
        }
      };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Withdraw remaining escrow balance (for campaign owner)
  public shared(msg) func withdrawEscrow(campaignId: Nat) : async Result.Result<Text, Text> {
    escrowManager.withdrawEscrow(msg.caller, campaignId)
  };

  // === DAO FUNCTIONALITY ===

  // Stake tokens to gain voting power
  public shared(msg) func stake(amount: Nat) : async Result.Result<Text, Text> {
    governanceManager.stake(msg.caller, amount)
  };

  // Create a new proposal
  public shared(msg) func createProposal(input: ProposalInput) : async Result.Result<Proposal, Text> {
    governanceManager.createProposal(msg.caller, input)
  };

  // Vote on a proposal
  public shared(msg) func vote(proposalId: Nat, voteBool: Bool) : async Result.Result<Text, Text> {
    governanceManager.vote(msg.caller, proposalId, voteBool)
  };

  // Get proposal results
  public query func getResults(proposalId: Nat) : async Result.Result<ProposalResult, Text> {
    governanceManager.getResults(proposalId)
  };

  // Get all proposals
  public query func getAllProposals() : async [Proposal] {
    governanceManager.getAllProposals()
  };

  // Get user's stake amount
  public query func getUserStake(user: Principal) : async Nat {
    governanceManager.getUserStake(user)
  };

  // Get votes for a specific proposal
  public query func getProposalVotes(proposalId: Nat) : async Result.Result<[Vote], Text> {
    governanceManager.getProposalVotes(proposalId)
  };

  // Get total staked tokens in the system
  public query func getTotalStakedTokens() : async Nat {
    governanceManager.getTotalStakedTokens()
  };

  // Close voting on a proposal (can be called after deadline)
  public shared(msg) func closeProposal(proposalId: Nat) : async Result.Result<Text, Text> {
    governanceManager.closeProposal(msg.caller, proposalId)
  };

  // === PROFILE FUNCTIONALITY ===

  // Register a new profile for the caller - requires authentication
  public shared(msg) func registerProfile(input: ProfileInput) : async Result.Result<Profile, Text> {
    switch (profileManager.registerProfile(msg.caller, input)) {
      case (#ok(profile)) { #ok(profile) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Get profile for a specific principal - any authenticated user can view
  public shared(msg) func getProfile(user: Principal) : async Result.Result<Profile, Text> {
    switch (profileManager.getProfile(msg.caller, user)) {
      case (#ok(profile)) { #ok(profile) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Get my own profile
  public shared(msg) func getMyProfile() : async Result.Result<Profile, Text> {
    switch (profileManager.getMyProfile(msg.caller)) {
      case (#ok(profile)) { #ok(profile) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Update profile for the caller - only user can update their own profile
  public shared(msg) func updateProfile(input: ProfileInput) : async Result.Result<Profile, Text> {
    switch (profileManager.updateProfile(msg.caller, input)) {
      case (#ok(profile)) { #ok(profile) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Get all profiles (for discovery) - any authenticated user can view
  public shared(msg) func getAllProfiles() : async Result.Result<[(Principal, Profile)], Text> {
    switch (profileManager.getAllProfiles(msg.caller)) {
      case (#ok(profiles)) { #ok(profiles) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Get profiles by role - any authenticated user can view
  public shared(msg) func getProfilesByRole(role: UserRole) : async Result.Result<[(Principal, Profile)], Text> {
    switch (profileManager.getProfilesByRole(msg.caller, role)) {
      case (#ok(profiles)) { #ok(profiles) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Get profile count - any authenticated user can view
  public shared(msg) func getProfileCount() : async Result.Result<Nat, Text> {
    switch (profileManager.getProfileCount(msg.caller)) {
      case (#ok(count)) { #ok(count) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Update verification status - restricted function
  public shared(msg) func updateVerificationStatus(targetUser: Principal, status: Types.VerificationStatus) : async Result.Result<Profile, Text> {
    switch (profileManager.updateVerificationStatus(msg.caller, targetUser, status)) {
      case (#ok(profile)) { #ok(profile) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // === ROLE-BASED REQUIREMENTS ===

  // Get minimum stake requirement for user's role
  public shared(msg) func getMinimumStakeRequirement() : async Result.Result<Nat, Text> {
    switch (authManager.getUserAccount(msg.caller)) {
      case (#ok(account)) {
        let requirement = switch (account.role) {
          case (#Brand) { 500 };
          case (#Influencer) { 100 };
        };
        #ok(requirement)
      };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Get voting power multiplier for user's role
  public shared(msg) func getVotingPowerMultiplier() : async Result.Result<Float, Text> {
    switch (authManager.getUserAccount(msg.caller)) {
      case (#ok(account)) {
        let multiplier = switch (account.role) {
          case (#Brand) { 1.5 };
          case (#Influencer) { 1.2 };
        };
        #ok(multiplier)
      };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Calculate effective voting power for user
  public shared(msg) func getEffectiveVotingPower() : async Result.Result<Nat, Text> {
    switch (authManager.getUserAccount(msg.caller)) {
      case (#ok(account)) {
        let baseStake = await getUserStake(msg.caller);
        let multiplier = switch (account.role) {
          case (#Brand) { 1.5 };
          case (#Influencer) { 1.2 };
        };
        let effectiveVotingPower = Float.toInt(Float.fromInt(baseStake) * multiplier);
        #ok(Int.abs(effectiveVotingPower))
      };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };
};
