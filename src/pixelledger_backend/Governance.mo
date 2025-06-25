import Array "mo:base/Array";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Map "mo:map/Map";
import Types "./Types";
import Storage "./Storage";
import Authorization "./Authorization";

module {
  public class GovernanceManager(storage: Storage.Storage, authManager: Authorization.AuthorizationManager) {
    
    // Role-based minimum stake requirements
    private func getMinimumStakeRequirement(role: Types.UserRole) : Nat {
      switch (role) {
        case (#Client) { 500 };      // Clients need 500 tokens minimum
        case (#Creative) { 100 }; // Creatives need 100 tokens minimum
      }
    };

    // Role-based voting power multipliers
    private func getVotingPowerMultiplier(role: Types.UserRole) : Float {
      switch (role) {
        case (#Client) { 1.5 };      // Clients get 1.5x voting power
        case (#Creative) { 1.2 }; // Creatives get 1.2x voting power
      }
    };
    
    // Stake tokens to gain voting power
    public func stake(caller: Principal, amount: Nat) : Types.GovernanceResult<Text> {
      // Require user authentication and get role
      switch (authManager.getUserAccount(caller)) {
        case (#err(_)) { return #err("User must be registered to stake tokens") };
        case (#ok(account)) {
          // Check minimum stake requirement for role
          let minStake = getMinimumStakeRequirement(account.role);
          let currentStake = switch (Map.get(storage.userStakes, Map.phash, caller)) {
            case null { 0 };
            case (?stake) { stake };
          };
          
          // If first time staking, ensure it meets minimum
          if (currentStake == 0 and amount < minStake) {
            let roleText = switch (account.role) {
              case (#Client) { "Client" };
              case (#Creative) { "Creative" };
            };
            return #err(roleText # " users must stake at least " # Nat.toText(minStake) # " tokens");
          };

          // Check if user has sufficient balance
          let userBalance = switch (Map.get(storage.userBalances, Map.phash, caller)) {
            case null { 0 };
            case (?balance) { balance };
          };
          
          if (userBalance < amount) {
            return #err("Insufficient balance to stake");
          };
          
          // Update user balance using Int arithmetic
          let newBalance = Int.abs(Int.abs(userBalance) - Int.abs(amount));
          Map.set(storage.userBalances, Map.phash, caller, newBalance);
          
          // Update user stake
          Map.set(storage.userStakes, Map.phash, caller, currentStake + amount);
          
          #ok("Successfully staked " # Nat.toText(amount) # " tokens. Total stake: " # Nat.toText(currentStake + amount))
        };
      }
    };

    // Create a new proposal
    public func createProposal(caller: Principal, input: Types.ProposalInput) : Types.GovernanceResult<Types.Proposal> {
      // Check if user has staked tokens (only stakers can create proposals)
      let userStake = switch (Map.get(storage.userStakes, Map.phash, caller)) {
        case null { 0 };
        case (?stake) { stake };
      };
      
      if (userStake == 0) {
        return #err("Must stake tokens to create proposals");
      };
      
      let currentTime = Time.now();
      let votingDuration = input.votingDurationHours * 3600 * 1000000000; // Convert hours to nanoseconds
      
      let proposal : Types.Proposal = {
        id = storage.nextProposalId;
        title = input.title;
        description = input.description;
        proposer = caller;
        createdAt = currentTime;
        votingDeadline = currentTime + votingDuration;
        votesFor = 0;
        votesAgainst = 0;
        totalVotingPower = 0;
        isExecuted = false;
        isActive = true;
      };
      
      Map.set(storage.proposals, Map.nhash, storage.nextProposalId, proposal);
      Map.set(storage.votes, Map.nhash, storage.nextProposalId, []); // Initialize empty vote array
      storage.nextProposalId += 1;
      
      #ok(proposal)
    };

    // Vote on a proposal
    public func vote(caller: Principal, proposalId: Nat, voteBool: Bool) : Types.GovernanceResult<Text> {
      // Require user authentication and get role for voting power calculation
      switch (authManager.getUserAccount(caller)) {
        case (#err(_)) { return #err("User must be registered to vote") };
        case (#ok(account)) {
          // Check if proposal exists
          switch (Map.get(storage.proposals, Map.nhash, proposalId)) {
            case null { #err("Proposal not found") };
            case (?proposal) {
              // Check if proposal is still active
              if (not proposal.isActive) {
                return #err("Proposal is not active");
              };
              
              // Check if voting period has ended
              let currentTime = Time.now();
              if (currentTime > proposal.votingDeadline) {
                return #err("Voting period has ended");
              };
              
              // Check if user has already voted
              let voteKey = Nat.toText(proposalId) # "-" # Principal.toText(caller);
              switch (Map.get(storage.userVotes, Map.thash, voteKey)) {
                case (?_) { #err("User has already voted on this proposal") };
                case null {
                  // Get user's base voting power (stake amount)
                  let baseStake = switch (Map.get(storage.userStakes, Map.phash, caller)) {
                    case null { 0 };
                    case (?stake) { stake };
                  };
                  
                  if (baseStake == 0) {
                    return #err("Must stake tokens to vote");
                  };
                  
                  // Calculate role-based voting power
                  let multiplier = getVotingPowerMultiplier(account.role);
                  let effectiveVotingPower = Float.toInt(Float.fromInt(baseStake) * multiplier);
                  let votingPower = Int.abs(effectiveVotingPower);
                  
                  // Create vote record
                  let voteRecord : Types.Vote = {
                    proposalId = proposalId;
                    voter = caller;
                    choice = if (voteBool) { #For } else { #Against };
                    votingPower = votingPower;
                    timestamp = currentTime;
                  };
                  
                  // Add vote to votes array
                  let currentVotes = switch (Map.get(storage.votes, Map.nhash, proposalId)) {
                    case null { [] };
                    case (?voteArray) { voteArray };
                  };
                  let updatedVotes = Array.append<Types.Vote>(currentVotes, [voteRecord]);
                  Map.set(storage.votes, Map.nhash, proposalId, updatedVotes);
                  
                  // Mark user as voted
                  Map.set(storage.userVotes, Map.thash, voteKey, true);
                  
                  // Update proposal vote counts
                  let updatedProposal : Types.Proposal = {
                    id = proposal.id;
                    title = proposal.title;
                    description = proposal.description;
                    proposer = proposal.proposer;
                    createdAt = proposal.createdAt;
                    votingDeadline = proposal.votingDeadline;
                    votesFor = if (voteBool) { proposal.votesFor + votingPower } else { proposal.votesFor };
                    votesAgainst = if (not voteBool) { proposal.votesAgainst + votingPower } else { proposal.votesAgainst };
                    totalVotingPower = proposal.totalVotingPower + votingPower;
                    isExecuted = proposal.isExecuted;
                    isActive = proposal.isActive;
                  };
                  Map.set(storage.proposals, Map.nhash, proposalId, updatedProposal);
                  
                  let voteType = if (voteBool) { "for" } else { "against" };
                  let roleText = switch (account.role) {
                    case (#Client) { "Client" };
                    case (#Creative) { "Creative" };
                  };
                  #ok("Successfully voted " # voteType # " proposal with " # Nat.toText(votingPower) # " voting power (" # roleText # " multiplier applied)")
                };
              }
            };
          }
        };
      }
    };

    // Get proposal results
    public func getResults(proposalId: Nat) : Types.GovernanceResult<Types.ProposalResult> {
      switch (Map.get(storage.proposals, Map.nhash, proposalId)) {
        case null { #err("Proposal not found") };
        case (?proposal) {
          // Calculate total staked tokens for participation rate
          let totalStakedTokens = Array.foldLeft<(Principal, Nat), Nat>(
            Iter.toArray(Map.entries(storage.userStakes)),
            0,
            func(acc: Nat, entry: (Principal, Nat)) : Nat {
              acc + entry.1
            }
          );
          
          let participationRate = if (totalStakedTokens > 0) {
            Float.fromInt(proposal.totalVotingPower) / Float.fromInt(totalStakedTokens)
          } else {
            0.0
          };
          
          // Determine if proposal passed (simple majority)
          let passed = proposal.votesFor > proposal.votesAgainst;
          
          let result : Types.ProposalResult = {
            proposal = proposal;
            totalVotes = proposal.votesFor + proposal.votesAgainst;
            participationRate = participationRate;
            passed = passed;
          };
          
          #ok(result)
        };
      }
    };

    // Get all proposals
    public func getAllProposals() : [Types.Proposal] {
      Iter.toArray(Map.vals(storage.proposals))
    };

    // Get user's stake amount
    public func getUserStake(user: Principal) : Nat {
      switch (Map.get(storage.userStakes, Map.phash, user)) {
        case null { 0 };
        case (?stake) { stake };
      }
    };

    // Get votes for a specific proposal
    public func getProposalVotes(proposalId: Nat) : Types.GovernanceResult<[Types.Vote]> {
      switch (Map.get(storage.proposals, Map.nhash, proposalId)) {
        case null { #err("Proposal not found") };
        case (?_) {
          let proposalVotes = switch (Map.get(storage.votes, Map.nhash, proposalId)) {
            case null { [] };
            case (?voteArray) { voteArray };
          };
          #ok(proposalVotes)
        };
      }
    };

    // Get total staked tokens in the system
    public func getTotalStakedTokens() : Nat {
      Array.foldLeft<(Principal, Nat), Nat>(
        Iter.toArray(Map.entries(storage.userStakes)),
        0,
        func(acc: Nat, entry: (Principal, Nat)) : Nat {
          acc + entry.1
        }
      )
    };

    // Close voting on a proposal (can be called after deadline)
    public func closeProposal(caller: Principal, proposalId: Nat) : Types.GovernanceResult<Text> {
      switch (Map.get(storage.proposals, Map.nhash, proposalId)) {
        case null { #err("Proposal not found") };
        case (?proposal) {
          // Only proposer can close their proposal
          if (not Principal.equal(caller, proposal.proposer)) {
            return #err("Only the proposer can close the proposal");
          };
          
          // Check if voting period has ended
          let currentTime = Time.now();
          if (currentTime <= proposal.votingDeadline) {
            return #err("Voting period has not ended yet");
          };
          
          if (not proposal.isActive) {
            return #err("Proposal is already closed");
          };
          
          let closedProposal : Types.Proposal = {
            id = proposal.id;
            title = proposal.title;
            description = proposal.description;
            proposer = proposal.proposer;
            createdAt = proposal.createdAt;
            votingDeadline = proposal.votingDeadline;
            votesFor = proposal.votesFor;
            votesAgainst = proposal.votesAgainst;
            totalVotingPower = proposal.totalVotingPower;
            isExecuted = proposal.isExecuted;
            isActive = false;
          };
          Map.set(storage.proposals, Map.nhash, proposalId, closedProposal);
          
          #ok("Proposal closed successfully")
        };
      }
    };
  }
}
