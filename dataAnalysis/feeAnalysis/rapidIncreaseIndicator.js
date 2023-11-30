const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = 'test';
const collectionName = 'dailyFeesTimelessOnline';

async function oneDayChange() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Find all documents in the collection
    const documents = await collection.find({}).toArray();

    for (const doc of documents) {
      if (doc.SMA && doc.SMA.length >= 2) {
        const smaValues = doc.SMA;
        const results = [];

        // Loop through the "SMA" field starting from the second element
        for (let i = 1; i < smaValues.length; i++) {
          const percentageIncrease = ((smaValues[i] / smaValues[i - 1]) * 100) - 100;
          results.push(percentageIncrease);
        }

        // Update the current document by adding the percentage increase values to the "percentIncrease" field
        await collection.updateOne(
          { _id: doc._id },
          { $set: { percentIncrease: results } }
        );
      } else {
        console.log(`Document with _id: ${doc._id} does not have enough SMA data.`);
      }
    }

    console.log("Calculation and storage of rapid increases completed for all documents.");

  } catch (error) {
    console.error('Error:', error);

  } finally {
    client.close();
  }
}

async function mostRecentChange() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  // Find all documents in the collection
  const documents = await collection.find({}).toArray();

  for (const doc of documents) {
    if (doc.percentIncrease && doc.percentIncrease.length >= 2) {
      const percentIncreaseValues = doc.percentIncrease;
      
      if (percentIncreaseValues.length > 0) {
        const lastPercentageIncrease = percentIncreaseValues[percentIncreaseValues.length - 1];

        if (lastPercentageIncrease > 10) {
          // Add the last percentage increase value to the "rapidIncrease" field
          await collection.updateOne(
            { _id: doc._id },
            { $set: { rapidIncrease: lastPercentageIncrease } }
          );

          console.log(`Last percentage increase value added to the 'rapidIncrease' field for document with _id: ${doc._id}`);
        } else {
          // If last percentage increase is not above 10, set 'rapidIncrease' field to null
          await collection.updateOne(
            { _id: doc._id },
            { $set: { rapidIncrease: null } }
          );

          console.log(`Last percentage increase value is not above 10 for document with _id: ${doc._id}. rapidIncrease field set to null.`);
        }
      }
    }
  }
  client.close();
}


async function rapidIncreaseCalculator() {
    try {
      await oneDayChange();
      await mostRecentChange();
  
      console.log('Analysis completed for all documents.');
    } catch (error) {
      console.error('Error:', error);
    }
  }

module.exports = { rapidIncreaseCalculator };
  