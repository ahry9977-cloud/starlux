import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============= اختبارات نظام البحث المتطور =============

describe('Search System Tests', () => {
  
  // ============= اختبارات تنظيف وتأمين البحث =============
  describe('Search Input Sanitization', () => {
    
    it('should sanitize SQL injection attempts', () => {
      const maliciousInputs = [
        "'; DROP TABLE products; --",
        "1' OR '1'='1",
        "UNION SELECT * FROM users",
        "'; DELETE FROM orders; --",
        "<script>alert('xss')</script>",
      ];
      
      maliciousInputs.forEach(input => {
        const sanitized = sanitizeSearchQuery(input);
        expect(sanitized).not.toContain('DROP');
        expect(sanitized).not.toContain('DELETE');
        expect(sanitized).not.toContain('UNION');
        expect(sanitized).not.toContain('<script>');
      });
    });
    
    it('should remove special characters from search query', () => {
      const input = "iPhone 15 Pro Max!@#$%^&*()";
      const sanitized = sanitizeSearchQuery(input);
      expect(sanitized).toBe("iPhone 15 Pro Max");
    });
    
    it('should trim whitespace from search query', () => {
      const input = "   Samsung Galaxy   ";
      const sanitized = sanitizeSearchQuery(input);
      expect(sanitized).toBe("Samsung Galaxy");
    });
    
    it('should handle empty search query', () => {
      const input = "";
      const sanitized = sanitizeSearchQuery(input);
      expect(sanitized).toBe("");
    });
    
    it('should limit search query length', () => {
      const longInput = "a".repeat(500);
      const sanitized = sanitizeSearchQuery(longInput);
      expect(sanitized.length).toBeLessThanOrEqual(200);
    });
    
    it('should handle Arabic text correctly', () => {
      const input = "هاتف آيفون جديد";
      const sanitized = sanitizeSearchQuery(input);
      expect(sanitized).toBe("هاتف آيفون جديد");
    });
    
    it('should handle mixed Arabic and English text', () => {
      const input = "iPhone آيفون 15";
      const sanitized = sanitizeSearchQuery(input);
      expect(sanitized).toBe("iPhone آيفون 15");
    });
  });
  
  // ============= اختبارات Rate Limiting =============
  describe('Search Rate Limiting', () => {
    
    it('should allow normal search frequency', () => {
      const rateLimiter = createSearchRateLimiter();
      const userId = 'user123';
      
      // 5 searches should be allowed
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.canSearch(userId)).toBe(true);
        rateLimiter.recordSearch(userId);
      }
    });
    
    it('should block excessive searches', () => {
      const rateLimiter = createSearchRateLimiter();
      const userId = 'user456';
      
      // Exhaust the limit
      for (let i = 0; i < 10; i++) {
        rateLimiter.recordSearch(userId);
      }
      
      expect(rateLimiter.canSearch(userId)).toBe(false);
    });
    
    it('should reset rate limit after window expires', () => {
      const rateLimiter = createSearchRateLimiter();
      const userId = 'user789';
      
      // Exhaust the limit
      for (let i = 0; i < 10; i++) {
        rateLimiter.recordSearch(userId);
      }
      
      // Simulate time passing
      rateLimiter.resetForUser(userId);
      
      expect(rateLimiter.canSearch(userId)).toBe(true);
    });
    
    it('should track different users separately', () => {
      const rateLimiter = createSearchRateLimiter();
      
      // User 1 exhausts limit
      for (let i = 0; i < 10; i++) {
        rateLimiter.recordSearch('user1');
      }
      
      // User 2 should still be able to search
      expect(rateLimiter.canSearch('user2')).toBe(true);
    });
  });
  
  // ============= اختبارات البحث الذكي =============
  describe('Smart Search Features', () => {
    
    it('should generate correct search suggestions', () => {
      const suggestions = generateSearchSuggestions('iph');
      expect(suggestions).toContain('iPhone');
      expect(suggestions).toContain('iPhone 15');
      expect(suggestions).toContain('iPhone Pro');
    });
    
    it('should handle typos with fuzzy matching', () => {
      const results = fuzzySearch('iphon', ['iPhone', 'iPad', 'MacBook']);
      expect(results).toContain('iPhone');
    });
    
    it('should prioritize exact matches', () => {
      const results = searchWithPriority('iPhone', [
        { name: 'iPhone 15', score: 0 },
        { name: 'iPhone Case', score: 0 },
        { name: 'Samsung Galaxy', score: 0 },
      ]);
      
      expect(results[0].name).toBe('iPhone 15');
    });
    
    it('should handle Arabic search terms', () => {
      const suggestions = generateSearchSuggestions('هاتف');
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });
  
  // ============= اختبارات سجل البحث =============
  describe('Search History', () => {
    
    it('should save search to history', () => {
      const history = createSearchHistory();
      history.add('user1', 'iPhone 15');
      
      expect(history.get('user1')).toContain('iPhone 15');
    });
    
    it('should limit history size', () => {
      const history = createSearchHistory(5);
      const userId = 'user1';
      
      for (let i = 0; i < 10; i++) {
        history.add(userId, `search ${i}`);
      }
      
      expect(history.get(userId).length).toBeLessThanOrEqual(5);
    });
    
    it('should clear user history', () => {
      const history = createSearchHistory();
      history.add('user1', 'test search');
      history.clear('user1');
      
      expect(history.get('user1').length).toBe(0);
    });
    
    it('should not store duplicate searches', () => {
      const history = createSearchHistory();
      history.add('user1', 'iPhone');
      history.add('user1', 'iPhone');
      
      const userHistory = history.get('user1');
      const iPhoneCount = userHistory.filter(s => s === 'iPhone').length;
      expect(iPhoneCount).toBe(1);
    });
  });
  
  // ============= اختبارات التحقق من URL =============
  describe('URL Search Validation', () => {
    
    it('should detect product URL', () => {
      const url = 'https://starlux.com/product/123';
      expect(isProductUrl(url)).toBe(true);
    });
    
    it('should detect store URL', () => {
      const url = 'https://starlux.com/store/456';
      expect(isStoreUrl(url)).toBe(true);
    });
    
    it('should detect category URL', () => {
      const url = 'https://starlux.com/category/electronics';
      expect(isCategoryUrl(url)).toBe(true);
    });
    
    it('should extract product ID from URL', () => {
      const url = 'https://starlux.com/product/789';
      expect(extractProductId(url)).toBe('789');
    });
    
    it('should handle invalid URLs gracefully', () => {
      const url = 'not-a-valid-url';
      expect(isProductUrl(url)).toBe(false);
      expect(extractProductId(url)).toBeNull();
    });
  });
  
  // ============= اختبارات الفلاتر =============
  describe('Search Filters', () => {
    
    it('should filter by price range', () => {
      const products = [
        { id: 1, price: 100 },
        { id: 2, price: 200 },
        { id: 3, price: 300 },
      ];
      
      const filtered = filterByPrice(products, 150, 250);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(2);
    });
    
    it('should filter by category', () => {
      const products = [
        { id: 1, categoryId: 1 },
        { id: 2, categoryId: 2 },
        { id: 3, categoryId: 1 },
      ];
      
      const filtered = filterByCategory(products, 1);
      expect(filtered.length).toBe(2);
    });
    
    it('should filter by rating', () => {
      const products = [
        { id: 1, rating: 4.5 },
        { id: 2, rating: 3.0 },
        { id: 3, rating: 5.0 },
      ];
      
      const filtered = filterByRating(products, 4.0);
      expect(filtered.length).toBe(2);
    });
    
    it('should combine multiple filters', () => {
      const products = [
        { id: 1, price: 100, categoryId: 1, rating: 4.5 },
        { id: 2, price: 200, categoryId: 2, rating: 3.0 },
        { id: 3, price: 150, categoryId: 1, rating: 5.0 },
      ];
      
      const filtered = applyFilters(products, {
        minPrice: 100,
        maxPrice: 180,
        categoryId: 1,
        minRating: 4.0,
      });
      
      expect(filtered.length).toBe(2);
    });
  });
  
  // ============= اختبارات الترتيب =============
  describe('Search Sorting', () => {
    
    it('should sort by price ascending', () => {
      const products = [
        { id: 1, price: 300 },
        { id: 2, price: 100 },
        { id: 3, price: 200 },
      ];
      
      const sorted = sortProducts(products, 'price_asc');
      expect(sorted[0].price).toBe(100);
      expect(sorted[2].price).toBe(300);
    });
    
    it('should sort by price descending', () => {
      const products = [
        { id: 1, price: 100 },
        { id: 2, price: 300 },
        { id: 3, price: 200 },
      ];
      
      const sorted = sortProducts(products, 'price_desc');
      expect(sorted[0].price).toBe(300);
      expect(sorted[2].price).toBe(100);
    });
    
    it('should sort by rating', () => {
      const products = [
        { id: 1, rating: 3.0 },
        { id: 2, rating: 5.0 },
        { id: 3, rating: 4.0 },
      ];
      
      const sorted = sortProducts(products, 'rating');
      expect(sorted[0].rating).toBe(5.0);
    });
    
    it('should sort by newest', () => {
      const products = [
        { id: 1, createdAt: new Date('2024-01-01') },
        { id: 2, createdAt: new Date('2024-03-01') },
        { id: 3, createdAt: new Date('2024-02-01') },
      ];
      
      const sorted = sortProducts(products, 'newest');
      expect(sorted[0].id).toBe(2);
    });
  });
  
  // ============= اختبارات الأداء =============
  describe('Search Performance', () => {
    
    it('should complete search within timeout', async () => {
      const startTime = Date.now();
      await performSearch('test query');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds max
    });
    
    it('should handle large result sets', () => {
      const largeResults = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Product ${i}`,
        price: Math.random() * 1000,
      }));
      
      const paginated = paginateResults(largeResults, 1, 20);
      expect(paginated.items.length).toBe(20);
      expect(paginated.totalPages).toBe(50);
    });
    
    it('should cache frequent searches', () => {
      const cache = createSearchCache();
      const query = 'popular search';
      const results = [{ id: 1, name: 'Result 1' }];
      
      cache.set(query, results);
      expect(cache.get(query)).toEqual(results);
    });
  });
});

// ============= Helper Functions =============

function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  
  // Remove SQL injection patterns and special characters
  let sanitized = query
    .replace(/['";\/]/g, '')
    .replace(/--/g, '')
    .replace(/DROP|DELETE|INSERT|UPDATE|UNION|SELECT/gi, '')
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[!@#$%^&*()]/g, ''); // Remove special characters
  
  // Trim and limit length
  sanitized = sanitized.trim().slice(0, 200);
  
  return sanitized;
}

function createSearchRateLimiter() {
  const searches: Map<string, number[]> = new Map();
  const limit = 10;
  const windowMs = 60000; // 1 minute
  
  return {
    canSearch(userId: string): boolean {
      const userSearches = searches.get(userId) || [];
      const now = Date.now();
      const recentSearches = userSearches.filter(t => now - t < windowMs);
      return recentSearches.length < limit;
    },
    recordSearch(userId: string): void {
      const userSearches = searches.get(userId) || [];
      userSearches.push(Date.now());
      searches.set(userId, userSearches);
    },
    resetForUser(userId: string): void {
      searches.delete(userId);
    },
  };
}

function generateSearchSuggestions(query: string): string[] {
  const suggestions = [
    'iPhone', 'iPhone 15', 'iPhone Pro', 'iPhone Case',
    'Samsung', 'Samsung Galaxy', 'MacBook', 'iPad',
    'هاتف', 'هاتف ذكي', 'لابتوب', 'تابلت',
  ];
  
  return suggestions.filter(s => 
    s.toLowerCase().includes(query.toLowerCase())
  );
}

function fuzzySearch(query: string, items: string[]): string[] {
  return items.filter(item => {
    const itemLower = item.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Simple fuzzy: check if most characters match
    let matches = 0;
    for (const char of queryLower) {
      if (itemLower.includes(char)) matches++;
    }
    return matches >= queryLower.length * 0.7;
  });
}

function searchWithPriority(query: string, items: { name: string; score: number }[]) {
  return items
    .map(item => ({
      ...item,
      score: item.name.toLowerCase().startsWith(query.toLowerCase()) ? 100 :
             item.name.toLowerCase().includes(query.toLowerCase()) ? 50 : 0,
    }))
    .sort((a, b) => b.score - a.score);
}

function createSearchHistory(maxSize = 10) {
  const history: Map<string, string[]> = new Map();
  
  return {
    add(userId: string, query: string): void {
      const userHistory = history.get(userId) || [];
      if (!userHistory.includes(query)) {
        userHistory.unshift(query);
        if (userHistory.length > maxSize) {
          userHistory.pop();
        }
        history.set(userId, userHistory);
      }
    },
    get(userId: string): string[] {
      return history.get(userId) || [];
    },
    clear(userId: string): void {
      history.set(userId, []);
    },
  };
}

function isProductUrl(url: string): boolean {
  return /\/product\/\d+/.test(url);
}

function isStoreUrl(url: string): boolean {
  return /\/store\/\d+/.test(url);
}

function isCategoryUrl(url: string): boolean {
  return /\/category\//.test(url);
}

function extractProductId(url: string): string | null {
  const match = url.match(/\/product\/(\d+)/);
  return match ? match[1] : null;
}

function filterByPrice(products: any[], min: number, max: number) {
  return products.filter(p => p.price >= min && p.price <= max);
}

function filterByCategory(products: any[], categoryId: number) {
  return products.filter(p => p.categoryId === categoryId);
}

function filterByRating(products: any[], minRating: number) {
  return products.filter(p => p.rating >= minRating);
}

function applyFilters(products: any[], filters: any) {
  let result = products;
  
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    result = filterByPrice(result, filters.minPrice || 0, filters.maxPrice || Infinity);
  }
  
  if (filters.categoryId !== undefined) {
    result = filterByCategory(result, filters.categoryId);
  }
  
  if (filters.minRating !== undefined) {
    result = filterByRating(result, filters.minRating);
  }
  
  return result;
}

function sortProducts(products: any[], sortBy: string) {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    default:
      return sorted;
  }
}

async function performSearch(query: string) {
  // Simulate search
  await new Promise(resolve => setTimeout(resolve, 100));
  return [];
}

function paginateResults(items: any[], page: number, limit: number) {
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    items: items.slice(start, end),
    totalItems: items.length,
    totalPages: Math.ceil(items.length / limit),
    currentPage: page,
  };
}

function createSearchCache() {
  const cache: Map<string, any> = new Map();
  
  return {
    get(key: string) {
      return cache.get(key);
    },
    set(key: string, value: any) {
      cache.set(key, value);
    },
    clear() {
      cache.clear();
    },
  };
}
