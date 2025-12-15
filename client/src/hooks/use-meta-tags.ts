import { useEffect } from 'react';

interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

interface MetaTagsConfig {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogType?: string;
}

/**
 * Hook to update document meta tags
 * Automatically cleans up on unmount
 */
export function useMetaTags(config: MetaTagsConfig) {
  useEffect(() => {
    const originalTitle = document.title;
    const addedElements: HTMLMetaElement[] = [];

    // Update title
    if (config.title) {
      document.title = config.title;
    }

    // Helper to add or update meta tag
    const setMetaTag = (selector: string, content: string) => {
      let element = document.querySelector<HTMLMetaElement>(selector);
      
      if (!element) {
        element = document.createElement('meta');
        const [attr, value] = selector.replace('meta[', '').replace(']', '').split('=');
        element.setAttribute(attr, value.replace(/"/g, ''));
        document.head.appendChild(element);
        addedElements.push(element);
      }
      
      element.setAttribute('content', content);
    };

    // Set meta tags
    if (config.description) {
      setMetaTag('meta[name="description"]', config.description);
    }

    if (config.ogTitle) {
      setMetaTag('meta[property="og:title"]', config.ogTitle);
    }

    if (config.ogDescription) {
      setMetaTag('meta[property="og:description"]', config.ogDescription);
    }

    if (config.ogUrl) {
      setMetaTag('meta[property="og:url"]', config.ogUrl);
    }

    if (config.ogType) {
      setMetaTag('meta[property="og:type"]', config.ogType);
    }

    // Cleanup function
    return () => {
      document.title = originalTitle;
      addedElements.forEach(element => {
        element.remove();
      });
    };
  }, [config.title, config.description, config.ogTitle, config.ogDescription, config.ogUrl, config.ogType]);
}
