const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;
const dbFile = path.join(__dirname, 'public', 'db', 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

function requireAuth(req, res, next) {
    console.log('Session:', req.session); 
    if (req.session && req.session.isAuthenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'login.html'));
});

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === '12344321') { 
        req.session.isAuthenticated = true;
        res.redirect('/');
    } else {
        res.status(401).send('Invalid password');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Could not log out');
        } else {
            res.redirect('/login');
        }
    });
});

app.use(requireAuth);
app.use(express.static('web'));
app.use(express.static('public'));

app.get('/db', (req, res) => {
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

app.use((req, res, next) => {
    if (req.path !== '/' && !path.extname(req.path)) {
        const filePath = path.join(__dirname, 'web', req.path + '.html');
        res.sendFile(filePath, (err) => {
            if (err) {
                next(); 
            }
        });
    } else {
        next();
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
