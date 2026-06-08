import { RANK_COLORS } from '../../lib/types/index.ts';

// Slide 1: Title (Cover)
export function SlideTitle({
  title,
  subtitle,
  author,
  darkMode,
}: {
  title: string;
  subtitle: string;
  author: string;
  darkMode?: boolean;
}) {
  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] items-center justify-center px-6 py-10">
      <div className="text-center">
        <h1
          className={`mb-4 text-3xl font-bold leading-tight ${darkMode ? 'text-stone-50' : 'text-stone-900'}`}
          style={{ fontFamily: 'Fraunces, Georgia, serif' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className={`mb-6 text-base leading-relaxed ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
            {subtitle}
          </p>
        )}
        {author && (
          <p className={`text-sm ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
            {author}
          </p>
        )}
      </div>
    </div>
  );
}

// Slide 2: Problem
export function SlideProblem({
  headline,
  body,
  darkMode,
}: {
  headline: string;
  body: string;
  darkMode?: boolean;
}) {
  return (
    <div className="px-6 py-10">
      <h2
        className={`mb-4 text-xl font-bold ${darkMode ? 'text-stone-50' : 'text-stone-900'}`}
      >
        {headline}
      </h2>
      <div
        className={`text-base leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}
      >
        {body}
      </div>
    </div>
  );
}

// Slide 3: Solution
export function SlideSolution({
  headline,
  body,
  darkMode,
}: {
  headline: string;
  body: string;
  darkMode?: boolean;
}) {
  return (
    <div className="px-6 py-10">
      <h2
        className={`mb-4 text-xl font-bold ${darkMode ? 'text-stone-50' : 'text-stone-900'}`}
      >
        {headline}
      </h2>
      <div
        className={`text-base leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}
      >
        {body}
      </div>
    </div>
  );
}

// Slide 4: Evidence (ranked bullets)
export function SlideEvidence({
  headline,
  items,
  darkMode,
}: {
  headline: string;
  items: Array<{ text: string; rank: 'top' | 'mid' | 'bot' }>;
  darkMode?: boolean;
}) {
  return (
    <div className="px-6 py-10">
      <h2
        className={`mb-4 text-xl font-bold ${darkMode ? 'text-stone-50' : 'text-stone-900'}`}
      >
        {headline}
      </h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            {/* Rank indicator */}
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: RANK_COLORS[item.rank] }}
            />
            <span
              className={`text-base leading-relaxed ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className={`mt-6 flex gap-4 text-xs ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
        <span style={{ color: RANK_COLORS.top }} className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RANK_COLORS.top }} />
          Strong
        </span>
        <span style={{ color: RANK_COLORS.mid }} className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RANK_COLORS.mid }} />
          Moderate
        </span>
        <span style={{ color: RANK_COLORS.bot }} className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RANK_COLORS.bot }} />
          Supporting
        </span>
      </div>
    </div>
  );
}

// Slide 5: Comparison (table)
export function SlideComparison({
  headline,
  rows,
  darkMode,
}: {
  headline: string;
  rows: Array<{ columns: Record<string, string> }>;
  darkMode?: boolean;
}) {
  const headers = Object.keys(rows[0]?.columns || {});

  return (
    <div className="overflow-x-auto px-4 py-8">
      <h2
        className={`mb-3 px-2 text-lg font-bold ${darkMode ? 'text-stone-50' : 'text-stone-900'}`}
      >
        {headline}
      </h2>
      <table className="w-full text-left text-sm">
        <thead>
          <tr
            className={`border-b ${darkMode ? 'border-stone-700' : 'border-stone-200'}`}
          >
            {headers.map((h) => (
              <th
                key={h}
                className={`px-2 py-2 font-semibold ${darkMode ? 'text-stone-200' : 'text-stone-700'}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b ${darkMode ? 'border-stone-800' : 'border-stone-100'}`}
            >
              {headers.map((h) => (
                <td
                  key={h}
                  className={`px-2 py-2 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}
                >
                  {row.columns[h]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Slide 6: Next Steps
export function SlideNextSteps({
  headline,
  body,
  darkMode,
}: {
  headline: string;
  body: string;
  darkMode?: boolean;
}) {
  return (
    <div className="px-6 py-10">
      <h2
        className={`mb-4 text-xl font-bold ${darkMode ? 'text-stone-50' : 'text-stone-900'}`}
      >
        {headline}
      </h2>
      <div
        className={`text-base leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}
      >
        {body}
      </div>
    </div>
  );
}

// Slide 7: Conclusion (CTA)
export function SlideConclusion({
  headline,
  cta_text,
  body,
  darkMode,
}: {
  headline: string;
  cta_text: string;
  body: string;
  darkMode?: boolean;
}) {
  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-6 py-10 text-center">
      <h2
        className={`mb-4 text-xl font-bold ${darkMode ? 'text-stone-50' : 'text-stone-900'}`}
      >
        {headline}
      </h2>
      {body && (
        <p
          className={`mb-6 text-base leading-relaxed ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}
        >
          {body}
        </p>
      )}
      <button
        className="rounded-full bg-[#16CBCB] px-6 py-3 text-sm font-semibold text-white"
        style={{ boxShadow: '0 4px 14px rgba(22, 203, 203, 0.3)' }}
      >
        {cta_text}
      </button>
    </div>
  );
}
