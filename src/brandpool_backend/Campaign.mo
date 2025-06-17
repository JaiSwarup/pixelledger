import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Map "mo:map/Map";
import Types "./Types";
import Storage "./Storage";
import Authorization "./Authorization";

module {
  public class CampaignManager(storage: Storage.Storage, authManager: Authorization.AuthorizationManager) {
    
    // Create a new campaign - only Brands can create campaigns
    public func createCampaign(caller: Principal, input: Types.CampaignInput) : Types.AuthResult<Types.Campaign> {
      authManager.withBrandAuth<Types.Campaign>(caller, func(account: Types.UserAccount) : Types.AuthResult<Types.Campaign> {
        let campaign : Types.Campaign = {
          id = storage.nextCampaignId;
          title = input.title;
          description = input.description;
          payout = input.payout;
          owner = caller;
          applicants = []; // Initialize as empty Principal array
          isCompleted = false;
        };

        Map.set(storage.campaigns, Map.nhash, storage.nextCampaignId, campaign);
        // Initialize empty applicants list in separate storage
        Map.set(storage.campaignApplicants, Map.nhash, storage.nextCampaignId, []);
        storage.nextCampaignId += 1;

        #ok(campaign)
      })
    };

    // Get all campaigns - any authenticated user can view
    public func getCampaigns(caller: Principal) : Types.AuthResult<[Types.Campaign]> {
      authManager.withAnyAuth<[Types.Campaign]>(caller, func(account: Types.UserAccount) : Types.AuthResult<[Types.Campaign]> {
        // Return campaigns with updated applicant data
        let allCampaigns = Iter.toArray(Map.vals(storage.campaigns));
        let updatedCampaigns = Array.map<Types.Campaign, Types.Campaign>(allCampaigns, func(campaign: Types.Campaign) : Types.Campaign {
          // Get applicants from the separate storage
          let applicants = switch (Map.get(storage.campaignApplicants, Map.nhash, campaign.id)) {
            case null { [] };
            case (?applicants) { applicants };
          };
          
          {
            id = campaign.id;
            title = campaign.title;
            description = campaign.description;
            payout = campaign.payout;
            owner = campaign.owner;
            applicants = applicants; // Use real applicant data
            isCompleted = campaign.isCompleted;
          }
        });
        #ok(updatedCampaigns)
      })
    };

    // Get a specific campaign by ID - any authenticated user can view
    public func getCampaignById(caller: Principal, id: Nat) : Types.AuthResult<Types.Campaign> {
      authManager.withAnyAuth<Types.Campaign>(caller, func(account: Types.UserAccount) : Types.AuthResult<Types.Campaign> {
        switch (Map.get(storage.campaigns, Map.nhash, id)) {
          case null { #err(#Unauthorized("Campaign not found")) };
          case (?campaign) { 
            // Get applicants from the separate storage
            let applicants = switch (Map.get(storage.campaignApplicants, Map.nhash, campaign.id)) {
              case null { [] };
              case (?applicants) { applicants };
            };
            
            let updatedCampaign : Types.Campaign = {
              id = campaign.id;
              title = campaign.title;
              description = campaign.description;
              payout = campaign.payout;
              owner = campaign.owner;
              applicants = applicants; // Use real applicant data
              isCompleted = campaign.isCompleted;
            };
            #ok(updatedCampaign)
          };
        }
      })
    };

    // Apply to a campaign using Principal - only Influencers can apply
    public func applyToCampaign(caller: Principal, campaignId: Nat) : Types.AuthResult<Text> {
      authManager.withInfluencerAuth<Text>(caller, func(account: Types.UserAccount) : Types.AuthResult<Text> {
        // Check if campaign exists
        switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
          case null { #err(#Unauthorized("Campaign not found")) };
          case (?campaign) {
            // Get current applicants for this campaign
            let currentApplicants = switch (Map.get(storage.campaignApplicants, Map.nhash, campaignId)) {
              case null { [] };
              case (?applicants) { applicants };
            };

            // Check if applicant already applied
            let alreadyApplied = Array.find<Principal>(currentApplicants, func(p: Principal) : Bool {
              Principal.equal(p, caller)
            });

            switch (alreadyApplied) {
              case (?_) { #err(#Unauthorized("Already applied to this campaign")) };
              case null {
                // Add applicant to the list
                let updatedApplicants = Array.append<Principal>(currentApplicants, [caller]);
                Map.set(storage.campaignApplicants, Map.nhash, campaignId, updatedApplicants);
                
                // Also update the campaign record to keep them in sync
                let updatedCampaign : Types.Campaign = {
                  id = campaign.id;
                  title = campaign.title;
                  description = campaign.description;
                  payout = campaign.payout;
                  owner = campaign.owner;
                  applicants = updatedApplicants; // Sync with Principal array
                  isCompleted = campaign.isCompleted;
                };
                Map.set(storage.campaigns, Map.nhash, campaignId, updatedCampaign);
                
                #ok("Successfully applied to campaign")
              };
            }
          };
        }
      })
    };

    // Get applicants for a specific campaign - only campaign owner can view
    public func getCampaignApplicants(caller: Principal, campaignId: Nat) : Types.AuthResult<[Principal]> {
      authManager.withBrandAuth<[Principal]>(caller, func(account: Types.UserAccount) : Types.AuthResult<[Principal]> {
        switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
          case null { #err(#Unauthorized("Campaign not found")) };
          case (?campaign) {
            if (Principal.equal(caller, campaign.owner)) {
              let applicants = switch (Map.get(storage.campaignApplicants, Map.nhash, campaignId)) {
                case null { [] };
                case (?applicants) { applicants };
              };
              #ok(applicants)
            } else {
              #err(#InsufficientPermissions("Only campaign owner can view applicants"))
            }
          };
        }
      })
    };

    // Approve an applicant for a campaign - only campaign owner can approve
    public func approveApplicant(caller: Principal, campaignId: Nat, applicant: Principal) : Types.AuthResult<Text> {
      authManager.withBrandAuth<Text>(caller, func(account: Types.UserAccount) : Types.AuthResult<Text> {
        // Check if campaign exists and caller is owner
        switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
          case null { #err(#Unauthorized("Campaign not found")) };
          case (?campaign) {
            if (not Principal.equal(caller, campaign.owner)) {
              #err(#InsufficientPermissions("Only campaign owner can approve applicants"))
            } else {
              // Verify applicant is an Influencer
              switch (authManager.requireInfluencer(applicant)) {
                case (#err(_)) { #err(#Unauthorized("Applicant must be an Influencer")) };
                case (#ok(_)) {
                  // Check if applicant has applied to this campaign
                  let currentApplicants = switch (Map.get(storage.campaignApplicants, Map.nhash, campaignId)) {
                    case null { [] };
                    case (?applicants) { applicants };
                  };

                  let hasApplied = Array.find<Principal>(currentApplicants, func(p: Principal) : Bool {
                    Principal.equal(p, applicant)
                  });

                  switch (hasApplied) {
                    case null { #err(#Unauthorized("Applicant has not applied to this campaign")) };
                    case (?_) {
                      // Get current approved applicants for this campaign
                      let currentApproved = switch (Map.get(storage.approvedApplicants, Map.nhash, campaignId)) {
                        case null { [] };
                        case (?approved) { approved };
                      };

                      // Check if applicant is already approved
                      let alreadyApproved = Array.find<Principal>(currentApproved, func(p: Principal) : Bool {
                        Principal.equal(p, applicant)
                      });

                      switch (alreadyApproved) {
                        case (?_) { #err(#Unauthorized("Applicant is already approved for this campaign")) };
                        case null {
                          // Add applicant to approved list
                          let updatedApproved = Array.append<Principal>(currentApproved, [applicant]);
                          Map.set(storage.approvedApplicants, Map.nhash, campaignId, updatedApproved);
                          #ok("Applicant successfully approved for campaign")
                        };
                      }
                    };
                  }
                };
              }
            }
          };
        }
      })
    };

    // Get approved applicants for a specific campaign - only campaign owner can view
    public func getCampaignApprovedApplicants(caller: Principal, campaignId: Nat) : Types.AuthResult<[Principal]> {
      authManager.withBrandAuth<[Principal]>(caller, func(account: Types.UserAccount) : Types.AuthResult<[Principal]> {
        switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
          case null { #err(#Unauthorized("Campaign not found")) };
          case (?campaign) {
            if (Principal.equal(caller, campaign.owner)) {
              let approved = switch (Map.get(storage.approvedApplicants, Map.nhash, campaignId)) {
                case null { [] };
                case (?approved) { approved };
              };
              #ok(approved)
            } else {
              #err(#InsufficientPermissions("Only campaign owner can view approved applicants"))
            }
          };
        }
      })
    };

    // Mark campaign as completed (used by escrow module) - only campaign owner
    public func markCampaignCompleted(caller: Principal, campaignId: Nat) : Types.AuthResult<Types.Campaign> {
      authManager.withBrandAuth<Types.Campaign>(caller, func(account: Types.UserAccount) : Types.AuthResult<Types.Campaign> {
        switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
          case null { #err(#Unauthorized("Campaign not found")) };
          case (?campaign) {
            if (not Principal.equal(caller, campaign.owner)) {
              #err(#InsufficientPermissions("Only campaign owner can mark campaign as completed"))
            } else {
              let completedCampaign : Types.Campaign = {
                id = campaign.id;
                title = campaign.title;
                description = campaign.description;
                payout = campaign.payout;
                owner = campaign.owner;
                applicants = campaign.applicants;
                isCompleted = true;
              };
              Map.set(storage.campaigns, Map.nhash, campaignId, completedCampaign);
              #ok(completedCampaign)
            }
          };
        }
      })
    };

    // Check if applicant is approved for a campaign - authenticated users can check
    public func isApplicantApproved(caller: Principal, campaignId: Nat, applicant: Principal) : Types.AuthResult<Bool> {
      authManager.withAnyAuth<Bool>(caller, func(account: Types.UserAccount) : Types.AuthResult<Bool> {
        let approvedList = switch (Map.get(storage.approvedApplicants, Map.nhash, campaignId)) {
          case null { [] };
          case (?approved) { approved };
        };

        let isApproved = Array.find<Principal>(approvedList, func(p: Principal) : Bool {
          Principal.equal(p, applicant)
        });

        switch (isApproved) {
          case null { #ok(false) };
          case (?_) { #ok(true) };
        }
      })
    };

    // Get campaigns owned by a specific user - any authenticated user can view
    public func getCampaignsByOwner(caller: Principal, owner: Principal) : Types.AuthResult<[Types.Campaign]> {
      authManager.withAnyAuth<[Types.Campaign]>(caller, func(account: Types.UserAccount) : Types.AuthResult<[Types.Campaign]> {
        let allCampaigns = Iter.toArray(Map.vals(storage.campaigns));
        let ownerCampaigns = Array.filter<Types.Campaign>(allCampaigns, func(campaign: Types.Campaign) : Bool {
          Principal.equal(campaign.owner, owner)
        });
        #ok(ownerCampaigns)
      })
    };

    // Get campaigns that a user has applied to - only the user themselves can view this
    public func getCampaignsAppliedTo(caller: Principal) : Types.AuthResult<[Types.Campaign]> {
      authManager.withInfluencerAuth<[Types.Campaign]>(caller, func(account: Types.UserAccount) : Types.AuthResult<[Types.Campaign]> {
        let allCampaigns = Iter.toArray(Map.vals(storage.campaigns));
        let appliedCampaigns = Array.filter<Types.Campaign>(allCampaigns, func(campaign: Types.Campaign) : Bool {
          let applicants = switch (Map.get(storage.campaignApplicants, Map.nhash, campaign.id)) {
            case null { [] };
            case (?applicants) { applicants };
          };
          
          let hasApplied = Array.find<Principal>(applicants, func(p: Principal) : Bool {
            Principal.equal(p, caller)
          });
          
          switch (hasApplied) {
            case null { false };
            case (?_) { true };
          }
        });
        #ok(appliedCampaigns)
      })
    };
  }
}
