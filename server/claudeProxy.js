import Anthropic from '@anthropic-ai/sdk';

/**
 * Shared Claude proxy used by the Vercel function (`api/claude.ts`) and the
 * Netlify function (`netlify/functions/claude.js`).
 *
 * Request body (POST JSON), same shape the frontend sends:
 *   { messages, system, maxTokens, imageData }
 * imageData, when present, is `{ data, mimeType }` — a base64 JPEG plus its
 * media type. It replaces the message list with one user turn that contains
 * the image and the text of the last incoming message.
 *
 * Env: ANTHROPIC_API_KEY
 */

/**
 * @typedef {Object} ClaudeProxyResult
 * @property {number} statusCode
 * @property {string} body
 * @property {string} contentType
 */

/**
 * @typedef {Object} ClaudeProxyInput
 * @property {string} method
 * @property {string | null} rawBody
 * @property {string | undefined} apiKey
 * @property {(params: {
 *   model: string,
 *   max_tokens: number,
 *   system: string,
 *   messages: unknown,
 * }) => Promise<{ content?: { text?: string | null }[] }>} [createMessage]
 */

/**
 * @param {ClaudeProxyInput} input
 * @returns {Promise<ClaudeProxyResult>}
 */
export async function handleClaudeEvent({ method, rawBody, apiKey, createMessage }) {
  if (method !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
      contentType: 'text/plain; charset=utf-8',
    };
  }

  try {
    // JSON.parse(null) yields null (same as a missing Netlify event.body).
    // Destructuring that throws and is returned as a 500 below.
    const { messages, system, maxTokens, imageData } = JSON.parse(
      /** @type {string} */ (rawBody),
    );

    let msgs = messages;
    if (imageData) {
      msgs = [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageData.mimeType,
              data: imageData.data,
            },
          },
          { type: 'text', text: messages[messages.length - 1]?.content || '' },
        ],
      }];
    }

    const params = {
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens || 1800,
      system: system || '',
      messages: msgs,
    };

    const response = /** @type {{ content?: { text?: string | null }[] }} */ (
      createMessage
        ? await createMessage(params)
        : await new Anthropic({ apiKey }).messages.create(
            /** @type {any} */ (params),
          )
    );

    const content = response.content?.map(c => c.text || '').join('') || '';

    return {
      statusCode: 200,
      body: JSON.stringify({ content }),
      contentType: 'application/json; charset=utf-8',
    };
  } catch (error) {
    // Preserve the original handler: read `.message` off whatever was thrown.
    // Log the message only — the SDK error object can carry request headers.
    const message = /** @type {{ message?: string }} */ (error).message;
    console.error('claude proxy error:', message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: message }),
      contentType: 'application/json; charset=utf-8',
    };
  }
}

/**
 * Web Request adapter used by the Vercel function. An empty POST body is
 * treated as null so it follows the same path as a missing Netlify body.
 *
 * @param {Request} request
 * @param {{ apiKey?: string, createMessage?: ClaudeProxyInput['createMessage'] }} [options]
 * @returns {Promise<Response>}
 */
export async function handleClaudeRequest(request, options = {}) {
  let rawBody = null;
  if (request.method === 'POST') {
    const text = await request.text();
    rawBody = text.length ? text : null;
  }

  const result = await handleClaudeEvent({
    method: request.method,
    rawBody,
    apiKey: options.apiKey ?? process.env.ANTHROPIC_API_KEY,
    createMessage: options.createMessage,
  });

  return new Response(result.body, {
    status: result.statusCode,
    headers: { 'Content-Type': result.contentType },
  });
}
