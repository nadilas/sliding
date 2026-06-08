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

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export function createOpenAIAgent(): AIAgent {
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      generate: () => Promise.reject(new Error('OPENAI_API_KEY not configured')),
    };
  }

  return {
    generate: async (sourceMarkdown: string, sourceFiles?: string[]) => {
      const chunks = chunkMarkdown(sourceMarkdown);
      const context = chunks.map((c) => c.content).join('\n\n---\n\n');

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SLIDE_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Generate an executive presentation from this research:\n\n${context}`,
            },
          ],
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
      }

      const data: OpenAIResponse = await response.json();
      const choice = data?.choices?.[0]?.message?.content;

      if (!choice) {
        throw new Error('Invalid response from OpenAI');
      }

      return JSON.parse(choice) as SlideContent;
    },
  };
}
