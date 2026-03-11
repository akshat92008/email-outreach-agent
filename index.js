const { searchBusinesses } = require('./scraper');
const { verifyAndEnrich } = require('./verifier');
const { analyzeWebsite } = require('./analyzer');
const { detectOpportunities } = require('./opportunity_detector');
const { generateOutreach, calculateLeadScore, getLeadLabel } = require('./outreach');
const { saveLeads } = require('./storage');
const { processOutreachQueue, processFollowUps } = require('./sender');

async function main() {
    const niche = process.env.NICHE || 'Dentist';
    const location = process.env.LOCATION || 'California';

    console.log(`--- [V3.0] AI LEAD GENERATION ENGINE START ---`);
    console.log(`Target: ${niche} in ${location}`);

    try {
        const initialLeads = await searchBusinesses(niche, location);
        console.log(`Found ${initialLeads.length} potential leads.`);

        const enrichedLeads = [];
        for (let lead of initialLeads) {
            console.log(`[PROCESS] Enriching ${lead.name}...`);

            // Step 1: Deep Profile Scrape
            lead = await verifyAndEnrich(lead);

            // Step 2: Website Audit (Technical)
            let analysis = null;
            if (lead.original_website) {
                console.log(`[AUDIT] Analyzing website: ${lead.original_website}`);
                analysis = await analyzeWebsite(lead.original_website);
                lead.website_analysis = analysis;
            }

            // Step 3: AI Opportunity Detection
            console.log(`[AI] Detecting opportunities...`);
            const insight = await detectOpportunities(lead, analysis);
            lead.opportunity_score = insight.opportunity_score;
            lead.opportunity_insight = insight.insight;
            lead.primary_gap = insight.primary_gap;
            lead.lost_customers = insight.lost_customer_estimate;

            // Step 4: Final AI Scoring
            lead.score = calculateLeadScore(lead, analysis, lead.opportunity_score);
            lead.label = getLeadLabel(lead.score);

            // Step 5: Outreach Generation
            const outreach = await generateOutreach(lead);
            lead.outreach_email = outreach.email.body;
            lead.outreach_email_subject = outreach.email.subject;
            lead.outreach_ig = outreach.instagramDM;
            lead.outreach_sms = outreach.sms;

            enrichedLeads.push(lead);
            console.log(`[DONE] ${lead.name} Scored: ${lead.score} (${lead.label})`);
        }

        await saveLeads(enrichedLeads);
        console.log(`Finished processing ${location}`);

        console.log(`--- Starting Daily Outreach & Follow-ups ---`);
        await processOutreachQueue();
        await processFollowUps();
        console.log(`--- All Cloud Operations Complete ---`);

    } catch (error) {
        console.error(`Error processing ${niche} in ${location}:`, error);
    }
}

main().catch(console.error);
