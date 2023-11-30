const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');
require('dotenv').config();

// MongoDB configuration
const uri = process.env.MONGODB_URI;
const dbName = 'test';
const collectionName = 'dailyFeesTimelessOnline';

// Nodemailer configuration (replace with your email service credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'trevor.jj.rice@gmail.com', // Your email address
    pass: process.env.EMAIL_PASSWORD // Your email password or app-specific password
  }
});

async function sendBatchedEmailNotification(notifications) {
  try {
    const mailOptions = {
      from: 'trevor.jj.rice@gmail.com',
      to: 'trevor.jj.rice@gmail.com', // Receiver's email address
      subject: 'Batched Rapid Increase Notifications',
      text: notifications.join('\n\n') // Join all notifications with newlines
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

async function getDocumentsWithRapidIncreaseAndSendEmails() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const notifications = [];

    // Find documents that have a non-null rapidIncrease value
    const documentsWithRapidIncrease = await collection.find({ rapidIncrease: { $ne: null } }).toArray();

    if (documentsWithRapidIncrease.length > 0) {
      // Sort documents by rapidIncrease in descending order
      documentsWithRapidIncrease.sort((a, b) => b.rapidIncrease - a.rapidIncrease);

      for (const doc of documentsWithRapidIncrease) {
        // Check if rapidIncrease is not null or undefined, and the conditions for SMA and the last element are met
        if (
          doc.rapidIncrease != null &&
          doc.SMA &&
          doc.SMA.length >= 2 &&
          doc.SMA[doc.SMA.length - 2] !== 0 && // Second last element is not 0
          doc.SMA[doc.SMA.length - 1] >= 1000 // Last element is greater than or equal to 1000
        ) {
          // Check for any fee of 0 in the past 7 days
          const feesLast7Days = doc.fees.slice(-7); // Get fees for the last 7 days
          const hasZeroFee = feesLast7Days.some(fee => fee === 0);

          if (!hasZeroFee) {
            const roundedIncrease = Math.round(doc.rapidIncrease); // Round to nearest whole number
            const lastSMAValue = Math.round(doc.SMA[doc.SMA.length - 1]).toLocaleString(); // Format number with commas
            notifications.push(`Rapid increase of ${roundedIncrease}% in daily fees for ${doc.name} ($${lastSMAValue} 7d SMA)`);
          }
        }
      }

      // Send a single email containing all notifications
      if (notifications.length > 0) {
        await sendBatchedEmailNotification(notifications);
      } else {
        console.log('No valid notifications to send.');
      }
    } else {
      console.log('No documents with rapid increase found.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

module.exports = { getDocumentsWithRapidIncreaseAndSendEmails };