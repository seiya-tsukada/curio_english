import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { validateTopicFiles } from './validate';

const TOPICS_DIR = path.resolve(import.meta.dirname, '../../content/topics');

function readTopicFiles() {
  return fs
    .readdirSync(TOPICS_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((fileName) => ({
      fileName,
      data: JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, fileName), 'utf8')) as unknown,
    }));
}

describe('content/topics', () => {
  test('all topic files are valid', () => {
    expect(validateTopicFiles(readTopicFiles())).toEqual([]);
  });
});

describe('validateTopicFiles', () => {
  const [valid] = readTopicFiles();

  test('reports schema errors with the file name', () => {
    const errors = validateTopicFiles([
      { fileName: valid.fileName, data: { ...(valid.data as object), categoryId: 'sports' } },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(valid.fileName);
    expect(errors[0]).toContain('categoryId');
  });

  test('requires the file name to match the topic id', () => {
    const errors = validateTopicFiles([{ fileName: 'wrong-name.json', data: valid.data }]);
    expect(errors).toEqual([expect.stringContaining('file name must match id')]);
  });

  test('rejects duplicate topic and sentence ids across files', () => {
    const errors = validateTopicFiles([valid, { ...valid }]);
    expect(errors).toContainEqual(expect.stringMatching(/topic id ".+" is already used/));
    expect(errors).toContainEqual(expect.stringMatching(/sentence id ".+" is already used/));
  });
});
