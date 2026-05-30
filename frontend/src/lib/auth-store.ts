"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  createElement,
  type ReactNode,
} from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: "individual" | "business" | "admin";
  jurisdiction: "TT" | "JM" | "BS" | "International";
  email_verified: boolean;
  kyc_data?: {
    step: number;
    status: string;
    rejectionReason?: string;
    submittedAt?: string;
    reviewedAt?: string;
    personalInfo: Record<string, unknown>;
    identityDocs: Record<string, unknown>;
    addressDocs: Record<string, unknown>;
    businessInfo: Record<string, unknown>;
    documents: Record<string, unknown>;
    directors: unknown[];
    businessDocs: unknown[];
  };
}

interface AuthContextValue {
  user: User | null;
  setUser: (u: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name: string, role: "individual" | "business" | "admin") => Promise<User>;
  logout: () => Promise<void>;
  loading: boolean;
  /** True when refresh failed and user needs to re-authenticate */
  sessionExpired: boolean;
  /** Dismiss the session-expired state */
  dismissSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ──────────────────────────────────────────────────────────
// 1. User Service (httpOnly cookies — tokens are NOT readable by JS)
// ──────────────────────────────────────────────────────────
//
// JWT access/refresh tokens live in httpOnly cookies set by the backend.
// We only manage the non-sensitive user object in sessionStorage for
// role checks and UI rendering.

const USER_KEY = "psi_user";

/** Monotonically increasing counter — bumped on every login/signup/refresh.
 *  Used to invalidate stale 401 responses from in-flight requests. */
let tokenVersion = 0;

export const UserService = {
  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(USER_KEY);
      return null;
    }
  },

  setUser(u: User | null) {
    if (u) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(u));
    } else {
      sessionStorage.removeItem(USER_KEY);
    }
  },

  /** Clear all client-side auth state (user object). Cookies are cleared by the server. */
  clearAll() {
    sessionStorage.removeItem(USER_KEY);
    tokenVersion++;
  },

  /** Get current token version (for stale-response guard) */
  getVersion(): number {
    return tokenVersion;
  },

  /** Bump version — called after login/signup/refresh to invalidate stale in-flight responses */
  bumpVersion() {
    tokenVersion++;
  },
};

// ──────────────────────────────────────────────────────────
// 2. Refresh logic — one in-flight at a time
// ──────────────────────────────────────────────────────────

let refreshPromise: Promise<boolean | null> | null = null;

/** Callbacks registered by the AuthProvider — module level for use outside React */
let onSessionExpired: (() => void) | null = null;

async function doRefresh(): Promise<boolean | null> {
  const versionBefore = UserService.getVersion();

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}), // Server reads from cookie; body is empty for compat
    });
    if (!res.ok) {
      UserService.clearAll();
      onSessionExpired?.();
      return null;
    }
    const data = await res.json();
    // Server sets new httpOnly cookies; we get user data back
    if (data.user) {
      UserService.setUser(data.user);
    }
    UserService.bumpVersion();
    return true;
  } catch {
    UserService.clearAll();
    onSessionExpired?.();
    return null;
  }
}

// ──────────────────────────────────────────────────────────
// 3. Authenticated fetch — with stale-response guard
// ──────────────────────────────────────────────────────────

/** Authenticated fetch wrapper.
 *  Tokens are sent via httpOnly cookies (credentials: 'include').
 *  Auto-refreshes on 401 and retries once.
 *  Stale 401 responses (from requests that started before a new login)
 *  are silently ignored. */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Snapshot the version at request time
  const requestVersion = UserService.getVersion();

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
    },
  });

  // If 401, check whether the token version changed (new login happened)
  // before attempting refresh — if so, this is a stale response, ignore it
  if (res.status === 401) {
    if (UserService.getVersion() !== requestVersion) {
      throw new Error("Stale request — token version changed");
    }

    // Not a retry (avoid infinite loop)
    if (!(options.headers as Record<string, string>)?.["X-Retry"]) {
      const refreshed = await doRefresh();
      if (refreshed) {
        return fetch(`${API_BASE}${url}`, {
          ...options,
          credentials: "include",
          headers: {
            ...(options.headers as Record<string, string>),
            "X-Retry": "true",
          },
        });
      }
    }

    // Refresh also failed — session is truly expired
    onSessionExpired?.();
  }

  return res;
}

// ──────────────────────────────────────────────────────────
// Auth Provider
// ──────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const hydrated = useRef(false);

  const dismissSessionExpired = useCallback(() => setSessionExpired(false), []);

  // ── Hydrate user from sessionStorage on mount ──

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      const stored = UserService.getUser();
      if (stored) {
        setUser(stored);
        // Refresh user data from /api/auth/me to get latest state.
        // If cookie is valid, this succeeds and we update the user object.
        // If cookie is expired, this returns 401 and we trigger session expiry.
        fetch(`${API_BASE}/auth/me`, { credentials: "include" })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.user) {
              UserService.setUser(d.user);
              setUser(d.user);
            }
          })
          .catch(() => {});
      }
      setLoading(false);
    }
  }, []);

  // ── Register module-level callbacks ──

  useEffect(() => {
    onSessionExpired = () => {
      UserService.clearAll();
      setUser(null);
      setSessionExpired(true);
    };
    return () => {
      onSessionExpired = null;
    };
  }, []);

  // ── Login ──

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    // Reset stale state.
    // sessionStorage write is caller's responsibility (after role checks).
    // React state is set here so useAuth() consumers work immediately.
    setSessionExpired(false);
    setUser(null);

    UserService.bumpVersion();
    setUser(data.user);
    return data.user as User;
  }, [setSessionExpired]);

  const signup = useCallback(async (email: string, password: string, name: string, role: "individual" | "business" | "admin") => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, name, role }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");

    // Reset stale state — caller commits session after any checks.
    setSessionExpired(false);
    setUser(null);

    UserService.bumpVersion();
    setUser(data.user);
    return data.user as User;
  }, [setSessionExpired]);

  // ── Logout ──

  const logout = useCallback(async () => {
    // Server clears httpOnly cookies + revokes tokens
    fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});

    // Clear everything synchronously
    UserService.clearAll();
    setUser(null);
    setSessionExpired(false);
  }, []);

  return createElement(
    AuthContext.Provider,
    { value: { user, setUser, login, signup, logout, loading, sessionExpired, dismissSessionExpired } },
    children
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
