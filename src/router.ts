import { useCallback, useEffect, useState } from 'react';
import type { MainTab } from './types/curio';

/**
 * Minimal client-side router on top of the History API.
 *
 * URL map:
 *   /                     Discover tab
 *   /topics               Topics tab
 *   /learning             My Learning tab
 *   /profile              Profile tab
 *   /topics/:topicId?s=N  Topic reader, starting at sentence N (1-based)
 *   /sentences/:id        Single sentence reader
 *
 * The server must serve index.html for every path (see vercel.json).
 */
export type Route =
  | { name: 'tab'; tab: MainTab }
  | { name: 'topic'; topicId: string; startOrder: number }
  | { name: 'sentence'; sentenceId: string }
  | { name: 'notFound' };

const TAB_PATHS: Record<MainTab, string> = {
  discover: '/',
  topics: '/topics',
  learning: '/learning',
  profile: '/profile',
};

const PATH_TABS = new Map(
  Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as MainTab])
);

function decodeSegment(segment: string): string | null {
  try {
    const decoded = decodeURIComponent(segment);
    return decoded === '' ? null : decoded;
  } catch {
    return null;
  }
}

export function parseRoute(pathname: string, search = ''): Route {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  const tab = PATH_TABS.get(path || '/');
  if (tab) return { name: 'tab', tab };

  const segments = path.split('/').filter(Boolean);
  if (segments.length === 2) {
    const id = decodeSegment(segments[1]);
    if (id && segments[0] === 'topics') {
      const s = Number(new URLSearchParams(search).get('s'));
      const startOrder = Number.isInteger(s) && s >= 1 ? s : 1;
      return { name: 'topic', topicId: id, startOrder };
    }
    if (id && segments[0] === 'sentences') {
      return { name: 'sentence', sentenceId: id };
    }
  }

  return { name: 'notFound' };
}

export function tabPath(tab: MainTab): string {
  return TAB_PATHS[tab];
}

export function topicPath(topicId: string, startOrder = 1): string {
  const base = `/topics/${encodeURIComponent(topicId)}`;
  return startOrder > 1 ? `${base}?s=${startOrder}` : base;
}

export function sentencePath(sentenceId: string): string {
  return `/sentences/${encodeURIComponent(sentenceId)}`;
}

interface HistoryState {
  /** Number of in-app entries before this one; 0 for the entry the user landed on. */
  depth: number;
}

function currentDepth(): number {
  const state = window.history.state as Partial<HistoryState> | null;
  return typeof state?.depth === 'number' ? state.depth : 0;
}

function readLocation(): Route {
  return parseRoute(window.location.pathname, window.location.search);
}

export interface Router {
  route: Route;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  /** Go back within the app, or to `fallbackPath` when there is no in-app history. */
  goBack: (fallbackPath?: string) => void;
}

export function useRouter(): Router {
  const [route, setRoute] = useState<Route>(readLocation);

  useEffect(() => {
    // Tag the landing entry so goBack() knows it cannot go further back.
    if (window.history.state?.depth === undefined) {
      window.history.replaceState({ depth: 0 } satisfies HistoryState, '');
    }
    const onPopState = () => setRoute(readLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback(
    (path: string, options: { replace?: boolean } = {}) => {
      const current = window.location.pathname + window.location.search;
      if (path === current) {
        setRoute(readLocation());
        return;
      }
      if (options.replace) {
        window.history.replaceState({ depth: currentDepth() } satisfies HistoryState, '', path);
      } else {
        window.history.pushState({ depth: currentDepth() + 1 } satisfies HistoryState, '', path);
      }
      setRoute(readLocation());
    },
    []
  );

  const goBack = useCallback(
    (fallbackPath = '/') => {
      if (currentDepth() > 0) {
        window.history.back();
      } else {
        navigate(fallbackPath, { replace: true });
      }
    },
    [navigate]
  );

  return { route, navigate, goBack };
}
