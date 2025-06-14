import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Map "mo:map/Map";
import Types "./Types";
import Storage "./Storage";

module {
  public class CampaignManager(storage: Storage.Storage) {
    
    // Create a new campaign
    public func createCampaign(owner: Principal, input: Types.CampaignInput) : Types.CampaignResult<Types.Campaign> {
      let campaign : Types.Campaign = {
        id = storage.nextCampaignId;
        title = input.title;
        description = input.description;
        payout = input.payout;
        owner = owner;
        applicants = [];
        isCompleted = false;
      };

      Map.set(storage.campaigns, Map.nhash, storage.nextCampaignId, campaign);
      storage.nextCampaignId += 1;

      #ok(campaign)
    };

    // Get all campaigns
    public func getCampaigns() : [Types.Campaign] {
      Iter.toArray(Map.vals(storage.campaigns))
    };

    // Get a specific campaign by ID
    public func getCampaignById(id: Nat) : Types.CampaignResult<Types.Campaign> {
      switch (Map.get(storage.campaigns, Map.nhash, id)) {
        case null { #err("Campaign not found") };
        case (?campaign) { #ok(campaign) };
      }
    };

    // Add applicant to a campaign (legacy function - kept for compatibility)
    public func addApplicant(campaignId: Nat, applicantId: Text) : Types.CampaignResult<Types.Campaign> {
      switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
        case null { #err("Campaign not found") };
        case (?campaign) {
          let updatedApplicants = Array.append<Text>(campaign.applicants, [applicantId]);
          let updatedCampaign : Types.Campaign = {
            id = campaign.id;
            title = campaign.title;
            description = campaign.description;
            payout = campaign.payout;
            owner = campaign.owner;
            applicants = updatedApplicants;
            isCompleted = campaign.isCompleted;
          };
          Map.set(storage.campaigns, Map.nhash, campaignId, updatedCampaign);
          #ok(updatedCampaign)
        };
      }
    };

    // Apply to a campaign using Principal
    public func applyToCampaign(campaignId: Nat, applicant: Principal) : Types.CampaignResult<Text> {
      // Check if campaign exists
      switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
        case null { #err("Campaign not found") };
        case (?_campaign) {
          // Get current applicants for this campaign
          let currentApplicants = switch (Map.get(storage.campaignApplicants, Map.nhash, campaignId)) {
            case null { [] };
            case (?applicants) { applicants };
          };

          // Check if applicant already applied
          let alreadyApplied = Array.find<Principal>(currentApplicants, func(p: Principal) : Bool {
            Principal.equal(p, applicant)
          });

          switch (alreadyApplied) {
            case (?_) { #err("Already applied to this campaign") };
            case null {
              // Add applicant to the list
              let updatedApplicants = Array.append<Principal>(currentApplicants, [applicant]);
              Map.set(storage.campaignApplicants, Map.nhash, campaignId, updatedApplicants);
              #ok("Successfully applied to campaign")
            };
          }
        };
      }
    };

    // Get applicants for a specific campaign
    public func getCampaignApplicants(campaignId: Nat) : Types.CampaignResult<[Principal]> {
      switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
        case null { #err("Campaign not found") };
        case (?_) {
          let applicants = switch (Map.get(storage.campaignApplicants, Map.nhash, campaignId)) {
            case null { [] };
            case (?applicants) { applicants };
          };
          #ok(applicants)
        };
      }
    };

    // Approve an applicant for a campaign
    public func approveApplicant(campaignId: Nat, applicant: Principal) : Types.CampaignResult<Text> {
      // Check if campaign exists
      switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
        case null { #err("Campaign not found") };
        case (?_campaign) {
          // Check if applicant has applied to this campaign
          let currentApplicants = switch (Map.get(storage.campaignApplicants, Map.nhash, campaignId)) {
            case null { [] };
            case (?applicants) { applicants };
          };

          let hasApplied = Array.find<Principal>(currentApplicants, func(p: Principal) : Bool {
            Principal.equal(p, applicant)
          });

          switch (hasApplied) {
            case null { #err("Applicant has not applied to this campaign") };
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
                case (?_) { #err("Applicant is already approved for this campaign") };
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
    };

    // Get approved applicants for a specific campaign
    public func getCampaignApprovedApplicants(campaignId: Nat) : Types.CampaignResult<[Principal]> {
      switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
        case null { #err("Campaign not found") };
        case (?_) {
          let approved = switch (Map.get(storage.approvedApplicants, Map.nhash, campaignId)) {
            case null { [] };
            case (?approved) { approved };
          };
          #ok(approved)
        };
      }
    };

    // Mark campaign as completed (used by escrow module)
    public func markCampaignCompleted(campaignId: Nat) : Types.CampaignResult<Types.Campaign> {
      switch (Map.get(storage.campaigns, Map.nhash, campaignId)) {
        case null { #err("Campaign not found") };
        case (?campaign) {
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
        };
      }
    };

    // Check if applicant is approved for a campaign
    public func isApplicantApproved(campaignId: Nat, applicant: Principal) : Bool {
      let approvedList = switch (Map.get(storage.approvedApplicants, Map.nhash, campaignId)) {
        case null { [] };
        case (?approved) { approved };
      };

      let isApproved = Array.find<Principal>(approvedList, func(p: Principal) : Bool {
        Principal.equal(p, applicant)
      });

      switch (isApproved) {
        case null { false };
        case (?_) { true };
      }
    };
  }
}
