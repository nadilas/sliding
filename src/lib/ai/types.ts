import type { PresentationContent, SlideType } from '../types/index.ts';

export interface AIAgent {
  generate(
    sourceMarkdown: string,
    sourceFiles?: string[],
  ): Promise<SlideContent>;
}

export interface SlideData {
  slide_index: number;
  type: SlideType;
  layout: string;
  data: Record<string, unknown>;
}

export interface SlideContent {
  slides: SlideData[];
  metadata: {
    created_by_email: string;
    generated_at: string;
    source_count: number;
    has_embeddings: boolean;
  };
}

export interface ChunkResult {
  content: string;
  file?: string;
}
