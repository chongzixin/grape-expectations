import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prioritise TypeScript extensions so App.tsx wins over legacy app.js
    extensions: ['.tsx', '.ts', '.jsx', '.mjs', '.js', '.json'],
  },
  build: {
    outDir: 'dist',
  },
});
