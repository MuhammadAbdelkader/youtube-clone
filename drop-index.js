const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/server/.env' });

async function dropIndex() {
  try {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    await mongoose.connection.collection('users').dropIndex('googleId_1');
    console.log('Index googleId_1 dropped successfully!');
  } catch (err) {
    console.error('Failed to drop index (it might not exist):', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

dropIndex();
