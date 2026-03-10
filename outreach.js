/**
 * Calculates a lead score from 0-100 based on multiple factors.
 */
function calculateLeadScore(lead, analysis = null) {
    let score = 0;

    // 1. Website Status (Max 40 points)
    if (!lead.has_website || lead.has_website === 'No') {
        score += 40; // High priority for businesses with NO website
    } else if (analysis && analysis.qualityScore < 50) {
        score += 25; // Good priority for businesses with BAD websites
    } else if (analysis && analysis.qualityScore < 75) {
        score += 10;
    }

    // 2. Business Reputation (Max 30 points)
    const reviews = parseInt(lead.reviews || 0);
    const rating = parseFloat(lead.rating || 0);

    if (rating >= 4.0) score += 10;
    if (reviews > 50) score += 20;
    else if (reviews > 20) score += 10;
    else if (reviews > 5) score += 5;

    // 3. Location & Niche (Max 30 points)
    const premiumCountries = ['USA', 'UK', 'Canada', 'Australia', 'United Arab Emirates'];
    if (lead.country && premiumCountries.some(c => lead.country.includes(c))) {
        score += 15;
    }

    // Niche profitability (Simple heuristic)
    const highValueNiches = ['Dentist', 'Lawyer', 'Plumbing', 'Real Estate', 'Roofing', 'Medical'];
    if (lead.niche && highValueNiches.some(n => lead.niche.toLowerCase().includes(n.toLowerCase()))) {
        score += 15;
    }

    return Math.min(100, score);
}

function getLeadLabel(score) {
    if (score >= 80) return 'High Value Lead';
    if (score >= 50) return 'Medium Value Lead';
    return 'Low Value Lead';
}

/**
 * Generates personalized outreach messages using AI (simulated with templates for now, 
 * but structured for Gemini integration).
 */
async function generateOutreach(lead, senderName = 'Your Agency') {
    const { name, niche, city, reviews, rating, has_website } = lead;

    const context = has_website ?
        `I noticed your current website could use some improvements in speed and mobile design.` :
        `I noticed your business doesn't have a website yet, which might be costing you customers in ${city}.`;

    const email = {
        subject: `Digital Growth for ${name}`,
        body: `Hi ${name} team,

I was looking at ${niche || 'businesses'} in ${city} and saw ${name} has fantastic reviews (${reviews} reviews, ${rating} stars!).

${context}

I specialize in building high-converting websites for local ${niche || 'service'} providers. Would you be open to a 2-minute chat about how a better online presence can help you get even more customers?

Best,
${senderName}`
    };

    const instagramDM = `Hey ${name}! Love the work you're doing in ${city} 👏 I noticed you don't have a website link in your bio - I actually build custom sites for ${niche}s that help double their bookings. Mind if I send over a quick demo?`;

    const facebookMsg = `Hi ${name}, I'm a local web designer and I just saw your business on Google. You have great reviews! I'd love to help you reach even more people with a professional website. Are you currently looking for any help with your digital presence?`;

    return { email, instagramDM, facebookMsg };
}

module.exports = { calculateLeadScore, getLeadLabel, generateOutreach };
