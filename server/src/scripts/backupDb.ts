import 'dotenv/config';
import * as dns from 'node:dns';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { EJSON } from 'bson';
import mongoose from 'mongoose';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const BACKUP_ROOT = process.env.DB_BACKUP_DIR || path.join(process.cwd(), 'src', 'scripts', '.backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(BACKUP_ROOT, `backup-${timestamp}`);

async function main(): Promise<void> {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/the-skill-hearth-local', {
    serverSelectionTimeoutMS: 20000,
  });
  const db = mongoose.connection.db;
  fs.mkdirSync(backupDir, { recursive: true });

  const collections = await db.listCollections().toArray();
  let totalDocs = 0;

  for (const c of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    const docs = await db.collection(c.name).find({}).toArray();
    const serialized = EJSON.serialize(docs, { relaxed: false });
    const file = path.join(backupDir, `${c.name}.json`);
    fs.writeFileSync(file, JSON.stringify(serialized, null, 1), 'utf8');
    totalDocs += docs.length;
    console.log(`  ${c.name}: ${docs.length}`);
  }

  const manifest = {
    database: db.databaseName,
    exportedAt: new Date().toISOString(),
    collections: collections.length,
    totalDocs,
    mongoUriHost: process.env.MONGODB_URI ? new URL(process.env.MONGODB_URI.replace('+srv', '').replace(/\/\/[^@]+@/, '//x@')).host : 'n/a',
  };
  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`\nBackup complete -> ${backupDir}`);
  console.log(`collections=${collections.length} totalDocs=${totalDocs}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});