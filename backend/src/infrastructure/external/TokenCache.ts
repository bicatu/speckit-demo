import { createHash } from 'crypto';
import { AuthUser } from './IAuthProvider';

/**
 * Cache entry for a validated JWT token
 */
interface TokenCacheEntry {
  tokenHash: string;
  authUser: AuthUser;
  expiresAt: number;
  validatedAt: number;
  accessCount: number;
}

/**
 * In-memory LRU cache for validated JWT tokens
 * 
 * Caches validated tokens to minimize round-trips to OAuth2/OIDC providers.
 * Uses SHA-256 hashing for cache keys and LRU eviction when max size reached.
 * 
 * Performance targets:
 * - Cache hit: <10ms
 * - Max memory: ~10MB (10,000 entries @ ~1KB each)
 * - Eviction: LRU when max size reached
 * - Cleanup: Periodic removal of expired entries (call cleanup() every 60s)
 */
export class TokenCache {
  private cache: Map<string, TokenCacheEntry>;
  private accessOrder: string[]; // For LRU tracking
  private readonly maxSize: number;
  private pendingValidations: Map<string, Promise<AuthUser | null>>; // For deduplication

  constructor(maxSize: number = 10000) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSize = maxSize;
    this.pendingValidations = new Map();
  }

  /**
   * Get cached user info for a token (synchronous cache lookup only)
   * @param token - Access token to look up
   * @returns AuthUser if cached and not expired, null otherwise
   */
  get(token: string): AuthUser | null {
    const tokenHash = this.hashToken(token);
    const entry = this.cache.get(tokenHash);

    if (!entry) {
      console.log('[TokenCache] Cache miss - token not found');
      return null;
    }

    // Check if expired
    if (Date.now() >= entry.expiresAt) {
      console.log('[TokenCache] Cache miss - token expired');
      this.cache.delete(tokenHash);
      this.removeFromAccessOrder(tokenHash);
      return null;
    }

    // Update access count and LRU order
    entry.accessCount++;
    this.updateAccessOrder(tokenHash);
    
    console.log(`[TokenCache] Cache hit - access count: ${entry.accessCount}, cache size: ${this.cache.size}`);

    return entry.authUser;
  }

  /**
   * Cache a validated token with user information
   * @param token - Access token
   * @param authUser - Validated user information
   * @param expiresAt - Unix timestamp when token expires
   */
  set(token: string, authUser: AuthUser, expiresAt: number): void {
    const tokenHash = this.hashToken(token);

    // Evict LRU entry if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(tokenHash)) {
      this.evictLRU();
    }

    const entry: TokenCacheEntry = {
      tokenHash,
      authUser,
      expiresAt,
      validatedAt: Date.now(),
      accessCount: 0,
    };

    this.cache.set(tokenHash, entry);
    this.updateAccessOrder(tokenHash);
  }

  /**
   * Remove a token from cache (e.g., on logout)
   * @param token - Access token to invalidate
   */
  delete(token: string): void {
    const tokenHash = this.hashToken(token);
    this.cache.delete(tokenHash);
    this.removeFromAccessOrder(tokenHash);
  }

  /**
   * Remove all expired entries from cache
   * Should be called periodically (e.g., every 60 seconds)
   */
  cleanup(): void {
    const now = Date.now();
    const expiredHashes: string[] = [];

    for (const [tokenHash, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        expiredHashes.push(tokenHash);
      }
    }

    for (const tokenHash of expiredHashes) {
      this.cache.delete(tokenHash);
      this.removeFromAccessOrder(tokenHash);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    evictionCount: number;
  } {
    let totalAccess = 0;
    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount;
    }

    // Simplified hit rate calculation (access count indicates cache hits)
    const hitRate = this.cache.size > 0 ? totalAccess / this.cache.size : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      evictionCount: 0, // Could track this with additional state
    };
  }

  /**
   * Get or validate token with deduplication for concurrent requests
   * Prevents multiple simultaneous validation calls for the same token
   * @param token - Access token to validate
   * @param validateFn - Async function that validates token with auth provider
   * @returns AuthUser if valid, null otherwise
   */
  async getOrValidate(
    token: string,
    validateFn: (token: string) => Promise<AuthUser | null>
  ): Promise<AuthUser | null> {
    const tokenHash = this.hashToken(token);

    // Check cache first (synchronous)
    const cachedUser = this.get(token);
    if (cachedUser) {
      return cachedUser;
    }

    // Check if validation already in progress
    const pendingValidation = this.pendingValidations.get(tokenHash);
    if (pendingValidation) {
      console.log('[TokenCache] Deduplicating concurrent validation request');
      return pendingValidation;
    }

    // Start new validation
    const validationPromise = validateFn(token)
      .then((authUser) => {
        // Remove from pending map
        this.pendingValidations.delete(tokenHash);
        
        if (authUser) {
          // Cache the validated token (assuming 1 hour expiry if not provided)
          const expiresAt = Date.now() + 3600000; // 1 hour default
          this.set(token, authUser, expiresAt);
        }
        
        return authUser;
      })
      .catch((error) => {
        // Remove from pending map on error
        this.pendingValidations.delete(tokenHash);
        throw error;
      });

    // Store pending validation
    this.pendingValidations.set(tokenHash, validationPromise);

    return validationPromise;
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.pendingValidations.clear();
  }

  /**
   * Hash token with SHA-256 for cache key
   * @param token - Access token
   * @returns 64-character hex string
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Update LRU access order - move token to end (most recently used)
   */
  private updateAccessOrder(tokenHash: string): void {
    this.removeFromAccessOrder(tokenHash);
    this.accessOrder.push(tokenHash);
  }

  /**
   * Remove token from access order array
   */
  private removeFromAccessOrder(tokenHash: string): void {
    const index = this.accessOrder.indexOf(tokenHash);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    const lruHash = this.accessOrder[0];
    this.cache.delete(lruHash);
    this.accessOrder.shift();
  }
}
