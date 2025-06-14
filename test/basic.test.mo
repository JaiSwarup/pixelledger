import Debug "mo:base/Debug";
import { test; suite } "mo:test/async";
import M "mo:matchers/Matchers";
import T "mo:matchers/Testable";

// Basic arithmetic tests to verify test setup
let _basicTests = suite("Basic Tests", func() : async () {
  
  await test("should perform basic arithmetic", func() : async () {
    let result = 2 + 2;
    M.assertThat(result, M.equals(T.nat(4)));
    Debug.print("✓ Basic arithmetic test passed");
  });

  await test("should handle text comparison", func() : async () {
    let text = "Hello, World!";
    M.assertThat(text, M.equals(T.text("Hello, World!")));
    Debug.print("✓ Text comparison test passed");
  });

  await test("should handle boolean values", func() : async () {
    let isTrue = true;
    M.assertThat(isTrue, M.equals(T.bool(true)));
    Debug.print("✓ Boolean test passed");
  });

  await test("should demonstrate basic matchers", func() : async () {
    let number: Int = 42;
    
    // Test using Int matchers
    M.assertThat(number, M.greaterThan(40));
    M.assertThat(number, M.lessThan(50));
    M.assertThat(number, M.inRange(40, 50));
    
    Debug.print("✓ Basic matchers test passed");
  });
});
