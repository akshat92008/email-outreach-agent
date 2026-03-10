const fs = require('fs');
const path = require('path');

/**
 * Generates a simple, professional demo website (HTML/CSS) for a business.
 */
function generateDemoWebsite(businessData) {
    const { name, niche, city, phone } = businessData;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - Premium ${niche || 'Services'} in ${city}</title>
    <style>
        :root {
            --primary: #2563eb;
            --text: #1f2937;
            --light: #f3f4f6;
        }
        body { font-family: 'Inter', sans-serif; margin: 0; color: var(--text); line-height: 1.6; }
        header { background: white; padding: 1rem 5%; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .logo { font-size: 1.5rem; font-weight: bold; color: var(--primary); }
        .hero { background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1920&q=80'); 
                background-size: cover; color: white; padding: 100px 5%; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .btn { background: var(--primary); color: white; padding: 0.8rem 2rem; border-radius: 5px; text-decoration: none; font-weight: bold; }
        .services { padding: 50px 5%; background: var(--light); display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .service-card { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .contact { padding: 50px 5%; text-align: center; }
        footer { background: #111; color: white; padding: 2rem 5%; text-align: center; }
    </style>
</head>
<body>
    <header>
        <div class="logo">${name}</div>
        <a href="#contact" class="btn">Get Started</a>
    </header>

    <section class="hero">
        <h1>High-Quality ${niche || 'Services'} in ${city}</h1>
        <p>Expert ${niche || 'solutions'} tailored to your needs. Experience the best of ${name}.</p>
        <br>
        <a href="#contact" class="btn">Book Now</a>
    </section>

    <section class="services">
        <div class="service-card">
            <h3>Reliable Service</h3>
            <p>We pride ourselves on being the most reliable ${niche || 'provider'} in the ${city} area.</p>
        </div>
        <div class="service-card">
            <h3>Expert Team</h3>
            <p>Our professionals are highly trained and ready to help you with any ${niche || 'request'}.</p>
        </div>
        <div class="service-card">
            <h3>Customer First</h3>
            <p>Your satisfaction is our top priority. We go above and beyond for our clients.</p>
        </div>
    </section>

    <section id="contact" class="contact">
        <h2>Ready to grow with ${name}?</h2>
        <p>Call us today at <strong>${phone || 'our local office'}</strong> or fill out the form below.</p>
        <form style="max-width: 500px; margin: 0 auto; text-align: left;">
            <input type="text" placeholder="Your Name" style="width: 100%; padding: 10px; margin: 10px 0;">
            <input type="email" placeholder="Your Email" style="width: 100%; padding: 10px; margin: 10px 0;">
            <textarea placeholder="How can we help?" style="width: 100%; padding: 10px; margin: 10px 0; height: 100px;"></textarea>
            <button type="submit" class="btn" style="width: 100%; border: none; cursor: pointer;">Send Message</button>
        </form>
    </section>

    <footer>
        <p>&copy; 2026 ${name}. All rights reserved. | Powered by High-End Design Agency</p>
    </footer>
</body>
</html>
    `;

    const demoDir = path.join(__dirname, 'demos');
    if (!fs.existsSync(demoDir)) fs.mkdirSync(demoDir);

    const fileName = `${name.replace(/\s+/g, '_').toLowerCase()}_demo.html`;
    const filePath = path.join(demoDir, fileName);

    fs.writeFileSync(filePath, htmlContent);
    return filePath;
}

module.exports = { generateDemoWebsite };
