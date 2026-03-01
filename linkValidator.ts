/**
 * STAR LUX - Link Validator & Compatibility Checker
 * Cross-Browser Support - RTL Support - Link Validation
 */

// ============================================
// LINK VALIDATION
// ============================================
export interface LinkValidationResult {
  url: string;
  isValid: boolean;
  isInternal: boolean;
  hasProtocol: boolean;
  error?: string;
}

export function validateLink(url: string): LinkValidationResult {
  const result: LinkValidationResult = {
    url,
    isValid: false,
    isInternal: false,
    hasProtocol: false,
  };

  if (!url || typeof url !== 'string') {
    result.error = 'Invalid URL: empty or not a string';
    return result;
  }

  // Check if internal link
  if (url.startsWith('/') || url.startsWith('#')) {
    result.isValid = true;
    result.isInternal = true;
    return result;
  }

  // Check protocol
  result.hasProtocol = /^https?:\/\//i.test(url);

  try {
    const urlObj = new URL(url, window.location.origin);
    result.isValid = true;
    result.isInternal = urlObj.origin === window.location.origin;
  } catch (e) {
    result.error = 'Invalid URL format';
  }

  return result;
}

export function sanitizeLink(url: string): string {
  if (!url) return '#';
  
  // Internal links
  if (url.startsWith('/') || url.startsWith('#')) {
    return url;
  }

  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }

  return url;
}

// ============================================
// BROWSER COMPATIBILITY
// ============================================
export interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
  isMobile: boolean;
  isRTL: boolean;
}

export function getBrowserInfo(): BrowserInfo {
  const ua = navigator.userAgent;
  const info: BrowserInfo = {
    name: 'Unknown',
    version: '0',
    isSupported: true,
    isMobile: /Mobile|Android|iPhone|iPad/i.test(ua),
    isRTL: document.dir === 'rtl' || document.documentElement.dir === 'rtl',
  };

  // Detect browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    info.name = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    info.version = match ? match[1] : '0';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    info.name = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    info.version = match ? match[1] : '0';
  } else if (ua.includes('Firefox')) {
    info.name = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    info.version = match ? match[1] : '0';
  } else if (ua.includes('Edg')) {
    info.name = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    info.version = match ? match[1] : '0';
  }

  // Check support (minimum versions)
  const minVersions: Record<string, number> = {
    Chrome: 80,
    Safari: 13,
    Firefox: 75,
    Edge: 80,
  };

  const minVersion = minVersions[info.name];
  if (minVersion && parseInt(info.version) < minVersion) {
    info.isSupported = false;
  }

  return info;
}

// ============================================
// RTL SUPPORT
// ============================================
export function isRTL(): boolean {
  return document.dir === 'rtl' || document.documentElement.dir === 'rtl';
}

export function setDirection(dir: 'rtl' | 'ltr'): void {
  document.dir = dir;
  document.documentElement.dir = dir;
  document.documentElement.lang = dir === 'rtl' ? 'ar' : 'en';
}

export function getLogicalProperty(
  property: 'margin' | 'padding' | 'border',
  side: 'start' | 'end'
): string {
  const rtl = isRTL();
  const physicalSide = side === 'start' 
    ? (rtl ? 'right' : 'left')
    : (rtl ? 'left' : 'right');
  return `${property}-${physicalSide}`;
}

// ============================================
// FEATURE DETECTION
// ============================================
export interface FeatureSupport {
  intersectionObserver: boolean;
  resizeObserver: boolean;
  mutationObserver: boolean;
  webAnimations: boolean;
  cssGrid: boolean;
  cssVariables: boolean;
  flexGap: boolean;
  webp: boolean;
  avif: boolean;
  touchEvents: boolean;
  serviceWorker: boolean;
  webGL: boolean;
}

export function detectFeatures(): FeatureSupport {
  return {
    intersectionObserver: 'IntersectionObserver' in window,
    resizeObserver: 'ResizeObserver' in window,
    mutationObserver: 'MutationObserver' in window,
    webAnimations: 'animate' in document.createElement('div'),
    cssGrid: CSS.supports('display', 'grid'),
    cssVariables: CSS.supports('--test', '0'),
    flexGap: CSS.supports('gap', '1px'),
    webp: checkWebPSupport(),
    avif: false, // Async check needed
    touchEvents: 'ontouchstart' in window,
    serviceWorker: 'serviceWorker' in navigator,
    webGL: checkWebGLSupport(),
  };
}

function checkWebPSupport(): boolean {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

// ============================================
// POLYFILLS LOADER
// ============================================
export async function loadPolyfills(): Promise<void> {
  const features = detectFeatures();
  
  // Log unsupported features for debugging
  if (!features.intersectionObserver) {
    console.warn('IntersectionObserver not supported');
  }
  if (!features.resizeObserver) {
    console.warn('ResizeObserver not supported');
  }
  
  // Modern browsers support all required features
  // No polyfills needed for target browsers
}

// ============================================
// SAFE NAVIGATION
// ============================================
export function safeNavigate(
  url: string,
  options?: { newTab?: boolean; replace?: boolean }
): void {
  const validation = validateLink(url);
  
  if (!validation.isValid) {
    console.error('Invalid navigation URL:', url);
    return;
  }

  const sanitized = sanitizeLink(url);

  if (options?.newTab) {
    window.open(sanitized, '_blank', 'noopener,noreferrer');
  } else if (options?.replace) {
    window.location.replace(sanitized);
  } else {
    window.location.href = sanitized;
  }
}

// ============================================
// SCROLL UTILITIES
// ============================================
export function scrollToElement(
  selector: string,
  options?: { offset?: number; behavior?: ScrollBehavior }
): void {
  const element = document.querySelector(selector);
  if (!element) return;

  const offset = options?.offset ?? 0;
  const behavior = options?.behavior ?? 'smooth';

  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior });
}

export function scrollToTop(behavior: ScrollBehavior = 'smooth'): void {
  window.scrollTo({ top: 0, behavior });
}

// ============================================
// EXPORT UTILITIES
// ============================================
export const browserInfo = getBrowserInfo();
export const featureSupport = detectFeatures();
