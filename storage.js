const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const db = require('./database/database');
const admin = require('firebase-admin');

// Initialize Firebase Admin for local OR GitHub Action Firestore sync
if (!admin.apps.length) {
    let serviceAccount = null;
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        }
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT secret in storage.js:", e.message);
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'agent-4dfcc'
        });
        console.log("Firebase storage initialized with Service Account.");
    } else {
        admin.initializeApp();
        console.log("Firebase storage initialized with Default App.");
    }
}
const firestore = admin.firestore();

const csvFilePath = path.join(__dirname, 'leads.csv');

const csvWriter = createCsvWriter({
    path: csvFilePath,
    header: [
        { id: 'name', title: 'Business Name' },
        { id: 'niche', title: 'Niche' },
        { id: 'email', title: 'Email' },
        { id: 'facebook', title: 'Facebook Page' },
        { id: 'city', title: 'City' },
        { id: 'country', title: 'Country' },
        { id: 'phone', title: 'Phone' },
        { id: 'reviews', title: 'Reviews' },
        { id: 'status', title: 'Outreach Status' }
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
            VALUES (@name, @niche, @email, @facebook, @city, @country, @phone, @reviews, @score, @outreach_email, @status)
        `);

        const insertMany = db.transaction((leads) => {
            for (const lead of leads) {
                // Map object properties to SQL parameters to avoid Missing Parameter errors
                const params = {
                    name: lead.name || '',
                    niche: lead.niche || '',
                    email: lead.email || '',
                    facebook: lead.facebook || '',
                    city: lead.city || '',
                    country: lead.country || '',
                    phone: lead.phone || '',
                    reviews: String(lead.reviews || '0'),
                    score: lead.score || 0,
                    outreach_email: lead.outreach_email || '',
                    status: lead.status || 'new'
                };
                insert.run(params);
            }
        });

        insertMany(leads);
        console.log(`Saved ${leads.length} leads to SQLite database.`);

        // Sync to Firestore
        try {
            console.log(`[FIREBASE] Starting sync for ${leads.length} leads...`);
            const batch = firestore.batch();

            leads.forEach((lead) => {
                // Sanitize data: Firestore does not allow 'undefined' values
                const sanitizedLead = {};
                Object.keys(lead).forEach(key => {
                    const value = lead[key];
                    if (value !== undefined) {
                        sanitizedLead[key] = value;
                    } else {
                        // Provide defaults for critical missing AI fields
                        if (key === 'opportunity_score' || key === 'score') sanitizedLead[key] = 0;
                        else sanitizedLead[key] = null;
                    }
                });

                const docRef = firestore.collection('leads').doc();
                batch.set(docRef, {
                    ...sanitizedLead,
                    created_at: admin.firestore.FieldValue.serverTimestamp(),
                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
            console.log(`[FIREBASE] ✅ Successfully synced ${leads.length} leads to Firestore.`);
        } catch (fsError) {
            console.error('[FIREBASE] ❌ Firestore sync failed!');
            console.error('[FIREBASE] Error Code:', fsError.code);
            console.error('[FIREBASE] Error Message:', fsError.message);
            // Log full error for metadata diagnostics if it's a gRPC error
            if (fsError.metadata) {
                console.error('[FIREBASE] Error Metadata:', JSON.stringify(fsError.metadata, null, 2));
            }
        }

    } catch (error) {
        console.error('Error saving leads:', error);
    }
}

module.exports = { saveLeads };
