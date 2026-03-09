const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const db = require('./database/database');

const csvWriter = createCsvWriter({
    path: csvFilePath,
    header: [
        {id: 'name', title: 'Business Name'},
        {id: 'niche', title: 'Niche'},
        {id: 'email', title: 'Email'},
        {id: 'facebook', title: 'Facebook Page'},
        {id: 'city', title: 'City'},
        {id: 'country', title: 'Country'},
        {id: 'phone', title: 'Phone'},
        {id: 'reviews', title: 'Reviews'},
        {id: 'status', title: 'Outreach Status'}
    ],
    append: fs.existsSync(csvFilePath)
});

async function saveLeads(leads) {
    if (leads.length === 0) return;
    try {
        // Save to CSV
        await csvWriter.writeRecords(leads);
        console.log(`Saved ${leads.length} leads to CSV: ${csvFilePath}`);

        // Save to SQLite
        const insert = db.prepare(`
            INSERT INTO leads (name, niche, email, facebook, city, country, phone, reviews, score, outreach_message, contacted_status)
            VALUES (@name, @niche, @email, @facebook, @city, @country, @phone, @reviews, @score, @outreach_message, @status)
        `);

        const insertMany = db.transaction((leads) => {
            for (const lead of leads) insert.run(lead);
        });

        insertMany(leads);
        console.log(`Saved ${leads.length} leads to SQLite database.`);
    } catch (error) {
        console.error('Error saving leads:', error);
    }
}

module.exports = { saveLeads };
