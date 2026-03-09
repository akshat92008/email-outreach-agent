const express = require('express');
const router = express.Router();
const db = require('../database/database');

// Get all leads
router.get('/', (req, res) => {
    try {
        const leads = db.prepare('SELECT * FROM leads ORDER BY score DESC, created_at DESC').all();
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single lead
router.get('/:id', (req, res) => {
    try {
        const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });
        res.json(lead);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update lead status
router.patch('/:id/status', (req, res) => {
    const { status } = req.body;
    try {
        db.prepare('UPDATE leads SET contacted_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
