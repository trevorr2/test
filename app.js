// const { fetchFeesAndStoreInMongoDB } = require('./databaseUpdate/dailyFees');
const { calculateAndStoreFeeMovingAverages } = require('./dataAnalysis/feeAnalysis/calculateFeeSMA');
const { rapidIncreaseCalculator } = require('./dataAnalysis/feeAnalysis/rapidIncreaseIndicator');
// const { fetchTVLAndStoreInMongoDB } = require('./databaseUpdate/dailyTVL');
const { getDocumentsWithRapidIncreaseAndSendEmails } = require('./email');


async function run(){
//  await fetchFeesAndStoreInMongoDB();
//  await fetchTVLAndStoreInMongoDB();
    await calculateAndStoreFeeMovingAverages();
    await rapidIncreaseCalculator();
    await getDocumentsWithRapidIncreaseAndSendEmails();
}

run();
