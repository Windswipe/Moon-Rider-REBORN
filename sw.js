/* global indexedDB, self, fetch, Response, URL */

const DB_NAME = 'MoonRiderResourcePack';
const STORE_NAME = 'files';

function openDb () {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getFileFromDb (path) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(path);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept requests containing /assets/
  // This handles both local root (/assets/...) and GH Pages (/Moon-Rider-REBORN/assets/...)
  const assetsMatch = url.pathname.match(/assets\/(.*)/);
  if (assetsMatch && event.request.method === 'GET') {
    const assetPath = 'assets/' + assetsMatch[1];

    event.respondWith(
      getFileFromDb(assetPath).then(blob => {
        if (blob) {
          // Serve from active resource pack
          return new Response(blob, {
            headers: { 'Content-Type': blob.type }
          });
        }
        // Fallback to network
        return fetch(event.request);
      }).catch(() => {
        return fetch(event.request);
      })
    );
  }
});
