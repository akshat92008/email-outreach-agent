/**
 * Calculates a lead score from 0-100 based on multiple factors.
 */
function calculateLeadScore(lead, analysis = null) {
    let score = 0;

    // 1. Website Status & Quality (Max 40 points)
    if (!lead.has_website || lead.has_website === 'No') {
        score += 40; // Perfect target: High priority for businesses with NO website
    } else if (analysis) {
        // If they have a website, we score based on how BAD it is (worse = better lead for us)
        if (analysis.qualityScore < 40) score += 35; // Terrible website
        else if (analysis.qualityScore < 70) score += 20; // Mediocre website
        else score += 5; // Good website, harder to sell to

        // Specific pain points give us better leverage
        if (!analysis.hasMobileViewport) score += 10;
        if (!analysis.hasBookingSystem) score += 15;
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
    if (score >= 75) return 'High Value';
    if (score >= 40) return 'Medium Value';
    return 'Low Value';
}

/**
 * Generates personalized multi-channel outreach messages based on website analysis.
 */
async function generateOutreach(lead) {
    const { name, niche, city, reviews, rating, has_website, website_analysis } = lead;

    let customPainPoint = "";
    let solutionPitch = "";

    // 1. Analyze pain points to build the hook
    if (!has_website || has_website === 'No') {
        customPainPoint = `I noticed your business doesn't have a website yet, which is likely costing you customers to other ${niche}s in ${city}.`;
        solutionPitch = `I build custom, high-converting websites specifically for local ${niche}s that help double their online bookings.`;
    } else if (website_analysis) {
        const issues = website_analysis.issues || [];
        if (issues.some(i => i.includes("slow"))) {
            customPainPoint = `I ran a speed test on your site and noticed it takes over ${Math.round(website_analysis.loadTimeMs / 1000)} seconds to load. You are likely losing mobile traffic.`;
            solutionPitch = `We fix these speed issues and rebuild sites to be lightning fast and mobile-first, immediately increasing conversions.`;
        } else if (!website_analysis.hasMobileViewport) {
            customPainPoint = `I reviewed your website on my phone and noticed it isn't optimized for mobile users.`;
            solutionPitch = `We rebuild sites to be perfectly mobile-responsive, which is exactly how 80% of your customers are searching for you.`;
        } else if (!website_analysis.hasBookingSystem) {
            customPainPoint = `I noticed you don't have a direct online booking system on your website.`;
            solutionPitch = `We specialize in integrating automated booking systems that let customers schedule 24/7 without calling, saving you hours every week.`;
        } else {
            customPainPoint = `I reviewed your website and see a few areas where a modern refresh could bring in higher-paying clients.`;
            solutionPitch = `We build premium, modern web experiences that make your brand stand out from competitors.`;
        }
    } else {
        customPainPoint = `I was reviewing your online presence and see some great opportunities to capture more traffic.`;
        solutionPitch = `I specialize in building high-converting websites for local ${niche || 'service'} providers.`;
    }

    // 2. Draft Multi-Channel Templates
    const email = {
        subject: `Quick idea to get more customers for ${name}`,
        body: `Hi ${name} team,

I was looking at ${niche || 'businesses'} in ${city} and saw you have fantastic Google reviews (${reviews} reviews, ${rating} stars!).

${customPainPoint}

${solutionPitch}

Would you be open to a 2-minute chat or letting me send over a quick free demo of what I mean?

Best,
Your Agency`
    };

    const instagramDM = `Hey ${name}! Love the work you're doing in ${city} 👏 ${customPainPoint} ${solutionPitch} Mind if I send over a quick demo link?`;

    const facebookMsg = `Hi ${name}, I'm a local web designer and just saw your great reviews on Google. ${customPainPoint} Are you currently open to seeing a quick demo of how we can improve your digital presence?`;

    const linkedinMsg = `Hi team at ${name}. I specialize in digital growth for ${niche}s in ${city}. ${customPainPoint} Let's connect! I'd love to share a brief strategy doc with you.`;

    const sms = `Hi ${name}! This is the web design team. Saw your great reviews on Google, but ${customPainPoint.toLowerCase()} Can we send you a quick 1-min demo of a solution?`;

    return { email, instagramDM, facebookMsg, linkedinMsg, sms };
}

module.exports = { calculateLeadScore, getLeadLabel, generateOutreach };
