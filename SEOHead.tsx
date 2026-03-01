/**
 * مكون SEO Head
 * يدير جميع Meta Tags والـ SEO للصفحات المختلفة
 */

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
}

export function SEOHead({
  title,
  description,
  keywords = '',
  image = 'https://star-lux.com/og-image.jpg',
  url = 'https://star-lux.com',
  type = 'website',
  author = 'STAR LUX',
}: SEOHeadProps) {
  // تحديث العنوان
  document.title = `${title} | STAR LUX`;

  // تحديث Meta Tags
  const updateMetaTag = (name: string, content: string) => {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  const updatePropertyTag = (property: string, content: string) => {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  // تحديث Meta Tags الأساسية
  updateMetaTag('title', title);
  updateMetaTag('description', description);
  if (keywords) {
    updateMetaTag('keywords', keywords);
  }
  updateMetaTag('author', author);

  // تحديث Open Graph Tags
  updatePropertyTag('og:type', type);
  updatePropertyTag('og:title', title);
  updatePropertyTag('og:description', description);
  updatePropertyTag('og:image', image);
  updatePropertyTag('og:url', url);
  updatePropertyTag('og:site_name', 'STAR LUX');

  // تحديث Twitter Tags
  updatePropertyTag('twitter:card', 'summary_large_image');
  updatePropertyTag('twitter:title', title);
  updatePropertyTag('twitter:description', description);
  updatePropertyTag('twitter:image', image);

  // تحديث Canonical URL
  let canonicalTag = document.querySelector('link[rel="canonical"]');
  if (!canonicalTag) {
    canonicalTag = document.createElement('link');
    canonicalTag.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalTag);
  }
  canonicalTag.setAttribute('href', url);

  return null;
}

/**
 * Hook للتعامل مع SEO
 */
export function useSEO(seoData: SEOHeadProps) {
  return <SEOHead {...seoData} />;
}
