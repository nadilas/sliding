import type { AIAgent, SlideContent } from './types.ts';
import { chunkMarkdown } from './knowledge.ts';

const SLIDE_SYSTEM_PROMPT = `You are a presentation designer for "Sliding", a self-hosted executive presentation tool. You transform engineer research (markdown, technical docs) into concise executive presentations.

Rules:
- Generate exactly 5-9 slides
- Use these slide types: title, problem, solution, evidence, comparison, next_steps, conclusion
- Each slide must have a clear headline and concise body text
- Evidence slides use ranked bullet points (top/mid/bot)
- Comparison slides show structured data tables
- Keep executive audience in mind: brief, clear, actionable
- No marketing fluff, no more than 3 bullet points per slide
- Total slides should be 7 for a standard pitch`;

interface ClaudeResponse {
  content?: Array<{ type: string; text?: string }>;
}

export function createClaudeAgent(): AIAgent {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      generate: () => Promise.reject(new Error('ANTHROPIC_API_KEY not configured')),
    };
  }

  return {
    generate: async (sourceMarkdown: string, sourceFiles?: string[]) => {
      const chunks = chunkMarkdown(sourceMarkdown);
      const context = chunks.map((c) => c.content).join('\n\n---\n\n');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: SLIDE_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Generate an executive presentation from this research:\n\n${context}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error ${response.status}: ${errorText}`);
      }

      const data: ClaudeResponse = await response.json();
      const contentBlock = data?.content?.[0];

      if (!contentBlock?.text) {
        throw new Error('Invalid response from Claude');
      }

      return JSON.parse(contentBlock.text) as SlideContent;
    },
  };
}
