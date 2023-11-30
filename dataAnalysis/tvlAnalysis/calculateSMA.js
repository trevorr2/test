const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'myDatabase';
const collectionName = 'dailyFeesTimeless';
const numberOfDays = 7; // Adjust the number of days for the moving average

async function calculateAndStoreFeeMovingAverages() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Find all documents in the collection
    const documents = await collection.find({}).toArray();

    for (const doc of documents) {
      const fees = doc.fees;
      const averages = [];

      // Calculate averages for consecutive sets of elements in the "fees" array
      for (let i = 0; i <= fees.length - numberOfDays; i++) {
        const slice = fees.slice(i, i + numberOfDays);
        const average = slice.reduce((acc, val) => acc + val, 0) / numberOfDays;
        averages.push(average);
      }

      // Update the current document by adding the averages to the "SMA" field
      await collection.updateOne(
        { _id: doc._id },
        { $set: { SMA: averages } }
      );
    }

    console.log(`Moving averages calculation and storage completed for all documents using ${numberOfDays} days.`);

  } catch (error) {
    console.error('Error:', error);

  } finally {
    client.close();
  }
}

module.exports = { calculateAndStoreFeeMovingAverages };

calculateAndStoreFeeMovingAverages();