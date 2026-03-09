const nodemailer = require('nodemailer');
const db = require('../database/database');

async function sendEmail(leadId, config) {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    if (!lead || !lead.email || lead.email === 'Pending Verification') {
        throw new Error('Valid email not found for lead');
    }

    // SMTP configuration should be in environment variables
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass
        }
    });

    const mailOptions = {
        from: config.from,
        to: lead.email,
        subject: lead.outreach_message_subject || 'Quick idea for your business',
        text: lead.outreach_message
    };

    await transporter.sendMail(mailOptions);
    
    db.prepare('UPDATE leads SET contacted_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('emailed', leadId);
    
    return { success: true };
}

function getSocialDeepLinks(lead) {
    const message = encodeURIComponent(lead.outreach_message);
    
    return {
        whatsapp: lead.phone ? `https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${message}` : null,
        facebook: lead.facebook ? `${lead.facebook}${lead.facebook.includes('?') ? '&' : '?'}text=${message}` : null,
        instagram: lead.instagram ? `https://www.instagram.com/direct/t/` : null // Instagram doesn't support pre-filled direct message links via web URL as easily
    };
}

module.exports = { sendEmail, getSocialDeepLinks };
