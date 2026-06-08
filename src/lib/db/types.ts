export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Vector = number[] | { dimensions: number; values: number[] };

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Updates: { id?: string; name?: string };
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          role: 'admin' | 'member';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          email: string;
          name?: string;
          avatar_url?: string | null;
          role?: 'admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
        Updates: {
          tenant_id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          role?: 'admin' | 'member';
          updated_at?: string;
        };
      };
      slide_templates: {
        Row: {
          id: string;
          slide_type: string;
          layout: string;
          fields: Json;
          preview_html: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slide_type: string;
          layout?: string;
          fields?: Json;
          preview_html?: string | null;
          created_at?: string;
        };
        Updates: {
          slide_type?: string;
          layout?: string;
          fields?: Json;
          preview_html?: string | null;
        };
      };
      presentations: {
        Row: {
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
        };
        Insert: {
          id?: number;
          tenant_id: string;
          title?: string;
          description?: string;
          source_markdown: string;
          source_files?: string[];
          share_token?: string;
          share_token_hash?: string | null;
          password_salt?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          confidential?: boolean;
          view_count?: number;
          latest_revision_id?: number | null;
        };
        Updates: {
          title?: string;
          description?: string;
          source_markdown?: string;
          source_files?: string[];
          share_token_hash?: string | null;
          password_salt?: string | null;
          published_at?: string | null;
          confidential?: boolean;
          view_count?: number;
          latest_revision_id?: number | null;
          updated_at?: string;
        };
      };
      presentation_revisions: {
        Row: {
          id: number;
          presentation_id: number;
          sequence: number;
          content: Json;
          status: 'generating' | 'completed' | 'failed';
          ai_provider: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          presentation_id: number;
          sequence?: number;
          content: Json;
          status?: 'generating' | 'completed' | 'failed';
          ai_provider?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Updates: {
          content?: Json;
          status?: 'generating' | 'completed' | 'failed';
          ai_provider?: string;
          error_message?: string | null;
        };
      };
      knowledge_chunks: {
        Row: {
          id: number;
          tenant_id: string;
          source_file: string | null;
          chunk_index: number;
          content: string;
          embedding: Vector | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          tenant_id: string;
          source_file?: string | null;
          chunk_index?: number;
          content: string;
          embedding?: Vector | null;
          created_at?: string;
        };
        Updates: {
          tenant_id?: string;
          source_file?: string | null;
          chunk_index?: number;
          content?: string;
          embedding?: Vector | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_knowledge: {
        Args: { query_embedding: Vector; match_count?: number };
        Returns: {
          id: number;
          source_file: string | null;
          content: string;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}

export type Tables = Database['public']['Tables'];
export type TablesINSERT = {
  [K in keyof Tables]: Tables[K]['Insert'];
};
export type Updatable = {
  [K in keyof Tables]: Tables[K]['Updates'];
};
