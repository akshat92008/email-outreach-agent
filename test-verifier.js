const { verifyAndEnrich } = require('./verifier');

async function testVerifier() {
    console.log("Starting test...");
    
    // Create a dummy lead for a real company (e.g., Apple) to test website finding and extraction
    const testLead = {
        name: "Apple Store",
        city: "Seattle",
        country: "USA",
        email: "Pending Verification",
        phone: "N/A"
    };

    try {
        const enrichedLead = await verifyAndEnrich(testLead);
        console.log("\n--- TEST RESULT ---");
        console.log(JSON.stringify(enrichedLead, null, 2));
    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        console.log("Exiting test.");
        process.exit(0);
    }
}

testVerifier();
