import { describe, expect, it } from 'vitest';
import { parseRoute, sentencePath, tabPath, topicPath } from './router';

describe('parseRoute', () => {
  it('maps tab paths, ignoring a trailing slash', () => {
    expect(parseRoute('/')).toEqual({ name: 'tab', tab: 'discover' });
    expect(parseRoute('/topics')).toEqual({ name: 'tab', tab: 'topics' });
    expect(parseRoute('/learning/')).toEqual({ name: 'tab', tab: 'learning' });
    expect(parseRoute('/profile')).toEqual({ name: 'tab', tab: 'profile' });
  });

  it('parses topic routes with an optional start sentence', () => {
    expect(parseRoute('/topics/topic-venus-day')).toEqual({
      name: 'topic',
      topicId: 'topic-venus-day',
      startOrder: 1,
    });
    expect(parseRoute('/topics/topic-venus-day', '?s=3')).toMatchObject({ startOrder: 3 });
    expect(parseRoute('/topics/topic-venus-day', '?s=0')).toMatchObject({ startOrder: 1 });
    expect(parseRoute('/topics/topic-venus-day', '?s=abc')).toMatchObject({ startOrder: 1 });
  });

  it('parses sentence routes', () => {
    expect(parseRoute('/sentences/sent-venus-day-2')).toEqual({
      name: 'sentence',
      sentenceId: 'sent-venus-day-2',
    });
  });

  it('returns notFound for anything else', () => {
    expect(parseRoute('/nope')).toEqual({ name: 'notFound' });
    expect(parseRoute('/topics/a/b')).toEqual({ name: 'notFound' });
    expect(parseRoute('/sentences/%E0%A4%A')).toEqual({ name: 'notFound' });
  });
});

describe('path builders', () => {
  it('round-trips through parseRoute', () => {
    expect(parseRoute(tabPath('learning'))).toEqual({ name: 'tab', tab: 'learning' });
    const [path, search] = topicPath('topic-x', 4).split('?');
    expect(parseRoute(path, `?${search}`)).toEqual({ name: 'topic', topicId: 'topic-x', startOrder: 4 });
    expect(topicPath('topic-x')).toBe('/topics/topic-x');
    expect(parseRoute(sentencePath('sent-x-1'))).toEqual({ name: 'sentence', sentenceId: 'sent-x-1' });
  });
});
