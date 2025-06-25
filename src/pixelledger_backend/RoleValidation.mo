import Types "./Types";
import Text "mo:base/Text";
import Array "mo:base/Array";

module {
  
  // Validation functions for role-specific data
  
  public func validateClientInfo(clientInfo: ?Types.ClientInfo) : Types.AuthResult<()> {
    switch (clientInfo) {
      case null { #err(#Unauthorized("Client information is required")) };
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

  public func validateCreativeInfo(creativeInfo: ?Types.CreativeInfo) : Types.AuthResult<()> {
    switch (creativeInfo) {
      case null { #err(#Unauthorized("Creative information is required")) };
      case (?info) {
        if (Array.size(info.specializations) == 0) {
          #err(#Unauthorized("You must select at least one specialization"))
        } else if ( switch (info.experienceLevel) {
          case (#Beginner) false; case (#Intermediate) false; case (#Expert) false; case (#Master) false;
        } ) {
          #err(#Unauthorized("Experience level must be Beginner, Intermediate, or Expert"))
        } else if (switch (info.hourlyRate) { case null true; case (?rate) rate < 0 }) {
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
      case (#Client) {
        validateClientInfo(input.clientInfo)
      };
      case (#Creative) {
        validateCreativeInfo(input.creativeInfo)
      };
    }
  };

  public func validateProjectInput(input: Types.ProjectInput) : Types.AuthResult<()> {
    if (Text.size(input.title) == 0) {
      #err(#Unauthorized("Project title cannot be empty"))
    } else if (Text.size(input.description) == 0) {
      #err(#Unauthorized("Project description cannot be empty"))
    } else if (input.budget == 0) {
      #err(#Unauthorized("Project payout must be greater than 0"))
    } else {
      #ok(())
    }
  };

  // Helper functions for frontend
  public func getRoleDisplayName(role: Types.UserRole) : Text {
    switch (role) {
      case (#Client) { "Client" };
      case (#Creative) { "Creative" };
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
      case (#Client, "createProjects") { true };
      case (#Client, "approveProjects") { true };
      case (#Client, "viewApplicants") { true };
      case (#Creative, "applyToProjects") { true };
      case (#Creative, "viewProjectss") { true };
      case (_, "viewProfiles") { true };
      case (_, "updateOwnProfile") { true };
      case (_, "viewOwnProfile") { true };
      case (_, _) { false };
    }
  };
}
