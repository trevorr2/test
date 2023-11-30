const { fetchFeesAndStoreInMongoDB } = require('./databaseUpdate/dailyFees');
const { fetchTVLAndStoreInMongoDB } = require('./databaseUpdate/dailyTVL');

fetchFeesAndStoreInMongoDB();
fetchTVLAndStoreInMongoDB();