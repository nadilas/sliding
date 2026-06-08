import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthUser {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
}

interface AuthContextType {
  user: AuthUser | null;
  sessionToken: string | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, tenantName: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('session_token') : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user on mount
  useState(() => {
    if (sessionToken) {
      fetch('/api/auth/me')
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Invalid session');
        })
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('session_token');
          setSessionToken(null);
        });
    }
  });

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Sign in failed');
      }

      const data = await res.json();
      setUser(data.user);
      setSessionToken(data.sessionToken);
      localStorage.setItem('session_token', data.sessionToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, tenantName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, tenantName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Sign up failed');
      }

      const data = await res.json();
      setUser(data.user);
      setSessionToken(data.sessionToken);
      localStorage.setItem('session_token', data.sessionToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem('session_token');
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, sessionToken, loading, error, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
