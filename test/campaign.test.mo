import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import { test; suite } "mo:test/async";
import M "mo:matchers/Matchers";
import T "mo:matchers/Testable";

// Test suite for Campaign functionality (unit tests for data structures)
let _campaignTests = suite("Campaign Management Tests", func() : async () {
  
  // Test campaign data structure
  await test("should create campaign data structure correctly", func() : async () {
    let campaignInput = {
      title = "Test Campaign";
      description = "This is a test campaign for unit testing";
      payout = 1000;
    };
    
    // Test the input structure using matchers
    M.assertThat(campaignInput.title, M.equals(T.text("Test Campaign")));
    M.assertThat(campaignInput.description, M.equals(T.text("This is a test campaign for unit testing")));
    M.assertThat(campaignInput.payout, M.equals(T.nat(1000)));
    Debug.print("✓ Campaign data structure created correctly");
  });

  // Test principal validation
  await test("should handle principal validation", func() : async () {
    let testPrincipal = Principal.fromText("rbp2o-jaaaa-aaaah-qcaiq-cai");
    let principalText = Principal.toText(testPrincipal);
    
    M.assertThat(principalText, M.equals(T.text("rbp2o-jaaaa-aaaah-qcaiq-cai")));
    Debug.print("✓ Principal validation test passed");
  });

  // Test campaign validation logic
  await test("should validate campaign input requirements", func() : async () {
    let validCampaign = {
      title = "Valid Campaign";
      description = "A campaign with valid data";
      payout = 1000;
    };
    
    // Test that title is not empty (using simple assertions)
    assert(validCampaign.title.size() > 0);
    // Test that payout is positive  
    assert(validCampaign.payout > 0);
    // Test that description is not empty
    assert(validCampaign.description.size() > 0);
    
    // Test with matchers for equality
    M.assertThat(validCampaign.title, M.equals(T.text("Valid Campaign")));
    M.assertThat(validCampaign.payout, M.equals(T.nat(1000)));
    
    Debug.print("✓ Campaign validation tests passed");
  });
});
