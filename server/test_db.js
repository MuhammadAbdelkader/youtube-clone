const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Channel = require('./models/channel.model');

async function testChannel() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const channel = await Channel.findOne();
    if (channel) {
        console.log("Found channel:", channel.title);
        // We will just verify it exists and has an owner
        console.log("Owner ID:", channel.owner);
    } else {
        console.log("No channels found.");
    }
    await mongoose.disconnect();
}
testChannel();
