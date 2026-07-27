const fs = require('fs');
const path = require('path');

const PERSISTENT_DIR = '/data';

const migrateToPersistent = () => {
  if (!fs.existsSync(PERSISTENT_DIR)) {
    console.log('[PERSISTENCE] /data directory does not exist. Running in local ephemeral mode.');
    return;
  }

  console.log('[PERSISTENCE] /data volume detected. Verifying data migrations...');

  const copyFolderSync = (from, to) => {
    if (!fs.existsSync(to)) {
      fs.mkdirSync(to, { recursive: true });
    }
    fs.readdirSync(from).forEach(element => {
      const src = path.join(from, element);
      const dest = path.join(to, element);
      if (fs.lstatSync(src).isDirectory()) {
        copyFolderSync(src, dest);
      } else {
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
          console.log(`[PERSISTENCE] Seeded file: ${element}`);
        }
      }
    });
  };

  try {
    // 1. Migrate Database
    const localDb = path.join(__dirname, '../database');
    const targetDb = '/data/database';
    copyFolderSync(localDb, targetDb);

    // 2. Migrate Uploads
    const localUploads = path.join(__dirname, '../uploads');
    const targetUploads = '/data/uploads';
    copyFolderSync(localUploads, targetUploads);

    console.log('[PERSISTENCE] Data volume sync and migrations complete.');
  } catch (error) {
    console.error('[PERSISTENCE] Migration failed:', error);
  }
};

module.exports = migrateToPersistent;
