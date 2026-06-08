import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../lib/auth.tsx';

export const Route = createFileRoute('/auth/sign-up')({
  component: SignUpPage,
});

function SignUpPage() {
  const { signUp, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async () => {
    try {
      await signUp(email, password, name, tenantName);
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
          Create your account
        </p>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="demo-input"
              placeholder="Jane Smith"
            />
          </div>

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
              placeholder="Min 8 characters"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
              Team Name
            </label>
            <input
              type="text"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className="demo-input"
              placeholder="Engineering Team"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-300 bg-[rgba(196,71,71,0.1)] p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleSignUp}
            disabled={loading || !email || !password || !name}
            className="demo-button w-full"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="mt-4 text-center text-sm text-[var(--sea-ink-soft)]">
            Already have an account?{' '}
            <a
              href="/auth/sign-in"
              className="text-[var(--lagoon-deep)]"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
