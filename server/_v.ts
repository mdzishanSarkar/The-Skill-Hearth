import mongoose from 'mongoose';
import 'dotenv/config';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/the-skill-hearth-local';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const res = await db.collection('users').updateMany(
    { email: { $in: ['m1test@test.dev', 'm1admin@test.dev'] } },
    { $set: { isEmailVerified: true } }
  );
  await db.collection('emailverificationtokens').deleteMany({});
  await db.collection('tokenblacklists').deleteMany({});
  console.log('updated:', res.modifiedCount, '| users now:', await db.collection('users').countDocuments());
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
