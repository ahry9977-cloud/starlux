console.log("");/**
 * تحسينات API للأداء
 * STAR LUX - منصة التجارة الإلكترونية
 * 
 * الميزات:
 * - تقليل عدد API Calls
 * - Batch Requests
 * - Response Caching
 * - Query Optimization
 */

// ============= Response Caching =============

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000;

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // تنظيف الكاش إذا وصل للحد الأقصى
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // التحقق من انتهاء الصلاحية
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    // إذا لا زال الكاش ممتلئ، احذف الأقدم
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, Math.floor(this.maxSize / 4));
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  clear(): void {
    this.cache.clear();
  }

  stats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

export const apiCache = new APICache();

// ============= Query Batching =============

interface BatchRequest<T> {
  key: string;
  resolver: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

class QueryBatcher {
  private pending = new Map<string, BatchRequest<any>[]>();
  private timeout: NodeJS.Timeout | null = null;
  private batchDelay = 10; // ms

  async batch<T>(key: string, resolver: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.pending.has(key)) {
        this.pending.set(key, []);
      }

      this.pending.get(key)!.push({
        key,
        resolver,
        resolve,
        reject,
      });

      if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  private async flush(): Promise<void> {
    this.timeout = null;
    const batches = Array.from(this.pending.entries());
    this.pending.clear();

    for (const [_key, requests] of batches) {
      try {
        // تنفيذ الاستعلام مرة واحدة فقط
        const result = await requests[0].resolver();
        requests.forEach((req: BatchRequest<any>) => req.resolve(result));
      } catch (error) {
        requests.forEach((req: BatchRequest<any>) => req.reject(error as Error));
      }
    }
  }
}

export const queryBatcher = new QueryBatcher();

// ============= Pagination Helpers =============

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: number;
  };
}

export function paginate<T extends { id: number }>(
  items: T[],
  params: PaginationParams,
  total: number
): PaginatedResult<T> {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100); // الحد الأقصى 100
  const totalPages = Math.ceil(total / limit);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextCursor: items.length > 0 ? items[items.length - 1].id : undefined,
    },
  };
}

// ============= Field Selection =============

export function selectFields<T extends Record<string, any>>(
  item: T,
  fields?: string[]
): Partial<T> {
  if (!fields || fields.length === 0) return item;

  const result: Partial<T> = {};
  for (const field of fields) {
    if (field in item) {
      (result as any)[field] = item[field];
    }
  }
  return result;
}

// ============= Response Compression Helpers =============

export function compressResponse<T>(data: T): T {
  // إزالة الحقول الفارغة لتقليل حجم الاستجابة
  if (Array.isArray(data)) {
    return data.map((item) => compressResponse(item)) as T;
  }

  if (data && typeof data === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        result[key] = compressResponse(value);
      }
    }
    return result;
  }

  return data;
}

// ============= Rate Limiting =============

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private defaultLimit = 100;
  private windowMs = 60000; // دقيقة واحدة

  check(key: string, limit?: number): { allowed: boolean; remaining: number; resetIn: number } {
    const maxRequests = limit || this.defaultLimit;
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetIn: this.windowMs,
      };
    }

    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: entry.resetTime - now,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetIn: entry.resetTime - now,
    };
  }

  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.limits.entries());
    for (const [key, entry] of entries) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// ============= Query Deduplication =============

const inflightQueries = new Map<string, Promise<any>>();

export async function deduplicateQuery<T>(
  key: string,
  query: () => Promise<T>
): Promise<T> {
  // إذا كان هناك استعلام مماثل قيد التنفيذ، انتظره
  if (inflightQueries.has(key)) {
    return inflightQueries.get(key) as Promise<T>;
  }

  const promise = query().finally(() => {
    inflightQueries.delete(key);
  });

  inflightQueries.set(key, promise);
  return promise;
}

// ============= Exports =============

export default {
  apiCache,
  queryBatcher,
  paginate,
  selectFields,
  compressResponse,
  rateLimiter,
  deduplicateQuery,
};
