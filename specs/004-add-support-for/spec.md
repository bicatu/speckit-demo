# Feature Specification: PKCE Support for OpenID Connect Authentication

**Feature Branch**: `004-add-support-for`  
**Created**: 2025-10-20  
**Status**: Draft  
**Input**: User description: "add support for PKCE on the backend and frontend"

## Clarifications

### Session 2025-10-20

- Q: How should the system handle lost code_verifier scenarios? → A: Detect missing verifier at callback, show clear error message, and prompt user to retry login
- Q: What observability should be implemented for PKCE flows? → A: Log security events (failures, missing verifiers, invalid challenges) and performance metrics (flow duration)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Authorization Code Flow with PKCE (Priority: P1)

When a user initiates login through the frontend application, the system generates a cryptographically secure PKCE code verifier and code challenge, sends the challenge to the authorization server during the OAuth authorization request, and later exchanges the authorization code along with the original verifier for access tokens. This prevents authorization code interception attacks for all client types.

**Why this priority**: This is the core security enhancement required by the updated project constitution. PKCE is mandatory for all OpenID Connect implementations and directly addresses authorization code interception vulnerabilities that affect both public clients (SPAs, mobile apps) and confidential clients.

**Independent Test**: Can be fully tested by initiating a login flow, capturing the authorization request to verify code_challenge presence, completing the OAuth flow, and verifying that token exchange includes code_verifier. Security is validated by confirming cryptographic randomness of verifier and proper SHA256 hashing.

**Acceptance Scenarios**:

1. **Given** a user is not authenticated, **When** they click the login button, **Then** the system generates a random code_verifier (43-128 characters), derives a SHA256 code_challenge, stores the verifier securely in session storage, and redirects to the authorization server with code_challenge parameter
2. **Given** the authorization server redirects back with an authorization code, **When** the frontend exchanges the code for tokens, **Then** the system retrieves the stored code_verifier and includes it in the token exchange request
3. **Given** the token exchange request is sent, **When** the authorization server validates the code_verifier against the original code_challenge, **Then** access and refresh tokens are successfully returned
4. **Given** an attacker intercepts the authorization code, **When** they attempt to exchange it without the correct code_verifier, **Then** the authorization server rejects the request and no tokens are issued

---

### User Story 2 - Backend PKCE Validation Support (Priority: P2)

The backend authentication middleware and OpenID Connect client implementation must support receiving and validating PKCE parameters from the frontend, ensuring that token exchange requests include the code_verifier and that the provider configuration supports PKCE flow.

**Why this priority**: While the frontend drives the PKCE flow, the backend must properly handle PKCE parameters in callback processing and token exchange. This ensures end-to-end PKCE support across the entire authentication stack.

**Independent Test**: Can be tested by sending token exchange requests with and without code_verifier to the backend callback endpoint, and verifying that requests without proper PKCE parameters are rejected when PKCE is enforced.

**Acceptance Scenarios**:

1. **Given** the backend receives an OAuth callback with an authorization code, **When** it exchanges the code for tokens, **Then** it includes the code_verifier parameter provided by the frontend in the token request
2. **Given** the OpenID Connect provider configuration, **When** the backend initializes the authentication client, **Then** it enables PKCE support with SHA256 as the code challenge method
3. **Given** a token exchange request without code_verifier, **When** PKCE is enforced by the provider, **Then** the backend properly handles the error response and returns appropriate error message to the frontend

---

### User Story 3 - Secure Code Verifier Storage (Priority: P3)

The frontend must securely store the PKCE code_verifier during the OAuth flow (between authorization request and callback) using appropriate browser storage mechanisms that prevent unauthorized access while maintaining availability for the callback handler.

**Why this priority**: Proper storage of the code_verifier is essential for PKCE security. If the verifier is compromised or lost, the OAuth flow cannot complete. However, this is lower priority than the core PKCE implementation as storage mechanisms can be refined after the basic flow works.

**Independent Test**: Can be tested by initiating login, inspecting browser storage to verify verifier presence and format, closing/reopening browser tabs, and confirming the callback can retrieve the verifier to complete authentication.

**Acceptance Scenarios**:

1. **Given** the frontend generates a code_verifier, **When** it redirects to the authorization server, **Then** the verifier is stored in session storage with a unique key tied to the OAuth state parameter
2. **Given** the OAuth callback is received, **When** the frontend retrieves the code_verifier from storage, **Then** it successfully retrieves the correct verifier using the state parameter as the key
3. **Given** the authentication flow completes, **When** tokens are received, **Then** the code_verifier is immediately removed from storage to minimize exposure
4. **Given** multiple concurrent login attempts, **When** different browser tabs initiate authentication, **Then** each flow maintains its own isolated code_verifier without conflicts

---

### Edge Cases

- What happens when the code_verifier is lost from browser storage (cleared by user, expired) before the callback completes? **→ System detects missing verifier at callback, displays clear error message explaining the issue, and prompts user to retry login with a new PKCE flow**
- How does the system handle authorization servers that don't support PKCE? **→ All configured providers (Keycloak v7.0+, WorkOS SDK v7.0.0+, MockAuthProvider) natively support PKCE with SHA256. If a provider lacks PKCE support, authentication initialization will fail during development/testing, requiring provider upgrade or replacement**
- What happens if the code_challenge derivation fails or produces invalid output? **→ Frontend validatess code_verifier format before derivation. If SHA256 hashing fails (e.g., Web Crypto API unavailable), display error message prompting user to upgrade browser or disable privacy extensions blocking crypto APIs**
- How does the system detect and handle authorization code replay attacks even with PKCE? **→ PKCE prevents replay attacks by design: each code_verifier is single-use and deleted after retrieval. Authorization servers reject code reuse. Backend providers enforce one-time code exchange, returning errors on subsequent attempts**
- What happens when the OAuth state parameter doesn't match any stored code_verifier? **→ System treats this as invalid/expired session: retrievePKCEVerifier() returns null, callback displays error message, prompts user to retry login. This protects against CSRF attacks and stale callback attempts**

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Frontend MUST generate a cryptographically random code_verifier of 43-128 characters using a secure random number generator
- **FR-002**: Frontend MUST derive code_challenge from code_verifier using SHA256 hash algorithm and base64url encoding
- **FR-003**: Frontend MUST include code_challenge and code_challenge_method=S256 parameters in the OAuth authorization request
- **FR-004**: Frontend MUST securely store the code_verifier during the OAuth flow (between authorization and callback)
- **FR-005**: Frontend MUST include the code_verifier in the token exchange request at the callback endpoint
- **FR-006**: Frontend MUST clear the code_verifier from storage immediately after successful token exchange
- **FR-007**: Backend OpenID Connect client MUST support PKCE with SHA256 code challenge method
- **FR-008**: Backend MUST include code_verifier parameter when exchanging authorization code for tokens
- **FR-009**: Backend MUST handle PKCE-related error responses from the authorization server
- **FR-010**: Backend MUST use authentication providers that support PKCE with SHA256 code challenge method (verified: Keycloak v7.0+, WorkOS SDK v7.0.0+, Mock provider with PKCE validation)
- **FR-011**: System MUST support PKCE for all authentication providers (MockAuthProvider, KeycloakAuthProvider, WorkOSAuthProvider)
- **FR-012**: System MUST maintain backward compatibility with existing authentication flows during migration
- **FR-013**: Frontend MUST detect missing code_verifier at callback and display clear error message prompting user to retry login
- **FR-014**: System MUST log security events including PKCE failures, missing verifiers, and invalid code challenges
- **FR-015**: System MUST capture performance metrics for PKCE flow duration to monitor authentication overhead

### Assumptions

- The current OpenID Connect providers (Keycloak and WorkOS) support PKCE with SHA256 code challenge method
- The frontend has access to Web Crypto API or equivalent for secure random number generation
- Session storage is available and persistent during the OAuth flow
- The existing authentication architecture can be extended without breaking changes

### Key Entities

- **Code Verifier**: Cryptographically random string (43-128 characters) generated per OAuth flow, stored temporarily, used to verify authorization code ownership
- **Code Challenge**: SHA256 hash of code_verifier, base64url encoded, sent to authorization server, used to validate subsequent code_verifier
- **OAuth State**: Unique identifier per OAuth flow, used to link authorization request to callback and retrieve stored code_verifier
- **PKCE Configuration**: Provider-specific settings for PKCE support, including code challenge method and validation rules (implemented in KeycloakAuthProvider, WorkOSAuthProvider, MockAuthProvider)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of OAuth authorization requests include valid code_challenge and code_challenge_method parameters
- **SC-002**: 100% of token exchange requests include valid code_verifier parameter matching the original code_challenge
- **SC-003**: Authorization code interception attacks are prevented (verified through security testing with intercepted codes)
- **SC-004**: Authentication flow completion time remains within 2 seconds of current implementation (PKCE adds minimal overhead)
- **SC-005**: Zero authentication failures due to PKCE implementation errors in production
- **SC-006**: All existing user authentication flows continue to work without disruption during and after PKCE implementation
- **SC-007**: All PKCE security events (failures, missing verifiers, invalid challenges) are logged and available for security audit
- **SC-008**: PKCE flow duration metrics are captured and monitored to detect performance degradation
- **SC-009**: PKCE overhead (verifier generation + challenge derivation + storage) remains under 100ms per authentication flow
