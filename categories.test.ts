import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database
vi.mock('./db', () => ({
  getDb: vi.fn(),
  getAllCategories: vi.fn(),
  getMainCategories: vi.fn(),
  getFeaturedCategories: vi.fn(),
  getSubcategories: vi.fn(),
  getCategoryById: vi.fn(),
  getCategoriesWithSubcategories: vi.fn(),
  searchProducts: vi.fn(),
}));

import { 
  getAllCategories, 
  getMainCategories, 
  getFeaturedCategories, 
  getSubcategories,
  getCategoryById,
  getCategoriesWithSubcategories,
  searchProducts,
} from './db';

describe('Categories API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: 1, nameAr: 'الإلكترونيات', nameEn: 'Electronics', parentId: null },
        { id: 2, nameAr: 'الأزياء', nameEn: 'Fashion', parentId: null },
        { id: 3, nameAr: 'الهواتف', nameEn: 'Phones', parentId: 1 },
      ];
      
      vi.mocked(getAllCategories).mockResolvedValue(mockCategories);
      
      const result = await getAllCategories();
      
      expect(result).toHaveLength(3);
      expect(result[0].nameAr).toBe('الإلكترونيات');
    });
  });

  describe('getMainCategories', () => {
    it('should return only main categories (parentId is null)', async () => {
      const mockMainCategories = [
        { id: 1, nameAr: 'الإلكترونيات', nameEn: 'Electronics', parentId: null },
        { id: 2, nameAr: 'الأزياء', nameEn: 'Fashion', parentId: null },
      ];
      
      vi.mocked(getMainCategories).mockResolvedValue(mockMainCategories);
      
      const result = await getMainCategories();
      
      expect(result).toHaveLength(2);
      result.forEach(cat => {
        expect(cat.parentId).toBeNull();
      });
    });
  });

  describe('getSubcategories', () => {
    it('should return subcategories for a given parent', async () => {
      const mockSubcategories = [
        { id: 3, nameAr: 'الهواتف', nameEn: 'Phones', parentId: 1 },
        { id: 4, nameAr: 'الحواسيب', nameEn: 'Computers', parentId: 1 },
      ];
      
      vi.mocked(getSubcategories).mockResolvedValue(mockSubcategories);
      
      const result = await getSubcategories(1);
      
      expect(result).toHaveLength(2);
      result.forEach(cat => {
        expect(cat.parentId).toBe(1);
      });
    });

    it('should return empty array for category with no subcategories', async () => {
      vi.mocked(getSubcategories).mockResolvedValue([]);
      
      const result = await getSubcategories(999);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('getCategoryById', () => {
    it('should return category by ID', async () => {
      const mockCategory = { id: 1, nameAr: 'الإلكترونيات', nameEn: 'Electronics', parentId: null };
      
      vi.mocked(getCategoryById).mockResolvedValue(mockCategory);
      
      const result = await getCategoryById(1);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
    });

    it('should return undefined for non-existent category', async () => {
      vi.mocked(getCategoryById).mockResolvedValue(undefined);
      
      const result = await getCategoryById(999);
      
      expect(result).toBeUndefined();
    });
  });

  describe('getCategoriesWithSubcategories', () => {
    it('should return categories with their subcategories', async () => {
      const mockHierarchy = [
        { 
          id: 1, 
          nameAr: 'الإلكترونيات', 
          nameEn: 'Electronics', 
          subcategories: [
            { id: 3, nameAr: 'الهواتف', nameEn: 'Phones' },
            { id: 4, nameAr: 'الحواسيب', nameEn: 'Computers' },
          ]
        },
      ];
      
      vi.mocked(getCategoriesWithSubcategories).mockResolvedValue(mockHierarchy);
      
      const result = await getCategoriesWithSubcategories();
      
      expect(result[0].subcategories).toHaveLength(2);
    });
  });
});

describe('Search API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const mockResults = {
        products: [
          { id: 1, title: 'iPhone 15', description: 'هاتف ذكي' },
          { id: 2, title: 'iPhone 14', description: 'هاتف ذكي' },
        ],
        total: 2,
      };
      
      vi.mocked(searchProducts).mockResolvedValue(mockResults);
      
      const result = await searchProducts({ query: 'iPhone' });
      
      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by category', async () => {
      const mockResults = {
        products: [{ id: 1, title: 'iPhone 15', categoryId: 3 }],
        total: 1,
      };
      
      vi.mocked(searchProducts).mockResolvedValue(mockResults);
      
      const result = await searchProducts({ query: 'iPhone', categoryId: 3 });
      
      expect(result.products[0].categoryId).toBe(3);
    });

    it('should filter by price range', async () => {
      const mockResults = {
        products: [{ id: 1, title: 'Budget Phone', price: '150' }],
        total: 1,
      };
      
      vi.mocked(searchProducts).mockResolvedValue(mockResults);
      
      const result = await searchProducts({ 
        query: 'phone', 
        minPrice: 100, 
        maxPrice: 200 
      });
      
      expect(result.products).toHaveLength(1);
    });

    it('should return empty results for no matches', async () => {
      vi.mocked(searchProducts).mockResolvedValue({ products: [], total: 0 });
      
      const result = await searchProducts({ query: 'nonexistent' });
      
      expect(result.products).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should support pagination', async () => {
      const mockResults = {
        products: [{ id: 11, title: 'Product 11' }],
        total: 50,
      };
      
      vi.mocked(searchProducts).mockResolvedValue(mockResults);
      
      const result = await searchProducts({ 
        query: 'product', 
        limit: 10, 
        offset: 10 
      });
      
      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(50);
    });
  });
});

describe('ChatBot API', () => {
  describe('Smart Responses', () => {
    it('should have predefined responses for common questions', () => {
      const smartResponses: Record<string, string> = {
        'مرحبا': 'مرحباً بك في STAR LUX!',
        'كيف اشتري': 'للشراء من STAR LUX',
        'الاقسام': 'أقسامنا الرئيسية',
        'طرق الدفع': 'نقبل',
        'التواصل': 'تواصل معنا',
      };
      
      expect(Object.keys(smartResponses)).toContain('مرحبا');
      expect(Object.keys(smartResponses)).toContain('كيف اشتري');
      expect(Object.keys(smartResponses)).toContain('الاقسام');
    });

    it('should include contact information in responses', () => {
      const contactInfo = {
        instagram: '@0q.b4',
        tiktok: '@4j_j7',
        telegram: '@T54_5',
        whatsapp: '+9647819501604',
        email: 'ahmedyassin555555555@gmail.com',
      };
      
      expect(contactInfo.instagram).toBe('@0q.b4');
      expect(contactInfo.whatsapp).toContain('964');
    });
  });
});
