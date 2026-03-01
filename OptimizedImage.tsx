/**
 * مكون الصور المحسنة
 * STAR LUX - منصة التجارة الإلكترونية
 * 
 * الميزات:
 * - Lazy Loading تلقائي
 * - Responsive Images مع srcset
 * - Placeholder أثناء التحميل
 * - تحسين الأداء
 */

import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  onLoadComplete?: () => void;
  onError?: () => void;
}

// Placeholder SVG للصور
const generatePlaceholder = (width: number, height: number): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect fill="#1e293b" width="100%" height="100%"/>
    <rect fill="#334155" x="25%" y="25%" width="50%" height="50%" rx="8"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes = '100vw',
  quality = 80,
  className,
  onLoadComplete,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer للـ Lazy Loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // تحميل مبكر قبل الظهور بـ 200px
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadComplete?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  // توليد srcset للـ Responsive Images
  const generateSrcSet = (baseSrc: string): string => {
    // إذا كانت الصورة من مصدر خارجي، نستخدمها كما هي
    if (baseSrc.startsWith('http') || baseSrc.startsWith('data:')) {
      return baseSrc;
    }
    
    // للصور المحلية، نولد أحجام مختلفة
    const widths = [320, 640, 768, 1024, 1280, 1536];
    return widths
      .map((w) => `${baseSrc}?w=${w}&q=${quality} ${w}w`)
      .join(', ');
  };

  const placeholderSrc = blurDataURL || 
    (placeholder === 'blur' && width && height 
      ? generatePlaceholder(width, height) 
      : undefined);

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        className
      )}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        aspectRatio: width && height ? `${width}/${height}` : undefined,
      }}
    >
      {/* Placeholder */}
      {!isLoaded && !isError && placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
        />
      )}

      {/* Skeleton أثناء التحميل */}
      {!isLoaded && !isError && !placeholderSrc && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse" />
      )}

      {/* الصورة الفعلية */}
      {isInView && !isError && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}

      {/* حالة الخطأ */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="text-center text-slate-400">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">فشل التحميل</span>
          </div>
        </div>
      )}
    </div>
  );
}

// مكون للصور في الخلفية
export function OptimizedBackgroundImage({
  src,
  alt,
  className,
  children,
  priority = false,
  overlay = true,
  ...props
}: OptimizedImageProps & { overlay?: boolean; children?: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority]);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [isInView, src]);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {/* خلفية Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse" />
      )}

      {/* الصورة */}
      {isInView && (
        <div
          className={cn(
            'absolute inset-0 bg-cover bg-center transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          style={{ backgroundImage: `url(${src})` }}
          role="img"
          aria-label={alt}
        />
      )}

      {/* Overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      {/* المحتوى */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default OptimizedImage;
