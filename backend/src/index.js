import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const port = Number(process.env.PORT) || 4000;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    await mongoose.connect(uri);
  } else {
    console.warn('MONGODB_URI not set; API running without database');
  }

  app.listen(port, () => {
    console.log(`NexaSpark API listening on http://127.0.0.1:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
