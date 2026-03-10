const functions = require('firebase-functions');
const axios = require('axios');

/**
 * Triggers the GitHub Action workflow via the API.
 * This requires a GITHUB_TOKEN to be set in environment variables.
 */
async function triggerCloudScan(niche, location) {
    const GITHUB_TOKEN = (functions.config().github ? functions.config().github.token : null) || process.env.GITHUB_TOKEN;
    const REPO_OWNER = 'akshat92008';
    const REPO_NAME = 'email-outreach-agent';
    const WORKFLOW_ID = 'scrape.yml';

    if (!GITHUB_TOKEN) {
        throw new Error("GITHUB_TOKEN is not configured.");
    }

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/dispatches`;

    try {
        const response = await axios.post(url, {
            ref: 'main',
            inputs: { niche, location }
        }, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        return response.status === 204;
    } catch (error) {
        console.error("Error triggering GitHub Action:", error.response?.data || error.message);
        throw error;
    }
}

module.exports = { triggerCloudScan };
