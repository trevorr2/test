const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const schedule = require('node-schedule');

const uri = process.env.MONGODB_URI
const url = 'https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyFees';

async function fetchFeesAndStoreInMongoDB() {
  try {
    const response = await fetch(url);
    const data = await response.json();

    const dbName = 'sandbox';
    const collectionName = 'dailyFees';

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    for (const protocol of data?.protocols || []) {
      const filter = { name: protocol.name };
      const existingProtocol = await collection.findOne(filter);

      const newFee = protocol.dailyFees;

      if (!existingProtocol) {
        // If the protocol doesn't exist, create a new document
        await collection.insertOne({
          name: protocol.name,
          fees: [newFee] // Store the fee value in an array
        });
      } else {
        // Update existing protocol's fees field with the latest data
        await collection.updateOne(
          filter,
          {
            $push: { fees: newFee } // Push the new fee value into the existing array
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

module.exports = { fetchFeesAndStoreInMongoDB };