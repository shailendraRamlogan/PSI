import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET || "psi-access-secret-change-me";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "psi-refresh-secret-change-me";

/** Access token: short-lived (15 minutes) */
export function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: "15m" }
  );
}

/** Refresh token: long-lived (7 days) */
export function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}

/** Verify an access token */
export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

/** Verify a refresh token */
export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

/** Express middleware: require a valid access token.
 *  Reads from cookie first, falls back to Authorization: Bearer header.
 *  This preserves Postman/API compatibility during the transition. */
export function authMiddleware(req, res, next) {
  // 1. Try httpOnly cookie first
  const cookieToken = req.cookies?.psi_access_token;
  // 2. Fall back to Authorization: Bearer header
  const header = req.headers.authorization;
  const bearerToken = header && header.startsWith("Bearer ") ? header.split(" ")[1] : null;

  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid access token" });
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Access token expired or invalid" });
  }
}
