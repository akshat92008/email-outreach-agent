const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database/database');
const leadRoutes = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// API Routes
app.use('/api/leads', leadRoutes);

// Serve Dashboard (to be built)
app.use(express.static(path.join(__dirname, 'dashboard/dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
