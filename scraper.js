const { chromium } = require('playwright-extra');

// Stealth plugin often forces headed mode. Disable in CI environments.
if (!process.env.CI) {
    const stealth = require('puppeteer-extra-plugin-stealth')();
    chromium.use(stealth);
}

const { saveLeads } = require('./storage');
const fs = require('fs');
const path = require('path');

const DUPE_FILE = path.join(__dirname, 'scraped_leads.json');

function getScrapedHistory() {
    try {
        if (!fs.existsSync(DUPE_FILE)) return [];
        return JSON.parse(fs.readFileSync(DUPE_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function addToHistory(leads) {
    const history = getScrapedHistory();
    const newEntries = leads.map(l => ({ name: l.name, city: l.city }));
    fs.writeFileSync(DUPE_FILE, JSON.stringify([...history, ...newEntries], null, 2));
}

function isDuplicate(name, city, history) {
    return history.some(h => h.name === name && h.city === city);
}

const DIRECTORY_DOMAINS = [
    'yelp.com', 'yellowpages.com', 'yellowbook.com', 'angi.com',
    'facebook.com', 'instagram.com', 'linkedin.com', 'tripadvisor.com',
    'houzz.com', 'thumbtack.com', 'bbb.org', 'crunchbase.com'
];

function isDirectory(url) {
    if (!url) return true;
    try {
        const domain = new URL(url).hostname.toLowerCase();
        return DIRECTORY_DOMAINS.some(d => domain.includes(d));
    } catch (e) {
        return true;
    }
}

async function searchBusinesses(niche, location) {
    console.log(`[SCRAPER VERSION 3.0] Target: Website-Less ${niche} in ${location}`);
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
        const history = getScrapedHistory();

        for (const el of businessElements) {
            const name = await el.getAttribute('aria-label');
            if (!name) continue;

            const city = location.split(',')[0].trim();
            if (isDuplicate(name, city, history)) {
                console.log(`[SCRAPER] Skipping duplicate: ${name} in ${city}`);
                continue;
            }

            const parent = await el.evaluateHandle(node => node.closest('div.Nv2Yzb') || node.parentElement.parentElement);

            // Website Detection & Filtering
            const websiteUrl = await parent.evaluate(p => {
                const link = p.querySelector('a[data-value="Website"]');
                return link ? link.href : null;
            });

            const leadHasRealWebsite = websiteUrl && !isDirectory(websiteUrl);

            if (leadHasRealWebsite) {
                console.log(`[SCRAPER] Discarding ${name} (Has existing website: ${websiteUrl})`);
                continue;
            }

            // Extract review data
            const reviewData = await parent.evaluate(p => {
                const ratingElement = p.querySelector('span.mw43f'); // Common rating selector
                const reviewsElement = p.querySelector('span.UY7F9'); // Common reviews selector

                const rating = ratingElement ? ratingElement.innerText.trim() : '0';
                const reviewsMatch = reviewsElement ? reviewsElement.innerText.match(/\d+/) : null;
                const reviews = reviewsMatch ? reviewsMatch[0] : '0';

                return { rating, reviews };
            });

            // Extract phone number if visible
            const phone = await parent.evaluate(p => {
                const text = p.innerText || '';
                const match = text.match(/(\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
                return match ? match[0].trim() : 'N/A';
            });

            leads.push({
                name,
                niche,
                phone,
                rating: reviewData.rating,
                reviews: reviewData.reviews,
                city,
                country: location.split(',').pop().trim(),
                email: null,
                facebook: null,
                instagram: null,
                whatsapp: null,
                linkedin: null,
                has_website: !!websiteUrl,
                original_website: websiteUrl,
                status: 'new',
                contacted_status: 'pending',
                score: 0, // Initial score, to be calculated by AI/logic
                history: [
                    { event: 'Lead Discovered', timestamp: new Date().toISOString() }
                ]
            });
        }

        // Perspective for future: Check for "Next Page" button if it exists in this view
        // Google Maps usually infinite scrolls, the scroll loop above handles it.
        // For standard SERP, we would look for #pnnext

        if (leads.length > 0) {
            console.log(`[SCRAPER] Found ${leads.length} new leads.`);
            addToHistory(leads);
        }

        return leads;
    } finally {
        await browser.close();
    }
}

module.exports = { searchBusinesses };
