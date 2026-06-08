import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../lib/auth.tsx';

export const Route = createFileRoute('/app')({
  component: AppDashboard,
});

function AppDashboard() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<'list' | 'create'>('list');

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <header className="border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-[var(--sea-ink)]">Sliding — Engineering</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--sea-ink-soft)]">{user?.email}</span>
            <button
              onClick={signOut}
              className="rounded-lg px-3 py-1.5 text-sm text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-[var(--sea-ink)]">
            {view === 'list' ? 'Your Presentations' : 'New Presentation'}
          </h2>
          {view === 'list' && (
            <button
              onClick={() => setView('create')}
              className="rounded-full bg-[var(--lagoon)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--lagoon-deep)]"
            >
              New Presentation
            </button>
          )}
          {view === 'create' && (
            <button
              onClick={() => setView('list')}
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)]"
            >
              Back
            </button>
          )}
        </div>

        {view === 'list' ? <PresentationList /> : <CreatePresentation />}
      </main>
    </div>
  );
}

function PresentationList() {
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState<Array<{
    id: number;
    title: string;
    description: string;
    share_token: string;
    created_at: string;
    view_count: number;
    confidential: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    fetch('/api/presentations')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to load');
      })
      .then((data) => {
        setPresentations(data.presentations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  });

  if (loading) return <p className="text-center text-[var(--sea-ink-soft)]">Loading...</p>;

  if (presentations.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center">
        <p className="text-[var(--sea-ink-soft)]">No presentations yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {presentations.map((p) => (
        <div
          key={p.id}
          className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:border-[var(--lagoon)]"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3
              className="cursor-pointer text-base font-semibold text-[var(--sea-ink)]"
              onClick={() => void navigate({ to: '/app/edit', search: { id: p.id } })}
            >
              {p.title}
            </h3>
            <span className="text-xs text-[var(--sea-ink-soft)]">
              {new Date(p.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mb-3 text-sm text-[var(--sea-ink-soft)]">{p.description}</p>
          <div className="flex items-center gap-2">
            <a
              href={`/p/${p.share_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[var(--lagoon)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              View
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/p/${p.share_token}`)}
              className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--sea-ink-soft)]"
            >
              Copy Link
            </button>
            {p.confidential && (
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                Confidential
              </span>
            )}
            <span className="ml-auto text-xs text-[var(--sea-ink-soft)]">
              {p.view_count} views
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreatePresentation() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [confidential, setConfidential] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: number; shareToken: string } | null>(null);

  const handleCreate = async () => {
    if (!markdown.trim()) {
      setError('Please provide research content');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Untitled Presentation',
          description,
          source_markdown: markdown,
          confidential,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create presentation');
      }

      const data = await res.json();
      setSuccess({ id: data.presentation.id, shareToken: data.presentation.share_token });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setGenerating(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-[var(--lagoon)] bg-[rgba(79,184,178,0.08)] p-8 text-center">
        <h3 className="mb-3 text-lg font-semibold text-[var(--lagoon-deep)]">
          Presentation Created!
        </h3>
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          Your presentation is being generated. You can view it when ready.
        </p>
        <div className="mb-4 flex justify-center gap-2">
          <a
            href={`/p/${success.shareToken}`}
            className="rounded-full bg-[var(--lagoon)] px-4 py-2 text-sm font-semibold text-white"
          >
            View Presentation
          </a>
          <button
            onClick={() => {
              setSuccess(null);
              setTitle('');
              setMarkdown('');
            }}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--sea-ink-soft)]"
          >
            Create Another
          </button>
        </div>
        <button
          onClick={() => void navigate({ to: '/app' })}
          className="text-sm text-[var(--lagoon)]"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
          Title <span className="text-[var(--sea-ink-soft)]">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q4 Infrastructure Improvements"
          className="demo-input"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
          Description <span className="text-[var(--sea-ink-soft)]">(optional)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this pitch"
          className="demo-input"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
          Research Content <span className="text-red-500">*</span>
        </label>
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder={`# Your Research Title\n\n## Problem\nWhat problem does this solve?\n\n## Solution\nHow does it solve the problem?\n\n## Evidence\nWhat evidence supports this?\n\n## Next Steps\nWhat actions are needed?`}
          className="demo-textarea min-h-[20rem] font-mono text-sm"
        />
      </div>

      <label className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={confidential}
          onChange={(e) => setConfidential(e.target.checked)}
          className="rounded border-[var(--line)]"
        />
        <span className="text-sm text-[var(--sea-ink-soft)]">Mark as confidential</span>
      </label>

      {error && (
        <div className="mb-4 rounded-xl border border-red-300 bg-[rgba(196,71,71,0.1)] p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={generating || !markdown.trim()}
        className="demo-button w-full"
      >
        {generating ? 'Generating Presentation...' : 'Generate Presentation'}
      </button>
    </div>
  );
}
