const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const db = require('./database/database');
const admin = require('firebase-admin');

// Initialize Firebase Admin for local OR GitHub Action Firestore sync
if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
        : null;

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'agent-4dfcc'
        });
    } else {
        admin.initializeApp();
    }
}
const firestore = admin.firestore();

const csvFilePath = path.join(__dirname, 'leads.csv');

const csvWriter = createCsvWriter({
    path: csvFilePath,
    header: [
        {id: 'name', title: 'Business Name'},
        {id: 'niche', title: 'Niche'},
        {id: 'email', title: 'Email'},
        {id: 'facebook', title: 'Facebook Page'},
        {id: 'city', title: 'City'},
        {id: 'country', title: 'Country'},
        {id: 'phone', title: 'Phone'},
        {id: 'reviews', title: 'Reviews'},
        {id: 'status', title: 'Outreach Status'}
    ],
    append: fs.existsSync(csvFilePath)
});

async function saveLeads(leads) {
    if (leads.length === 0) return;
    try {
        // Save to CSV
        await csvWriter.writeRecords(leads);
        console.log(`Saved ${leads.length} leads to CSV: ${csvFilePath}`);

        // Save to SQLite
        const insert = db.prepare(`
            INSERT INTO leads (name, niche, email, facebook, city, country, phone, reviews, score, outreach_message, contacted_status)
            VALUES (@name, @niche, @email, @facebook, @city, @country, @phone, @reviews, @score, @outreach_message, @status)
        `);

        const insertMany = db.transaction((leads) => {
            for (const lead of leads) insert.run(lead);
        });

        insertMany(leads);
        console.log(`Saved ${leads.length} leads to SQLite database.`);

        // Sync to Firestore
        try {
            const batch = firestore.batch();
            leads.forEach((lead) => {
                const docRef = firestore.collection('leads').doc();
                batch.set(docRef, {
                    ...lead,
                    created_at: admin.firestore.FieldValue.serverTimestamp(),
                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
            console.log(`Synced ${leads.length} leads to Firestore.`);
        } catch (fsError) {
            console.warn('Firestore sync failed (check if you are logged in or have FIREBASE_SERVICE_ACCOUNT secret set):', fsError.message);
        }

    } catch (error) {
        console.error('Error saving leads:', error);
    }
}

module.exports = { saveLeads };
