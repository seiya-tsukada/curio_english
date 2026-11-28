import { test } from 'vitest';
import assert from 'node:assert/strict';
import { ALL_SENTENCES, CATEGORIES, SENTENCE_MAP, TOPICS } from './data';
import { getRecommendedFeed, getRelatedSentences } from './utils/recommendation';
import { tokenizeSentenceWithVocab } from './utils/textTokens';
import {
  createInitialLearningState,
  getTodayKey,
  getTodayReadCount,
  getWeeklyActivity,
  recordSentenceRead,
  toggleSavedSentence,
  toggleSavedVocab,
} from './utils/storage';

test('content dataset meets minimum 6 categories, 30 topics, and 150 sentences', () => {
  assert.equal(CATEGORIES.length, 6);
  assert.ok(TOPICS.length >= 30, `Expected >=30 topics, got ${TOPICS.length}`);
  assert.ok(
    ALL_SENTENCES.length >= 150,
    `Expected >=150 sentences, got ${ALL_SENTENCES.length}`
  );

  // Every topic has 5 sentences and valid category
  const categoryIds = new Set(CATEGORIES.map((c) => c.id));
  for (const topic of TOPICS) {
    assert.ok(categoryIds.has(topic.categoryId));
    const count = ALL_SENTENCES.filter((s) => s.topicId === topic.id).length;
    assert.equal(count, 5, `Topic ${topic.id} should have 5 sentences`);
  }
});

test('recommendation prioritizes selected interest categories and unread sentences', () => {
  const state = createInitialLearningState();
  state.preferences = {
    interestedCategories: ['history'],
    level: 'beginner',
    dailyGoal: 10,
    onboardingCompleted: true,
  };

  const feed = getRecommendedFeed(ALL_SENTENCES, state, 'all');
  assert.equal(feed.length, ALL_SENTENCES.length);
  // Top card should come from user's selected interest category ('history')
  assert.equal(feed[0].categoryId, 'history');

  // Mark top card as read; it should move down and no longer be first
  const updated = recordSentenceRead(state, feed[0].id, feed[0].topicId);
  const feedAfterRead = getRecommendedFeed(ALL_SENTENCES, updated, 'all');
  assert.notEqual(feedAfterRead[0].id, feed[0].id);

  // Consecutive items should not repeat the exact same topic
  for (let i = 1; i < Math.min(20, feedAfterRead.length); i++) {
    assert.notEqual(feedAfterRead[i].topicId, feedAfterRead[i - 1].topicId);
  }
});

test('category filter narrows recommended feed and related sentences exclude current', () => {
  const state = createInitialLearningState();
  const techFeed = getRecommendedFeed(ALL_SENTENCES, state, 'technology');
  // Count from the data so adding topics doesn't break the test.
  const techCount = ALL_SENTENCES.filter((s) => s.categoryId === 'technology').length;
  assert.equal(techFeed.length, techCount);
  assert.ok(techFeed.every((s) => s.categoryId === 'technology'));

  const related = getRelatedSentences(techFeed[0], ALL_SENTENCES, 3);
  assert.equal(related.length, 3);
  assert.ok(related.every((r) => r.id !== techFeed[0].id));
});

test('tokenizer matches underlined vocabulary words while preserving punctuation', () => {
  const sample = SENTENCE_MAP['sent-octopus-1']; // "Octopuses have three hearts inside their soft bodies."
  const tokens = tokenizeSentenceWithVocab(sample.english, sample.vocabulary);
  const vocabTokens = tokens.filter((t) => Boolean(t.vocab));
  assert.equal(vocabTokens.length, sample.vocabulary.length);
  assert.equal(vocabTokens[0].text, 'Octopuses');
  assert.equal(vocabTokens[1].text, 'hearts');
});

test('learning state tracking updates read count, saved items, and weekly activity', () => {
  const fixedDate = new Date('2026-11-26T10:00:00Z');
  let state = createInitialLearningState();

  state = recordSentenceRead(state, 'sent-octopus-1', 'topic-octopus-hearts', fixedDate);
  // Reading the same sentence again should not double-increment daily count
  state = recordSentenceRead(state, 'sent-octopus-1', 'topic-octopus-hearts', fixedDate);
  assert.equal(getTodayReadCount(state, fixedDate), 1);

  state = recordSentenceRead(state, 'sent-octopus-2', 'topic-octopus-hearts', fixedDate);
  assert.equal(getTodayReadCount(state, fixedDate), 2);

  state = toggleSavedSentence(state, 'sent-octopus-1');
  assert.deepEqual(state.savedSentenceIds, ['sent-octopus-1']);
  state = toggleSavedSentence(state, 'sent-octopus-1');
  assert.deepEqual(state.savedSentenceIds, []);

  state = toggleSavedVocab(
    state,
    { word: 'hearts', pos: '名詞', meaningJa: '心臓' },
    'sent-octopus-1',
    fixedDate
  );
  assert.equal(state.savedVocab.length, 1);

  const weekly = getWeeklyActivity(state, fixedDate);
  assert.equal(weekly.length, 7);
  assert.equal(weekly[6].dateKey, getTodayKey(fixedDate));
  assert.equal(weekly[6].count, 2);
});
