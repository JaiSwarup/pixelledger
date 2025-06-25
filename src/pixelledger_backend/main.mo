import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Debug "mo:base/Debug";

// Import our modules
import Types "./Types";
import Storage "./Storage";
import Project "./Project";
import Escrow "./Escrow";
import Governance "./Governance";
import Profile "./Profile";
import Authorization "./Authorization";

actor PixelLedger {
  
  // Debug helper function
  private func debug_showRole(role: Types.UserRole) : Text {
    switch (role) {
      case (#Client) { "Client" };
      case (#Creative) { "Creative" };
    }
  };

  // Re-export types for external use
  public type Project = Types.Project;
  public type ProjectInput = Types.ProjectInput;
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
  private stable var projectEntries : [(Nat, Types.Project)] = [];
  private stable var projectApplicantEntries : [(Nat, [Principal])] = [];
  private stable var approvedApplicantEntries : [(Nat, [Principal])] = [];
  private stable var escrowBalanceEntries : [(Nat, Nat)] = [];
  private stable var userBalanceEntries : [(Principal, Nat)] = [];
  private stable var profileEntries : [(Principal, Types.Profile)] = [];
  private stable var userAccountEntries : [(Principal, Types.UserAccount)] = [];
  private stable var userStakeEntries : [(Principal, Nat)] = [];
  private stable var proposalEntries : [(Nat, Types.Proposal)] = [];
  private stable var voteEntries : [(Nat, [Types.Vote])] = [];
  private stable var userVoteEntries : [(Text, Bool)] = [];
  private stable var nextProjectId : Nat = 1;
  private stable var nextProposalId : Nat = 1;

  // Initialize storage and managers
  private let storage = Storage.createStorage();
  private let authManager = Authorization.AuthorizationManager(storage);
  private let projectManager = Project.ProjectManager(storage, authManager);
  private let escrowManager = Escrow.EscrowManager(storage, authManager);
  private let governanceManager = Governance.GovernanceManager(storage, authManager);
  private let profileManager = Profile.ProfileManager(storage, authManager);

  // Upgrade hooks
  system func preupgrade() {
    let stableStorage = Storage.toStable(storage);
    projectEntries := stableStorage.projectEntries;
    projectApplicantEntries := stableStorage.projectApplicantEntries;
    approvedApplicantEntries := stableStorage.approvedApplicantEntries;
    escrowBalanceEntries := stableStorage.escrowBalanceEntries;
    userBalanceEntries := stableStorage.userBalanceEntries;
    profileEntries := stableStorage.profileEntries;
    userAccountEntries := stableStorage.userAccountEntries;
    userStakeEntries := stableStorage.userStakeEntries;
    proposalEntries := stableStorage.proposalEntries;
    voteEntries := stableStorage.voteEntries;
    userVoteEntries := stableStorage.userVoteEntries;
    nextProjectId := stableStorage.nextProjectId;
    nextProposalId := stableStorage.nextProposalId;
  };

  system func postupgrade() {
    let stableStorage : Storage.StableStorage = {
      projectEntries = projectEntries;
      projectApplicantEntries = projectApplicantEntries;
      approvedApplicantEntries = approvedApplicantEntries;
      escrowBalanceEntries = escrowBalanceEntries;
      userBalanceEntries = userBalanceEntries;
      profileEntries = profileEntries;
      userAccountEntries = userAccountEntries;
      userStakeEntries = userStakeEntries;
      proposalEntries = proposalEntries;
      voteEntries = voteEntries;
      userVoteEntries = userVoteEntries;
      nextProjectId = nextProjectId;
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

  // Check if user is a client
  public query func isClient(user: Principal) : async Bool {
    authManager.isClient(user)
  };

  // Check if user is a creative
  public query func isCreative(user: Principal) : async Bool {
    authManager.isCreative(user)
  };

  // Get projects by owner (useful for clients to see their projects)
  public shared(msg) func getProjectsByOwner(owner: Principal) : async [Project] {
    switch (projectManager.getProjectsByOwner(msg.caller, owner)) {
      case (#ok(projects)) { projects };
      case (#err(_)) { [] }; // Return empty array on error
    }
  };

  // Get projects where user has applied (useful for creatives)
  public shared(msg) func getProjectsAppliedTo() : async [Project] {
    switch (projectManager.getProjectsAppliedTo(msg.caller)) {
      case (#ok(projects)) { projects };
      case (#err(_)) { [] }; // Return empty array on error
    }
  };

  // === PROJECT FUNCTIONALITY ===

  // Create a new project - only Clients can create projects
  public shared(msg) func createProject(input: ProjectInput) : async Result.Result<Project, Text> {
    Debug.print("createProject called by principal: " # Principal.toText(msg.caller));
    switch (projectManager.createProject(msg.caller, input)) {
      case (#ok(project)) {
        Debug.print("Project created successfully by: " # Principal.toText(msg.caller));
        #ok(project) 
      };
      case (#err(error)) { 
        Debug.print("Project creation failed for: " # Principal.toText(msg.caller) # " Error: " # authManager.authErrorToText(error));
        #err(authManager.authErrorToText(error)) 
      };
    }
  };

  // Get all projects - any authenticated user can view
  public shared(msg) func getProjects() : async [Project] {
    switch (projectManager.getProjects(msg.caller)) {
      case (#ok(projects)) { projects };
      case (#err(_)) { [] }; // Return empty array on error
    }
  };

  // Get a specific project by ID - any authenticated user can view
  public shared(msg) func getProjectById(id: Nat) : async Result.Result<Project, Text> {
    switch (projectManager.getProjectById(msg.caller, id)) {
      case (#ok(project)) { #ok(project) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Apply to a project - only Creatives can apply
  public shared(msg) func applyToProject(projectId: Nat) : async Result.Result<Text, Text> {
    switch (projectManager.applyToProject(msg.caller, projectId)) {
      case (#ok(message)) { #ok(message) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Get applicants for a specific project - only project owner can view
  public shared(msg) func getProjectApplicants(projectId: Nat) : async Result.Result<[Principal], Text> {
    switch (projectManager.getProjectApplicants(msg.caller, projectId)) {
      case (#ok(applicants)) { #ok(applicants) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Approve an applicant for a project - only project owner can approve
  public shared(msg) func approveApplicant(projectId: Nat, applicant: Principal) : async Result.Result<Text, Text> {
    switch (projectManager.approveApplicant(msg.caller, projectId, applicant)) {
      case (#ok(message)) { #ok(message) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Get approved applicants for a specific project - only project owner can view
  public shared(msg) func getProjectApprovedApplicants(projectId: Nat) : async Result.Result<[Principal], Text> {
    switch (projectManager.getProjectApprovedApplicants(msg.caller, projectId)) {
      case (#ok(approved)) { #ok(approved) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Check if applicant is approved for a project - any authenticated user can check
  public shared(msg) func isApplicantApproved(projectId: Nat, applicant: Principal) : async Result.Result<Bool, Text> {
    switch (projectManager.isApplicantApproved(msg.caller, projectId, applicant)) {
      case (#ok(isApproved)) { #ok(isApproved) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Select a creative for a project - only project owner can select
  public shared(msg) func selectCreative(projectId: Nat, creative: Principal) : async Result.Result<Text, Text> {
    switch (projectManager.selectCreative(msg.caller, projectId, creative)) {
      case (#ok(message)) { #ok(message) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // === ESCROW FUNCTIONALITY ===

  // Deposit ICP into escrow for a project (simulation)
  public shared(msg) func depositToEscrow(projectId: Nat, amount: Nat) : async Result.Result<Text, Text> {
    escrowManager.depositToEscrow(msg.caller, projectId, amount)
  };

  // Get escrow balance for a project
  public query func getEscrowBalance(projectId: Nat) : async Result.Result<Nat, Text> {
    escrowManager.getEscrowBalance(projectId)
  };

  // Get user balance (simulation)
  public query func getUserBalance(user: Principal) : async Nat {
    escrowManager.getUserBalance(user)
  };

  // Add balance to user (for testing simulation)
  public func addUserBalance(user: Principal, amount: Nat) : async Result.Result<Text, Text> {
    escrowManager.addUserBalance(user, amount)
  };

  // Complete project and release funds to approved applicants - only project owner
  public shared(msg) func completeProject(projectId: Nat, applicant: Principal) : async Result.Result<Text, Text> {
    // First check if applicant is approved through authorization system
    switch (projectManager.isApplicantApproved(msg.caller, projectId, applicant)) {
      case (#ok(isApproved)) {
        switch (escrowManager.completeProject(msg.caller, projectId, applicant, isApproved)) {
          case (#ok(message)) {
            // Mark project as completed in project manager
            switch (projectManager.completeProject(msg.caller, projectId)) {
              case (#ok(_)) {
                // Add completed project to user's profile
                let _ = profileManager.addCompletedProjectToProfile(applicant, projectId);
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

  // Withdraw remaining escrow balance (for project owner)
  public shared(msg) func withdrawEscrow(projectId: Nat) : async Result.Result<Text, Text> {
    escrowManager.withdrawEscrow(msg.caller, projectId)
  };

  // Release funds from escrow to a specific creative (project owner only)
  public shared(msg) func releaseFunds(projectId: Nat, creativePrincipal: Principal) : async Result.Result<Text, Text> {
    // Get the project to check ownership
    switch (projectManager.getProjectById(msg.caller, projectId)) {
      case (#ok(project)) {
        // Check if caller is the project owner
        if (authManager.canManageProject(msg.caller, project.owner)) {
          // Check if the creative is approved for this project
          switch (projectManager.isApplicantApproved(msg.caller, projectId, creativePrincipal)) {
            case (#ok(isApproved)) {
              if (isApproved) {
                // Release funds from escrow to the creative
                escrowManager.releaseFunds(msg.caller, projectId, creativePrincipal)
              } else {
                #err("Creative is not approved for this project")
              }
            };
            case (#err(error)) { #err(authManager.authErrorToText(error)) };
          }
        } else {
          #err("Unauthorized: Only project owner can release funds")
        }
      };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
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
      case (#err(error)) { 
        // If profile not found in profiles storage, check user's account
        switch (authManager.getUserAccount(user)) {
          case (#ok(account)) {
            switch (account.profile) {
              case (?profile) { #ok(profile) };
              case null { #err("Profile not found") };
            }
          };
          case (#err(_)) { #err(authManager.authErrorToText(error)) };
        }
      };
    }
  };

  // Get my own profile
  public shared(msg) func getMyProfile() : async Result.Result<Profile, Text> {
    switch (profileManager.getMyProfile(msg.caller)) {
      case (#ok(profile)) { #ok(profile) };
      case (#err(error)) { 
        // If profile not found in profiles storage, check user's account
        switch (authManager.getUserAccount(msg.caller)) {
          case (#ok(account)) {
            switch (account.profile) {
              case (?profile) { #ok(profile) };
              case null { #err("Profile not found") };
            }
          };
          case (#err(_)) { #err(authManager.authErrorToText(error)) };
        }
      };
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
          case (#Client) { 500 };
          case (#Creative) { 100 };
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
          case (#Client) { 1.5 };
          case (#Creative) { 1.2 };
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
          case (#Client) { 1.5 };
          case (#Creative) { 1.2 };
        };
        let effectiveVotingPower = Float.toInt(Float.fromInt(baseStake) * multiplier);
        #ok(Int.abs(effectiveVotingPower))
      };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // === CREATIVE-SPECIFIC API FUNCTIONS ===

  // Get all creative profiles for client discovery
  public shared(msg) func getCreativeProfiles() : async Result.Result<[(Principal, Profile)], Text> {
    switch (profileManager.getProfilesByRole(msg.caller, #Creative)) {
      case (#ok(profiles)) { #ok(profiles) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Get all client profiles for creative discovery  
  public shared(msg) func getClientProfiles() : async Result.Result<[(Principal, Profile)], Text> {
    switch (profileManager.getProfilesByRole(msg.caller, #Client)) {
      case (#ok(profiles)) { #ok(profiles) };
      case (#err(error)) { #err(authManager.authErrorToText(error)) };
    }
  };

  // Get my projects as a client
  public shared(msg) func getMyClientProjects() : async [Project] {
    switch (projectManager.getMyProjects(msg.caller)) {
      case (#ok(projects)) { projects };
      case (#err(_)) { [] };
    }
  };

  // Get projects I've applied to as a creative
  public shared(msg) func getMyCreativeApplications() : async [Project] {
    switch (projectManager.getProjectsAppliedTo(msg.caller)) {
      case (#ok(projects)) { projects };
      case (#err(_)) { [] };
    }
  };

  // Check if user can create projects (is a client)
  public query func canCreateProjects(user: Principal) : async Bool {
    authManager.canCreateProject(user)
  };

  // Check if user can apply to projects (is a creative)
  public query func canApplyToProjects(user: Principal) : async Bool {
    authManager.canApplyToProject(user)
  };
};
