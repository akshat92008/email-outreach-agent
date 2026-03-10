const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const db = require('./database');

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// Get all leads
app.get('/leads', async (req, res) => {
    try {
        const snapshot = await db.collection('leads').orderBy('score', 'desc').get();
        const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update lead status
app.patch('/leads/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await db.collection('leads').doc(req.params.id).update({
            contacted_status: status,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const { triggerCloudScan } = require('./github_trigger');

// Trigger new lead scan
app.post('/leads/scan', async (req, res) => {
    const { niche, location } = req.body;
    try {
        await triggerCloudScan(niche, location);
        res.json({ success: true, message: `Scan initiated for ${niche} in ${location}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

exports.api = functions.https.onRequest(app);
