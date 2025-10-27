# Issue #6 - [BUG] mkdir: return 403 error for mkdir action in the root dir #17

## Motivation

When users attempt to create directories in the root directory of the filesystem, the system currently returns a 500 Internal Server Error. This is problematic because a 500 status code indicates an unexpected server failure, when in reality this is an intentional restriction - the root directory is read-only by design.

Returning the correct HTTP status code (403 Forbidden) is important for API clarity and proper error handling. It helps client applications distinguish between permission/policy violations (which are expected and handled gracefully) and actual server errors (which may require investigation or retry logic). This improves the developer experience and makes the API more predictable and standards-compliant.

## Current Behavior

The `puter.fs.mkdir()` function returns a 500 Internal Server Error when attempting to create a directory directly in the root directory. This misleads API consumers into thinking there's a server-side failure rather than a policy restriction.

**Reproduction Steps:**
1. Open the Puter development environment on `puter.localhost:4100`
2. Open the Developer Console on your browser:
  - **Chrome:** Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac), or right-click anywhere on the page and select **Inspect**.
  - **Firefox:** Press `Ctrl+Shift+K` (Windows/Linux) or `Cmd+Option+K` (Mac), or right-click and choose **Inspect Element**.
  - **Edge:** Press `Ctrl+Shift+I` (Windows) or `Cmd+Option+I` (Mac), or right-click and select **Inspect**.
  - **Safari:** Enable the Develop menu in Preferences > Advanced, then press `Cmd+Option+C` or choose **Develop > Show JavaScript Console**.
2. Execute `puter.fs.mkdir('/foo')` to attempt creating a directory in the root
3. Observe: The operation fails with a 500 Internal Server Error
4. Compare with `puter.fs.mkdir('/[username]/Videos/foo')` which succeeds as expected
5. Observe: The error response doesn't clearly communicate that root directory creation is forbidden

## Expected Behavior

When a user attempts to create a directory in the root directory, the system should return a 403 Forbidden error with a clear message explaining that the root directory is read-only.

**Acceptance Criteria:**
- [ ] Attempting to create a directory in the root (e.g., `/foo`) returns a 403 Forbidden error
- [ ] The error response includes a clear message indicating that directories cannot be created in the root directory
- [ ] Creating directories in valid locations (e.g., `/[username]/Videos/foo`) continues to work correctly
- [ ] The validation check occurs before any directory creation logic is executed
- [ ] The error handling applies regardless of whether `create_missing_parents` is enabled

## Verification

**Manual Testing:**
1. Test the forbidden case: `puter.fs.mkdir('/foo')` should return 403 Forbidden with an appropriate error message
2. Test valid directory creation: `puter.fs.mkdir('/[username]/Videos/testdir')` should succeed
3. Verify the created directory exists: `await puter.fs.readdir('/[username]/Videos/')` should list `testdir`
4. Test with parent creation enabled to ensure the check applies in all scenarios

**Expected Results:**
- Root directory creation attempts fail with 403 status code (not 500)
- Valid directory creation operations continue to work as before
- Error messages clearly communicate the policy restriction
