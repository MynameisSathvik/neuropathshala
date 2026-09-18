import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readOfflineDocument,
  readOfflineSyncQueue,
  writeOfflineDocument,
  writeOfflineSyncQueue
} from '../src/services/offlineStorage';

test('offline storage safely falls back when IndexedDB is unavailable', async () => {
  assert.equal(await readOfflineDocument('missing'), undefined);
  assert.equal(await readOfflineSyncQueue(), undefined);
  await assert.doesNotReject(() => writeOfflineDocument('example', { value: true }));
  await assert.doesNotReject(() => writeOfflineSyncQueue([{ id: 'sync-example' }]));
});
