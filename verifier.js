const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

async function verifyAndEnrich(lead) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log(`Verifying: ${lead.name}`);
    
    // Search for the business name on Google
    const searchQuery = `${lead.name} ${lead.city} ${lead.country}`;
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
    
    // Simple check: Look for "Facebook" or contact info in search results
    const content = await page.content();
    
    // Look for Facebook page
    const fbMatch = content.match(/facebook\.com\/([a-zA-Z0-9.]+)/);
    if (fbMatch) {
        lead.facebook = `https://www.facebook.com/${fbMatch[1]}`;
    }

    // Rough email extraction (very basic, usually requires visiting specific pages)
    const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
        lead.email = emailMatch[0];
    }

    // Verify website absence: If the first few results contain a clear official domain (not yelp, yellowpages, etc.)
    // this is a heuristic. For now, we trust Google Maps' "missing website" more but this adds a check.
    // In a real scenario, we'd check if the search result domain matches the business name closely.

    await browser.close();
    return lead;
}

module.exports = { verifyAndEnrich };
