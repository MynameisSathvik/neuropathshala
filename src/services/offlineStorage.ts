const DATABASE_NAME = 'neuropathshala-offline-store';
const DATABASE_VERSION = 1;
const DOCUMENTS_STORE = 'documents';
const SYNC_STORE = 'syncQueue';

type StoredDocument = {
  key: string;
  version: number;
  updatedAt: string;
  value: unknown;
};

function isAvailable(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!isAvailable()) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(DOCUMENTS_STORE)) {
        database.createObjectStore(DOCUMENTS_STORE, { keyPath: 'key' });
      }
      if (!database.objectStoreNames.contains(SYNC_STORE)) {
        database.createObjectStore(SYNC_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB could not be opened'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'));
  });
}

export async function readOfflineDocument<T>(key: string): Promise<T | undefined> {
  const database = await openDatabase();
  if (!database) return undefined;
  try {
    const transaction = database.transaction(DOCUMENTS_STORE, 'readonly');
    const document = await requestResult<StoredDocument | undefined>(transaction.objectStore(DOCUMENTS_STORE).get(key));
    return document?.value as T | undefined;
  } finally {
    database.close();
  }
}

export async function writeOfflineDocument(key: string, value: unknown): Promise<void> {
  const database = await openDatabase();
  if (!database) return;
  try {
    const transaction = database.transaction(DOCUMENTS_STORE, 'readwrite');
    transaction.objectStore(DOCUMENTS_STORE).put({ key, version: 1, updatedAt: new Date().toISOString(), value } satisfies StoredDocument);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function readOfflineSyncQueue<T>(): Promise<T[] | undefined> {
  const database = await openDatabase();
  if (!database) return undefined;
  try {
    const transaction = database.transaction(SYNC_STORE, 'readonly');
    const records = await requestResult<T[]>(transaction.objectStore(SYNC_STORE).getAll());
    return records;
  } finally {
    database.close();
  }
}

export async function writeOfflineSyncQueue<T extends { id: string }>(queue: T[]): Promise<void> {
  const database = await openDatabase();
  if (!database) return;
  try {
    const transaction = database.transaction(SYNC_STORE, 'readwrite');
    const store = transaction.objectStore(SYNC_STORE);
    store.clear();
    queue.forEach((item) => store.put(item));
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}
