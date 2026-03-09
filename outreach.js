function calculateLeadScore(lead) {
    let score = 0;
    
    // +3 if no website (This is our primary filter, but we verify here)
    if (lead.website_status === 'No' || !lead.hasWebsite) score += 3;
    
    // +2 if rating above 4
    if (parseFloat(lead.reviews) > 4) score += 2;
    
    // +2 if reviews > 20
    const reviewCount = parseInt(lead.reviews.toString().replace(/,/g, ''));
    if (reviewCount > 20) score += 2;
    
    // +1 if located in USA, UK, Canada, Australia
    const premiumCountries = ['USA', 'United States', 'UK', 'United Kingdom', 'Canada', 'Australia'];
    if (lead.country && premiumCountries.some(c => lead.country.includes(c))) {
        score += 1;
    }
    
    return score;
}

function generateMessage(lead, senderName = 'Your Name') {
    const { name, city, reviews, rating } = lead;
    
    const subject = `Quick idea for ${name}`;
    
    let personalizedSnippet = "";
    if (parseInt(reviews) > 10) {
        personalizedSnippet = `I noticed you have great reviews (${reviews} reviews) on Google, which is a huge testament to your service.`;
    } else {
        personalizedSnippet = `I came across your business while searching for top-rated ${lead.niche || 'services'} in ${city}.`;
    }

    const body = `Hi ${name},

${personalizedSnippet}

Many customers search online for services like yours, but it looks like your business doesn't currently have a website. This makes it harder for potential clients to find you and book your services directly.

I specialize in building fast, lead-generating websites for local businesses in the ${lead.niche || 'service'} industry.

Would you be open to seeing a quick example of what a modern website for ${name} could look like?

Best,
${senderName}`;

    return { subject, body };
}

module.exports = { generateMessage, calculateLeadScore };
