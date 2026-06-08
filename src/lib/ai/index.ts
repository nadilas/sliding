import { createOpenAIAgent } from './openai.ts';
import { createClaudeAgent } from './claude.ts';
import type { AIAgent, SlideContent } from './types.ts';

export interface AIOptions {
  primaryProvider?: 'openai' | 'claude';
  fallbackProvider?: 'openai' | 'claude';
  maxRetries?: number;
}

export function createAI(options: AIOptions = {}) {
  const {
    primaryProvider = 'openai',
    fallbackProvider = 'claude',
    maxRetries = 2,
  } = options;

  const primary = primaryProvider === 'openai' ? createOpenAIAgent() : createClaudeAgent();
  const fallback = fallbackProvider === 'openai' ? createOpenAIAgent() : createClaudeAgent();

  return {
    generateSlides: async (
      sourceMarkdown: string,
      sourceFiles?: string[],
    ): Promise<SlideContent> => {
      let lastError: Error | null = null;

      // Try primary provider
      try {
        return await primary.generate(sourceMarkdown, sourceFiles);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }

      // Try fallback provider
      try {
        return await fallback.generate(sourceMarkdown, sourceFiles);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }

      throw lastError ?? new Error('Both AI providers failed');
    },
  };
}

export function createAIAgent(provider: 'openai' | 'claude'): AIAgent {
  return provider === 'openai' ? createOpenAIAgent() : createClaudeAgent();
}
