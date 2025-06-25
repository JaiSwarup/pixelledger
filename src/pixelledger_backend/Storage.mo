import Map "mo:map/Map";
import { thash; nhash; phash } "mo:map/Map";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Types "./Types";

module {
  public type Storage = {
    // Project storage
    var projects: Map.Map<Nat, Types.Project>;
    var nextProjectId: Nat;
    
    // Project applicant storage (Principal-based)
    var projectApplicants: Map.Map<Nat, [Principal]>;
    var approvedApplicants: Map.Map<Nat, [Principal]>;
    
    // Escrow storage
    var escrowBalances: Map.Map<Nat, Nat>;
    var userBalances: Map.Map<Principal, Nat>;
    
    // Profile storage
    var profiles: Map.Map<Principal, Types.Profile>;
    
    // Authorization storage
    var userAccounts: Map.Map<Principal, Types.UserAccount>;
    
    // DAO storage
    var userStakes: Map.Map<Principal, Nat>;
    var proposals: Map.Map<Nat, Types.Proposal>;
    var nextProposalId: Nat;
    var votes: Map.Map<Nat, [Types.Vote]>;
    var userVotes: Map.Map<Text, Bool>; // Key: "proposalId-principalId"
  };

  public func createStorage() : Storage {
    {
      var projects = Map.new<Nat, Types.Project>();
      var nextProjectId = 1;
      
      var projectApplicants = Map.new<Nat, [Principal]>();
      var approvedApplicants = Map.new<Nat, [Principal]>();
      
      var escrowBalances = Map.new<Nat, Nat>();
      var userBalances = Map.new<Principal, Nat>();
      
      var profiles = Map.new<Principal, Types.Profile>();
      
      var userAccounts = Map.new<Principal, Types.UserAccount>();
      
      var userStakes = Map.new<Principal, Nat>();
      var proposals = Map.new<Nat, Types.Proposal>();
      var nextProposalId = 1;
      var votes = Map.new<Nat, [Types.Vote]>();
      var userVotes = Map.new<Text, Bool>();
    }
  };

  // Stable storage types for upgrades
  public type StableStorage = {
    projectEntries: [(Nat, Types.Project)];
    projectApplicantEntries: [(Nat, [Principal])];
    approvedApplicantEntries: [(Nat, [Principal])];
    escrowBalanceEntries: [(Nat, Nat)];
    userBalanceEntries: [(Principal, Nat)];
    profileEntries: [(Principal, Types.Profile)];
    userAccountEntries: [(Principal, Types.UserAccount)];
    userStakeEntries: [(Principal, Nat)];
    proposalEntries: [(Nat, Types.Proposal)];
    voteEntries: [(Nat, [Types.Vote])];
    userVoteEntries: [(Text, Bool)];
    nextProjectId: Nat;
    nextProposalId: Nat;
  };

  public func toStable(storage: Storage) : StableStorage {
    {
      projectEntries = Iter.toArray(Map.entries(storage.projects));
      projectApplicantEntries = Iter.toArray(Map.entries(storage.projectApplicants));
      approvedApplicantEntries = Iter.toArray(Map.entries(storage.approvedApplicants));
      escrowBalanceEntries = Iter.toArray(Map.entries(storage.escrowBalances));
      userBalanceEntries = Iter.toArray(Map.entries(storage.userBalances));
      profileEntries = Iter.toArray(Map.entries(storage.profiles));
      userAccountEntries = Iter.toArray(Map.entries(storage.userAccounts));
      userStakeEntries = Iter.toArray(Map.entries(storage.userStakes));
      proposalEntries = Iter.toArray(Map.entries(storage.proposals));
      voteEntries = Iter.toArray(Map.entries(storage.votes));
      userVoteEntries = Iter.toArray(Map.entries(storage.userVotes));
      nextProjectId = storage.nextProjectId;
      nextProposalId = storage.nextProposalId;
    }
  };

  public func restoreFromStable(storage: Storage, stableStorage: StableStorage) {
    // Restore data from stable storage
    storage.projects := Map.fromIter<Nat, Types.Project>(stableStorage.projectEntries.vals(), nhash);
    storage.nextProjectId := stableStorage.nextProjectId;
    
    storage.projectApplicants := Map.fromIter<Nat, [Principal]>(stableStorage.projectApplicantEntries.vals(), nhash);
    storage.approvedApplicants := Map.fromIter<Nat, [Principal]>(stableStorage.approvedApplicantEntries.vals(), nhash);
    
    storage.escrowBalances := Map.fromIter<Nat, Nat>(stableStorage.escrowBalanceEntries.vals(), nhash);
    storage.userBalances := Map.fromIter<Principal, Nat>(stableStorage.userBalanceEntries.vals(), phash);
    
    storage.profiles := Map.fromIter<Principal, Types.Profile>(stableStorage.profileEntries.vals(), phash);
    
    storage.userAccounts := Map.fromIter<Principal, Types.UserAccount>(stableStorage.userAccountEntries.vals(), phash);
    
    storage.userStakes := Map.fromIter<Principal, Nat>(stableStorage.userStakeEntries.vals(), phash);
    storage.proposals := Map.fromIter<Nat, Types.Proposal>(stableStorage.proposalEntries.vals(), nhash);
    storage.nextProposalId := stableStorage.nextProposalId;
    storage.votes := Map.fromIter<Nat, [Types.Vote]>(stableStorage.voteEntries.vals(), nhash);
    storage.userVotes := Map.fromIter<Text, Bool>(stableStorage.userVoteEntries.vals(), thash);
  };
}
