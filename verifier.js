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
 * Executes a targeted Google Dorking search for social profiles using SERP-style queries.
 */
async function googleDorkingSearch(page, businessName, city, site) {
    // Precise format as requested: site:site.com "[Business Name]" "[City]"
    const query = `site:${site} "${businessName}" "${city}"`;
    const SERP_API_KEY = process.env.SERP_API_KEY;

    try {
        if (SERP_API_KEY) {
            console.log(`[DORKING] Using SERP API for ${site}...`);
            // This is a placeholder for actual SERP API integration if provided
            // For now, we continue with stealth playwright as fallback
        }

        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
        
        // Target specifically the first organic result link for the requested site
        const firstLink = await page.evaluate((site) => {
            const links = Array.from(document.querySelectorAll('#search a'));
            const matches = links.find(a => a.href.includes(site) && !a.href.includes('google.com'));
            return matches ? matches.href : null;
        }, site);

        return firstLink;
    } catch (e) {
        console.log(`[DORKING ERROR] ${site}:`, e.message);
        return null;
    }
}

/**
 * Scrapes bio and link-in-bio for emails and whatsapp links with enhanced regex.
 */
async function scrapeSocialBio(page, url) {
    const data = { email: null, whatsapp: null };
    try {
        console.log(`[BIO MINING] Checking: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
        
        const bioText = await page.evaluate(() => {
            // General selectors for bio text across socials
            const selectors = [
                'header section div:nth-child(2) span', // Instagram
                '[data-testid="about_section"]', // Facebook mobile/desktop
                '.profile-bio', // Generic
                'meta[name="description"]' // Meta fallback
            ];
            
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el && el.innerText) return el.innerText;
            }
            
            // Meta description check
            const meta = document.querySelector('meta[name="description"]');
            if (meta) return meta.getAttribute('content');
            
            return document.body.innerText;
        });

        // Advanced Regex for Email
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emailMatches = bioText.match(emailRegex);
        if (emailMatches) data.email = emailMatches[0];

        // WhatsApp specific mining (wa.me, api.whatsapp, or raw digit strings)
        const waLinkRegex = /(wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\d+)/;
        const waLinkMatch = bioText.match(waLinkRegex);
        if (waLinkMatch) {
            data.whatsapp = waLinkMatch[2];
        } else {
            // Fallback: look for phone-like strings in bio that might be whatsapp
            const phoneInBio = bioText.match(/(\+?\d{10,15})/);
            if (phoneInBio) data.whatsapp = phoneInBio[0].replace(/\D/g, '');
        }

        // Deep Link-in-Bio Check (Linktree, Beacons, etc.)
        const linkInBio = await page.evaluate(() => {
            const a = document.querySelector('a[href*="linktr.ee"], a[href*="l.instagram.com"], a[href*="beacons.ai"]');
            return a ? a.href : null;
        });

        if (linkInBio && !data.email) {
            console.log(`[BIO MINING] Following link-in-bio: ${linkInBio}`);
            await page.goto(linkInBio, { waitUntil: 'domcontentloaded', timeout: 10000 });
            const linktreeText = await page.evaluate(() => document.body.innerText);
            const secondaryEmail = linktreeText.match(emailRegex);
            if (secondaryEmail) data.email = secondaryEmail[0];
            
            const secondaryWa = linktreeText.match(waLinkRegex);
            if (secondaryWa && !data.whatsapp) data.whatsapp = secondaryWa[2];
        }
    } catch (e) {
        console.log(`[BIO MINING ERROR] ${url}:`, e.message);
    }
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

        // Step 2: Google Dorking Fallback for Socials
        if (!lead.instagram) {
            console.log("Instagram missing. Running Google Dorking...");
            const dorkedIg = await googleDorkingSearch(page, lead.name, lead.city, 'instagram.com');
            if (dorkedIg) lead.instagram = dorkedIg;
        }
        if (!lead.facebook) {
            console.log("Facebook missing. Running Google Dorking...");
            const dorkedFb = await googleDorkingSearch(page, lead.name, lead.city, 'facebook.com');
            if (dorkedFb) lead.facebook = dorkedFb;
        }

        // Step 3: Social Profile Parsing (Bio & Linktree)
        const socialProfiles = [lead.instagram, lead.facebook].filter(Boolean);
        for (const profileUrl of socialProfiles) {
            console.log(`Analyzing Social Bio: ${profileUrl}...`);
            const bioData = await scrapeSocialBio(page, profileUrl);
            if (bioData.email && !lead.email) lead.email = bioData.email;
            if (bioData.whatsapp && !lead.whatsapp) lead.whatsapp = bioData.whatsapp;
        }

        // Step 4: Website and Contact Extraction (Fallback)
        // Only crawl if it's NOT a directory and we have a URL
        const isDirectory = (url) => {
            const domains = ['yelp.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'yellowpages.com'];
            return domains.some(d => url.includes(d));
        };

        if (websiteToCheck && !websiteToCheck.includes('google.com') && !isDirectory(websiteToCheck)) {
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
        } else {
            console.log("Skipping website crawl (Directory or No Website found)");
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
