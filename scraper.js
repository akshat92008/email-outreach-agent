const { chromium } = require('playwright-extra');

// Stealth plugin often forces headed mode. Disable in CI environments.
if (!process.env.CI) {
    const stealth = require('puppeteer-extra-plugin-stealth')();
    chromium.use(stealth);
}

const { saveLeads } = require('./storage');

async function searchBusinesses(niche, location) {
    console.log(`[SCRAPER VERSION 2.0] Starting search for ${niche} in ${location}`);
    const browser = await chromium.launch({ 
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ] 
    }); 
    try {
        const page = await browser.newPage();
        
        const query = `${niche} in ${location}`;
        console.log(`[SCRAPER] Query: ${query}`);
        
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`);
        
        // Wait for results
        try {
            await page.waitForSelector('a.hfpxzc', { timeout: 15000 });
        } catch (e) {
            console.log('No results found.');
            return [];
        }

        // Scroll to load more results
        for (let i = 0; i < 10; i++) {
            await page.evaluate(() => {
                const feed = document.querySelector('div[role="feed"]');
                if (feed) feed.scrollTop = feed.scrollHeight;
            });
            await page.waitForTimeout(1500);
        }

        await page.screenshot({ path: `debug_${niche.replace(/\s+/g, '_')}_${location.replace(/\s+/g, '_')}.png` });
        
        const businessElements = await page.$$('a.hfpxzc');
        const leads = [];

        for (const el of businessElements) {
            const name = await el.getAttribute('aria-label');
            if (!name) continue;

            const parent = await el.evaluateHandle(node => node.closest('div.Nv2Yzb') || node.parentElement.parentElement);
            
            // Check if website exists - more robust check
            const hasWebsite = await parent.evaluate(p => {
                const links = Array.from(p.querySelectorAll('a'));
                return links.some(a => 
                    (a.textContent && a.textContent.toLowerCase().includes('website')) ||
                    (a.ariaLabel && a.ariaLabel.toLowerCase().includes('website'))
                );
            });

                leads.push({
                    name,
                    niche,
                    phone,
                    reviews,
                    city: location.split(',')[0].trim(),
                    country: location.split(',').pop().trim(),
                    email: null,
                    facebook: null,
                    status: 'pending',
                    contacted_status: 'pending',
                    score: Math.floor(Math.random() * 10) + 1, // Simulated initial score
                    history: [
                        { event: 'Lead Discovered', timestamp: new Date().toISOString() }
                    ]
                });
        }
        return leads;
    } finally {
        await browser.close();
    }
}

module.exports = { searchBusinesses };
