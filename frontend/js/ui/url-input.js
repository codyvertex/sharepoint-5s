/**
 * URL Input Component
 * Handles SharePoint URL validation and submission.
 */

const SP_REGEX = /^https:\/\/[\w-]+\.sharepoint\.com\/(sites|teams)\/[\w%-]+/i;

/**
 * Validate a SharePoint URL.
 * @param {string} url
 * @returns {{ valid: boolean, message: string }}
 */
export function validateSharePointUrl(url) {
  if (!url) return { valid: false, message: '' };
  if (!url.startsWith('https://')) return { valid: false, message: 'URL must start with https://' };
  if (!SP_REGEX.test(url)) return { valid: false, message: 'Not a valid SharePoint site URL' };
  return { valid: true, message: '' };
}

/**
 * Extract a readable site name from a SharePoint URL.
 * @param {string} url
 * @returns {string}
 */
export function getSiteNameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const siteIdx = parts.findIndex(p => p === 'sites' || p === 'teams');
    if (siteIdx >= 0 && parts[siteIdx + 1]) {
      return decodeURIComponent(parts[siteIdx + 1]);
    }
    return parsed.hostname;
  } catch {
    return url;
  }
}
