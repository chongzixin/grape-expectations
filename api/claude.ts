import { handleClaudeRequest } from '../server/claudeProxy.js';

/**
 * Vercel Function: POST /api/claude
 *
 * Same contract as the Netlify function at /.netlify/functions/claude.
 * vercel.json rewrites that legacy path here, and sets maxDuration.
 *
 * Env: ANTHROPIC_API_KEY
 *
 * Label scans POST a base64 JPEG (client compresses to 2400px, quality 0.85).
 * Vercel rejects request bodies over 4.5 MB before this function runs.
 */
export const maxDuration = 120;

async function dispatch(request: Request): Promise<Response> {
  return handleClaudeRequest(request);
}

export async function GET(request: Request): Promise<Response> {
  return dispatch(request);
}

export async function POST(request: Request): Promise<Response> {
  return dispatch(request);
}

export async function PUT(request: Request): Promise<Response> {
  return dispatch(request);
}

export async function PATCH(request: Request): Promise<Response> {
  return dispatch(request);
}

export async function DELETE(request: Request): Promise<Response> {
  return dispatch(request);
}

export async function OPTIONS(request: Request): Promise<Response> {
  return dispatch(request);
}
