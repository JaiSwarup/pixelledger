import Debug "mo:base/Debug";
import { test; suite } "mo:test/async";
import M "mo:matchers/Matchers";
import T "mo:matchers/Testable";

// Comprehensive test suite demonstrating matchers library capabilities
let _matchersTests = suite("Matchers Library Demo", func() : async () {
  
  await test("should demonstrate equality matchers", func() : async () {
    // Basic equality tests
    M.assertThat(42, M.equals(T.nat(42)));
    M.assertThat("hello", M.equals(T.text("hello")));
    M.assertThat(true, M.equals(T.bool(true)));
    
    // WORKAROUND: Use assertion failures to show debug-like messages
    // This will only show if the test fails, but demonstrates the concept
    let testPassed = (42 == 42);
    assert testPassed; // This assertion includes the test info
    
    // Alternative: Use the attempt function to get detailed error messages
    switch (M.attempt(42, M.equals(T.nat(42)))) {
      case (#success) { 
        // Test passed - we can't print debug info here
        assert true;
      };
      case (#fail(_message)) { 
        // This would show detailed error info if the test failed
        assert false; 
      };
    };
  });

  // TEMPORARY: Uncomment this test to see debug output
  /*
  await test("FAIL ON PURPOSE - shows debug output", func() : async () {
    Debug.print("🔍 You can see this debug message!");
    Debug.print("🔍 Because this test will fail");
    Debug.print("🔍 Comment out this test after viewing the output");
    
    // This will fail and show the debug output above
    M.assertThat(2 + 2, M.equals(T.nat(5))); 
  });
  */

  await test("should demonstrate comparison matchers for Int", func() : async () {
    let value: Int = 10;
    
    // Comparison matchers (these work with Int types)
    M.assertThat(value, M.greaterThan(5));
    M.assertThat(value, M.lessThan(20));
    M.assertThat(value, M.greaterThanOrEqual(10));
    M.assertThat(value, M.lessThanOrEqual(10));
    M.assertThat(value, M.inRange(5, 15));
    
    Debug.print("✓ Comparison matchers working");
  });

  await test("should demonstrate combined matchers", func() : async () {
    let value: Int = 15;
    
    // Combined matchers using allOf
    M.assertThat(value, M.allOf<Int>([
      M.greaterThan(10),
      M.lessThan(20),
      M.greaterThanOrEqual(15)
    ]));
    
    // Combined matchers using anyOf
    M.assertThat(value, M.anyOf<Int>([
      M.equals(T.int(10)),
      M.equals(T.int(15)),
      M.equals(T.int(20))
    ]));
    
    Debug.print("✓ Combined matchers working");
  });

  await test("should demonstrate array matchers", func() : async () {
    let numbers = [1, 2, 3];
    
    // Array element matchers
    M.assertThat(numbers, M.array<Nat>([
      M.equals(T.nat(1)),
      M.equals(T.nat(2)),
      M.equals(T.nat(3))
    ]));
    
    Debug.print("✓ Array matchers working");
  });

  await test("should demonstrate option matchers", func() : async () {
    let someValue: ?Nat = ?42;
    let noneValue: ?Nat = null;
    
    // Option matchers
    M.assertThat(someValue, M.isSome<Nat>());
    M.assertThat(T.optional(T.natTestable, noneValue), M.isNull<Nat>());
    
    Debug.print("✓ Option matchers working");
  });

  await test("should demonstrate not matcher", func() : async () {
    let value = 42;
    
    // Using not matcher
    M.assertThat(value, M.not_(M.equals(T.nat(0))));
    M.assertThat("hello", M.not_(M.equals(T.text("world"))));
    
    Debug.print("✓ Not matchers working");
  });

  await test("should demonstrate custom validation", func() : async () {
    // Example of testing campaign data with matchers
    let campaign = {
      id = 1;
      title = "Marketing Campaign";
      payout = 1000;
      isActive = true;
    };
    
    // Test individual fields
    M.assertThat(campaign.id, M.equals(T.nat(1)));
    M.assertThat(campaign.title, M.equals(T.text("Marketing Campaign")));
    M.assertThat(campaign.payout, M.equals(T.nat(1000)));
    M.assertThat(campaign.isActive, M.equals(T.bool(true)));
    
    Debug.print("✓ Custom validation with matchers working");
  });

  // 🔍 DEBUGGING: Uncomment this test to see debug output
  /*
  await test("DEBUG - shows debug output when failing", func() : async () {
    Debug.print("🔍 Debug message 1: This WILL be visible!");
    Debug.print("🔍 Debug message 2: Because this test fails intentionally");
    Debug.print("🔍 Debug message 3: After viewing output, comment this test out");
    
    let value = 2 + 2;
    Debug.print("🔍 Debug message 4: Calculated value is " # debug_show(value));
    
    // This assertion will fail, causing all debug output above to be shown
    M.assertThat(value, M.equals(T.nat(5))); // 4 ≠ 5, so this fails
  });
  */
});