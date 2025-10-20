# Research: PKCE Support for OpenID Connect Authentication

**Feature**: PKCE Support  
**Date**: 2025-10-20  
**Status**: Complete

## Overview

This document captures research findings for implementing PKCE (Proof Key for Code Exchange, RFC 7636) support in the existing OpenID Connect authentication system.

## Research Tasks

### 1. PKCE Implementation Standards

**Decision**: Implement PKCE according to RFC 7636 with SHA256 code challenge method

**Rationale**:
- RFC 7636 is the official PKCE standard adopted by OAuth 2.0
- SHA256 (S256) is the recommended and most secure code challenge method
- All major OIDC providers (Keycloak, WorkOS, Auth0, Okta) support S256
- Plain text code challenge method is deprecated and insecure

**Alternatives Considered**:
- Plain text code challenge: Rejected due to security vulnerabilities (no actual cryptographic protection)
- Custom security mechanism: Rejected as PKCE is industry standard with proven security

**Implementation Details**:
- code_verifier: 43-128 characters (base64url-encoded random bytes)
- code_challenge: BASE64URL(SHA256(code_verifier))
- code_challenge_method: S256

### 2. Browser Cryptographic APIs for Secure Random Generation

**Decision**: Use Web Crypto API (`crypto.subtle` and `crypto.getRandomValues`) for PKCE generation

**Rationale**:
- Web Crypto API is W3C standard, available in all modern browsers
- Provides cryptographically secure random number generation (CSPRNG)
- Built-in SHA256 hashing through `crypto.subtle.digest()`
- No external dependencies required
- Better performance than JavaScript-based crypto libraries

**Alternatives Considered**:
- Third-party libraries (e.g., crypto-js): Rejected due to unnecessary dependency and larger bundle size
- Math.random(): Rejected as it's not cryptographically secure
- UUID libraries: Rejected as they don't provide required format/length

**Implementation Pattern**:
```typescript
// Generate code verifier (43-128 characters)
const randomBytes = crypto.getRandomValues(new Uint8Array(32));
const codeVerifier = base64UrlEncode(randomBytes);

// Generate code challenge
const encoder = new TextEncoder();
const data = encoder.encode(codeVerifier);
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const codeChallenge = base64UrlEncode(new Uint8Array(hashBuffer));
```

### 3. Session Storage vs LocalStorage for code_verifier

**Decision**: Use sessionStorage for code_verifier storage

**Rationale**:
- sessionStorage is scoped to single browser tab/window (better isolation)
- Automatically cleared when tab closes (shorter exposure window)
- Prevents cross-tab interference with multiple concurrent auth flows
- OAuth state parameter links auth request to callback in same tab
- More aligned with OAuth security best practices (minimize credential exposure)

**Alternatives Considered**:
- localStorage: Rejected due to cross-tab persistence and longer exposure time
- Memory only: Rejected as page refreshes during OAuth redirect would lose verifier
- Cookies: Rejected due to CSRF concerns and unnecessary server-side exposure
- IndexedDB: Rejected as overkill for temporary single-value storage

**Security Considerations**:
- Key format: `pkce_verifier_${state}` to link verifier to specific OAuth flow
- Cleanup: Immediate removal after token exchange
- XSS protection: Standard CSP headers prevent malicious script access

### 4. Keycloak PKCE Support

**Decision**: Keycloak fully supports PKCE with SHA256 out-of-the-box (v7.0+)

**Rationale**:
- Keycloak has native PKCE support since version 7.0 (released 2019)
- Project uses Keycloak for local development
- No configuration changes required on Keycloak side
- PKCE parameters are automatically recognized and validated

**Verification**:
- Keycloak validates code_challenge_method=S256
- Supports both public and confidential clients with PKCE
- Returns standard OAuth error codes for PKCE validation failures

**Implementation Impact**:
- No changes needed to docker-compose.yml Keycloak configuration
- KeycloakAuthProvider must include PKCE parameters in token exchange

### 5. WorkOS PKCE Support

**Decision**: WorkOS supports PKCE with SHA256 (supported since 2021)

**Rationale**:
- WorkOS Node SDK (v7.0.0) has built-in PKCE support
- Project currently uses WorkOS SDK
- PKCE is recommended by WorkOS for all client types
- SDK handles PKCE parameter formatting automatically

**Verification**:
- WorkOS SDK documentation confirms PKCE support
- SDK provides helper methods for PKCE generation
- Can use SDK helpers or custom implementation (for consistency with other providers)

**Implementation Decision**:
- Use custom PKCE implementation (same code for all providers) for consistency
- WorkOS SDK will accept standard PKCE parameters

### 6. Mock Provider PKCE Support

**Decision**: Update MockAuthProvider to accept and validate PKCE parameters

**Rationale**:
- Mock provider must match real provider behavior for testing
- PKCE validation logic should be testable locally
- Helps catch integration issues during development

**Implementation**:
- Accept code_challenge and code_challenge_method in authorization URL
- Store challenge associated with auth code
- Validate code_verifier matches original challenge during token exchange
- Return appropriate errors for mismatched verifiers

### 7. Error Handling and User Messaging

**Decision**: Implement specific error handling for PKCE-related failures with clear user messaging

**Rationale**:
- Users may encounter PKCE errors due to storage cleared, browser extensions, or network issues
- Clear error messages reduce support burden
- Specific error codes enable better debugging and monitoring

**Error Scenarios**:
- Missing code_verifier: "Authentication failed. Please try logging in again."
- Invalid code_challenge: "Security verification failed. Please retry login."
- Provider doesn't support PKCE: "Authentication provider configuration error. Contact support."

**Implementation**:
- Frontend detects missing verifier before callback submission
- Backend logs PKCE errors with security event flag
- User sees generic security message (don't expose attack surface details)
- Admins see detailed error in logs

### 8. Logging and Observability

**Decision**: Implement security event logging for PKCE failures and performance metrics for flow duration

**Rationale**:
- PKCE failures may indicate security attacks or configuration issues
- Performance metrics ensure PKCE doesn't degrade user experience
- Audit trail required for security compliance

**Logging Strategy**:
- Log PKCE security events: missing verifier, invalid challenge, validation failures
- Log performance metrics: code_verifier generation time, total PKCE overhead
- Use structured logging (JSON format)
- Include correlation IDs to trace full auth flow

**Metrics to Capture**:
- PKCE generation duration (frontend)
- Token exchange duration with PKCE (backend)
- PKCE error rate by provider
- Storage failures (verifier loss)

### 9. Backward Compatibility Strategy

**Decision**: Implement PKCE without breaking existing authentication flows

**Rationale**:
- Feature must deploy without requiring provider reconfiguration
- Existing sessions should continue to work
- Gradual rollout reduces risk

**Implementation Approach**:
- Add PKCE parameters to new auth flows (backward compatible)
- Existing cached tokens remain valid
- No database migrations required
- No breaking changes to IAuthProvider interface (additive only)

**Validation**:
- Test that non-PKCE flows still work (for legacy compatibility if needed)
- Verify PKCE is optional on provider side initially
- Monitor error rates during rollout

### 10. Testing Strategy

**Decision**: Implement comprehensive testing at unit, integration, and security levels

**Rationale**:
- Security features require thorough testing
- PKCE correctness critical for preventing attacks
- Must test all three providers (Mock, Keycloak, WorkOS)

**Test Coverage**:

**Unit Tests**:
- PKCE utility functions (generation, encoding, validation)
- Each auth provider's PKCE implementation
- Frontend storage and retrieval logic
- Error handling for each failure scenario

**Integration Tests**:
- Full OAuth flow with PKCE (frontend + backend)
- Token exchange with valid and invalid verifiers
- Cross-provider consistency (all three providers)
- Storage cleanup after successful auth

**Security Tests**:
- Authorization code interception attack prevention
- Replay attack prevention
- Invalid code_challenge rejection
- Missing code_verifier detection

## Technology Stack Decisions

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend Crypto | Web Crypto API | Native, secure, no dependencies |
| Hash Algorithm | SHA256 (S256) | RFC 7636 recommended, provider support |
| Storage | sessionStorage | Tab isolation, auto-cleanup, OAuth best practice |
| Backend Validation | Provider SDK + custom | Consistency across providers |
| Testing | Jest (backend), Vitest (frontend) | Existing project standards |
| Logging | Structured JSON logs | Security audit, performance monitoring |

## Dependencies

| Dependency | Version | Purpose | Status |
|------------|---------|---------|--------|
| Web Crypto API | Browser native | PKCE generation | ✅ Available |
| Keycloak | v7.0+ | PKCE support | ✅ Confirmed |
| WorkOS SDK | v7.0.0 | PKCE support | ✅ Confirmed |
| sessionStorage | Browser native | code_verifier storage | ✅ Available |

## Security Considerations

1. **Code Verifier Entropy**: Minimum 256 bits (32 bytes) for cryptographic security
2. **Storage Isolation**: sessionStorage prevents cross-tab/cross-origin access
3. **Timing Attacks**: Use constant-time comparison for verifier validation (provided by crypto libraries)
4. **XSS Protection**: CSP headers prevent unauthorized script access to storage
5. **Error Messages**: Generic messages to users, detailed logs for admins only
6. **Audit Trail**: All PKCE events logged with timestamps and correlation IDs

## Performance Impact

| Operation | Expected Duration | Mitigation |
|-----------|------------------|------------|
| code_verifier generation | <10ms | Native crypto API performance |
| SHA256 hash computation | <5ms | Hardware-accelerated in modern browsers |
| Storage operations | <1ms | Native sessionStorage performance |
| **Total PKCE overhead** | **<20ms** | Well within 2-second auth flow target |

## Open Questions

None. All research tasks completed with clear decisions.

## References

- [RFC 7636: PKCE Specification](https://datatracker.ietf.org/doc/html/rfc7636)
- [Web Crypto API Specification](https://www.w3.org/TR/WebCryptoAPI/)
- [Keycloak PKCE Documentation](https://www.keycloak.org/docs/latest/securing_apps/)
- [WorkOS PKCE Support](https://workos.com/docs/sso/guide/pkce)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
