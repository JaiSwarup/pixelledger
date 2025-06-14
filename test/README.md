# Test Configuration for BrandPool

This directory contains unit tests for the BrandPool project.

## Test Structure

- `basic.test.mo` - Basic functionality tests to verify test setup
- `campaign.test.mo` - Campaign management related tests
- `profile.test.mo` - User profile management tests  
- `application.test.mo` - Application process tests
- `debug-demo.test.mo` - Demonstrates debug output behavior

## Running Tests

To run all tests:
```bash
mops test
```

To run tests with more verbose output:
```bash
mops test --verbose
```

## Important: Debug Output Behavior

**Debug.print statements are suppressed in successful tests** but will appear when tests fail. This is normal behavior in the mops testing framework to keep output clean.

### How to See Debug Output:

1. **Temporarily make a test fail:**
   ```motoko
   await test("debug test", func() : async () {
     Debug.print("🔍 This will be visible!");
     Debug.print("🔍 Because the test fails");
     M.assertThat(2 + 2, M.equals(T.nat(5))); // Fails intentionally
   });
   ```

2. **Use better error messages with matchers:**
   ```motoko
   // The matchers library provides detailed error messages
   M.assertThat(actualValue, M.equals(T.nat(expectedValue)));
   // If this fails, you'll see exactly what was expected vs actual
   ```

3. **Use the attempt function for debugging:**
   ```motoko
   switch (M.attempt(value, M.equals(T.nat(42)))) {
     case (#success) { assert true; };
     case (#fail(message)) { 
       Debug.print("Test would fail with: " # message);
       assert false; // Only if you want to see the debug output
     };
   };
   ```

4. **Create debugging utilities:**
   ```motoko
   // Use assertions that include context
   let isValid = (campaign.payout > 0);
   assert isValid; // Will show the assertion context if it fails
   ```

### Best Practices for Testing:

1. **Use assertions instead of Debug.print for verification:**
   ```motoko
   // Good: Use assertions
   assert (result == expected);
   
   // Avoid: Using Debug.print for verification
   Debug.print("Result: " # debug_show(result));
   ```

2. **Debug.print appears only on test failure:**
   ```motoko
   await test("example", func() : async () {
     Debug.print("This will only show if the test fails");
     assert (someCondition); // If this fails, debug output appears
   });
   ```

3. **To see debug output temporarily:**
   - Uncomment failing tests in debug-utils.test.mo
   - Add temporary failing assertions to your tests
   - Use the matchers attempt function for detailed error analysis

## Test Guidelines

1. All test files should have the `.test.mo` extension
2. Use the built-in expect library from the test package
3. Group related tests in suites using `suite("Suite Name", func() : async () { ... })`
4. Use descriptive test names that explain what is being tested
5. Use assertions for verification, not Debug.print statements
6. Debug.print can be used for debugging failing tests

## Available Testing Libraries

The test package provides various expect functions:
- `Expect.expect.nat()` - for Nat comparisons
- `Expect.expect.text()` - for Text comparisons  
- `Expect.expect.bool()` - for Bool comparisons
- `Expect.expect.principal()` - for Principal comparisons
- `Expect.expect.array()` - for Array comparisons
- `Expect.fail()` - to explicitly fail a test with a message

### Matchers Library (Recommended)

We also use the `matchers` library which provides more expressive and composable assertions:

```motoko
import M "mo:matchers/Matchers";
import T "mo:matchers/Testable";

// Basic equality
M.assertThat(value, M.equals(T.nat(42)));

// Comparisons
M.assertThat(value, M.greaterThan(T.nat(10)));
M.assertThat(value, M.lessThan(T.nat(100)));

// Combined conditions
M.assertThat(value, M.allOf<Nat>([
  M.greaterThan(T.nat(10)),
  M.lessThan(T.nat(100))
]));

// Array testing
M.assertThat(array, M.hasSize<Nat>(T.nat(5)));
M.assertThat(array, M.array<Nat>([
  M.equals(T.nat(1)),
  M.equals(T.nat(2))
]));

// Text testing
M.assertThat(text, M.startsWith("Hello"));
M.assertThat(text, M.containsText("World"));

// Option testing
M.assertThat(option, M.isSome<Nat>(M.equals(T.nat(42))));
M.assertThat(option, M.isNull<Nat>());
```

**Advantages of Matchers:**
- More expressive and readable test assertions
- Better error messages when tests fail
- Composable matchers for complex conditions
- Type-safe testing with clear intent

## Test Coverage

Current test coverage includes:
- Data structure validation
- Input validation logic
- Principal handling
- Timestamp functionality
- Status transitions
- Array operations
