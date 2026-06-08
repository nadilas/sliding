// Slide types for the MVP
export const SLIDE_TYPES = [
  'title',
  'problem',
  'solution',
  'evidence',
  'comparison',
  'next_steps',
  'conclusion',
] as const;

export type SlideType = (typeof SLIDE_TYPES)[number];

// Rank indicators for evidence slides
export const RANK_COLORS = {
  top: '#C7423A',
  mid: '#D89A3A',
  bot: '#5BA66B',
  na: '#C7C2B6',
} as const;

export type RankColor = (typeof RANK_COLORS)[keyof typeof RANK_COLORS];

export const RANKS = ['top', 'mid', 'bot', 'na'] as const;
export type Rank = (typeof RANKS)[number];

// Design tokens (derived from existing deck)
export const DESIGN = {
  fonts: {
    heading: '"Inter", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  colors: {
    stone: {
      50: '#fafaf9',
      100: '#f5f5f4',
      200: '#e7e5e4',
      300: '#d6d3d1',
      400: '#a8a29e',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c',
      800: '#292524',
      900: '#1c1917',
    },
    teal: '#16CBCB',
    tealDeep: '#0E9C9C',
  } as const,
} as const;

// Database types
export interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

export interface SlideTemplate {
  id: string;
  slide_type: SlideType;
  layout: string;
  fields: Record<string, { type: string; label: string }>[];
  preview_html: string | null;
  created_at: string;
}

export interface Presentation {
  id: number;
  tenant_id: string;
  title: string;
  description: string;
  source_markdown: string | null;
  source_files: string[];
  share_token: string;
  share_token_hash: string | null;
  password_salt: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  confidential: boolean;
  view_count: number;
  latest_revision_id: number | null;
}

export interface PresentationRevision {
  id: number;
  presentation_id: number;
  sequence: number;
  content: PresentationContent;
  status: 'generating' | 'completed' | 'failed';
  ai_provider: string;
  error_message: string | null;
  created_at: string;
}

export interface KnowledgeChunk {
  id: number;
  tenant_id: string;
  source_file: string | null;
  chunk_index: number;
  content: string;
  embedding: number[] | null;
  created_at: string;
}

// Presentation content model (JSONB)
export interface SlideData {
  slide_index: number;
  type: SlideType;
  layout: string;
  data: Record<string, unknown>;
}

export interface PresentationMetadata {
  created_by_email: string;
  generated_at: string;
  source_count: number;
  has_embeddings: boolean;
}

export interface PresentationContent {
  slides: SlideData[];
  metadata: PresentationMetadata;
}

// API types
export interface CreatePresentationRequest {
  title: string;
  description?: string;
  source_markdown: string;
  source_files?: string[];
  confidential?: boolean;
  password?: string;
}

export interface CreatePresentationResponse {
  presentation: Pick<Presentation, 'id' | 'title' | 'share_token' | 'created_at'>;
  revision: { id: number; status: string };
}

export interface GetPresentationResponse {
  presentation: Presentation;
  revision: PresentationRevision;
}

export interface GetSharedPresentationResponse {
  presentation: Pick<Presentation, 'id' | 'title' | 'description' | 'share_token' | 'published_at' | 'confidential'>;
  revision: Pick<PresentationRevision, 'content'>;
}

export interface RevokePresentationRequest {
  password: string;
}

export interface SearchKnowledgeRequest {
  query: string;
  matchCount?: number;
}

export interface SearchKnowledgeResponse {
  chunks: Pick<KnowledgeChunk, 'source_file' | 'content' | 'similarity'>[];
}

// Auth types
export interface Session {
  user: Pick<User, 'id' | 'tenant_id' | 'email' | 'name' | 'role'>;
  token: string;
}

// Slide component props
export interface SlideTitleProps {
  title: string;
  subtitle: string;
  author: string;
  darkMode?: boolean;
}

export interface SlideProblemProps {
  headline: string;
  body: string;
  darkMode?: boolean;
}

export interface SlideSolutionProps {
  headline: string;
  body: string;
  darkMode?: boolean;
}

export interface SlideEvidenceProps {
  headline: string;
  items: { text: string; rank: Rank }[];
  darkMode?: boolean;
}

export interface SlideComparisonProps {
  headline: string;
  rows: { columns: Record<string, string> }[];
  darkMode?: boolean;
}

export interface SlideNextStepsProps {
  headline: string;
  body: string;
  darkMode?: boolean;
}

export interface SlideConclusionProps {
  headline: string;
  cta_text: string;
  body: string;
  darkMode?: boolean;
}

export type SlideProps =
  | SlideTitleProps
  | SlideProblemProps
  | SlideSolutionProps
  | SlideEvidenceProps
  | SlideComparisonProps
  | SlideNextStepsProps
  | SlideConclusionProps;
