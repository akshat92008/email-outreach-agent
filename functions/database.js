const admin = require('firebase-admin');

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
        admin.initializeApp({
            projectId: 'agent-4dfcc'
        });
    }
}

const db = admin.firestore();

module.exports = db;
