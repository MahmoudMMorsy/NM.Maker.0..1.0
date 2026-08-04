export const initDB = () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('NORTemplatesDB', 1);
        request.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('templates')) {
                db.createObjectStore('templates', { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveTemplate = async (project: any) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('templates', 'readwrite');
        const store = tx.objectStore('templates');

        const title = project.metadata?.title || 'Untitled Project';
        const serializedProject = {
            id: title + '_' + Date.now(),
            name: title,
            data: project,
            savedAt: Date.now()
        };

        const request = store.put(serializedProject);
        request.onsuccess = () => resolve(serializedProject.id);
        request.onerror = () => reject(request.error);
    });
};

export const getTemplates = async () => {
    const db = await initDB();
    return new Promise<any[]>((resolve, reject) => {
        const tx = db.transaction('templates', 'readonly');
        const store = tx.objectStore('templates');
        const request = store.getAll();
        request.onsuccess = () => {
            console.log("Templates retrieved successfully:", request.result);
            resolve(request.result);
        };
        request.onerror = () => {
            console.error("Failed to retrieve templates:", request.error);
            reject(request.error);
        };
    });
};

export const loadTemplate = async (id: string) => {
    const db = await initDB();
    return new Promise<any>((resolve, reject) => {
        const tx = db.transaction('templates', 'readonly');
        const store = tx.objectStore('templates');
        const request = store.get(id);
        request.onsuccess = () => {
            if (!request.result) return reject(new Error('Template not found'));
            resolve(request.result.data);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deleteTemplate = async (id: string) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('templates', 'readwrite');
        const store = tx.objectStore('templates');
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
};
