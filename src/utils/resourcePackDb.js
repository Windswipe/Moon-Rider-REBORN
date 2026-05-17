/* global indexedDB */

const DB_NAME = 'MoonRiderResourcePack';
const STORE_NAME = 'files';
const META_STORE = 'metadata';

function openDb () {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveResourcePack (packName, filesDict) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const meta = tx.objectStore(META_STORE);

    // Clear existing
    store.clear();
    meta.clear();

    meta.put(packName, 'packName');

    for (const [path, blob] of Object.entries(filesDict)) {
      store.put(blob, path);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearResourcePack () {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.objectStore(META_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getResourcePackName () {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([META_STORE], 'readonly');
    const request = tx.objectStore(META_STORE).get('packName');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

module.exports = {
  openDb,
  saveResourcePack,
  clearResourcePack,
  getResourcePackName
};
