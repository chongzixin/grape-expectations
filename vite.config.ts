import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

/** Vite dev-server plugin that mirrors netlify/functions/claude.js locally. */
function netlifyFunctionsPlugin() {
  return {
    name: 'netlify-functions-dev',
    configureServer(server: { middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void } }) {
      server.middlewares.use('/.netlify/functions/claude', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const Anthropic = require('@anthropic-ai/sdk');
            const { messages, system, maxTokens, imageData } = JSON.parse(body);

            const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

            let msgs = messages;
            if (imageData) {
              msgs = [{
                role: 'user',
                content: [
                  { type: 'image', source: { type: 'base64', media_type: imageData.mimeType, data: imageData.data } },
                  { type: 'text', text: messages[messages.length - 1]?.content || '' },
                ],
              }];
            }

            const response = await client.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: maxTokens || 1800,
              system: system || '',
              messages: msgs,
            });

            const content = response.content?.map((c: { text?: string }) => c.text || '').join('') || '';
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ content }));
          } catch (error: unknown) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), netlifyFunctionsPlugin()],
  resolve: {
    // Prioritise TypeScript extensions so App.tsx wins over legacy app.js
    extensions: ['.tsx', '.ts', '.jsx', '.mjs', '.js', '.json'],
  },
  build: {
    outDir: 'dist',
  },
});
