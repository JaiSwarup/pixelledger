import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Principal "mo:base/Principal";
import Map "mo:map/Map";
import Types "./Types";
import Storage "./Storage";
import Authorization "./Authorization";

module {
  public class EscrowManager(storage: Storage.Storage, authManager: Authorization.AuthorizationManager) {
    
    // Deposit ICP into escrow for a project (simulation)
    public func depositToEscrow(caller: Principal, projectId: Nat, amount: Nat) : Types.EscrowResult<Text> {
      // Use proper authorization - only Clients can deposit to escrow
      switch (authManager.requireClient(caller)) {
        case (#err(_)) { return #err("Only Client users can deposit to escrow") };
        case (#ok(_)) {
          // Check if project exists
          switch (Map.get(storage.projects, Map.nhash, projectId)) {
            case null { #err("project not found") };
            case (?project) {
              // Only project owner can deposit
              if (not Principal.equal(caller, project.owner)) {
                return #err("Only project owner can deposit to escrow");
              };

              // Check if project is already completed
              if (project.isCompleted) {
                return #err("Cannot deposit to completed project");
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
              let currentEscrow = switch (Map.get(storage.escrowBalances, Map.nhash, projectId)) {
                case null { 0 };
                case (?balance) { balance };
              };
              Map.set(storage.escrowBalances, Map.nhash, projectId, currentEscrow + amount);

              #ok("Successfully deposited " # Nat.toText(amount) # " to project escrow")
            };
          }
        };
      }
    };

    // Get escrow balance for a project
    public func getEscrowBalance(projectId: Nat) : Types.EscrowResult<Nat> {
      switch (Map.get(storage.projects, Map.nhash, projectId)) {
        case null { #err("Project not found") };
        case (?_) {
          let balance = switch (Map.get(storage.escrowBalances, Map.nhash, projectId)) {
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

    // Complete project and release funds to approved applicants
    public func completeProject(caller: Principal, projectId: Nat, applicant: Principal, isApplicantApproved: Bool) : Types.EscrowResult<Text> {
      // Check if project exists
      switch (Map.get(storage.projects, Map.nhash, projectId)) {
        case null { #err("Project not found") };
        case (?project) {
          // Only project owner can complete the project
          if (not Principal.equal(caller, project.owner)) {
            return #err("Only project owner can complete the project");
          };

          // Check if project is already completed
          if (project.isCompleted) {
            return #err("Project is already completed");
          };

          // Check if applicant is approved (passed from project module)
          if (not isApplicantApproved) {
            return #err("Applicant is not approved for this project");
          };

          // Check escrow balance
          let escrowAmount = switch (Map.get(storage.escrowBalances, Map.nhash, projectId)) {
            case null { 0 };
            case (?balance) { balance };
          };

          if (escrowAmount < project.budget) {
            return #err("Insufficient escrow balance for budget");
          };

          // Transfer funds from escrow to applicant
          let applicantBalance = switch (Map.get(storage.userBalances, Map.phash, applicant)) {
            case null { 0 };
            case (?balance) { balance };
          };

          Map.set(storage.userBalances, Map.phash, applicant, applicantBalance + project.budget);
          
          // Update escrow balance using Int arithmetic
          let newEscrowBalance = Int.abs(Int.abs(escrowAmount) - Int.abs(project.budget));
          Map.set(storage.escrowBalances, Map.nhash, projectId, newEscrowBalance);

          #ok("Project completed successfully. Payout of " # Nat.toText(project.budget) # " transferred to applicant")
        };
      }
    };

    // Withdraw remaining escrow balance (for project owner)
    public func withdrawEscrow(caller: Principal, projectId: Nat) : Types.EscrowResult<Text> {
      // Use proper authorization - only Clients can withdraw from escrow
      switch (authManager.requireClient(caller)) {
        case (#err(_)) { return #err("Only Client users can withdraw from escrow") };
        case (#ok(_)) {
          // Check if project exists
          switch (Map.get(storage.projects, Map.nhash, projectId)) {
            case null { #err("Project not found") };
            case (?project) {
              // Only project owner can withdraw
              if (not Principal.equal(caller, project.owner)) {
                return #err("Only project owner can withdraw escrow");
              };

              // Check escrow balance
              let escrowAmount = switch (Map.get(storage.escrowBalances, Map.nhash, projectId)) {
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
              Map.set(storage.escrowBalances, Map.nhash, projectId, 0);

              #ok("Withdrawn " # Nat.toText(escrowAmount) # " from project escrow")
            };
          }
        };
      }
    };

    // Release funds from escrow to a specific creative (manual release by project owner)
    public func releaseFunds(caller: Principal, projectId: Nat, creativePrincipal: Principal) : Types.EscrowResult<Text> {
      // Use proper authorization - only Clients can release funds
      switch (authManager.requireClient(caller)) {
        case (#err(_)) { #err("Only Client users can release funds") };
        case (#ok(_)) {
          // Check if project exists
          switch (Map.get(storage.projects, Map.nhash, projectId)) {
            case null { #err("Project not found") };
            case (?project) {
              // Only project owner can release funds
              if (not Principal.equal(caller, project.owner)) {
                #err("Only project owner can release funds")
              } else {
                // Check if there's any escrow balance
                let escrowBalance = switch (Map.get(storage.escrowBalances, Map.nhash, projectId)) {
                  case null { 0 };
                  case (?balance) { balance };
                };

                if (escrowBalance == 0) {
                  #err("No escrow balance for this project")
                } else {
                  // Transfer funds from escrow to creative
                  let currentCreativeBalance = switch (Map.get(storage.userBalances, Map.phash, creativePrincipal)) {
                    case null { 0 };
                    case (?balance) { balance };
                  };

                  // Update creative balance
                  Map.set(storage.userBalances, Map.phash, creativePrincipal, currentCreativeBalance + escrowBalance);
                  
                  // Clear escrow balance
                  Map.set(storage.escrowBalances, Map.nhash, projectId, 0);
                  
                  #ok("Released " # Nat.toText(escrowBalance) # " tokens to creative " # Principal.toText(creativePrincipal))
                }
              }
            };
          };
        };
      }
    };
  }
}
