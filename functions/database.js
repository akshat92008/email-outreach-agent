const admin = require('firebase-admin');

if (!admin.apps.length) {
    let serviceAccount = null;
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        }
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT secret:", e.message);
    }

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'agent-4dfcc'
        });
        console.log("Firebase initialized with Service Account.");
    } else {
        admin.initializeApp({
            projectId: 'agent-4dfcc'
        });
        console.log("Firebase initialized with Default App.");
    }
}

const db = admin.firestore();

module.exports = db;
