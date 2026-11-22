import { handleClaudeEvent } from '../../server/claudeProxy.js';

/**
 * Netlify adapter. Behaviour lives in server/claudeProxy.js so this stays
 * aligned with api/claude.ts. Env: ANTHROPIC_API_KEY.
 *
 * @param {{ httpMethod: string, body: string | null }} event
 */
export async function handler(event) {
  const result = await handleClaudeEvent({
    method: event.httpMethod,
    rawBody: event.body,
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  return {
    statusCode: result.statusCode,
    headers: { 'Content-Type': result.contentType },
    body: result.body,
  };
};
