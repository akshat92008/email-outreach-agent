const { searchBusinesses } = require('./scraper');
const { verifyAndEnrich } = require('./verifier');
const { generateMessage, calculateLeadScore } = require('./outreach');
const { saveLeads } = require('./storage');

async function main() {
    const niches = ['plumbers', 'landscapers', 'junk removal']; // Expanded for more results
    const locations = ['Austin, Texas', 'Toronto, Canada', 'Sydney, Australia'];

    for (const niche of niches) {
        for (const location of locations) {
            console.log(`--- Starting process for ${niche} in ${location} ---`);
            
            try {
                const initialLeads = await searchBusinesses(niche, location);
                console.log(`Found ${initialLeads.length} potential leads.`);

                const enrichedLeads = [];
                for (let lead of initialLeads) {
                    lead = await verifyAndEnrich(lead);
                    const { subject, body } = generateMessage(lead);
                    lead.outreach_message = body;
                    lead.score = calculateLeadScore(lead);
                    enrichedLeads.push(lead);
                }

                await saveLeads(enrichedLeads);
                console.log(`Finished processing ${location}`);
            } catch (error) {
                console.error(`Error processing ${niche} in ${location}:`, error);
            }
        }
    }
}

main().catch(console.error);
