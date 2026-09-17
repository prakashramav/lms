/**
 * SSRF (Server-Side Request Forgery) Prevention Utility
 * Phase 13 — Production Security Hardening (Section 42)
 *
 * Validates outgoing URLs against:
 * - Protocols (only http and https allowed)
 * - Private RFC 1918 subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Loopback addresses (127.0.0.0/8, ::1, localhost)
 * - Link-local and AWS / Cloud Metadata IP (169.254.169.254)
 * - Carrier-grade NAT (100.64.0.0/10)
 * - IPv6 Unique Local (fc00::/7) and Link-Local (fe80::/10)
 */

const { URL } = require('url');

const DISALLOWED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'instance-data',
  '169.254.169.254',
]);

const isPrivateIp = (ip) => {
  // IPv4 regex checks
  if (ip === '127.0.0.1' || ip === '0.0.0.0') return true;

  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    // 10.0.0.0 - 10.255.255.255
    if (parts[0] === 10) return true;
    // 172.16.0.0 - 172.31.255.255
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0 - 192.168.255.255
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 127.0.0.0/8
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (Link Local / Cloud metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 100.64.0.0/10 (Carrier-Grade NAT)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
  }

  // IPv6 checks
  if (ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) {
    return true;
  }

  return false;
};

/**
 * Validates a target URL for SSRF vulnerabilities.
 * @param {string} targetUrl - URL to be fetched
 * @returns {{ valid: boolean, error?: string }}
 */
const validateSafeUrl = (targetUrl) => {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string' };
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return { valid: false, error: 'Malformed URL' };
  }

  // Enforce http / https protocols only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: `Disallowed protocol: ${parsed.protocol}. Only http: and https: are allowed.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check known internal hostnames
  if (DISALLOWED_HOSTNAMES.has(hostname)) {
    return { valid: false, error: `Access to internal host "${hostname}" is prohibited.` };
  }

  // Check if hostname is an IP and if it is private
  if (isPrivateIp(hostname)) {
    return { valid: false, error: `Access to private IP address "${hostname}" is prohibited.` };
  }

  // Check for common internal domain suffixes
  if (
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.corp')
  ) {
    return { valid: false, error: `Access to internal network domain "${hostname}" is prohibited.` };
  }

  return { valid: true, sanitizedUrl: parsed.toString() };
};

module.exports = {
  validateSafeUrl,
  isPrivateIp,
};
