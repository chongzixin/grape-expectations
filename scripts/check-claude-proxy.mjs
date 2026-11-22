/**
 * Mocked request checks for the Claude proxy. Does not call Anthropic.
 * Run: npm run check:functions
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { handleClaudeEvent, handleClaudeRequest } from '../server/claudeProxy.js';

const require = createRequire(import.meta.url);
const { handler: netlifyHandler } = require('../netlify/functions/claude.js');
const AnthropicSdk = require('@anthropic-ai/sdk');

assert.equal(typeof AnthropicSdk, 'function', 'Anthropic SDK require() must be the client class');

console.error = () => {};

const silent = { createMessage: async () => ({ content: [{ text: 'ok' }] }) };

function mockCreate(capture) {
  return async (params) => {
    capture.params = params;
    return capture.response ?? { content: [{ text: 'hello' }] };
  };
}

async function expectJson(response, status, body) {
  assert.equal(response.status, status);
  assert.match(response.headers.get('content-type') || '', /^application\/json/);
  assert.deepEqual(await response.json(), body);
}

const checks = [];

function check(name, fn) {
  checks.push((async () => {
    await fn();
    console.log(`ok  ${name}`);
  })().catch((error) => {
    console.error(`FAIL ${name}`);
    throw error;
  }));
}

check('GET returns 405 plain text', async () => {
  const result = await handleClaudeEvent({
    method: 'GET',
    rawBody: null,
    apiKey: undefined,
    createMessage: async () => {
      throw new Error('should not be called');
    },
  });
  assert.equal(result.statusCode, 405);
  assert.equal(result.body, 'Method Not Allowed');
  assert.match(result.contentType, /^text\/plain/);
});

check('missing body is a 500', async () => {
  const result = await handleClaudeEvent({
    method: 'POST',
    rawBody: null,
    apiKey: undefined,
    ...silent,
  });
  assert.equal(result.statusCode, 500);
  const parsed = JSON.parse(result.body);
  assert.equal(typeof parsed.error, 'string');
  assert.ok(parsed.error.length > 0);
});

check('invalid JSON is a 500', async () => {
  const result = await handleClaudeEvent({
    method: 'POST',
    rawBody: '{',
    apiKey: undefined,
  });
  assert.equal(result.statusCode, 500);
  assert.equal(JSON.parse(result.body).error.includes('JSON') || JSON.parse(result.body).error.length > 0, true);
});

check('text messages are forwarded with defaults', async () => {
  const capture = {};
  const result = await handleClaudeEvent({
    method: 'POST',
    rawBody: JSON.stringify({
      messages: [{ role: 'user', content: 'pair with laksa' }],
      system: 'be brief',
      maxTokens: 60,
    }),
    apiKey: 'not-used',
    createMessage: mockCreate(capture),
  });
  assert.equal(result.statusCode, 200);
  assert.deepEqual(JSON.parse(result.body), { content: 'hello' });
  assert.equal(capture.params.model, 'claude-sonnet-4-6');
  assert.equal(capture.params.max_tokens, 60);
  assert.equal(capture.params.system, 'be brief');
  assert.deepEqual(capture.params.messages, [
    { role: 'user', content: 'pair with laksa' },
  ]);
});

check('omitted maxTokens and system use the Netlify defaults', async () => {
  const capture = {};
  await handleClaudeEvent({
    method: 'POST',
    rawBody: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    apiKey: undefined,
    createMessage: mockCreate(capture),
  });
  assert.equal(capture.params.max_tokens, 1800);
  assert.equal(capture.params.system, '');
});

check('imageData replaces messages with a vision turn', async () => {
  const capture = {};
  await handleClaudeEvent({
    method: 'POST',
    rawBody: JSON.stringify({
      messages: [
        { role: 'user', content: 'ignore me' },
        { role: 'user', content: 'read this label' },
      ],
      imageData: { data: 'QUJD', mimeType: 'image/jpeg' },
      maxTokens: 1500,
    }),
    apiKey: undefined,
    createMessage: mockCreate(capture),
  });
  assert.deepEqual(capture.params.messages, [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: 'QUJD' },
      },
      { type: 'text', text: 'read this label' },
    ],
  }]);
  assert.equal(capture.params.max_tokens, 1500);
});

check('content blocks are concatenated', async () => {
  const capture = {
    response: { content: [{ text: 'a' }, { text: '' }, { text: null }, { text: 'b' }] },
  };
  const result = await handleClaudeEvent({
    method: 'POST',
    rawBody: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    apiKey: undefined,
    createMessage: mockCreate(capture),
  });
  assert.deepEqual(JSON.parse(result.body), { content: 'ab' });
});

check('empty model content becomes an empty string', async () => {
  const result = await handleClaudeEvent({
    method: 'POST',
    rawBody: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    apiKey: undefined,
    createMessage: async () => ({}),
  });
  assert.deepEqual(JSON.parse(result.body), { content: '' });
});

check('upstream errors become JSON 500', async () => {
  const result = await handleClaudeEvent({
    method: 'POST',
    rawBody: JSON.stringify({ messages: [] }),
    apiKey: undefined,
    createMessage: async () => {
      throw new Error('rate limited');
    },
  });
  assert.equal(result.statusCode, 500);
  assert.deepEqual(JSON.parse(result.body), { error: 'rate limited' });
});

check('Request adapter: POST success and non-POST 405', async () => {
  const capture = {};
  const ok = await handleClaudeRequest(
    new Request('http://local/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hello' }],
        system: 'sys',
      }),
    }),
    { createMessage: mockCreate(capture), apiKey: 'not-used' },
  );
  await expectJson(ok, 200, { content: 'hello' });
  assert.equal(capture.params.system, 'sys');
  assert.equal(capture.params.max_tokens, 1800);

  let called = false;
  const denied = await handleClaudeRequest(
    new Request('http://local/api/claude', { method: 'PUT' }),
    {
      createMessage: async () => {
        called = true;
        return { content: [] };
      },
    },
  );
  assert.equal(denied.status, 405);
  assert.equal(await denied.text(), 'Method Not Allowed');
  assert.equal(called, false);
});

check('Request adapter: empty POST body does not call the model', async () => {
  let called = false;
  const response = await handleClaudeRequest(
    new Request('http://local/api/claude', { method: 'POST', body: '' }),
    {
      createMessage: async () => {
        called = true;
        return { content: [] };
      },
    },
  );
  assert.equal(response.status, 500);
  assert.equal(called, false);
});

check('netlify handler returns the same status and body', async () => {
  const denied = await netlifyHandler({ httpMethod: 'DELETE', body: null });
  assert.equal(denied.statusCode, 405);
  assert.equal(denied.body, 'Method Not Allowed');
  assert.match(denied.headers['Content-Type'], /^text\/plain/);

  const bad = await netlifyHandler({ httpMethod: 'POST', body: 'not-json' });
  assert.equal(bad.statusCode, 500);
  assert.equal(bad.headers['Content-Type'].startsWith('application/json'), true);
  const parsed = JSON.parse(bad.body);
  assert.equal(typeof parsed.error, 'string');
  assert.ok(parsed.error.length > 0);
});

check('legacy path shape still accepts the Netlify event body string', async () => {
  const capture = {};
  const result = await handleClaudeEvent({
    method: 'POST',
    rawBody: JSON.stringify({ messages: [{ role: 'user', content: 'x' }], maxTokens: 0 }),
    apiKey: undefined,
    createMessage: mockCreate(capture),
  });
  assert.equal(result.statusCode, 200);
  // 0 is falsy, so the original `maxTokens || 1800` applies.
  assert.equal(capture.params.max_tokens, 1800);
});

await Promise.all(checks);
console.log(`\n${checks.length} claude proxy checks passed`);
