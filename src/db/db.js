import Dexie from 'dexie';

export const db = new Dexie('CynoiaDemoDB');

// Schema:
// tasks: id (auto-increment), content, status (synced/pending), createdAt
db.version(1).stores({
  tasks: '++id, status, createdAt'
});
