import Map "mo:map/Map";
import { thash; nhash; phash } "mo:map/Map";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Types "./Types";

module {
  public type Storage = {
    // Campaign storage
    var campaigns: Map.Map<Nat, Types.Campaign>;
    var nextCampaignId: Nat;
    
    // Campaign applicant storage (Principal-based)
    var campaignApplicants: Map.Map<Nat, [Principal]>;
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
      var campaigns = Map.new<Nat, Types.Campaign>();
      var nextCampaignId = 1;
      
      var campaignApplicants = Map.new<Nat, [Principal]>();
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
    campaignEntries: [(Nat, Types.Campaign)];
    campaignApplicantEntries: [(Nat, [Principal])];
    approvedApplicantEntries: [(Nat, [Principal])];
    escrowBalanceEntries: [(Nat, Nat)];
    userBalanceEntries: [(Principal, Nat)];
    profileEntries: [(Principal, Types.Profile)];
    userAccountEntries: [(Principal, Types.UserAccount)];
    userStakeEntries: [(Principal, Nat)];
    proposalEntries: [(Nat, Types.Proposal)];
    voteEntries: [(Nat, [Types.Vote])];
    userVoteEntries: [(Text, Bool)];
    nextCampaignId: Nat;
    nextProposalId: Nat;
  };

  public func toStable(storage: Storage) : StableStorage {
    {
      campaignEntries = Iter.toArray(Map.entries(storage.campaigns));
      campaignApplicantEntries = Iter.toArray(Map.entries(storage.campaignApplicants));
      approvedApplicantEntries = Iter.toArray(Map.entries(storage.approvedApplicants));
      escrowBalanceEntries = Iter.toArray(Map.entries(storage.escrowBalances));
      userBalanceEntries = Iter.toArray(Map.entries(storage.userBalances));
      profileEntries = Iter.toArray(Map.entries(storage.profiles));
      userAccountEntries = Iter.toArray(Map.entries(storage.userAccounts));
      userStakeEntries = Iter.toArray(Map.entries(storage.userStakes));
      proposalEntries = Iter.toArray(Map.entries(storage.proposals));
      voteEntries = Iter.toArray(Map.entries(storage.votes));
      userVoteEntries = Iter.toArray(Map.entries(storage.userVotes));
      nextCampaignId = storage.nextCampaignId;
      nextProposalId = storage.nextProposalId;
    }
  };

  public func restoreFromStable(storage: Storage, stableStorage: StableStorage) {
    // Restore data from stable storage
    storage.campaigns := Map.fromIter<Nat, Types.Campaign>(stableStorage.campaignEntries.vals(), nhash);
    storage.nextCampaignId := stableStorage.nextCampaignId;
    
    storage.campaignApplicants := Map.fromIter<Nat, [Principal]>(stableStorage.campaignApplicantEntries.vals(), nhash);
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
