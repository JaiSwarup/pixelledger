import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Principal "mo:base/Principal";
import Map "mo:map/Map";
import Types "./Types";
import Storage "./Storage";
import Authorization "./Authorization";

module {
  public class EscrowManager(storage: Storage.Storage, authManager: Authorization.AuthorizationManager) {
    
    // Deposit ICP into escrow for a campaign (simulation)
    public func depositToEscrow(caller: Principal, campaignId: Nat, amount: Nat) : Types.EscrowResult<Text> {
      // Use proper authorization - only Brands can deposit to escrow
      switch (authManager.requireBrand(caller)) {
        case (#err(_)) { return #err("Only Brand users can deposit to escrow") };
        case (#ok(_)) {
          // Check if campaign exists
          switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
            case null { #err("Campaign not found") };
            case (?campaign) {
              // Only campaign owner can deposit
              if (not Principal.equal(caller, campaign.owner)) {
                return #err("Only campaign owner can deposit to escrow");
              };

              // Check if campaign is already completed
              if (campaign.isCompleted) {
                return #err("Cannot deposit to completed campaign");
              };

              // Get caller's current balance (simulated)
              let callerBalance = switch (Map.get(storage.userBalances, Map.phash, caller)) {
                case null { 0 };
                case (?balance) { balance };
              };

              // Check if caller has sufficient balance
              if (callerBalance < amount) {
                return #err("Insufficient balance");
              };

              // Update caller's balance using Int arithmetic
              let newBalance = Int.abs(Int.abs(callerBalance) - Int.abs(amount));
              Map.set(storage.userBalances, Map.phash, caller, newBalance);

              // Add to escrow
              let currentEscrow = switch (Map.get(storage.escrowBalances, Map.nhash, campaignId)) {
                case null { 0 };
                case (?balance) { balance };
              };
              Map.set(storage.escrowBalances, Map.nhash, campaignId, currentEscrow + amount);

              #ok("Successfully deposited " # Nat.toText(amount) # " to campaign escrow")
            };
          }
        };
      }
    };

    // Get escrow balance for a campaign
    public func getEscrowBalance(campaignId: Nat) : Types.EscrowResult<Nat> {
      switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
        case null { #err("Campaign not found") };
        case (?_) {
          let balance = switch (Map.get(storage.escrowBalances, Map.nhash, campaignId)) {
            case null { 0 };
            case (?balance) { balance };
          };
          #ok(balance)
        };
      }
    };

    // Get user balance (simulation)
    public func getUserBalance(user: Principal) : Nat {
      switch (Map.get(storage.userBalances, Map.phash, user)) {
        case null { 0 };
        case (?balance) { balance };
      }
    };

    // Add balance to user (for testing simulation)
    public func addUserBalance(user: Principal, amount: Nat) : Types.EscrowResult<Text> {
      let currentBalance = switch (Map.get(storage.userBalances, Map.phash, user)) {
        case null { 0 };
        case (?balance) { balance };
      };
      Map.set(storage.userBalances, Map.phash, user, currentBalance + amount);
      #ok("Added " # Nat.toText(amount) # " to user balance")
    };

    // Complete campaign and release funds to approved applicants
    public func completeCampaign(caller: Principal, campaignId: Nat, applicant: Principal, isApplicantApproved: Bool) : Types.EscrowResult<Text> {
      // Check if campaign exists
      switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
        case null { #err("Campaign not found") };
        case (?campaign) {
          // Only campaign owner can complete the campaign
          if (not Principal.equal(caller, campaign.owner)) {
            return #err("Only campaign owner can complete the campaign");
          };

          // Check if campaign is already completed
          if (campaign.isCompleted) {
            return #err("Campaign is already completed");
          };

          // Check if applicant is approved (passed from campaign module)
          if (not isApplicantApproved) {
            return #err("Applicant is not approved for this campaign");
          };

          // Check escrow balance
          let escrowAmount = switch (Map.get(storage.escrowBalances, Map.nhash, campaignId)) {
            case null { 0 };
            case (?balance) { balance };
          };

          if (escrowAmount < campaign.payout) {
            return #err("Insufficient escrow balance for payout");
          };

          // Transfer funds from escrow to applicant
          let applicantBalance = switch (Map.get(storage.userBalances, Map.phash, applicant)) {
            case null { 0 };
            case (?balance) { balance };
          };

          Map.set(storage.userBalances, Map.phash, applicant, applicantBalance + campaign.payout);
          
          // Update escrow balance using Int arithmetic
          let newEscrowBalance = Int.abs(Int.abs(escrowAmount) - Int.abs(campaign.payout));
          Map.set(storage.escrowBalances, Map.nhash, campaignId, newEscrowBalance);

          #ok("Campaign completed successfully. Payout of " # Nat.toText(campaign.payout) # " transferred to applicant")
        };
      }
    };

    // Withdraw remaining escrow balance (for campaign owner)
    public func withdrawEscrow(caller: Principal, campaignId: Nat) : Types.EscrowResult<Text> {
      // Use proper authorization - only Brands can withdraw from escrow
      switch (authManager.requireBrand(caller)) {
        case (#err(_)) { return #err("Only Brand users can withdraw from escrow") };
        case (#ok(_)) {
          // Check if campaign exists
          switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
            case null { #err("Campaign not found") };
            case (?campaign) {
              // Only campaign owner can withdraw
              if (not Principal.equal(caller, campaign.owner)) {
                return #err("Only campaign owner can withdraw escrow");
              };

              // Check escrow balance
              let escrowAmount = switch (Map.get(storage.escrowBalances, Map.nhash, campaignId)) {
                case null { 0 };
                case (?balance) { balance };
              };

              if (escrowAmount == 0) {
                return #err("No funds to withdraw");
              };

              // Transfer remaining escrow back to owner
              let ownerBalance = switch (Map.get(storage.userBalances, Map.phash, caller)) {
                case null { 0 };
                case (?balance) { balance };
              };

              Map.set(storage.userBalances, Map.phash, caller, ownerBalance + escrowAmount);
              Map.set(storage.escrowBalances, Map.nhash, campaignId, 0);

              #ok("Withdrawn " # Nat.toText(escrowAmount) # " from campaign escrow")
            };
          }
        };
      }
    };
  }
}
