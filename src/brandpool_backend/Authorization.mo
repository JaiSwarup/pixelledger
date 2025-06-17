import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Map "mo:map/Map";
import Types "./Types";
import Storage "./Storage";

module {
  public class AuthorizationManager(storage: Storage.Storage) {
    
    // === CORE AUTHORIZATION FUNCTIONS ===

    public func registerUser(caller: Principal, registration: Types.RoleRegistration): Types.AuthResult<Types.UserAccount> {
      switch (Map.get(storage.userAccounts, Map.phash, caller)) {
        case (?_existing) {
          #err(#Unauthorized("User already registered"))
        };
        case null {
          let newAccount: Types.UserAccount = {
            principal = caller;
            role = registration.role;
            brandInfo = registration.brandInfo;
            influencerInfo = registration.influencerInfo;
            profile = registration.profile;
            isActive = true;
            createdAt = Time.now();
          };
          Map.set(storage.userAccounts, Map.phash, caller, newAccount);
          #ok(newAccount)
        };
      }
    };

    public func getUserAccount(principal: Principal): Types.AuthResult<Types.UserAccount> {
      switch (Map.get(storage.userAccounts, Map.phash, principal)) {
        case (?account) {
          if (account.isActive) {
            #ok(account)
          } else {
            #err(#AccountInactive)
          }
        };
        case null { #err(#AccountNotFound) };
      }
    };

    public func getUserRole(principal: Principal): Types.AuthResult<Types.UserRole> {
      switch (getUserAccount(principal)) {
        case (#ok(account)) { #ok(account.role) };
        case (#err(error)) { #err(error) };
      }
    };

    // === ROLE VALIDATION FUNCTIONS ===

    public func requireBrand(caller: Principal): Types.AuthResult<Types.UserAccount> {
      switch (getUserAccount(caller)) {
        case (#ok(account)) {
          switch (account.role) {
            case (#Brand) { #ok(account) };
            case (#Influencer) { #err(#RoleRequired(#Brand)) };
          }
        };
        case (#err(error)) { #err(error) };
      }
    };

    public func requireInfluencer(caller: Principal): Types.AuthResult<Types.UserAccount> {
      switch (getUserAccount(caller)) {
        case (#ok(account)) {
          switch (account.role) {
            case (#Influencer) { #ok(account) };
            case (#Brand) { #err(#RoleRequired(#Influencer)) };
          }
        };
        case (#err(error)) { #err(error) };
      }
    };

    public func requireAnyRole(caller: Principal): Types.AuthResult<Types.UserAccount> {
      getUserAccount(caller)
    };

    // === PERMISSION MIDDLEWARE ===

    public func withBrandAuth<T>(
      caller: Principal, 
      action: (Types.UserAccount) -> Types.AuthResult<T>
    ) : Types.AuthResult<T> {
      switch (requireBrand(caller)) {
        case (#ok(account)) { action(account) };
        case (#err(error)) { #err(error) };
      }
    };

    public func withInfluencerAuth<T>(
      caller: Principal, 
      action: (Types.UserAccount) -> Types.AuthResult<T>
    ) : Types.AuthResult<T> {
      switch (requireInfluencer(caller)) {
        case (#ok(account)) { action(account) };
        case (#err(error)) { #err(error) };
      }
    };

    public func withAnyAuth<T>(
      caller: Principal, 
      action: (Types.UserAccount) -> Types.AuthResult<T>
    ) : Types.AuthResult<T> {
      switch (requireAnyRole(caller)) {
        case (#ok(account)) { action(account) };
        case (#err(error)) { #err(error) };
      }
    };

    // === CAMPAIGN AUTHORIZATION ===

    public func canCreateCampaign(caller: Principal): Bool {
      switch (requireBrand(caller)) {
        case (#ok(_)) { true };
        case (#err(_)) { false };
      }
    };

    public func canApplyToCampaign(caller: Principal): Bool {
      switch (requireInfluencer(caller)) {
        case (#ok(_)) { true };
        case (#err(_)) { false };
      }
    };

    public func canManageCampaign(caller: Principal, campaignOwner: Principal): Bool {
      Principal.equal(caller, campaignOwner) and canCreateCampaign(caller)
    };

    // === PROFILE AUTHORIZATION ===

    public func canCreateProfile(caller: Principal): Bool {
      switch (requireAnyRole(caller)) {
        case (#ok(_)) { true };
        case (#err(_)) { false };
      }
    };

    public func canUpdateProfile(caller: Principal, profileOwner: Principal): Bool {
      Principal.equal(caller, profileOwner)
    };

    public func canViewProfile(caller: Principal, _profileOwner: Principal): Bool {
      // Profiles are generally public, but we might add privacy controls later
      switch (requireAnyRole(caller)) {
        case (#ok(_)) { true };
        case (#err(_)) { false };
      }
    };

    // === GOVERNANCE AUTHORIZATION ===

    public func canCreateProposal(caller: Principal, minStake: Nat): Types.AuthResult<Bool> {
      switch (requireAnyRole(caller)) {
        case (#ok(_account)) {
          let userStake = switch (Map.get(storage.userStakes, Map.phash, caller)) {
            case (?stake) { stake };
            case null { 0 };
          };
          
          if (userStake >= minStake) {
            #ok(true)
          } else {
            #err(#InsufficientStake)
          }
        };
        case (#err(error)) { #err(error) };
      }
    };

    public func canVoteOnProposal(caller: Principal): Types.AuthResult<Bool> {
      switch (requireAnyRole(caller)) {
        case (#ok(_)) {
          let userStake = switch (Map.get(storage.userStakes, Map.phash, caller)) {
            case (?stake) { stake };
            case null { 0 };
          };
          
          if (userStake > 0) {
            #ok(true)
          } else {
            #err(#InsufficientStake)
          }
        };
        case (#err(error)) { #err(error) };
      }
    };

    // === UTILITY FUNCTIONS ===

    public func isRegistered(principal: Principal): Bool {
      switch (Map.get(storage.userAccounts, Map.phash, principal)) {
        case (?account) { account.isActive };
        case null { false };
      }
    };

    public func isBrand(principal: Principal): Bool {
      switch (getUserRole(principal)) {
        case (#ok(#Brand)) { true };
        case _ { false };
      }
    };

    public func isInfluencer(principal: Principal): Bool {
      switch (getUserRole(principal)) {
        case (#ok(#Influencer)) { true };
        case _ { false };
      }
    };

    public func getAllUsers(): [(Principal, Types.UserAccount)] {
      Iter.toArray(Map.entries(storage.userAccounts))
    };

    public func getUserCount(): Nat {
      Map.size(storage.userAccounts)
    };

    public func updateUserAccount(principal: Principal, updater: (Types.UserAccount) -> Types.UserAccount): Types.AuthResult<Types.UserAccount> {
      switch (Map.get(storage.userAccounts, Map.phash, principal)) {
        case (?account) {
          let updatedAccount = updater(account);
          Map.set(storage.userAccounts, Map.phash, principal, updatedAccount);
          #ok(updatedAccount)
        };
        case null { #err(#AccountNotFound) };
      }
    };

    public func deactivateUser(principal: Principal): Types.AuthResult<Text> {
      switch (updateUserAccount(principal, func(account: Types.UserAccount): Types.UserAccount {
        {
          principal = account.principal;
          role = account.role;
          brandInfo = account.brandInfo;
          influencerInfo = account.influencerInfo;
          profile = account.profile;
          isActive = false;
          createdAt = account.createdAt;
        }
      })) {
        case (#ok(_)) { #ok("User deactivated successfully") };
        case (#err(error)) { #err(error) };
      }
    };
    public func authErrorToText(error: Types.AuthError): Text {
      switch (error) {
        case (#Unauthorized(msg)) { "Unauthorized: " # msg };
        case (#InsufficientPermissions(msg)) { "Insufficient Permissions: " # msg };
        case (#RoleRequired(role)) { "Role Required: " # (switch (role) {
          case (#Brand) { "Brand" };
          case (#Influencer) { "Influencer" };
        }) };
        case (#AccountNotFound) { "Account Not Found" };
        case (#AccountInactive) { "Account is Inactive" };
        case (#InsufficientStake) { "Insufficient Stake" };
      }
    };
  }
}