const { searchBusinesses } = require('./scraper');
const { verifyAndEnrich } = require('./verifier');
const { analyzeWebsite } = require('./analyzer');
const { calculateLeadScore, getLeadLabel, generateOutreach } = require('./outreach');
const { generateDemoWebsite } = require('./demo_generator');
const { saveLeads } = require('./storage');

async function runDailyAutomation(niche, location) {
    console.log(`[AUTOMATION] Starting daily scrape for ${niche} in ${location}...`);

    // 1. Scrape Leads
    const rawLeads = await searchBusinesses(niche, location);
    if (!rawLeads || rawLeads.length === 0) {
        console.log("[AUTOMATION] No new leads found.");
        return;
    }

    const processedLeads = [];

    for (const lead of rawLeads) {
        console.log(`[AUTOMATION] Processing: ${lead.name}`);

        // 2. Enrich & Verify
        let enrichedLead = await verifyAndEnrich(lead);

        // 3. Analyze Website (if any)
        let analysis = null;
        if (enrichedLead.original_website || enrichedLead.has_website) {
            analysis = await analyzeWebsite(enrichedLead.original_website);
        }

        // 4. Score Lead
        enrichedLead.score = calculateLeadScore(enrichedLead, analysis);
        enrichedLead.value_label = getLeadLabel(enrichedLead.score);

        // 5. Generate Outreach
        const outreach = await generateOutreach(enrichedLead);
        enrichedLead.outreach_message = outreach.email.body; // Default to email
        enrichedLead.instagram_dm = outreach.instagramDM;
        enrichedLead.facebook_msg = outreach.facebookMsg;

        // 6. Generate Demo Website (if no website)
        if (!enrichedLead.has_website || enrichedLead.has_website === 'No') {
            const demoPath = generateDemoWebsite(enrichedLead);
            enrichedLead.demo_url = `file://${demoPath}`; // In production, this would be a hosted URL
        }

        enrichedLead.created_at = new Date().toISOString();
        processedLeads.push(enrichedLead);
    }

    // 7. Save to Firestore/Storage
    await saveLeads(processedLeads);
    console.log(`[AUTOMATION] Successfully processed and saved ${processedLeads.length} leads.`);
}

module.exports = { runDailyAutomation };
