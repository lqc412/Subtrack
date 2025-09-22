import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeChatActions } from '../src/utils/chatActions.js';

describe('normalizeChatActions', () => {
  it('normalizes known aliases to canonical create action', () => {
    assert.deepStrictEqual(normalizeChatActions(['add']), ['create']);
  });

  it('deduplicates and filters unknown entries', () => {
    const result = normalizeChatActions(['Add', 'create', 'REMOVE', 'unknown', 'Edit', '  sign up  ']);
    assert.deepStrictEqual(result, ['create', 'delete', 'update']);
  });
});
