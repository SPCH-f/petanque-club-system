/**
 * Helper to fix CORS and absolute URL issues for images.
 * If the image URL points to localhost but the site is accessed via a domain,
 * it converts it to use the current host.
 */
export const getImageUrl = (url) => {
  if (!url) return null;
  
  // Replace HTML escaped ampersands &amp; with literal &
  url = url.replace(/&amp;/g, '&');
  
  // If it is an external URL (Cloudinary, Facebook, etc.), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Get backend base URL (remove trailing /api if present)
  let backendUrl = import.meta.env.VITE_API_URL || '';
  if (backendUrl.endsWith('/api')) {
    backendUrl = backendUrl.substring(0, backendUrl.length - 4);
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
