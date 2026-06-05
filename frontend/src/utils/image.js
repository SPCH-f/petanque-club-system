/**
 * Helper to fix CORS and absolute URL issues for images.
 * If the image URL points to localhost but the site is accessed via a domain,
 * it converts it to use the current host.
 */
export const getImageUrl = (url) => {
  if (!url) return null;

  // Replace HTML escaped ampersands &amp; with literal &
  url = String(url).replace(/&amp;/g, '&').trim();

  // Preserve external URLs (Cloudinary, Facebook, etc.)
  if (/^https?:\/\//i.test(url)) {
    // Normalize local development URLs to the configured backend URL in production.
    if (/localhost:\d+|127\.0\.0\.1:\d+/.test(url)) {
      let backendUrl = import.meta.env.VITE_API_URL || '';
      if (backendUrl.endsWith('/api')) {
        backendUrl = backendUrl.slice(0, -4);
      }
      if (!backendUrl) {
        backendUrl = typeof window !== 'undefined' ? window.location.origin : '';
      }
      const relative = url.replace(/^https?:\/\/[^/]+/i, '');
      return `${backendUrl}${relative}`;
    }
    return url;
  }

  // Get backend base URL (remove trailing /api if present)
  let backendUrl = import.meta.env.VITE_API_URL || '';
  if (backendUrl.endsWith('/api')) {
    backendUrl = backendUrl.slice(0, -4);
  }
  if (!backendUrl) {
    backendUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  // If it's a relative path starting with /uploads
  if (url.startsWith('/uploads')) {
    return `${backendUrl}${url}`;
  }

  // If it's an absolute URL containing /uploads, extract the relative part and append to backendUrl
  if (url.includes('/uploads/')) {
    const parts = url.split('/uploads/');
    return `${backendUrl}/uploads/` + (parts[parts.length - 1] || '');
  }

  return url;
};
