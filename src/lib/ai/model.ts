import type { AIAgent, SlideContent } from './types.ts';

const MODEL_SYSTEM_PROMPT = `You transform engineer research into executive slide presentations.

Input: a markdown document with optional file attachments.
Output: a JSON "slides" array, each with type from: title, problem, solution, evidence, comparison, next_steps, conclusion.

Structure:
- Slide 1: title (cover) - title, subtitle, author
- Slide 2: problem - headline, body
- Slide 3: solution - headline, body
- Slide 4: evidence (ranked bullets) - headline, items [{text, rank}]
- Slide 5: comparison (table) - headline, rows [{columns}]
- Slide 6: next_steps - headline, body
- Slide 7: conclusion - headline, cta_text, body

Rules:
- Max 7 slides, 3 bullets per evidence slide
- Use rank: "top" for strongest, "bot" for weakest
- Comparison rows have 2-4 columns
- Body text max 3 sentences per slide
- No marketing fluff`;

interface ModelResponse {
  content?: Array<{ type: string; text?: string }>;
}

export function createAI(ai: { generateSlides: (md: string, files?: string[]) => Promise<SlideContent> }): {
  generate: (presentationId: number, sourceMarkdown: string, sourceFiles?: string[]) => Promise<SlideContent>;
} {
  return {
    generate: async (presentationId: number, sourceMarkdown: string, sourceFiles?: string[]) => {
      const content = await ai.generateSlides(sourceMarkdown, sourceFiles);

      // Ensure slides have correct slide_index
      const slidesWithIndex = content.slides.map((slide, i) => ({
        ...slide,
        slide_index: i,
      }));

      return {
        ...content,
        slides: slidesWithIndex,
        metadata: {
          ...content.metadata,
          generated_at: new Date().toISOString(),
        },
      };
    },
  };
}

// Standalone markdown-to-slides converter (used when AI is unavailable)
export function convertMarkdownToSlides(markdown: string): SlideContent {
  const lines = markdown.split('\n');

  // Extract title (first # heading)
  const titleMatch = lines.find((l) => l.startsWith('# '));
  const title = titleMatch ? titleMatch.replace('# ', '') : 'Untitled';

  // Extract subtitle (second # heading or first ## heading)
  const headings = lines.filter((l) => l.startsWith('#') && !l.startsWith('##'));
  const subtitle = headings[1]?.replace('# ', '') || '';

  const slides = [{
    slide_index: 0,
    type: 'title' as const,
    layout: 'cover',
    data: { title, subtitle, author: '' },
  }];

  // Extract body content for additional slides
  const bodyText = lines
    .filter((l) => !l.startsWith('#') && l.trim())
    .join('\n')
    .slice(0, 1000);

  slides.push({
    slide_index: 1,
    type: 'problem' as const,
    layout: 'default',
    data: { headline: 'Problem', body: bodyText.slice(0, 200) },
  });

  slides.push({
    slide_index: 2,
    type: 'solution' as const,
    layout: 'default',
    data: { headline: 'Solution', body: bodyText.slice(200, 400) },
  });

  slides.push({
    slide_index: 3,
    type: 'conclusion' as const,
    layout: 'cta',
    data: {
      headline: 'Conclusion',
      cta_text: 'Next Steps',
      body: bodyText.slice(400, 600),
    },
  });

  return { slides, metadata: { created_by_email: '', generated_at: new Date().toISOString(), source_count: 0, has_embeddings: false } };
}
