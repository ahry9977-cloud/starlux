import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, Package, Store, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import './search-animations.css';

interface SearchSuggestion {
  id: string;
  type: 'product' | 'store' | 'category' | 'history';
  title: string;
  subtitle?: string;
  image?: string;
  url?: string;
}

interface GlowingSearchBarProps {
  onSearch: (query: string) => void;
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  showHistory?: boolean;
  maxSuggestions?: number;
}

export function GlowingSearchBar({
  onSearch,
  onSuggestionClick,
  suggestions = [],
  isLoading = false,
  placeholder = 'ابحث عن منتجات، متاجر...',
  className,
  autoFocus = false,
  showHistory = true,
  maxSuggestions = 8,
}: GlowingSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);
  const particleIdRef = useRef(0);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('star_lux_search_history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch {
        setSearchHistory([]);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveToHistory = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h.toLowerCase() !== trimmed.toLowerCase());
      const newHistory = [trimmed, ...filtered].slice(0, 10);
      localStorage.setItem('star_lux_search_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('star_lux_search_history');
  }, []);

  // Handle input change with debounce
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);
    
    if (value.trim()) {
      setShowSuggestions(true);
      // Trigger search with debounce (handled by parent)
      onSearch(value);
    } else {
      setShowSuggestions(showHistory && searchHistory.length > 0);
    }
  }, [onSearch, showHistory, searchHistory.length]);

  // Handle form submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveToHistory(query);
      onSearch(query);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  }, [query, saveToHistory, onSearch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.type === 'history') {
      setQuery(suggestion.title);
      onSearch(suggestion.title);
    } else {
      saveToHistory(suggestion.title);
      onSuggestionClick?.(suggestion);
    }
    setShowSuggestions(false);
  }, [saveToHistory, onSearch, onSuggestionClick]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = query.trim() ? suggestions : searchHistory.map((h, i) => ({ 
      id: `history-${i}`, 
      type: 'history' as const, 
      title: h 
    }));
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case 'Enter':
        if (activeIndex >= 0 && items[activeIndex]) {
          e.preventDefault();
          handleSuggestionClick(items[activeIndex] as SearchSuggestion);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
    }
  }, [query, suggestions, searchHistory, activeIndex, handleSuggestionClick]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (query.trim() || (showHistory && searchHistory.length > 0)) {
      setShowSuggestions(true);
    }
  }, [query, showHistory, searchHistory.length]);

  // Handle blur
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Don't blur if clicking on suggestions
    if (containerRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsFocused(false);
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  // Handle clear
  const handleClear = useCallback(() => {
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  // Create ripple effect
  const createRipple = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const id = rippleIdRef.current++;
    setRipples(prev => [...prev, { id, x, y }]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, []);

  // Create particle effect on typing
  useEffect(() => {
    if (query && isFocused) {
      const id = particleIdRef.current++;
      const x = Math.random() * 100;
      const y = 50;
      
      setParticles(prev => [...prev.slice(-10), { id, x, y }]);
      
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== id));
      }, 1500);
    }
  }, [query, isFocused]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon for suggestion type
  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'store':
        return <Store className="w-4 h-4" />;
      case 'history':
        return <Clock className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  // Highlight matching text
  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="suggestion-highlight">{part}</span>
      ) : part
    );
  };

  // Prepare display items
  const displayItems = query.trim() 
    ? suggestions.slice(0, maxSuggestions)
    : searchHistory.slice(0, 5).map((h, i) => ({
        id: `history-${i}`,
        type: 'history' as const,
        title: h,
      }));

  return (
    <div 
      ref={containerRef}
      className={cn('search-container', className)}
    >
      <form onSubmit={handleSubmit} className="w-full">
        <div 
          className={cn(
            'search-wrapper',
            isFocused && 'focused'
          )}
          onClick={createRipple}
        >
          {/* Ripple Effects */}
          <div className="ripple-container">
            {ripples.map(ripple => (
              <span
                key={ripple.id}
                className="ripple"
                style={{
                  left: ripple.x - 50,
                  top: ripple.y - 50,
                }}
              />
            ))}
          </div>

          {/* Particles */}
          <div className="particles-container">
            {particles.map(particle => (
              <span
                key={particle.id}
                className="particle"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  '--x-offset': `${(Math.random() - 0.5) * 40}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>

          {/* Search Icon */}
          <Search className="search-icon" />

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="search-input"
            autoFocus={autoFocus}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            dir="auto"
          />

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className={cn('search-clear', query && 'visible')}
            tabIndex={-1}
          >
            <X className="w-full h-full" />
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (displayItems.length > 0 || isLoading) && (
        <div className="suggestions-container">
          {/* Search History Header */}
          {!query.trim() && searchHistory.length > 0 && showHistory && (
            <div className="search-history">
              <div className="search-history-header">
                <span>عمليات البحث الأخيرة</span>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="search-history-clear"
                >
                  مسح الكل
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="search-loading">
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
            </div>
          )}

          {/* Suggestions List */}
          {!isLoading && displayItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'suggestion-item',
                activeIndex === index && 'active'
              )}
              onClick={() => handleSuggestionClick(item)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="suggestion-icon">
                {'image' in item && item.image ? (
                  <img src={item.image} alt="" />
                ) : (
                  getSuggestionIcon(item.type)
                )}
              </div>
              <div className="suggestion-text">
                <div className="suggestion-title">
                  {highlightMatch(item.title, query)}
                </div>
                {'subtitle' in item && item.subtitle && (
                  <div className="suggestion-subtitle">{item.subtitle}</div>
                )}
              </div>
            </div>
          ))}

          {/* No Results */}
          {!isLoading && query.trim() && displayItems.length === 0 && (
            <div className="no-results">
              <Search className="no-results-icon" />
              <p>لا توجد نتائج لـ "{query}"</p>
              <p className="text-sm mt-1">جرب كلمات بحث مختلفة</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GlowingSearchBar;
