const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const videoFolder = 'public/videos';
const dbFolder = 'public/db';
const dbFile = path.join(dbFolder, 'data.json');

// Ensure folders exist
[videoFolder, dbFolder].forEach(folder => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
});

// Helper to read database
function readDatabase() {
    try {
        return fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, 'utf-8')) : [];
    } catch (err) {
        console.error('Error reading database:', err);
        return [];
    }
}

// API to stream video
app.get('/videos/:name', (req, res) => {
    const videoName = req.params.name;
    const videoPath = path.join(videoFolder, videoName);

    if (!fs.existsSync(videoPath)) {
        return res.status(404).send('Video not found');
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize) {
            res.status(416).send('Requested range not satisfiable');
            return;
        }

        const chunkSize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    }
});

// API to fetch video list
app.get('/videos', (req, res) => {
    const data = readDatabase();
    res.json(data);
});

app.listen(3000, () => console.log('Server running on port 3000'));
