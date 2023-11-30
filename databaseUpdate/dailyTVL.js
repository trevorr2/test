const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const schedule = require('node-schedule');
require('dotenv').config();


const uri = process.env.MONGODB_URI;
const url = 'https://api.llama.fi/protocols';

async function fetchTVLAndStoreInMongoDB() {
  try {
    const response = await fetch(url);
    const data = await response.json();

    const dbName = 'sandbox';
    const collectionName = 'dailyTVL';

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    for (const protocol of data) {
      const { name, tvl, mcap } = protocol;

      const filter = { name };
      const existingProtocol = await collection.findOne(filter);

      if (!existingProtocol) {
        // If the protocol doesn't exist, create a new document
        await collection.insertOne({
          name,
          mcap: [mcap], // Store the mcap value in an array
          tvl: [tvl]    // Store the tvl value in an array
        });
      } else {
        // Update existing protocol's tvl and mcap fields with the latest data
        await collection.updateOne(
          filter,
          {
            $push: { mcap: mcap, tvl: tvl } // Push the new values into the existing arrays
          }
        );
      }
    }

    console.log('Data updated in MongoDB');
    client.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

module.exports = { fetchTVLAndStoreInMongoDB };