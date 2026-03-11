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

        // 1. Performance Scoring (Lighthouse-style weights)
        if (analysis.loadTimeMs > 6000) {
            analysis.issues.push("Critical: Extremely slow load time (> 6s)");
            analysis.qualityScore -= 40;
        } else if (analysis.loadTimeMs > 3000) {
            analysis.issues.push("Warning: Slow load time (> 3s)");
            analysis.qualityScore -= 20;
        }

        // 2. Mobile & UX
        const viewportMeta = await page.$('meta[name="viewport"]');
        if (viewportMeta) {
            analysis.hasMobileViewport = true;
        } else {
            analysis.issues.push("UX: Not optimized for mobile (Missing Viewport Meta)");
            analysis.qualityScore -= 25;
        }

        // 3. SEO Audit
        const title = await page.title();
        const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => null);
        const h1Count = await page.$$eval('h1', tags => tags.length);

        if (title && title.length > 10) analysis.seoScore += 30;
        if (description && description.length > 30) analysis.seoScore += 30;
        if (h1Count === 1) analysis.seoScore += 40;
        else if (h1Count === 0) analysis.issues.push("SEO: Missing H1 Tag");
        else if (h1Count > 1) analysis.issues.push("SEO: Multiple H1 Tags (Confusing for Google)");

        if (analysis.seoScore < 100) {
            analysis.qualityScore -= 15;
        }

        // 4. Conversion & Trust Signals (CTAs, Booking, SSL)
        const pageContent = await page.content();
        const html = pageContent.toLowerCase();

        // Detect booking systems
        const bookingKeywords = ['calendly.com', 'acuityscheduling', 'book online', 'schedule appointment', 'reserver', 'booking'];
        if (bookingKeywords.some(k => html.includes(k))) {
            analysis.hasBookingSystem = true;
        } else {
            analysis.issues.push("Conversion: No direct online booking system detected");
            analysis.qualityScore -= 15;
        }

        // Detect SSL
        if (!analysis.hasSSL) {
            analysis.issues.push("Security: Unsecured connection (Missing SSL/HTTPS)");
            analysis.qualityScore -= 30;
        }

        // Detect Contact Forms
        const forms = await page.$$('form');
        const hasVisibleForm = forms.length > 0;
        if (!hasVisibleForm) {
            analysis.issues.push("Conversion: No visible contact form for lead capture");
            analysis.qualityScore -= 10;
        }

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
