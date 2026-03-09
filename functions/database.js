const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'agent-4dfcc'
    });
}

const db = admin.firestore();

module.exports = db;
