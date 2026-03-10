const { searchBusinesses } = require('./scraper');
const { verifyAndEnrich } = require('./verifier');
const { generateOutreach, calculateLeadScore } = require('./outreach');
const { saveLeads } = require('./storage');
const { processOutreachQueue, processFollowUps } = require('./sender');

async function main() {
    const niche = process.env.NICHE || 'Dentist';
    const location = process.env.LOCATION || 'California';

    console.log(`--- Starting process for ${niche} in ${location} ---`);

    try {
        const initialLeads = await searchBusinesses(niche, location);
        console.log(`Found ${initialLeads.length} potential leads.`);

        const enrichedLeads = [];
        for (let lead of initialLeads) {
            lead = await verifyAndEnrich(lead);
            const outreach = await generateOutreach(lead);
            lead.outreach_email = outreach.email.body;
            lead.outreach_email_subject = outreach.email.subject;
            lead.outreach_ig = outreach.instagramDM;
            lead.outreach_fb = outreach.facebookMsg;
            lead.outreach_linkedin = outreach.linkedinMsg;
            lead.outreach_sms = outreach.sms;
            lead.score = calculateLeadScore(lead, lead.website_analysis);
            enrichedLeads.push(lead);
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
