import type { RawEmail } from "../email/types";

const DB_NAME = "mail-whale";
const DB_VERSION = 1;
const EMAILS_STORE = "emails";
const META_STORE = "meta";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(EMAILS_STORE)) {
        const store = db.createObjectStore(EMAILS_STORE, { keyPath: "id" });
        store.createIndex("date", "date");
        store.createIndex("threadId", "threadId");
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveEmails(emails: RawEmail[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(EMAILS_STORE, "readwrite");
  const store = tx.objectStore(EMAILS_STORE);
  for (const email of emails) {
    store.put(email);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getEmails(limit?: number): Promise<RawEmail[]> {
  const db = await openDB();
  const tx = db.transaction(EMAILS_STORE, "readonly");
  const store = tx.objectStore(EMAILS_STORE);
  const index = store.index("date");
  const request = index.openCursor(null, "prev"); // newest first

  const emails: RawEmail[] = [];
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && (!limit || emails.length < limit)) {
        emails.push(cursor.value);
        cursor.continue();
      } else {
        resolve(emails);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getLastScanDate(): Promise<string | null> {
  const db = await openDB();
  const tx = db.transaction(META_STORE, "readonly");
  const store = tx.objectStore(META_STORE);
  const request = store.get("lastScanDate");
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result?.value || null);
    request.onerror = () => reject(request.error);
  });
}

export async function setLastScanDate(date: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(META_STORE, "readwrite");
  const store = tx.objectStore(META_STORE);
  store.put({ key: "lastScanDate", value: date });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllEmails(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(EMAILS_STORE, "readwrite");
  tx.objectStore(EMAILS_STORE).clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
