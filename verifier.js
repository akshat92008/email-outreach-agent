const { chromium } = require('playwright-extra');

// Regex Patterns as specified by the user
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

/**
 * Cleans extracted strings to remove HTML artifacts and trailing spaces.
 */
function cleanData(dataArray) {
    if (!dataArray || dataArray.length === 0) return null;
    // Remove duplicates and clean
    const uniqueCleaned = [...new Set(dataArray.map(item => item.trim().replace(/['">]/g, '')))];
    return uniqueCleaned.length > 0 ? uniqueCleaned[0] : null;
}

/**
 * Extracts contact info from a single page using attributes and regex.
 */
async function extractContactInfo(page) {
    let emails = [];
    let phones = [];

    // 1. HTML Attribute Targeting (mailto: and tel:)
    try {
        const mailtoLinks = await page.$$eval('a[href^="mailto:"]', links => links.map(a => a.href.replace('mailto:', '')));
        if (mailtoLinks.length > 0) emails.push(...mailtoLinks);

        const telLinks = await page.$$eval('a[href^="tel:"]', links => links.map(a => a.href.replace('tel:', '')));
        if (telLinks.length > 0) phones.push(...telLinks);

        const instaLinks = await page.$$eval('a[href*="instagram.com"]', links => links.map(a => a.href));
        const fbLinks = await page.$$eval('a[href*="facebook.com"]', links => links.map(a => a.href));
        
        contactData.email = cleanData(emails);
        contactData.phone = cleanData(phones);
        contactData.instagram = cleanData(instaLinks);
        contactData.facebook = cleanData(fbLinks);

    } catch (e) {
        // Ignore evaluation errors
    }

    // 2. Regex Pattern Matching on HTML Body
    try {
        const bodyText = await page.evaluate(() => document.body.innerText || document.body.textContent);
        if (bodyText) {
            const regexEmails = bodyText.match(EMAIL_REGEX);
            if (regexEmails) {
                const cleaned = cleanData(regexEmails);
                if (cleaned && !contactData.email) contactData.email = cleaned;
            }

            const regexPhones = bodyText.match(PHONE_REGEX);
            if (regexPhones) {
                const cleaned = cleanData(regexPhones);
                if (cleaned && !contactData.phone) contactData.phone = cleaned;
            }
        }
    } catch (e) {
        // Ignore rendering errors
    }

    return contactData;
}

async function verifyAndEnrich(lead, targetUrl = null) {
    const browser = await chromium.launch({ headless: true });
    
    try {
        const page = await browser.newPage();
        
        let websiteToCheck = targetUrl;

        // If no url provided, perform a quick Google Search to find one
        if (!websiteToCheck) {
            console.log(`Searching for website: ${lead.name}`);
            const searchQuery = `${lead.name} ${lead.city} ${lead.country} official website`;
            try {
                await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
                websiteToCheck = await page.$eval('#search a', a => a.href).catch(() => null);
                if (websiteToCheck && websiteToCheck.includes('facebook.com')) {
                    lead.facebook = websiteToCheck;
                }
            } catch (e) {
                console.log("Google search failed or timed out:", e.message);
            }
        }

        if (!websiteToCheck || websiteToCheck.includes('google.com')) {
            console.log(`No valid website found for: ${lead.name}`);
            lead.email = null;
            lead.phone = null;
            await browser.close();
            return lead;
        }

        console.log(`Crawling: ${websiteToCheck}`);
        
        try {
            await page.goto(websiteToCheck, { waitUntil: 'domcontentloaded', timeout: 10000 });
        } catch (e) {
            console.log(`Failed to load ${websiteToCheck}:`, e.message);
            lead.email = null;
            lead.phone = null;
            await browser.close();
            return lead;
        }

        // Try extracting from the landing page
        console.log("Extracting from landing page...");
        let contactData = await extractContactInfo(page);

        // Step 1: Expand Crawl Depth if needed
        if (!contactData.email || !contactData.phone) {
            console.log(`Initial page missing data. Expanding crawl depth for ${lead.name}...`);
            
            // Find secondary links
            const targetStrings = ['/contact', '/contact-us', '/about', '/team'];
            const links = await page.$$eval('a', (anchors, targetStrings) => {
                return anchors
                    .filter(a => a.href && targetStrings.some(str => a.href.toLowerCase().includes(str)))
                    .map(a => a.href);
            }, targetStrings).catch(() => []);

            const uniqueLinks = [...new Set(links)].slice(0, 2); // Limit to 2 pages

            for (const link of uniqueLinks) {
                if (contactData.email && contactData.phone) break;
                
                console.log(`   -> Checking subpage: ${link}`);
                try {
                    await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 10000 });
                    console.log(`   -> Extracting from subpage...`);
                    const deepData = await extractContactInfo(page);
                    
                    if (!contactData.email && deepData.email) contactData.email = deepData.email;
                    if (!contactData.phone && deepData.phone) contactData.phone = deepData.phone;
                } catch (e) {
                    console.log(`   -> Failed to load or extract subpage: ${link}`, e.message);
                }
            }
        }

        lead.email = contactData.email;
        if (!lead.instagram) lead.instagram = contactData.instagram;
        if (!lead.facebook) lead.facebook = contactData.facebook;
        if (!lead.phone || lead.phone === 'N/A') {
            lead.phone = contactData.phone;
        }

        if (!lead.history) lead.history = [];
        lead.history.push({ event: 'Verification Completed', timestamp: new Date().toISOString() });

    } catch (globalError) {
        console.error("Global verifier error:", globalError);
    } finally {
        console.log("Closing browser...");
        await browser.close().catch(e => console.error("Error closing browser:", e));
    }
    
    return lead;
}

module.exports = { verifyAndEnrich };
