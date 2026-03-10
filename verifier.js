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

/**
 * Extracts social profiles from Google Knowledge Graph containers.
 */
async function extractKnowledgeGraphProfiles(page) {
    return await page.evaluate(() => {
        const socialLinks = {};
        // Knowledge Graph social indicators
        const profileSelectors = [
            '[data-attrid="kc:/common/topic:social_media_presence"] a',
            '.kp-header a[href*="instagram.com"]',
            '.kp-header a[href*="facebook.com"]',
            '.kp-header a[href*="linkedin.com"]'
        ];
        
        profileSelectors.forEach(selector => {
            const links = Array.from(document.querySelectorAll(selector));
            links.forEach(link => {
                if (link.href.includes('instagram.com')) socialLinks.instagram = link.href;
                if (link.href.includes('facebook.com')) socialLinks.facebook = link.href;
                if (link.href.includes('linkedin.com')) socialLinks.linkedin = link.href;
            });
        });
        return socialLinks;
    }).catch(() => ({}));
}

/**
 * Executes a targeted Google Dorking search for social profiles.
 */
async function googleDorkingSearch(page, businessName, city, site) {
    const query = `${businessName} ${city} site:${site}`;
    try {
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
        const firstLink = await page.$eval('#search a[href*="' + site + '"]', a => a.href).catch(() => null);
        return firstLink;
    } catch (e) {
        return null;
    }
}

/**
 * Scrapes bio and link-in-bio for emails and whatsapp links.
 */
async function scrapeSocialBio(page, url) {
    const data = { email: null, whatsapp: null };
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        const bioText = await page.evaluate(() => {
            const bioElement = document.querySelector('header section div:nth-child(2) span') || // IG bio
                               document.querySelector('[data-testid="about_section"]') || // FB About
                               document.body;
            return bioElement ? bioElement.innerText : '';
        });

        // Regex for Email & WhatsApp
        const emailMatch = bioText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) data.email = emailMatch[0];

        const waMatch = bioText.match(/(wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\d+)/);
        if (waMatch) data.whatsapp = waMatch[2];

        // Check for linktree or other link-in-bios
        const externalLink = await page.$eval('a[href*="linktr.ee"], a[href*="l.instagram.com"]', a => a.href).catch(() => null);
        if (externalLink && !data.email) {
            await page.goto(externalLink, { waitUntil: 'domcontentloaded', timeout: 8000 });
            const linktreeText = await page.evaluate(() => document.body.innerText);
            const secondaryEmail = linktreeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (secondaryEmail) data.email = secondaryEmail[0];
        }
    } catch (e) {}
    return data;
}

async function verifyAndEnrich(lead, targetUrl = null) {
    const browser = await chromium.launch({ headless: true });
    
    try {
        const page = await browser.newPage();
        let websiteToCheck = targetUrl;

        // Step 1: Search Google & Extract Knowledge Graph Profiles
        console.log(`Deep searching for: ${lead.name}`);
        const searchQuery = `${lead.name} ${lead.city} ${lead.country}`;
        try {
            await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
            
            // Extract from Knowledge Graph
            const kgProfiles = await extractKnowledgeGraphProfiles(page);
            if (kgProfiles.instagram) lead.instagram = kgProfiles.instagram;
            if (kgProfiles.facebook) lead.facebook = kgProfiles.facebook;
            if (kgProfiles.linkedin) lead.linkedin = kgProfiles.linkedin;

            if (!websiteToCheck) {
                websiteToCheck = await page.$eval('#search a', a => a.href).catch(() => null);
            }
        } catch (e) {
            console.log("Initial Google deep search error:", e.message);
        }

        // Step 2: Google Dorking Fallback for Instagram
        if (!lead.instagram) {
            console.log("Instagram missing. Running Google Dorking...");
            const dorkedIg = await googleDorkingSearch(page, lead.name, lead.city, 'instagram.com');
            if (dorkedIg) lead.instagram = dorkedIg;
        }

        // Step 3: Social Profile Parsing (Bio & Linktree)
        if (lead.instagram) {
            console.log("Analyzing Instagram Bio...");
            const bioData = await scrapeSocialBio(page, lead.instagram);
            if (bioData.email && !lead.email) lead.email = bioData.email;
            if (bioData.whatsapp) lead.whatsapp = bioData.whatsapp;
        }

        // Step 4: Website and Contact Extraction (Fallback)
        if (websiteToCheck && !websiteToCheck.includes('google.com')) {
            console.log(`Crawling website: ${websiteToCheck}`);
            try {
                await page.goto(websiteToCheck, { waitUntil: 'domcontentloaded', timeout: 10000 });
                const contactData = await extractContactInfo(page);
                
                if (!lead.email) lead.email = contactData.email;
                if (!lead.phone || lead.phone === 'N/A') lead.phone = contactData.phone;
                if (!lead.instagram) lead.instagram = contactData.instagram;
                if (!lead.facebook) lead.facebook = contactData.facebook;

            } catch (e) {
                console.log(`Website crawl failed: ${websiteToCheck}`);
            }
        }

        // Step 5: WhatsApp Formatting (E.164)
        if (lead.phone && lead.phone !== 'N/A') {
            const digits = lead.phone.replace(/\D/g, '');
            // Simple heuristic for WhatsApp registration prep (formatting only)
            if (digits.length >= 10) {
                lead.whatsapp_ready_number = digits;
            }
        }

        if (!lead.history) lead.history = [];
        lead.history.push({ event: 'Advanced Intelligence Extraction Completed', timestamp: new Date().toISOString() });

    } catch (globalError) {
        console.error("Global verifier error:", globalError);
    } finally {
        await browser.close().catch(e => console.error("Error closing browser:", e));
    }
    
    return lead;
}

module.exports = { verifyAndEnrich };
