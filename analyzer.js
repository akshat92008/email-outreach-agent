const { chromium } = require('playwright-extra');

async function analyzeWebsite(url) {
    if (!url) return { score: 0, report: "No website provided." };

    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();

        // 1. SSL & Security Check
        const isSsl = url.startsWith('https');

        const startTime = Date.now();
        await page.goto(url, { waitUntil: 'load', timeout: 20000 });
        const loadTime = Date.now() - startTime;

        // 2. Page Speed Score (Mock/Simple logic: < 3s is good)
        let speedScore = loadTime < 3000 ? 100 : Math.max(0, 100 - (loadTime - 3000) / 100);

        // 3. Mobile Responsiveness (Check if viewport scaling exists)
        const hasViewport = await page.evaluate(() => {
            const viewport = document.querySelector('meta[name="viewport"]');
            return !!viewport;
        });

        // 4. SEO Basics
        const seoData = await page.evaluate(() => {
            return {
                title: document.title,
                hasDescription: !!document.querySelector('meta[name="description"]'),
                h1Count: document.querySelectorAll('h1').length
            };
        });

        // 5. Modern Features Check
        const features = await page.evaluate(() => {
            const text = document.body.innerText.toLowerCase();
            return {
                hasContactForm: !!document.querySelector('form'),
                hasBooking: text.includes('book') || text.includes('schedule') || text.includes('appointment'),
                isOutdated: text.includes('© 2020') || text.includes('© 2019') || text.includes('© 2018')
            };
        });

        // Calculate Overall Quality Score (0-100)
        let qualityScore = 0;
        if (isSsl) qualityScore += 10;
        if (hasViewport) qualityScore += 20;
        if (seoData.title && seoData.hasDescription) qualityScore += 20;
        if (features.hasContactForm) qualityScore += 10;
        if (speedScore > 80) qualityScore += 20;
        if (!features.isOutdated) qualityScore += 20;

        const report = {
            url,
            isSsl,
            loadTimeMs: loadTime,
            mobileReady: hasViewport,
            seo: seoData,
            features,
            qualityScore: Math.round(qualityScore)
        };

        return report;
    } catch (e) {
        console.error(`Analysis failed for ${url}:`, e.message);
        return { score: 0, error: e.message };
    } finally {
        await browser.close();
    }
}

module.exports = { analyzeWebsite };
