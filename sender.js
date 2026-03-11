const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios'); // For external sending APIs (Resend, Twilio, etc)

// Hard Throttling Limits
const DAILY_LIMITS = {
    email: 50,
    instagram: 30,
    linkedin: 30,
    sms: 50
};

/**
 * Validates if the daily sending limit has been reached for a specific channel.
 */
async function checkDailyLimit(channel) {
    const db = getFirestore();
    const today = new Date().toISOString().split('T')[0];
    const limitsRef = db.collection('system_metrics').doc(`limits_${today}`);

    const doc = await limitsRef.get();
    let currentCount = 0;

    if (doc.exists) {
        currentCount = doc.data()[channel] || 0;
    }

    return currentCount < DAILY_LIMITS[channel];
}

/**
 * Increments the daily sent counter for a specific channel.
 */
async function incrementDailyCount(channel) {
    const db = getFirestore();
    const today = new Date().toISOString().split('T')[0];
    const limitsRef = db.collection('system_metrics').doc(`limits_${today}`);

    const increment = require('firebase-admin/firestore').FieldValue.increment(1);
    await limitsRef.set({ [channel]: increment }, { merge: true });
}

/**
 * Simulates sending an email via an API like Resend or SendGrid.
 */
async function sendEmail(lead) {
    const canSend = await checkDailyLimit('email');
    if (!canSend) {
        console.log(`[SENDER] 🛑 Daily Email limit (${DAILY_LIMITS.email}) reached. Skipping ${lead.name}.`);
        return false;
    }

    if (!lead.email) {
        console.log(`[SENDER] ⚠️ No email found for ${lead.name}.`);
        return false;
    }

    console.log(`[SENDER] 📧 Sending Email to ${lead.email} (${lead.name})...`);

    // Placeholder for actual API call, e.g.:
    // await axios.post('https://api.resend.com/emails', { ... });

    // Artificial delay to mimic API latency and prevent rapid firing bans
    await new Promise(resolve => setTimeout(resolve, 1500));

    await incrementDailyCount('email');

    // Update Lead inside CRM
    const db = getFirestore();
    const leadRef = db.collection('leads').doc(lead.id);
    await leadRef.update({
        status: 'contacted',
        last_contacted: new Date().toISOString(),
        contact_channel: 'Email',
        history: require('firebase-admin/firestore').FieldValue.arrayUnion({
            event: 'Outreach Sent',
            channel: 'Email',
            timestamp: new Date().toISOString()
        })
    });

    return true;
}

/**
 * Simulates sending an Instagram DM.
 */
async function sendInstagramDM(lead) {
    const canSend = await checkDailyLimit('instagram');
    if (!canSend) return false;

    if (!lead.instagram) return false;

    console.log(`[SENDER] 📸 Sending Instagram DM to ${lead.instagram} (${lead.name})...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await incrementDailyCount('instagram');

    const db = getFirestore();
    const leadRef = db.collection('leads').doc(lead.id);
    await leadRef.update({
        status: 'contacted',
        last_contacted: new Date().toISOString(),
        contact_channel: 'Instagram',
        history: require('firebase-admin/firestore').FieldValue.arrayUnion({
            event: 'Outreach Sent',
            channel: 'Instagram',
            timestamp: new Date().toISOString()
        })
    });

    return true;
}

/**
 * Simulates sending an SMS.
 */
async function sendSMS(lead) {
    const canSend = await checkDailyLimit('sms');
    if (!canSend) return false;

    if (!lead.phone || lead.phone === 'N/A') return false;

    console.log(`[SENDER] 💬 Sending SMS to ${lead.phone} (${lead.name})...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await incrementDailyCount('sms');

    const db = getFirestore();
    const leadRef = db.collection('leads').doc(lead.id);
    await leadRef.update({
        status: 'contacted',
        last_contacted: new Date().toISOString(),
        contact_channel: 'SMS',
        history: require('firebase-admin/firestore').FieldValue.arrayUnion({
            event: 'Outreach Sent',
            channel: 'SMS',
            timestamp: new Date().toISOString()
        })
    });

    return true;
}

/**
 * Processes the queue of new leads and dispatches outreach based on value.
 */
async function processOutreachQueue() {
    const db = getFirestore();
    console.log(`[QUEUE] Processing daily outreach queue...`);

    const leadsSnapshot = await db.collection('leads')
        .where('status', '==', 'new')
        .where('score', '>=', 50)
        .orderBy('score', 'desc')
        .limit(20)
        .get();

    for (const doc of leadsSnapshot.docs) {
        const lead = doc.data();
        lead.id = doc.id;

        // Try Email first
        if (lead.email) {
            const success = await sendEmail(lead);
            if (success) continue;
        }

        // Try Instagram if Email fails/missing
        if (lead.instagram) {
            const success = await sendInstagramDM(lead);
            if (success) continue;
        }

        // Try SMS as last resort
        if (lead.phone && lead.phone !== 'N/A') {
            await sendSMS(lead);
        }
    }
}

/**
 * Automates the Day 3, Day 7, Day 14 follow-up sequences.
 */
async function processFollowUps() {
    const db = getFirestore();
    const now = new Date();

    console.log(`[FOLLOW-UPS] Checking for scheduled follow-ups...`);

    // Look for Contacted leads that HAVEN'T replied yet
    const leadsSnapshot = await db.collection('leads')
        .where('status', '==', 'contacted')
        .get();

    for (const doc of leadsSnapshot.docs) {
        const lead = doc.data();
        lead.id = doc.id;

        if (!lead.last_contacted) continue;

        const lastContactDate = new Date(lead.last_contacted);
        const diffTime = Math.abs(now - lastContactDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let followUpMessage = null;
        let sequenceStep = 0;

        if (diffDays === 3 && lead.follow_up_step !== 1) {
            followUpMessage = `Hi ${lead.name}, just floating this to the top of your inbox. Did you get a chance to see the previous email regarding your digital presence?`;
            sequenceStep = 1;
        } else if (diffDays === 7 && lead.follow_up_step === 1) {
            followUpMessage = `Hey ${lead.name} team, I know things get busy. We recently helped a similar business double their leads simply by speeding up their website. Let me know if you are open to a quick look.`;
            sequenceStep = 2;
        } else if (diffDays === 14 && lead.follow_up_step === 2) {
            followUpMessage = `Hi ${lead.name}. This will be my last email, but I wanted to make sure you saw the potential here. We can completely revitalize your online booking. If things open up in the future, please reach out!`;
            sequenceStep = 3;
        }

        if (followUpMessage) {
            const canSend = await checkDailyLimit('email');
            if (!canSend) {
                console.log(`[FOLLOW-UPS] 🛑 Daily limit reached. Cannot send follow-up to ${lead.name}.`);
                continue;
            }

            console.log(`[FOLLOW-UPS] 📧 Sending Step ${sequenceStep} Follow-Up to ${lead.email} (${lead.name})`);

            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay
            await incrementDailyCount('email');

            const leadRef = db.collection('leads').doc(lead.id);
            await leadRef.update({
                follow_up_step: sequenceStep,
                last_contacted: now.toISOString(), // Reset the clock for the NEXT follow-up
                history: require('firebase-admin/firestore').FieldValue.arrayUnion({
                    event: `Follow-Up Sequence ${sequenceStep} Sent`,
                    channel: 'Email',
                    timestamp: now.toISOString()
                })
            });
        }
    }
}

module.exports = { checkDailyLimit, incrementDailyCount, sendEmail, processOutreachQueue, processFollowUps };
