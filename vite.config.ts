import fs from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { validateTopicFiles } from './src/content/validate';

const TOPICS_DIR = path.resolve(import.meta.dirname, 'content/topics');

/** Fails the build (and reports in dev) when content/topics/*.json is invalid. */
function validateContent(): Plugin {
  const run = (): string[] => {
    const parseErrors: string[] = [];
    const files = fs
      .readdirSync(TOPICS_DIR)
      .filter((name) => name.endsWith('.json'))
      .flatMap((fileName) => {
        try {
          const raw = fs.readFileSync(path.join(TOPICS_DIR, fileName), 'utf8');
          return [{ fileName, data: JSON.parse(raw) as unknown }];
        } catch (error) {
          parseErrors.push(`${fileName}: ${(error as Error).message}`);
          return [];
        }
      });
    return [...parseErrors, ...validateTopicFiles(files)];
  };

  return {
    name: 'validate-content',
    buildStart() {
      const errors = run();
      if (errors.length > 0) {
        this.error(`Invalid content:\n\n${errors.join('\n\n')}`);
      }
    },
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(TOPICS_DIR)) return;
      const errors = run();
      if (errors.length > 0) {
        server.config.logger.error(`Invalid content:\n\n${errors.join('\n\n')}`);
      }
    },
  };
}

export default defineConfig({
  plugins: [validateContent(), react(), tailwindcss()],
});
