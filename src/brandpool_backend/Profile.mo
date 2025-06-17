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
        case (#Brand) {
          switch (input.brandInfo) {
            case null { #err(#Unauthorized("Brand users must provide brand information")) };
            case (?brandInfo) {
              if (Text.size(brandInfo.companyName) == 0) {
                #err(#Unauthorized("Company name is required for Brand users"))
              } else if (Text.size(brandInfo.industry) == 0) {
                #err(#Unauthorized("Industry is required for Brand users"))
              } else {
                #ok(())
              }
            };
          }
        };
        case (#Influencer) {
          switch (input.influencerInfo) {
            case null { #err(#Unauthorized("Influencer users must provide influencer information")) };
            case (?influencerInfo) {
              if (influencerInfo.followerCount == 0) {
                #err(#Unauthorized("Follower count is required for Influencer users"))
              } else if (Array.size(influencerInfo.contentCategories) == 0) {
                #err(#Unauthorized("At least one content category is required for Influencer users"))
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
                  completedCampaigns = [];
                  role = account.role; // Use role from authenticated account
                  brandInfo = if (account.role == #Brand) input.brandInfo else null;
                  influencerInfo = if (account.role == #Influencer) input.influencerInfo else null;
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
                  completedCampaigns = existingProfile.completedCampaigns; // Preserve completed campaigns
                  role = account.role; // Role cannot be changed after registration
                  brandInfo = if (account.role == #Brand) input.brandInfo else existingProfile.brandInfo;
                  influencerInfo = if (account.role == #Influencer) input.influencerInfo else existingProfile.influencerInfo;
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

    // Add a completed campaign to user's profile - system function for internal use
    public func addCompletedCampaignToProfile(user: Principal, campaignId: Nat) : Types.AuthResult<()> {
      switch (Map.get(storage.profiles, Map.phash, user)) {
        case null { #err(#AccountNotFound) };
        case (?profile) {
          // Check if campaign is already in completed list
          let alreadyCompleted = Array.find<Nat>(profile.completedCampaigns, func(id: Nat) : Bool {
            id == campaignId
          });
          
          switch (alreadyCompleted) {
            case (?_) { #ok(()) }; // Already exists, no error
            case null {
              let updatedCompletedCampaigns = Array.append<Nat>(profile.completedCampaigns, [campaignId]);
              let updatedProfile : Types.Profile = {
                username = profile.username;
                bio = profile.bio;
                socialLinks = profile.socialLinks;
                completedCampaigns = updatedCompletedCampaigns;
                role = profile.role;
                brandInfo = profile.brandInfo;
                influencerInfo = profile.influencerInfo;
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
                case (#Brand) {
                  let updatedBrandInfo = switch (profile.brandInfo) {
                    case null { profile.brandInfo };
                    case (?brandInfo) { 
                      ?{
                        brandInfo with verificationStatus = status
                      }
                    };
                  };
                  {
                    profile with brandInfo = updatedBrandInfo
                  }
                };
                case (#Influencer) {
                  let updatedInfluencerInfo = switch (profile.influencerInfo) {
                    case null { profile.influencerInfo };
                    case (?influencerInfo) {
                      ?{
                        influencerInfo with verificationStatus = status
                      }
                    };
                  };
                  {
                    profile with influencerInfo = updatedInfluencerInfo
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
