const { GoogleGenerativeAI } = require("@google/generative-ai");

async function detectOpportunities(lead, analysis) {
    if (!process.env.GEMINI_API_KEY) return { score: 0, insight: "API Key missing" };

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Analyze this business lead and website audit to identify high-value sales opportunities.
    
    Business: ${lead.name}
    Niche: ${lead.niche}
    Reviews: ${lead.reviews} (Rating: ${lead.rating})
    Website Original: ${lead.original_website || 'None'}
    
    Audit Results:
    ${analysis ? JSON.stringify(analysis, null, 2) : 'No website found.'}
    
    Identify if this business is a "Diamond in the Rough" (High reviews, but poor or no digital presence).
    
    Return a JSON object:
    {
        "opportunity_score": 0-100,
        "primary_gap": "e.g. No Website, Slow Speed, No Booking",
        "insight": "1-2 sentence explanation of the opportunity",
        "lost_customer_estimate": "Estimated customers lost per month (e.g. 10-20)"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean markdown if present
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { opportunity_score: 0, insight: "Failed to parse AI response" };
    } catch (e) {
        console.error("[OPPORTUNITY DETECTOR] Error:", e.message);
        return { opportunity_score: 0, insight: "AI Analysis Error" };
    }
}

module.exports = { detectOpportunities };
