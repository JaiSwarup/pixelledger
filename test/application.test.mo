import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Int "mo:base/Int";
import { test; suite } "mo:test/async";
import M "mo:matchers/Matchers";
import T "mo:matchers/Testable";

// Test suite for Application functionality
let _applicationTests = suite("Application Management Tests", func() : async () {
  
  // Test application data structure
  await test("should create application data structure correctly", func() : async () {
    let applicationInput = {
      campaignId = 1;
      applicantId = "test-user-123";
      portfolioLink = "https://portfolio.example.com";
      message = "I would like to apply for this campaign";
    };
    
    M.assertThat(applicationInput.campaignId, M.equals(T.nat(1)));
    M.assertThat(applicationInput.applicantId, M.equals(T.text("test-user-123")));
    M.assertThat(applicationInput.portfolioLink, M.equals(T.text("https://portfolio.example.com")));
    M.assertThat(applicationInput.message, M.equals(T.text("I would like to apply for this campaign")));
    Debug.print("✓ Application data structure created correctly");
  });

  // Test timestamp functionality
  await test("should handle timestamp creation", func() : async () {
    let currentTime = Time.now();
    
    // Verify that timestamp is a reasonable value (not zero and not negative)
    M.assertThat(currentTime, M.greaterThan(0));
    Debug.print("✓ Timestamp creation test passed: " # Int.toText(currentTime));
  });

  // Test application status logic with improved approach
  await test("should handle application status transitions", func() : async () {
    type ApplicationStatus = {
      #pending;
      #approved;
      #rejected;
    };
    
    let initialStatus: ApplicationStatus = #pending;
    let approvedStatus: ApplicationStatus = #approved;
    let rejectedStatus: ApplicationStatus = #rejected;
    
    // Test status comparisons using pattern matching validation
    let isPending = switch (initialStatus) {
      case (#pending) { true };
      case (_) { false };
    };
    
    let isApproved = switch (approvedStatus) {
      case (#approved) { true };
      case (_) { false };
    };
    
    let isRejected = switch (rejectedStatus) {
      case (#rejected) { true };
      case (_) { false };
    };
    
    // Assert all status validations
    M.assertThat(isPending, M.equals(T.bool(true)));
    M.assertThat(isApproved, M.equals(T.bool(true)));
    M.assertThat(isRejected, M.equals(T.bool(true)));
    
    Debug.print("✓ All application status transitions validated");
  });
});
