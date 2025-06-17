import Types "./Types";
import Text "mo:base/Text";
import Array "mo:base/Array";

module {
  
  // Validation functions for role-specific data
  
  public func validateBrandInfo(brandInfo: ?Types.BrandInfo) : Types.AuthResult<()> {
    switch (brandInfo) {
      case null { #err(#Unauthorized("Brand information is required")) };
      case (?info) {
        if (Text.size(info.companyName) == 0) {
          #err(#Unauthorized("Company name cannot be empty"))
        } else if (Text.size(info.industry) == 0) {
          #err(#Unauthorized("Industry cannot be empty"))
        } else if (Text.size(info.website) == 0) {
          #err(#Unauthorized("Website cannot be empty"))
        } else {
          #ok(())
        }
      };
    }
  };

  public func validateInfluencerInfo(influencerInfo: ?Types.InfluencerInfo) : Types.AuthResult<()> {
    switch (influencerInfo) {
      case null { #err(#Unauthorized("Influencer information is required")) };
      case (?info) {
        if (info.followerCount == 0) {
          #err(#Unauthorized("Follower count must be greater than 0"))
        } else if (Array.size(info.contentCategories) == 0) {
          #err(#Unauthorized("At least one content category is required"))
        } else if (info.engagementRate < 0.0 or info.engagementRate > 100.0) {
          #err(#Unauthorized("Engagement rate must be between 0 and 100"))
        } else {
          #ok(())
        }
      };
    }
  };

  public func validateProfileInput(role: Types.UserRole, input: Types.ProfileInput) : Types.AuthResult<()> {
    // Basic validation for all users
    if (Text.size(input.username) == 0) {
      return #err(#Unauthorized("Username cannot be empty"));
    };

    if (Text.size(input.bio) == 0) {
      return #err(#Unauthorized("Bio cannot be empty"));
    };

    // Role-specific validation
    switch (role) {
      case (#Brand) {
        validateBrandInfo(input.brandInfo)
      };
      case (#Influencer) {
        validateInfluencerInfo(input.influencerInfo)
      };
    }
  };

  public func validateCampaignInput(input: Types.CampaignInput) : Types.AuthResult<()> {
    if (Text.size(input.title) == 0) {
      #err(#Unauthorized("Campaign title cannot be empty"))
    } else if (Text.size(input.description) == 0) {
      #err(#Unauthorized("Campaign description cannot be empty"))
    } else if (input.payout == 0) {
      #err(#Unauthorized("Campaign payout must be greater than 0"))
    } else {
      #ok(())
    }
  };

  // Helper functions for frontend
  public func getRoleDisplayName(role: Types.UserRole) : Text {
    switch (role) {
      case (#Brand) { "Brand" };
      case (#Influencer) { "Influencer" };
    }
  };

  public func getVerificationStatusDisplayName(status: Types.VerificationStatus) : Text {
    switch (status) {
      case (#Pending) { "Pending" };
      case (#Verified) { "Verified" };
      case (#Rejected) { "Rejected" };
    }
  };

  public func canUserPerformAction(userRole: Types.UserRole, action: Text) : Bool {
    switch (userRole, action) {
      case (#Brand, "createCampaign") { true };
      case (#Brand, "approveCampaign") { true };
      case (#Brand, "viewApplicants") { true };
      case (#Influencer, "applyToCampaign") { true };
      case (#Influencer, "viewCampaigns") { true };
      case (_, "viewProfiles") { true };
      case (_, "updateOwnProfile") { true };
      case (_, "viewOwnProfile") { true };
      case (_, _) { false };
    }
  };
}
