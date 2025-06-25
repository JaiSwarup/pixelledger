import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Map "mo:map/Map";
import Text "mo:base/Text";
import Types "./Types";
import Storage "./Storage";
import Authorization "./Authorization";

module {
  public class ProfileManager(storage: Storage.Storage, authManager: Authorization.AuthorizationManager) {
    
    // Validate role-specific profile input
    private func validateProfileInput(role: Types.UserRole, input: Types.ProfileInput) : Types.AuthResult<()> {
      switch (role) {
        case (#Client) {
          switch (input.clientInfo) {
            case null { #err(#Unauthorized("Client users must provide client information")) };
            case (?clientInfo) {
              if (Text.size(clientInfo.companyName) == 0) {
                #err(#Unauthorized("Company name is required for Client users"))
              } else if (Text.size(clientInfo.industry) == 0) {
                #err(#Unauthorized("Industry is required for Client users"))
              } else {
                #ok(())
              }
            };
          }
        };
        case (#Creative) {
          switch (input.creativeInfo) {
            case null { #err(#Unauthorized("Creative users must provide creative information")) };
            case (?creativeInfo) {
              if (Array.size(creativeInfo.specializations) == 0) {
                #err(#Unauthorized("At least one specialization is required for Creative users"))
              } else {
                #ok(())
              }
            };
          }
        };
      }
    };

    // Register a new profile for the caller - requires authentication
    public func registerProfile(caller: Principal, input: Types.ProfileInput) : Types.AuthResult<Types.Profile> {
      authManager.withAnyAuth<Types.Profile>(caller, func(account: Types.UserAccount) : Types.AuthResult<Types.Profile> {
        // Check if profile already exists
        switch (Map.get(storage.profiles, Map.phash, caller)) {
          case (?_) { #err(#Unauthorized("Profile already exists for this user")) };
          case null {
            // Validate role-specific input
            switch (validateProfileInput(account.role, input)) {
              case (#err(error)) { #err(error) };
              case (#ok(())) {
                let profile : Types.Profile = {
                  username = input.username;
                  bio = input.bio;
                  socialLinks = input.socialLinks;
                  completedProjects = [];
                  role = account.role; // Use role from authenticated account
                  clientInfo = if (account.role == #Client) input.clientInfo else null;
                  creativeInfo = if (account.role == #Creative) input.creativeInfo else null;
                };
                
                Map.set(storage.profiles, Map.phash, caller, profile);
                #ok(profile)
              };
            }
          };
        }
      })
    };

    // Get profile for a specific principal - any authenticated user can view
    public func getProfile(caller: Principal, user: Principal) : Types.AuthResult<Types.Profile> {
      authManager.withAnyAuth<Types.Profile>(caller, func(account: Types.UserAccount) : Types.AuthResult<Types.Profile> {
        switch (Map.get(storage.profiles, Map.phash, user)) {
          case null { #err(#Unauthorized("Profile not found")) };
          case (?profile) { #ok(profile) };
        }
      })
    };

    // Get own profile
    public func getMyProfile(caller: Principal) : Types.AuthResult<Types.Profile> {
      authManager.withAnyAuth<Types.Profile>(caller, func(account: Types.UserAccount) : Types.AuthResult<Types.Profile> {
        switch (Map.get(storage.profiles, Map.phash, caller)) {
          case null { #err(#Unauthorized("Profile not found")) };
          case (?profile) { #ok(profile) };
        }
      })
    };

    // Update profile for the caller - only user can update their own profile
    public func updateProfile(caller: Principal, input: Types.ProfileInput) : Types.AuthResult<Types.Profile> {
      authManager.withAnyAuth<Types.Profile>(caller, func(account: Types.UserAccount) : Types.AuthResult<Types.Profile> {
        switch (Map.get(storage.profiles, Map.phash, caller)) {
          case null { #err(#Unauthorized("Profile not found. Please register first.")) };
          case (?existingProfile) {
            // Validate role-specific input
            switch (validateProfileInput(account.role, input)) {
              case (#err(error)) { #err(error) };
              case (#ok(())) {
                let updatedProfile : Types.Profile = {
                  username = input.username;
                  bio = input.bio;
                  socialLinks = input.socialLinks;
                  completedProjects = existingProfile.completedProjects; // Preserve completed projects
                  role = account.role; // Role cannot be changed after registration
                  clientInfo = if (account.role == #Client) input.clientInfo else existingProfile.clientInfo;
                  creativeInfo = if (account.role == #Creative) input.creativeInfo else existingProfile.creativeInfo;
                };
                
                Map.set(storage.profiles, Map.phash, caller, updatedProfile);
                #ok(updatedProfile)
              };
            }
          };
        }
      })
    };

    // Get all profiles (for discovery) - any authenticated user can view
    public func getAllProfiles(caller: Principal) : Types.AuthResult<[(Principal, Types.Profile)]> {
      authManager.withAnyAuth<[(Principal, Types.Profile)]>(caller, func(account: Types.UserAccount) : Types.AuthResult<[(Principal, Types.Profile)]> {
        #ok(Iter.toArray(Map.entries(storage.profiles)))
      })
    };

    // Get profiles by role - any authenticated user can view
    public func getProfilesByRole(caller: Principal, role: Types.UserRole) : Types.AuthResult<[(Principal, Types.Profile)]> {
      authManager.withAnyAuth<[(Principal, Types.Profile)]>(caller, func(account: Types.UserAccount) : Types.AuthResult<[(Principal, Types.Profile)]> {
        let allProfiles = Iter.toArray(Map.entries(storage.profiles));
        let filteredProfiles = Array.filter<(Principal, Types.Profile)>(allProfiles, func((principal, profile): (Principal, Types.Profile)) : Bool {
          profile.role == role
        });
        #ok(filteredProfiles)
      })
    };

    // Get profile count - any authenticated user can view
    public func getProfileCount(caller: Principal) : Types.AuthResult<Nat> {
      authManager.withAnyAuth<Nat>(caller, func(account: Types.UserAccount) : Types.AuthResult<Nat> {
        #ok(Map.size(storage.profiles))
      })
    };

    // Add a completed project to user's profile - system function for internal use
    public func addCompletedProjectToProfile(user: Principal, projectId: Nat) : Types.AuthResult<()> {
      switch (Map.get(storage.profiles, Map.phash, user)) {
        case null { #err(#AccountNotFound) };
        case (?profile) {
          // Check if project is already in completed list
          let alreadyCompleted = Array.find<Nat>(profile.completedProjects, func(id: Nat) : Bool {
            id == projectId
          });
          
          switch (alreadyCompleted) {
            case (?_) { #ok(()) }; // Already exists, no error
            case null {
              let updatedCompletedProjects = Array.append<Nat>(profile.completedProjects, [projectId]);
              let updatedProfile : Types.Profile = {
                username = profile.username;
                bio = profile.bio;
                socialLinks = profile.socialLinks;
                completedProjects = updatedCompletedProjects;
                role = profile.role;
                clientInfo = profile.clientInfo;
                creativeInfo = profile.creativeInfo;
              };
              Map.set(storage.profiles, Map.phash, user, updatedProfile);
              #ok(())
            };
          }
        };
      }
    };

    // Update verification status - system function for admin use
    public func updateVerificationStatus(
      caller: Principal, 
      targetUser: Principal, 
      status: Types.VerificationStatus
    ) : Types.AuthResult<Types.Profile> {
      // Note: In a full implementation, this would require admin role
      // For now, users can only update their own verification status
      if (not Principal.equal(caller, targetUser)) {
        #err(#InsufficientPermissions("Can only update your own verification status"))
      } else {
        authManager.withAnyAuth<Types.Profile>(caller, func(account: Types.UserAccount) : Types.AuthResult<Types.Profile> {
          switch (Map.get(storage.profiles, Map.phash, targetUser)) {
            case null { #err(#AccountNotFound) };
            case (?profile) {
              let updatedProfile = switch (profile.role) {
                case (#Client) {
                  let updatedClientInfo = switch (profile.clientInfo) {
                    case null { profile.clientInfo };
                    case (?clientInfo) { 
                      ?{
                        clientInfo with verificationStatus = status
                      }
                    };
                  };
                  {
                    profile with clientInfo = updatedClientInfo
                  }
                };
                case (#Creative) {
                  let updatedCreativeInfo = switch (profile.creativeInfo) {
                    case null { profile.creativeInfo };
                    case (?creativeInfo) {
                      ?{
                        creativeInfo with verificationStatus = status
                      }
                    };
                  };
                  {
                    profile with creativeInfo = updatedCreativeInfo
                  }
                };
              };
              
              Map.set(storage.profiles, Map.phash, targetUser, updatedProfile);
              #ok(updatedProfile)
            };
          }
        })
      }
    };
  }
}
