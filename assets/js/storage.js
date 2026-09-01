// --- 15. Persistencia de Medios (IndexedDB) ---
        // Guarda canciones y videos en el almacenamiento del navegador para
        // que sigan disponibles entre sesiones. IndexedDB soporta blobs
        // grandes (a diferencia de localStorage, limitado a ~5MB).
        const MediaStore = (function () {
            const DB_NAME = 'ecos-media-db';
            const DB_VERSION = 1;
            const STORE = 'media';

            function openDB() {
                return new Promise((resolve, reject) => {
                    const req = indexedDB.open(DB_NAME, DB_VERSION);
                    req.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains(STORE)) {
                            db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
                        }
                    };
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });
            }

            async function save(entry) {
                const db = await openDB();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(STORE, 'readwrite');
                    const req = tx.objectStore(STORE).add(entry);
                    req.onsuccess = () => { db.close(); resolve(req.result); };
                    req.onerror = () => { db.close(); reject(req.error); };
                });
            }

            async function all() {
                const db = await openDB();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(STORE, 'readonly');
                    const req = tx.objectStore(STORE).getAll();
                    req.onsuccess = () => { db.close(); resolve(req.result || []); };
                    req.onerror = () => { db.close(); reject(req.error); };
                });
            }

            async function remove(id) {
                const db = await openDB();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(STORE, 'readwrite');
                    tx.objectStore(STORE).delete(id);
                    tx.oncomplete = () => { db.close(); resolve(); };
                    tx.onerror = () => { db.close(); reject(tx.error); };
                });
            }

            async function clear() {
                const db = await openDB();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(STORE, 'readwrite');
                    tx.objectStore(STORE).clear();
                    tx.oncomplete = () => { db.close(); resolve(); };
                    tx.onerror = () => { db.close(); reject(tx.error); };
                });
            }

            return { save, all, remove, clear };
        })();