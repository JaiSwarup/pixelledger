import Result "mo:base/Result";
import Principal "mo:base/Principal";

// Import our modules
import Types "./Types";
import Storage "./Storage";
import Campaign "./Campaign";
import Escrow "./Escrow";
import Governance "./Governance";
import Profile "./Profile";

actor BrandPool {
  
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

  // Stable storage for upgrades
  private stable var campaignEntries : [(Nat, Types.Campaign)] = [];
  private stable var campaignApplicantEntries : [(Nat, [Principal])] = [];
  private stable var approvedApplicantEntries : [(Nat, [Principal])] = [];
  private stable var escrowBalanceEntries : [(Nat, Nat)] = [];
  private stable var userBalanceEntries : [(Principal, Nat)] = [];
  private stable var profileEntries : [(Principal, Types.Profile)] = [];
  private stable var userStakeEntries : [(Principal, Nat)] = [];
  private stable var proposalEntries : [(Nat, Types.Proposal)] = [];
  private stable var voteEntries : [(Nat, [Types.Vote])] = [];
  private stable var userVoteEntries : [(Text, Bool)] = [];
  private stable var nextCampaignId : Nat = 1;
  private stable var nextProposalId : Nat = 1;

  // Initialize storage and managers
  private let storage = Storage.createStorage();
  private let campaignManager = Campaign.CampaignManager(storage);
  private let escrowManager = Escrow.EscrowManager(storage);
  private let governanceManager = Governance.GovernanceManager(storage);
  private let profileManager = Profile.ProfileManager(storage);

  // Upgrade hooks
  system func preupgrade() {
    let stableStorage = Storage.toStable(storage);
    campaignEntries := stableStorage.campaignEntries;
    campaignApplicantEntries := stableStorage.campaignApplicantEntries;
    approvedApplicantEntries := stableStorage.approvedApplicantEntries;
    escrowBalanceEntries := stableStorage.escrowBalanceEntries;
    userBalanceEntries := stableStorage.userBalanceEntries;
    profileEntries := stableStorage.profileEntries;
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
      userStakeEntries = userStakeEntries;
      proposalEntries = proposalEntries;
      voteEntries = voteEntries;
      userVoteEntries = userVoteEntries;
      nextCampaignId = nextCampaignId;
      nextProposalId = nextProposalId;
    };
    
    Storage.restoreFromStable(storage, stableStorage);
  };

  // === CAMPAIGN FUNCTIONALITY ===

  // Create a new campaign
  public shared(msg) func createCampaign(input: CampaignInput) : async Result.Result<Campaign, Text> {
    campaignManager.createCampaign(msg.caller, input)
  };

  // Get all campaigns
  public query func getCampaigns() : async [Campaign] {
    campaignManager.getCampaigns()
  };

  // Get a specific campaign by ID
  public query func getCampaignById(id: Nat) : async Result.Result<Campaign, Text> {
    campaignManager.getCampaignById(id)
  };

  // Additional utility function to add an applicant to a campaign
  public func addApplicant(campaignId: Nat, applicantId: Text) : async Result.Result<Campaign, Text> {
    campaignManager.addApplicant(campaignId, applicantId)
  };

  // Apply to a campaign using Principal
  public func applyToCampaign(campaignId: Nat, applicant: Principal) : async Result.Result<Text, Text> {
    campaignManager.applyToCampaign(campaignId, applicant)
  };

  // Get applicants for a specific campaign
  public query func getCampaignApplicants(campaignId: Nat) : async Result.Result<[Principal], Text> {
    campaignManager.getCampaignApplicants(campaignId)
  };

  // Approve an applicant for a campaign
  public func approveApplicant(campaignId: Nat, applicant: Principal) : async Result.Result<Text, Text> {
    campaignManager.approveApplicant(campaignId, applicant)
  };

  // Get approved applicants for a specific campaign
  public query func getCampaignApprovedApplicants(campaignId: Nat) : async Result.Result<[Principal], Text> {
    campaignManager.getCampaignApprovedApplicants(campaignId)
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

  // Complete campaign and release funds to approved applicants
  public shared(msg) func completeCampaign(campaignId: Nat, applicant: Principal) : async Result.Result<Text, Text> {
    let isApproved = campaignManager.isApplicantApproved(campaignId, applicant);
    switch (escrowManager.completeCampaign(msg.caller, campaignId, applicant, isApproved)) {
      case (#ok(message)) {
        // Mark campaign as completed in campaign manager
        let _ = campaignManager.markCampaignCompleted(campaignId);
        // Add completed campaign to user's profile
        profileManager.addCompletedCampaignToProfile(applicant, campaignId);
        #ok(message)
      };
      case (#err(error)) { #err(error) };
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

  // Register a new profile for the caller
  public shared(msg) func registerProfile(input: ProfileInput) : async Result.Result<Profile, Text> {
    profileManager.registerProfile(msg.caller, input)
  };

  // Get profile for a specific principal
  public query func getProfile(user: Principal) : async Result.Result<Profile, Text> {
    profileManager.getProfile(user)
  };

  // Update profile for the caller
  public shared(msg) func updateProfile(input: ProfileInput) : async Result.Result<Profile, Text> {
    profileManager.updateProfile(msg.caller, input)
  };

  // Get all profiles (for discovery)
  public query func getAllProfiles() : async [(Principal, Profile)] {
    profileManager.getAllProfiles()
  };

  // Get profile count
  public query func getProfileCount() : async Nat {
    profileManager.getProfileCount()
  };
};
