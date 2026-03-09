const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
const { saveLeads } = require('./storage');

async function searchBusinesses(niche, location) {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }); 
    try {
        const page = await browser.newPage();
        
        const query = `${niche} in ${location}`;
        console.log(`Searching for: ${query}`);
        
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

            if (!hasWebsite) {
                const phone = await parent.$$eval('div.W4E79', divs => {
                    const phoneRegex = /\+?[\d\s-]{10,}/;
                    for (const div of divs) {
                        const match = div.textContent.match(phoneRegex);
                        if (match) return match[0];
                    }
                    return 'N/A';
                }).catch(() => 'N/A');

                const reviews = await parent.$eval('span.UY7F9', span => span.textContent.replace(/[()]/g, '').trim()).catch(() => '0');
                
                leads.push({
                    name,
                    niche,
                    phone,
                    reviews,
                    city: location.split(',')[0].trim(),
                    country: location.split(',').pop().trim(),
                    email: 'Pending Verification',
                    facebook: 'Pending Verification',
                    status: 'pending'
                });
            }
        }
        return leads;
    } finally {
        await browser.close();
    }
}

module.exports = { searchBusinesses };
