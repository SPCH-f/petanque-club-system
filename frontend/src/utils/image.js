/**
 * Helper to fix CORS and absolute URL issues for images.
 * If the image URL points to localhost but the site is accessed via a domain,
 * it converts it to use the current host.
 */
export const getImageUrl = (url) => {
  if (!url) return null;
  
  // If it's already a relative path, return it as is
  if (url.startsWith('/uploads')) return url;

  // If it's an absolute URL (localhost, cloudflare, etc.), 
  // extract the part starting from /uploads
  if (url.includes('/uploads/')) {
    const parts = url.split('/uploads/');
    return '/uploads/' + (parts[parts.length - 1] || '');
  }
  
  return url;
};
