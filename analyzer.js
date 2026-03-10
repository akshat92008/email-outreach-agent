const { chromium } = require('playwright-extra');

async function analyzeWebsite(url) {
    if (!url) return null;

    const analysis = {
        url,
        loadTimeMs: 0,
        hasMobileViewport: false,
        hasSSL: url.startsWith('https'),
        hasBookingSystem: false,
        hasContactForm: false,
        seoScore: 0,
        qualityScore: 100,
        issues: []
    };

    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width: 375, height: 812 }, // Mobile viewport emulation
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        });
        const page = await context.newPage();

        const startTime = Date.now();

        try {
            await page.goto(url, { waitUntil: 'load', timeout: 15000 });
        } catch (e) {
            analysis.issues.push("Website timeout or severe load error.");
            analysis.qualityScore -= 40;
            return analysis;
        }

        analysis.loadTimeMs = Date.now() - startTime;

        // 1. Check Load Speed
        if (analysis.loadTimeMs > 6000) {
            analysis.issues.push("Extremely slow load time (> 6s)");
            analysis.qualityScore -= 30;
        } else if (analysis.loadTimeMs > 3000) {
            analysis.issues.push("Slow load time (> 3s)");
            analysis.qualityScore -= 15;
        }

        // 2. Check Mobile Responsiveness (Meta Viewport)
        const viewportMeta = await page.$('meta[name="viewport"]');
        if (viewportMeta) {
            analysis.hasMobileViewport = true;
        } else {
            analysis.issues.push("Not optimized for mobile (Missing Viewport)");
            analysis.qualityScore -= 20;
        }

        // 3. Check SEO Basics
        const title = await page.title();
        const description = await page.$('meta[name="description"]');
        if (title && title.length > 5) analysis.seoScore += 50;
        if (description) analysis.seoScore += 50;

        if (analysis.seoScore < 100) {
            analysis.issues.push("Poor basic SEO (Missing Title/Description)");
            analysis.qualityScore -= 10;
        }

        // 4. Feature Detection (Forms & Booking)
        const pageContent = await page.content();
        const html = pageContent.toLowerCase();

        if (html.includes('calendly.com') || html.includes('acuityscheduling') || html.includes('book online') || html.includes('schedule appointment')) {
            analysis.hasBookingSystem = true;
        } else {
            analysis.issues.push("Missing direct online booking system");
            analysis.qualityScore -= 10;
        }

        const forms = await page.$$('form');
        if (forms.length > 0) analysis.hasContactForm = true;

        if (!analysis.hasSSL) {
            analysis.issues.push("Unsecured connection (Missing SSL/HTTPS)");
            analysis.qualityScore -= 20;
        }

        // Floor the score
        analysis.qualityScore = Math.max(0, analysis.qualityScore);

        return analysis;

    } catch (e) {
        console.error(`[ANALYZER] Error scanning ${url}:`, e.message);
        return analysis;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { analyzeWebsite };
