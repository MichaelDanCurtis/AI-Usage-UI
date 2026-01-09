import { CacheEntry } from '../types/index.js';
import logger from '../utils/logger.js';

export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTtl: number;

  constructor(defaultTtl: number = 300) {
    this.cache = new Map();
    this.defaultTtl = defaultTtl;
    this.startCleanup();
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    };
    this.cache.set(key, entry);
    logger.debug(`Cache set: ${key}`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = (now - entry.timestamp) / 1000;

    if (age > entry.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${key}`);
      return null;
    }

    logger.debug(`Cache hit: ${key} (age: ${age.toFixed(2)}s)`);
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    const age = (now - entry.timestamp) / 1000;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
    logger.debug(`Cache deleted: ${key}`);
  }

  clear(): void {
    this.cache.clear();
    logger.debug('Cache cleared');
  }

  private startCleanup(): void {
    // Clean up expired entries every 60 seconds
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        const age = (now - entry.timestamp) / 1000;
        if (age > entry.ttl) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug(`Cleaned up ${cleaned} expired cache entries`);
      }
    }, 60000);
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
