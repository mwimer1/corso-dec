// lib/shared/cache/lru-cache.ts
/**
 * @fileoverview High-performance Least-Recently-Used (LRU) cache implementation
 *
 * This module provides a memory-efficient LRU cache with O(1) operations for
 * get, set, and delete operations. Designed for serverless environments with
 * no timers or global state dependencies.
 *
 * @author Corso Development Team
 * @since 1.0.0
 * @see {@link https://docs.corso.app/caching} for caching documentation
 */

// Note: Using standard Error classes instead of ApplicationError to avoid circular dependencies in shared layer

/**
 * High-performance Least-Recently-Used (LRU) cache with O(1) operations
 *
 * @description In-memory cache that automatically evicts the least recently used
 * items when capacity is exceeded. Uses JavaScript's Map insertion order property
 * to avoid the need for a separate doubly-linked list, resulting in simpler and
 * more performant implementation.
 *
 * PERFORMANCE CHARACTERISTICS:
 * - get(): O(1) average case with Map lookup and re-insertion
 * - put(): O(1) average case with automatic LRU eviction
 * - delete(): O(1) with direct Map deletion
 * - Memory usage: O(capacity) with no additional data structures
 *
 * SERVERLESS OPTIMIZED:
 * - No timers or intervals that could cause memory leaks
 * - No global state unless explicitly exported
 * - Immediate memory cleanup on eviction
 * - Compatible with function-as-a-service platforms
 *
 * ALGORITHM DETAILS:
 * - Uses Map's insertion order to track access recency
 * - Most recently accessed items are at the end of the Map
 * - Eviction removes the first (oldest) item when at capacity
 * - Access updates item position by delete + re-insert
 *
 * @example
 * ```typescript
 * // Basic caching for API responses
 * const apiCache = new LRUCache<string, UserData>(50);
 *
 * async function getCachedUser(userId: string): Promise<UserData> {
 *   // Check cache first
 *   let user = apiCache.get(userId);
 *   if (user) {
 *     return user; // Cache hit - O(1) retrieval
 *   }
 *
 *   // Cache miss - fetch from API
 *   user = await fetchUserFromAPI(userId);
 *   apiCache.put(userId, user); // Cache for future requests
 *   return user;
 * }
 *
 * // Session data caching
 * const sessionCache = new LRUCache<string, SessionData>(100);
 *
 * function getSession(sessionId: string): SessionData | null {
 *   return sessionCache.get(sessionId) || null;
 * }
 *
 * function setSession(sessionId: string, data: SessionData): void {
 *   sessionCache.put(sessionId, data);
 * }
 *
 * // Query result caching with automatic eviction
 * const queryCache = new LRUCache<string, QueryResult>(25);
 *
 * async function getCachedQuery(sql: string): Promise<QueryResult> {
 *   const cacheKey = hashQuery(sql);
 *
 *   // Try cache first
 *   const cached = queryCache.get(cacheKey);
 *   if (cached) {
 *     console.log('Cache hit for query:', sql);
 *     return cached;
 *   }
 *
 *   // Execute query and cache result
 *   const result = await executeQuery(sql);
 *   queryCache.put(cacheKey, result);
 *   return result;
 * }
 *
 * // Cache statistics and management
 * const cache = new LRUCache<string, Data>(10);
 *
 * // Monitor cache usage
 * console.log(`Cache usage: ${cache.size()}/10`);
 * console.log('Recent keys:', cache.keys().slice(0, 5));
 *
 * // Cleanup operations
 * cache.delete('old-key'); // Remove specific item
 * cache.clear(); // Remove all items
 * ```
 *
 * @template K - Type of cache keys (must be valid Map key type)
 * @template V - Type of cached values
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map} for Map documentation
 *
 * @performance
 * - All operations are O(1) average case
 * - Memory usage is bounded by capacity parameter
 * - No memory leaks in serverless environments
 * - Efficient garbage collection with automatic eviction
 *
 * @since 1.0.0
 */
export class LRUCache<K, V> {
  private capacity: number;
  private store: Map<K, V>;

  /**
   * Create a new LRU cache with the specified capacity
   *
   * @param capacity - Maximum number of items to store (default: 100, minimum: 1)
   *
   * @throws {Error} When capacity is less than 1
   *
   * @example
   * ```typescript
   * // Small cache for frequently accessed data
   * const quickCache = new LRUCache<string, string>(10);
   *
   * // Large cache for API responses
   * const apiCache = new LRUCache<string, ApiResponse>(500);
   *
   * // Default capacity cache
   * const defaultCache = new LRUCache(); // capacity = 100
   * ```
   */
  constructor(capacity = 100) {
    if (capacity < 1) {
      throw new Error('LRUCache capacity must be >= 1');
    }
    this.capacity = capacity;
    this.store = new Map<K, V>();
  }

  /**
   * Retrieve a value from the cache and mark it as recently used
   *
   * @description Looks up the value by key and promotes it to most-recently-used
   * position if found. This ensures frequently accessed items stay in the cache
   * longer even when at capacity.
   *
   * PERFORMANCE: O(1) average case - uses Map.get() followed by delete/set
   * to update access order without traversing the entire structure.
   *
   * @param key - The key to look up in the cache
   *
   * @returns The cached value if found, undefined if key doesn't exist
   *
   * @example
   * ```typescript
   * const cache = new LRUCache<string, UserData>(10);
   * cache.put('user:123', userData);
   *
   * // First access - promotes to most recent
   * const user = cache.get('user:123'); // UserData object
   *
   * // Key doesn't exist
   * const missing = cache.get('user:999'); // undefined
   *
   * // Usage in conditional logic
   * const cachedResult = cache.get(key);
   * if (cachedResult) {
   *   return cachedResult; // Cache hit
   * } else {
   *   const freshData = await fetchData(key);
   *   cache.put(key, freshData);
   *   return freshData;
   * }
   * ```
   */
  get(key: K): V | undefined {
    const value = this.store.get(key);
    if (value === undefined) return undefined;
    // Promote to most recently used by re-inserting at end
    this.store.delete(key);
    this.store.set(key, value);
    return value;
  }

  /**
   * Insert or update a value in the cache
   *
   * @description Adds a new key-value pair or updates an existing one. If the
   * cache is at capacity, automatically evicts the least recently used item
   * before adding the new one. Updated items are promoted to most recent.
   *
   * EVICTION STRATEGY: When at capacity, removes the first item from the Map
   * (which is the least recently used due to insertion order maintenance).
   *
   * PERFORMANCE: O(1) average case - uses Map operations with potential
   * single eviction. No iteration through the entire cache.
   *
   * @param key - The key to store the value under
   * @param value - The value to cache
   *
   * @example
   * ```typescript
   * const cache = new LRUCache<string, ApiResponse>(3);
   *
   * // Add items to cache
   * cache.put('api:users', userResponse);    // Cache: [users]
   * cache.put('api:posts', postResponse);    // Cache: [users, posts]
   * cache.put('api:comments', commentResponse); // Cache: [users, posts, comments]
   *
   * // At capacity - adding new item evicts LRU
   * cache.put('api:profiles', profileResponse); // Cache: [posts, comments, profiles]
   * // 'users' was evicted as it was least recently used
   *
   * // Update existing item - promotes to most recent
   * cache.put('api:posts', updatedPostResponse); // Cache: [comments, profiles, posts]
   *
   * // Caching expensive computations
   * function getProcessedData(id: string): ProcessedData {
   *   const existing = cache.get(id);
   *   if (existing) return existing;
   *
   *   const processed = expensiveComputation(id);
   *   cache.put(id, processed); // Cache for future use
   *   return processed;
   * }
   * ```
   */
  put(key: K, value: V): void {
    // If key exists, remove it first to update position
    if (this.store.has(key)) {
      this.store.delete(key);
    }
    // Evict LRU item if at capacity
    if (this.store.size >= this.capacity) {
      const lruKey = this.store.keys().next().value as K;
      this.store.delete(lruKey);
    }
    // Add new item at most recent position
    this.store.set(key, value);
  }

  /**
   * Remove a specific key from the cache
   *
   * @description Deletes the specified key and its associated value from the
   * cache. Has no effect if the key doesn't exist. Useful for invalidating
   * specific cache entries when data becomes stale.
   *
   * @param key - The key to remove from the cache
   *
   * @example
   * ```typescript
   * const cache = new LRUCache<string, UserData>(10);
   * cache.put('user:123', userData);
   *
   * // Remove specific user when data changes
   * cache.delete('user:123');
   *
   * // Cache invalidation on user update
   * async function updateUser(userId: string, updates: UserUpdates) {
   *   await saveUserToDatabase(userId, updates);
   *   cache.delete(`user:${userId}`); // Invalidate cached version
   * }
   * ```
   */
  delete(key: K): void {
    this.store.delete(key);
  }

  /**
   * Remove all items from the cache
   *
   * @description Empties the entire cache, removing all key-value pairs.
   * Useful for cache invalidation, testing, or memory cleanup scenarios.
   *
   * @example
   * ```typescript
   * const cache = new LRUCache<string, Data>(100);
   *
   * // Clear cache on user logout
   * function logout() {
   *   cache.clear(); // Remove all cached user data
   *   redirectToLogin();
   * }
   *
   * // Clear cache when switching tenants
   * function switchTenant(newTenantId: string) {
   *   cache.clear(); // Invalidate all tenant-specific data
   *   loadTenantData(newTenantId);
   * }
   * ```
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get the current number of items in the cache
   *
   * @returns Number of cached items (0 to capacity)
   *
   * @example
   * ```typescript
   * const cache = new LRUCache<string, Data>(10);
   *
   * console.log(`Cache usage: ${cache.size()}/10`); // "Cache usage: 0/10"
   * cache.put('key1', data1);
   * console.log(`Cache usage: ${cache.size()}/10`); // "Cache usage: 1/10"
   *
   * // Monitor cache efficiency
   * const hitRate = hits / (hits + cache.size()); // Approximate hit rate
   * ```
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Get all cache keys in most-recently-used order
   *
   * @description Returns an array of all keys with the most recently used first.
   * Useful for debugging, monitoring, or implementing custom cache policies.
   *
   * @returns Array of keys ordered from most recent to least recent
   *
   * @example
   * ```typescript
   * const cache = new LRUCache<string, string>(5);
   * cache.put('a', 'first');
   * cache.put('b', 'second');
   * cache.get('a'); // Promotes 'a' to most recent
   *
   * console.log(cache.keys()); // ['a', 'b'] - 'a' is most recent
   *
   * // Debug most frequently accessed items
   * const recentKeys = cache.keys().slice(0, 3);
   * console.log('Most accessed:', recentKeys);
   * ```
   */
  keys(): K[] {
    return Array.from(this.store.keys()).reverse();
  }

  /**
   * Get all cached values in most-recently-used order
   *
   * @description Returns an array of all values with the most recently used first.
   * Useful for debugging or implementing custom iteration over cached data.
   *
   * @returns Array of values ordered from most recent to least recent
   *
   * @example
   * ```typescript
   * const cache = new LRUCache<string, UserData>(10);
   * cache.put('user1', userData1);
   * cache.put('user2', userData2);
   *
   * // Get all cached user data
   * const allUsers = cache.values();
   * console.log(`Cached ${allUsers.length} users`);
   *
   * // Process most recent values first
   * const recentValues = cache.values().slice(0, 5);
   * recentValues.forEach(processValue);
   * ```
   */
  values(): V[] {
    return Array.from(this.store.values()).reverse();
  }
} 

