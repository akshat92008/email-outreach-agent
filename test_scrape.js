const { runDailyAutomation } = require('./automation');

async function testScrape() {
    const niche = 'Business Coach';
    const location = 'Los Angeles, California';

    console.log(`🚀 Starting Test Scrape for ${niche} in ${location}...`);
    try {
        await runDailyAutomation(niche, location);
        console.log('✅ Test Scrape Completed successfully!');
    } catch (error) {
        console.error('❌ Test Scrape Failed:', error);
    }
}

testScrape();
