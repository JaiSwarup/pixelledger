import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Map "mo:map/Map";
import Types "./Types";
import Storage "./Storage";

module {
  public class ProfileManager(storage: Storage.Storage) {
    
    // Register a new profile for the caller
    public func registerProfile(caller: Principal, input: Types.ProfileInput) : Types.ProfileResult<Types.Profile> {
      // Check if profile already exists
      switch (Map.get(storage.profiles, Map.phash, caller)) {
        case (?_) { #err("Profile already exists for this user") };
        case null {
          let profile : Types.Profile = {
            username = input.username;
            bio = input.bio;
            socialLinks = input.socialLinks;
            completedCampaigns = [];
          };
          
          Map.set(storage.profiles, Map.phash, caller, profile);
          #ok(profile)
        };
      }
    };

    // Get profile for a specific principal
    public func getProfile(user: Principal) : Types.ProfileResult<Types.Profile> {
      switch (Map.get(storage.profiles, Map.phash, user)) {
        case null { #err("Profile not found") };
        case (?profile) { #ok(profile) };
      }
    };

    // Update profile for the caller
    public func updateProfile(caller: Principal, input: Types.ProfileInput) : Types.ProfileResult<Types.Profile> {
      switch (Map.get(storage.profiles, Map.phash, caller)) {
        case null { #err("Profile not found. Please register first.") };
        case (?existingProfile) {
          let updatedProfile : Types.Profile = {
            username = input.username;
            bio = input.bio;
            socialLinks = input.socialLinks;
            completedCampaigns = existingProfile.completedCampaigns; // Preserve completed campaigns
          };
          
          Map.set(storage.profiles, Map.phash, caller, updatedProfile);
          #ok(updatedProfile)
        };
      }
    };

    // Get all profiles (for discovery)
    public func getAllProfiles() : [(Principal, Types.Profile)] {
      Iter.toArray(Map.entries(storage.profiles))
    };

    // Get profile count
    public func getProfileCount() : Nat {
      Map.size(storage.profiles)
    };

    // Add a completed campaign to user's profile
    public func addCompletedCampaignToProfile(user: Principal, campaignId: Nat) : () {
      switch (Map.get(storage.profiles, Map.phash, user)) {
        case null { /* No profile exists, skip */ };
        case (?profile) {
          // Check if campaign is already in completed list
          let alreadyCompleted = Array.find<Nat>(profile.completedCampaigns, func(id: Nat) : Bool {
            id == campaignId
          });
          
          switch (alreadyCompleted) {
            case (?_) { /* Already exists, skip */ };
            case null {
              let updatedCompletedCampaigns = Array.append<Nat>(profile.completedCampaigns, [campaignId]);
              let updatedProfile : Types.Profile = {
                username = profile.username;
                bio = profile.bio;
                socialLinks = profile.socialLinks;
                completedCampaigns = updatedCompletedCampaigns;
              };
              Map.set(storage.profiles, Map.phash, user, updatedProfile);
            };
          }
        };
      }
    };
  }
}
