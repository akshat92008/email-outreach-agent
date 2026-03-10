const { getFirestore } = require('firebase-admin/firestore');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Requires Google AI Studio API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes an inbound reply from a lead to determine intent.
 * Intended to be called by a webhook (e.g., SendGrid/Resend inbound parse).
 */
async function analyzeReplyIntent(leadName, replyText) {
    if (!process.env.GEMINI_API_KEY) {
        console.log('[AI SALES] Warning: GEMINI_API_KEY missing. Falling back to keyword analysis.');
        return fallbackKeywordAnalysis(replyText);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            You are an AI Sales Assistant analyzing an email reply from a lead named ${leadName}.
            
            Reply: "${replyText}"
            
            Analyze the intent of this reply. Is the lead:
            1. "Interested" (Positive, asking for demo, prices, or a call)
            2. "Not Interested" (Negative, unsubscribe, stop emailing)
            3. "Question" (Asking for more info before deciding)
            4. "Neutral" (Out of office, auto-reply, vague)

            Return ONLY a valid JSON object matching exactly this structure:
            {
                "intent": "Interested" | "Not Interested" | "Question" | "Neutral",
                "summary": "A 1-sentence summary of what they said",
                "confidence": 0-100
            }
        `;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Extract JSON from potential markdown formatting
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return fallbackKeywordAnalysis(replyText);
    } catch (error) {
        console.error('[AI SALES] Gemini Intent Analysis Error:', error);
        return fallbackKeywordAnalysis(replyText);
    }
}

/**
 * Fallback intent analysis if Gemini API is unavailable.
 */
function fallbackKeywordAnalysis(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('unsubscribe') || lowerText.includes('stop') || lowerText.includes('not interested') || lowerText.includes('no thanks')) {
        return { intent: "Not Interested", summary: "Lead explicitly opted out via keywords.", confidence: 90 };
    }
    if (lowerText.includes('yes') || lowerText.includes('demo') || lowerText.includes('call') || lowerText.includes('interested') || lowerText.includes('how much')) {
        return { intent: "Interested", summary: "Keywords suggest interest in a demo or discussion.", confidence: 75 };
    }

    return { intent: "Neutral", summary: "Could not definitively determine intent via keywords.", confidence: 50 };
}

/**
 * Generates an automated response based on the detected intent.
 */
async function draftResponse(leadName, intentInfo) {
    const CALENDAR_LINK = "https://calendly.com/your-agency/demo";

    if (intentInfo.intent === "Interested") {
        return `Hi ${leadName},\n\nThat sounds great! I'd love to show you a quick demo of what we can do for your business.\n\nYou can pick a time that works best for you right here: ${CALENDAR_LINK}\n\nLooking forward to speaking with you!\n\nBest,\nYour Agency`;
    }
    else if (intentInfo.intent === "Not Interested") {
        return null; // Do not reply
    }

    // For questions or neutral, Gemini would dynamically draft the response in a full implementation.
    // For now, return a placeholder that a human should review.
    return `[DRAFT - REQUIRES HUMAN REVIEW]\nHi ${leadName}. Thanks for reaching out. ${intentInfo.summary}`;
}

/**
 * Main Webhook Handler Simulator.
 * Takes an inbound message, determines intent, updates the CRM, and drafts a reply.
 */
async function processInboundReply(leadId, leadName, replyText) {
    const db = getFirestore();
    console.log(`[AI SALES] Processing reply from ${leadName}...`);

    const analysis = await analyzeReplyIntent(leadName, replyText);
    console.log(`[AI SALES] Detected Intent: ${analysis.intent} (${analysis.confidence}%)`);

    let dbUpdate = {
        status: 'Replied',
        last_reply: new Date().toISOString(),
        ai_intent: analysis.intent,
        ai_summary: analysis.summary,
        history: require('firebase-admin/firestore').FieldValue.arrayUnion({
            event: `Reply Received: ${analysis.intent}`,
            details: analysis.summary,
            timestamp: new Date().toISOString()
        })
    };

    // If interested, draft a response and potentially auto-send or queue for human review
    if (analysis.intent === "Interested" || analysis.intent === "Question") {
        const draftedResponse = await draftResponse(leadName, analysis);
        if (draftedResponse) {
            dbUpdate.ai_drafted_response = draftedResponse;
            console.log(`[AI SALES] Drafted response for ${leadName}. Saved to CRM.`);
            // In production: await sendEmail(leadEmail, draftedResponse);
        }
    }

    if (analysis.intent === "Not Interested") {
        dbUpdate.status = "Lost";
        console.log(`[AI SALES] Lead ${leadName} marked as Lost.`);
    }

    const leadRef = db.collection('leads').doc(leadId);
    await leadRef.update(dbUpdate);

    return analysis;
}

module.exports = { analyzeReplyIntent, processInboundReply };
