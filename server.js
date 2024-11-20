const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const dbFile = path.join(__dirname, 'public', 'db', 'data.json');

app.use(express.static('web'));
app.use(express.static('public'));
app.use(cors());

function verifyAPIKey(req, res, next) {
    const apiKey = req.query.apikey;
    if (apiKey && apiKey === 'asd') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

app.get('/db', verifyAPIKey, (req, res) => {
    try {
        if (fs.existsSync(dbFile)) {
            const data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
            res.json(data);
        } else {
            res.status(404).json({ error: 'Database file not found' });
        }
    } catch (err) {
        console.error('Error reading database file:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
