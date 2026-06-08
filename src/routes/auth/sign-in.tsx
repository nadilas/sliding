import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../lib/auth.tsx';

export const Route = createFileRoute('/auth/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
      void navigate({ to: '/app' });
    } catch {
      // Error handled by useAuth
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold text-[var(--sea-ink)]">
          Sliding
        </h1>
        <p className="mb-8 text-center text-[var(--sea-ink-soft)]">
          Sign in to your account
        </p>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="demo-input"
              placeholder="you@company.com"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="demo-input"
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            />
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-300 bg-[rgba(196,71,71,0.1)] p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={loading || !email || !password}
            className="demo-button w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="mt-4 text-center text-sm text-[var(--sea-ink-soft)]">
            Don't have an account?{' '}
            <a
              href="/auth/sign-up"
              className="text-[var(--lagoon-deep)]"
            >
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
