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

/**
 * Public origin used for absolute URLs in social meta tags (crawlers ignore
 * relative og:image). SITE_URL wins; on Vercel it falls back to the project's
 * production domain, which Vercel exposes to builds.
 */
function resolveSiteUrl(): string | undefined {
  const explicit = process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercelDomain ? `https://${vercelDomain}` : undefined;
}

function socialMeta(): Plugin {
  const siteUrl = resolveSiteUrl();
  const imageUrl = `${siteUrl ?? ''}/og-image.png`;
  return {
    name: 'social-meta',
    transformIndexHtml() {
      const meta = (attr: 'property' | 'name', key: string, content: string) => ({
        tag: 'meta',
        attrs: { [attr]: key, content },
        injectTo: 'head' as const,
      });
      // No og:url / canonical: every route serves the same HTML, so pointing
      // them at "/" would collapse shared topic links into the home page.
      return [
        meta('property', 'og:image', imageUrl),
        meta('name', 'twitter:image', imageUrl),
      ];
    },
  };
}

export default defineConfig({
  plugins: [validateContent(), socialMeta(), react(), tailwindcss()],
});
