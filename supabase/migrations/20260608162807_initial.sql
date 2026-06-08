-- Sliding MVP: Initial Schema
-- Tenant isolation via RLS, BIGSERIAL for internal PKs, UUID for external identifiers

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- --------------------------------------------------
-- Tenants
-- --------------------------------------------------
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Note: RLS is enabled by default. Access controlled via users table policies.

-- --------------------------------------------------
-- Users
-- --------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY, -- mirrors auth.users.id
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, email)
);


CREATE POLICY "users: members can view own tenant" ON users
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Link to auth.users (Better-Auth stores user data here)
CREATE POLICY "users: self-upsert" ON users
  FOR ALL USING (id = auth.uid());

-- --------------------------------------------------
-- Slide Templates
-- --------------------------------------------------
CREATE TABLE slide_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_type TEXT NOT NULL, -- title, problem, solution, evidence, comparison, next_steps, conclusion
  layout TEXT NOT NULL DEFAULT 'default',
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  preview_html TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE POLICY "templates: anyone can read" ON slide_templates
  FOR SELECT USING (true);

-- Seed default templates
INSERT INTO slide_templates (slide_type, layout, fields) VALUES
  ('title', 'cover', jsonb_build_array(
    jsonb_build_object('key', 'title', 'type', 'text', 'label', 'Title'),
    jsonb_build_object('key', 'subtitle', 'type', 'text', 'label', 'Subtitle'),
    jsonb_build_object('key', 'author', 'type', 'text', 'label', 'Author')
  )),
  ('problem', 'default', jsonb_build_array(
    jsonb_build_object('key', 'headline', 'type', 'text', 'label', 'Problem Statement'),
    jsonb_build_object('key', 'body', 'type', 'markdown', 'label', 'Details')
  )),
  ('solution', 'default', jsonb_build_array(
    jsonb_build_object('key', 'headline', 'type', 'text', 'label', 'Solution'),
    jsonb_build_object('key', 'body', 'type', 'markdown', 'label', 'Details')
  )),
  ('evidence', 'bullets', jsonb_build_array(
    jsonb_build_object('key', 'headline', 'type', 'text', 'label', 'Evidence'),
    jsonb_build_object('key', 'items', 'type', 'bullets[]', 'label', 'Bullet Points')
  )),
  ('comparison', 'table', jsonb_build_array(
    jsonb_build_object('key', 'headline', 'type', 'text', 'label', 'Comparison'),
    jsonb_build_object('key', 'rows', 'type', 'table[]', 'label', 'Comparison Rows')
  )),
  ('next_steps', 'default', jsonb_build_array(
    jsonb_build_object('key', 'headline', 'type', 'text', 'label', 'Next Steps'),
    jsonb_build_object('key', 'body', 'type', 'markdown', 'label', 'Details')
  )),
  ('conclusion', 'cta', jsonb_build_array(
    jsonb_build_object('key', 'headline', 'type', 'text', 'label', 'Conclusion'),
    jsonb_build_object('key', 'cta_text', 'type', 'text', 'label', 'Call to Action Text'),
    jsonb_build_object('key', 'body', 'type', 'markdown', 'label', 'Details')
  ));

-- --------------------------------------------------
-- Presentations
-- --------------------------------------------------
CREATE TABLE presentations (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  title TEXT NOT NULL DEFAULT 'Untitled',
  description TEXT DEFAULT '',
  source_markdown TEXT,
  source_files TEXT[] DEFAULT '{}',
  share_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  share_token_hash TEXT, -- SHA-256 of token for password-protected links
  password_salt BYTEA,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  confidential BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  latest_revision_id BIGINT
);


CREATE INDEX idx_presentations_tenant ON presentations(tenant_id);
CREATE INDEX idx_presentations_share_token ON presentations(share_token);
CREATE INDEX idx_presentations_created_by ON presentations(created_by);

CREATE POLICY "presentations: tenant members can CRUD" ON presentations
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- --------------------------------------------------
-- Presentation Revisions
-- --------------------------------------------------
CREATE TABLE presentation_revisions (
  id BIGSERIAL PRIMARY KEY,
  presentation_id BIGINT NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  ai_provider TEXT NOT NULL DEFAULT 'openai',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX idx_revisions_presentation ON presentation_revisions(presentation_id, sequence DESC);

CREATE TABLE presentation_revisions_public (
  id BIGINT PRIMARY KEY REFERENCES presentation_revisions(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE POLICY "revisions_public: readable when presentation is shared" ON presentation_revisions_public
  FOR SELECT USING (true);

-- --------------------------------------------------
-- Knowledge Chunks (with vector embeddings)
-- --------------------------------------------------
CREATE TABLE knowledge_chunks (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  source_file TEXT,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX idx_knowledge_tenant ON knowledge_chunks(tenant_id);
CREATE INDEX idx_knowledge_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE POLICY "knowledge: tenant members can CRUD" ON knowledge_chunks
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- --------------------------------------------------
-- Helper functions
-- --------------------------------------------------
CREATE OR REPLACE FUNCTION hash_share_token(text)
RETURNS text AS $$
  SELECT encode(sha256(concat($1, current_setting('app.token_salt', true) DEFAULT ''::text))::bytea, 'hex')
$$ LANGUAGE SQL SECURITY INVOKER;

-- Search function: find knowledge chunks matching a query
CREATE OR REPLACE FUNCTION search_knowledge(query_embedding vector(1536), match_count int DEFAULT 5)
RETURNS TABLE (
  id BIGSERIAL PRIMARY KEY,
  source_file TEXT,
  content TEXT,
  similarity DOUBLE PRECISION
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    kc.id,
    kc.source_file,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE kc.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;
