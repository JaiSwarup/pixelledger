# Fix for Infinite Refresh Issue

## Root Cause Analysis

The infinite refresh was caused by several overlapping issues:

### 1. **Duplicate Logic Between Hook and Store**
- `useRoleAuth` hook was managing when to fetch data
- `useRoleAuthStore` also had its own fetch logic and caching
- This created competing decision-making that could cause loops

### 2. **Unstable Dependencies**
- Store functions were included in useEffect dependencies
- Even though Zustand functions are stable, the linter couldn't detect this
- This caused unnecessary re-renders

### 3. **Race Conditions**
- Multiple simultaneous calls to `refreshUserAccount`
- No locking mechanism to prevent concurrent requests
- State could be inconsistent during overlapping requests

### 4. **Missing Loading State Management**
- Loading state wasn't being properly cleared in all code paths
- Caused UI to get stuck in loading state

## Applied Fixes

### 1. **Simplified Hook Logic**
```typescript
// BEFORE: Hook managed complex fetch logic
useEffect(() => {
  const fetchUserAccount = async () => {
    // Complex logic here...
    await refreshUserAccount(principal, backendActor);
  };
  fetchUserAccount();
}, [isAuthenticated, principal, backendActor, refreshUserAccount, clearUserAccount]);

// AFTER: Hook only triggers on auth state changes
useEffect(() => {
  const currentAuthState = `${isAuthenticated}-${principal?.toString() || 'none'}-${!!backendActor}`;
  if (lastAuthStateRef.current === currentAuthState) return;
  
  lastAuthStateRef.current = currentAuthState;
  if (!isAuthenticated || !principal) {
    clearUserAccount();
    return;
  }
  if (!backendActor) return;
  
  refreshUserAccount(principal, backendActor);
}, [isAuthenticated, principal?.toString(), !!backendActor]); // No store functions
```

### 2. **Added Request Locking**
```typescript
interface RoleAuthState {
  _isRefreshing: boolean; // Lock to prevent concurrent requests
  // ...
}

refreshUserAccount: async (principal, backendActor) => {
  if (state._isRefreshing) {
    console.log('Already refreshing, skipping duplicate request');
    return;
  }
  
  set({ loading: true, _isRefreshing: true });
  // ... fetch logic
  set({ loading: false, _isRefreshing: false });
}
```

### 3. **Stable Function References**
- Removed store functions from useEffect dependencies
- Used string-based auth state tracking instead of object references
- Added proper logging for debugging

### 4. **Timeout Protection**
```typescript
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
);

const isRegistered = await Promise.race([
  backendActor.isUserRegistered(principal),
  timeoutPromise
]);
```

### 5. **Comprehensive State Cleanup**
- All loading state changes now also clear the refresh lock
- `clearUserAccount` properly resets all state
- Added debug logging throughout

## Testing

The app should now:
1. ✅ Load authentication state from localStorage immediately
2. ✅ Check user registration only once per principal change
3. ✅ Show proper loading states without infinite loops
4. ✅ Handle errors gracefully with timeouts
5. ✅ Cache user data for 5 minutes to reduce backend calls
6. ✅ Display debug info in development mode

## Debug Panel

In development mode, you'll see a debug panel in the top-right showing:
- Auth status and loading state
- Principal information
- Backend actor availability
- Role loading and user account status
- Error states
- Force show fallback status

This helps identify exactly where any remaining issues might occur.
