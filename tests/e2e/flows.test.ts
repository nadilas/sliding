import { describe, it, expect, beforeEach } from 'vitest';
import { createTestClient, type TestContext } from '../setup';

describe('Sliding MVP E2E Tests', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestClient();
    await ctx.seedDatabase();
  });

  // Flow 1: Create presentation
  it('creates a presentation and returns share token', async () => {
    const user = await ctx.createUser();
    const response = await ctx.api.createPresentation(user.token, {
      title: 'Q4 Infrastructure Review',
      source_markdown: '# Q4 Review\n\n## Problem\nLegacy systems...\n\n## Solution\nCloud migration...',
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.presentation).toHaveProperty('share_token');
    expect(data.presentation.share_token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(data.revision).toHaveProperty('status');
  });

  // Flow 2: Edit presentation (regenerate)
  it('regenerates a presentation with feedback', async () => {
    const user = await ctx.createUser();
    const pres = await ctx.api.createPresentation(user.token, {
      title: 'Test',
      source_markdown: '# Test',
    });

    const regenResponse = await ctx.api.regeneratePresentation(
      user.token,
      pres.presentation.id,
      { source_markdown: '# Updated content' },
    );

    expect(regenResponse.ok).toBe(true);
    const data = await regenResponse.json();
    expect(data.status).toBe('generating');
    expect(data).toHaveProperty('revisionId');
  });

  // Flow 3: Share presentation (generate shareable link)
  it('generates a shareable link', async () => {
    const user = await ctx.createUser();
    const pres = await ctx.api.createPresentation(user.token, {
      title: 'Shared',
      source_markdown: '# Shared',
    });

    // Link format: /p/{share_token}
    expect(pres.presentation.share_token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

    const sharedResponse = await ctx.api.getSharedPresentation(pres.presentation.share_token);
    expect(sharedResponse.ok).toBe(true);
  });

  // Flow 4: View presentation (executive view)
  it('renders a presentation with slides', async () => {
    const user = await ctx.createUser();
    const pres = await ctx.api.createPresentation(user.token, {
      title: 'View Test',
      source_markdown: '# View Test\n\n## Problem\nTest problem.\n\n## Solution\nTest solution.',
    });

    const response = await ctx.api.getSharedPresentation(pres.presentation.share_token);
    const data = await response.json();

    expect(data.revision).toHaveProperty('content');
    const content = data.revision.content;
    expect(content).toHaveProperty('slides');
    expect(Array.isArray(content.slides)).toBe(true);
    expect(content.slides.length).toBeGreaterThan(0);
  });

  // Flow 5: Password-protected view
  it('requires password for protected presentations', async () => {
    const user = await ctx.createUser();
    const pres = await ctx.api.createPresentation(user.token, {
      title: 'Protected',
      source_markdown: '# Protected',
      password: 'secret123',
    });

    // Without password
    const noPasswordResponse = await ctx.api.getSharedPresentation(pres.presentation.share_token);
    const noPasswordData = await noPasswordResponse.json();
    expect(noPasswordData).toHaveProperty('requiresPassword');
    expect(noPasswordData.requiresPassword).toBe(true);

    // With correct password
    const correctPasswordResponse = await ctx.api.getSharedPresentation(
      pres.presentation.share_token,
      { password: 'secret123' },
    );
    expect(correctPasswordResponse.ok).toBe(true);

    // With wrong password
    const wrongPasswordResponse = await ctx.api.getSharedPresentation(
      pres.presentation.share_token,
      { password: 'wrongpassword' },
    );
    expect(wrongPasswordResponse.status).toBe(403);
  });

  // Flow 6: Revoke access
  it('revokes a presentation link', async () => {
    const user = await ctx.createUser();
    const pres = await ctx.api.createPresentation(user.token, {
      title: 'Revoked',
      source_markdown: '# Revoked',
      password: 'revokepass',
    });

    // Revoke with authenticated user
    const revokeResponse = await ctx.api.revokePresentation(
      user.token,
      pres.presentation.id,
    );
    expect(revokeResponse.ok).toBe(true);

    // After revocation, the presentation should not be accessible
    const afterRevokeResponse = await ctx.api.getSharedPresentation(pres.presentation.share_token);
    // Should return 404 or similar
    expect(afterRevokeResponse.status).not.toBe(200);
  });
});
