import assert from 'node:assert/strict';
import test from 'node:test';

import { getWikiPageDateMetadata } from '../../src/utils/wiki-metadata.mjs';

test('위키 장 메타데이터는 서로 다른 최초 발행일·수정일·검증일을 섞지 않는다', () => {
  const metadata = getWikiPageDateMetadata({
    published: new Date('2026-08-10T00:00:00.000Z'),
    updated: new Date('2026-08-11T00:00:00.000Z'),
    lastVerified: new Date('2026-08-12T00:00:00.000Z'),
  });

  assert.deepEqual(metadata, {
    datePublished: '2026-08-10T00:00:00.000Z',
    dateModified: '2026-08-11T00:00:00.000Z',
    lastVerified: '2026-08-12T00:00:00.000Z',
  });
  assert.notEqual(metadata.datePublished, metadata.dateModified);
  assert.notEqual(metadata.dateModified, metadata.lastVerified);
});
