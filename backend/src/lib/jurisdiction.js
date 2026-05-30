// Geodata bundled with geoip-lite — no API calls, no rate limits
import geoip from "geoip-lite";

const COUNTRY_TO_JURISDICTION = {
  TT: "TT", // Trinidad & Tobago
  JM: "JM", // Jamaica
  BS: "BS", // Bahamas
};

/**
 * Detect jurisdiction from an IP address.
 * Returns "TT" | "JM" | "BS" | "International"
 */
export function detectJurisdiction(ip) {
  // Handle localhost / private IPs
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return "International";
  }

  // Strip port if present
  const cleanIp = ip.split(":")[0];

  const result = geoip.lookup(cleanIp);
  if (!result || !result.country) {
    return "International";
  }

  return COUNTRY_TO_JURISDICTION[result.country] || "International";
}

/**
 * Extract the client IP from an Express request.
 * Handles nginx proxy headers (x-forwarded-for).
 */
export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "127.0.0.1";
}
