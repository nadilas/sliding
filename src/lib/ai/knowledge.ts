import type { ChunkResult } from './types.ts';

export function chunkMarkdown(markdown: string, chunkSize: number = 2000): ChunkResult[] {
  const chunks: ChunkResult[] = [];

  // Split by top-level headings
  const sections = markdown.split(/^#{1,2}\s+/m).filter(Boolean);

  let currentChunk = '';

  for (const section of sections) {
    const fullSection = `#${section}`;

    if (currentChunk.length + fullSection.length > chunkSize && currentChunk) {
      chunks.push({ content: currentChunk.trim() });
      currentChunk = fullSection;
    } else {
      currentChunk += '\n' + fullSection;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({ content: currentChunk.trim() });
  }

  return chunks.length > 0 ? chunks : [{ content: markdown.trim() }];
}

export async function createEmbedding(text: string): Promise<number[]> {
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error ${response.status}`);
  }

  const data = await response.json();
  return data?.data?.[0]?.embedding;
}

export async function chunkAndEmbed(
  markdown: string,
  sourceFile?: string,
): Promise<Array<{ content: string; embedding: number[]; source?: string }>> {
  const chunks = chunkMarkdown(markdown);
  const results = [];

  for (const chunk of chunks) {
    try {
      const embedding = await createEmbedding(chunk.content);
      results.push({
        content: chunk.content,
        embedding,
        source: chunk.source || sourceFile,
      });
    } catch {
      // Skip chunks that fail to embed
    }
  }

  return results;
}
