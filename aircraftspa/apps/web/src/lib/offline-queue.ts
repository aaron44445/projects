"use client";

const DB_NAME = "aircraftspa-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending-actions";

interface OfflineAction {
  id?: number;
  type: "status_update" | "checklist_toggle" | "notes_update" | "photo_upload";
  url: string;
  method: string;
  body?: unknown;
  timestamp: number;
  retries: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueAction(
  action: Omit<OfflineAction, "id" | "timestamp" | "retries">
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add({
      ...action,
      timestamp: Date.now(),
      retries: 0,
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingActions(): Promise<OfflineAction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeAction(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function processQueue(): Promise<{
  succeeded: number;
  failed: number;
}> {
  const actions = await getPendingActions();
  let succeeded = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: action.body ? JSON.stringify(action.body) : undefined,
      });

      if (response.ok) {
        await removeAction(action.id!);
        succeeded++;
      } else if (action.retries >= 3) {
        await removeAction(action.id!);
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { succeeded, failed };
}

// Auto-process queue when coming back online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    processQueue().then(({ succeeded, failed }) => {
      if (succeeded > 0) {
        console.log(`[OfflineQueue] Synced ${succeeded} actions`);
      }
      if (failed > 0) {
        console.warn(`[OfflineQueue] Failed to sync ${failed} actions`);
      }
    });
  });

  // Listen for service worker messages
  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type === "PROCESS_OFFLINE_QUEUE") {
      processQueue();
    }
  });
}

// Helper for making offline-capable API calls
export async function offlineFetch(
  url: string,
  options: RequestInit & { offlineType?: OfflineAction["type"] } = {}
): Promise<Response | null> {
  const { offlineType, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      credentials: "include",
    });
    return response;
  } catch {
    if (offlineType) {
      await queueAction({
        type: offlineType,
        url,
        method: (fetchOptions.method as string) || "GET",
        body: fetchOptions.body
          ? JSON.parse(fetchOptions.body as string)
          : undefined,
      });
      console.log(`[OfflineQueue] Queued ${offlineType} for later sync`);
    }
    return null;
  }
}
