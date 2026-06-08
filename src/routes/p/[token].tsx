import { useState, useEffect, useRef, useCallback } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  SlideTitle,
  SlideProblem,
  SlideSolution,
  SlideEvidence,
  SlideComparison,
  SlideNextSteps,
  SlideConclusion,
} from '../../components/slides/index.tsx';

export const Route = createFileRoute('/p/token')({
  component: ExecutiveView,
});

interface SlideData {
  slide_index: number;
  type: string;
  layout: string;
  data: Record<string, unknown>;
}

function ExecutiveView() {
  const { token } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [presentation, setPresentation] = useState<{
    title: string;
    description: string;
    confidential: boolean;
  } | null>(null);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const body = password ? { password } : {};
        const res = await fetch(`/api/presentations/t/${token}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: Object.keys(body).length ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
          const data = await res.json();
          if (data.requiresPassword) {
            setRequiresPassword(true);
          } else {
            throw new Error(data.error || 'Presentation not found');
          }
          return;
        }

        const data = await res.json();
        setPresentation(data.presentation);

        const content = data.revision?.content as { slides?: SlideData[] };
        if (content?.slides) {
          setSlides(content.slides);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, password]);

  // Detect color scheme
  useEffect(() => {
    const root = document.documentElement;
    const theme = root.getAttribute('data-theme');
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(theme === 'dark' || (theme === 'auto' && mq.matches));
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < slides.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    }
  }, [currentIndex, slides.length]);

  const handleSubmitPassword = async () => {
    // Will re-trigger the effect by changing password state
  };

  if (requiresPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center">
            <div className="mb-4 text-4xl">🔒</div>
            <h2 className={`mb-2 text-lg font-bold ${darkMode ? 'text-stone-50' : 'text-stone-900'}`}>
              Password Required
            </h2>
            <p className={`mb-4 text-sm ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              This presentation is password-protected.
            </p>
            <input
              type="password"
              autoFocus
              className="demo-input mb-3"
              placeholder="Enter password"
              onKeyDown={(e) => e.key === 'Enter' && window.location.reload()}
            />
            <button
              onClick={() => window.location.reload()}
              className="demo-button w-full"
            >
              Unlock
            </button>
            <p className="mt-3 text-xs text-red-500" id="password-error"></p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[var(--lagoon)] border-t-transparent" />
          <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            Loading presentation...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="rounded-2xl border border-red-300 bg-[rgba(196,71,71,0.1)] p-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  function renderSlide() {
    if (!currentSlide) return <p className="px-6 py-10 text-center text-[var(--sea-ink-soft)]">No slides available.</p>;

    const data = currentSlide.data as Record<string, unknown>;

    switch (currentSlide.type) {
      case 'title':
        return (
          <SlideTitle
            title={data.title as string}
            subtitle={data.subtitle as string}
            author={data.author as string}
            darkMode={darkMode}
          />
        );
      case 'problem':
        return (
          <SlideProblem
            headline={data.headline as string}
            body={data.body as string}
            darkMode={darkMode}
          />
        );
      case 'solution':
        return (
          <SlideSolution
            headline={data.headline as string}
            body={data.body as string}
            darkMode={darkMode}
          />
        );
      case 'evidence':
        return (
          <SlideEvidence
            headline={data.headline as string}
            items={(data.items as Array<{ text: string; rank: 'top' | 'mid' | 'bot' }>) || []}
            darkMode={darkMode}
          />
        );
      case 'comparison':
        return (
          <SlideComparison
            headline={data.headline as string}
            rows={(data.rows as Array<{ columns: Record<string, string> }>) || []}
            darkMode={darkMode}
          />
        );
      case 'next_steps':
        return (
          <SlideNextSteps
            headline={data.headline as string}
            body={data.body as string}
            darkMode={darkMode}
          />
        );
      case 'conclusion':
        return (
          <SlideConclusion
            headline={data.headline as string}
            cta_text={data.cta_text as string}
            body={data.body as string}
            darkMode={darkMode}
          />
        );
      default:
        return <p className="px-6 py-10 text-center text-[var(--sea-ink-soft)]">Unknown slide type.</p>;
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className={`flex items-center justify-between px-4 py-2 text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
        <span>Sliding</span>
        {presentation?.confidential && (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
            Confidential
          </span>
        )}
      </header>

      {/* Slide content */}
      <main className="flex-1">{renderSlide()}</main>

      {/* Footer: slide counter + dots */}
      <footer className="flex items-center justify-between px-4 py-3">
        <span className={`text-xs ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
          {currentIndex + 1} / {slides.length}
        </span>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex
                  ? 'w-4 bg-[#16CBCB]'
                  : 'w-1.5 bg-[var(--line)]'
              }`}
            />
          ))}
        </div>
      </footer>
    </div>
  );
}
