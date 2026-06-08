import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Sliding</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Engineer research to executive presentations.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Self-hosted. Shareable links. AI-generated. Engineers prepare research,
          AI generates structured slides, executives view via phone.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/auth/sign-in"
            className="rounded-full bg-[var(--lagoon)] px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[var(--lagoon-deep)]"
          >
            Get Started
          </a>
          <a
            href="/app"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)]"
          >
            Engineering Dashboard
          </a>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Self-Hosted', 'Run on your own infrastructure. Full data ownership.'],
          ['AI-Generated', 'Engineers write research. AI generates polished slides.'],
          ['Shareable Links', 'Unique UUID tokens. Optional passwords. Revocable.'],
          ['Mobile-First', 'Designed for 375px phones. Executives view on the go.'],
        ].map(([title, desc]) => (
          <article
            key={title}
            className="island-shell feature-card rise-in rounded-2xl p-5"
          >
            <h2 className="mb-2 text-base font-semibold text-[var(--sea-ink)]">
              {title}
            </h2>
            <p className="m-0 text-sm text-[var(--sea-ink-soft)]">{desc}</p>
          </article>
        ))}
      </section>

      <section className="island-shell mt-8 rounded-2xl p-6">
        <p className="island-kicker mb-2">How It Works</p>
        <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
          <li>Engineers prepare research (markdown, files).</li>
          <li>AI generates structured, typed slides (7 types).</li>
          <li>Presentations get unique shareable links.</li>
          <li>Executives view via phone — no app needed.</li>
          <li>Links are password-protected and revocable.</li>
        </ul>
      </section>
    </main>
  )
}
