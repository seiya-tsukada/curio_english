import { z } from 'zod';
import { topicFileSchema } from './schema.ts';

export interface RawTopicFile {
  /** File name without directory, e.g. "topic-octopus-hearts.json" */
  fileName: string;
  data: unknown;
}

/**
 * Validates every topic file against the schema and checks cross-file rules.
 * Returns a list of human-readable errors (empty when everything is valid).
 */
export function validateTopicFiles(files: RawTopicFile[]): string[] {
  const errors: string[] = [];
  const topicOwners = new Map<string, string>();
  const sentenceOwners = new Map<string, string>();

  for (const { fileName, data } of files) {
    const result = topicFileSchema.safeParse(data);
    if (!result.success) {
      errors.push(`${fileName}:\n${z.prettifyError(result.error)}`);
      continue;
    }

    const topic = result.data;
    if (fileName !== `${topic.id}.json`) {
      errors.push(`${fileName}: file name must match id ("${topic.id}.json")`);
    }

    const topicOwner = topicOwners.get(topic.id);
    if (topicOwner) {
      errors.push(`${fileName}: topic id "${topic.id}" is already used in ${topicOwner}`);
    } else {
      topicOwners.set(topic.id, fileName);
    }

    for (const sentence of topic.sentences) {
      const owner = sentenceOwners.get(sentence.id);
      if (owner) {
        errors.push(`${fileName}: sentence id "${sentence.id}" is already used in ${owner}`);
      } else {
        sentenceOwners.set(sentence.id, fileName);
      }
    }
  }

  return errors;
}
