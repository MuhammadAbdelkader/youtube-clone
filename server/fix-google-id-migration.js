require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const User = require("./models/user.model");

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set. Aborting -- refusing to run with a hardcoded fallback.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const affected = await User.countDocuments({ googleId: null });
  console.log(`Found ${affected} user(s) with an explicit googleId: null.`);

  if (affected > 0) {
    const result = await User.updateMany(
      { googleId: null },
      { $unset: { googleId: "" } }
    );
    console.log(`Cleaned up ${result.modifiedCount} document(s). googleId is now truly absent on these users.`);
  } else {
    console.log("Nothing to clean up.");
  }

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
