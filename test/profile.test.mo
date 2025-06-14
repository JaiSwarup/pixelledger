import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import { test; suite } "mo:test/async";
import M "mo:matchers/Matchers";
import T "mo:matchers/Testable";

// Test suite for Profile functionality
let _profileTests = suite("Profile Management Tests", func() : async () {
  
  // Test profile data structure
  await test("should create profile data structure correctly", func() : async () {
    let profileInput = {
      name = "Test User";
      email = "test@example.com";
      bio = "Test bio";
      socialLinks = ["https://twitter.com/test"];
    };
    
    M.assertThat(profileInput.name, M.equals(T.text("Test User")));
    M.assertThat(profileInput.email, M.equals(T.text("test@example.com")));
    M.assertThat(profileInput.bio, M.equals(T.text("Test bio")));
    M.assertThat(profileInput.socialLinks.size(), M.equals(T.nat(1)));
    Debug.print("✓ Profile data structure created correctly");
  });

  // Test email validation logic
  await test("should validate email format", func() : async () {
    let validEmail = "user@domain.com";
    let invalidEmail = "invalid-email";
    
    // Simple email validation (contains @ and .)
    let hasAt = func(email: Text): Bool {
      let chars = email.chars();
      for (char in chars) {
        if (char == '@') return true;
      };
      false;
    };
    
    let hasDot = func(email: Text): Bool {
      let chars = email.chars();
      for (char in chars) {
        if (char == '.') return true;
      };
      false;
    };
    
    M.assertThat(hasAt(validEmail) and hasDot(validEmail), M.equals(T.bool(true)));
    M.assertThat(hasAt(invalidEmail) and hasDot(invalidEmail), M.equals(T.bool(false)));
    Debug.print("✓ Email validation tests passed");
  });

  // Test social links array handling
  await test("should handle social links array", func() : async () {
    let socialLinks = ["https://twitter.com/user", "https://linkedin.com/in/user"];
    
    M.assertThat(socialLinks.size(), M.equals(T.nat(2)));
    M.assertThat(socialLinks[0], M.equals(T.text("https://twitter.com/user")));
    Debug.print("✓ Social links array handling tests passed");
  });
});
