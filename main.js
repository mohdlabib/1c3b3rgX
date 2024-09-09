const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const cors = require('cors');
const { exit } = require('process');

const app = express();
const videoFolder = 'public/videos';
const thumbnailFolder = 'public/thumbnail';
const dbFolder = 'public/db';
const dbFile = path.join(dbFolder, 'data.json');

app.use((req, res, next) => {
    if (req.path !== '/' && !path.extname(req.path)) {
        const filePath = path.join(__dirname, 'web', req.path + '.html');
        res.sendFile(filePath, (err) => {
            if (err) {
                next(); // Lanjutkan jika file tidak ditemukan
            }
        });
    } else {
        next();
    }
});

app.use(express.static('web'));
app.use(express.static('public'));
app.use(cors());

const API_KEY = 'asd';

function verifyAPIKey(req, res, next) {
    const apiKey = req.query.apikey;
    if (apiKey && apiKey === API_KEY) {
        next();
    } else {
        res.status(401).json({
            error: 'Unauthorized'
        });
    }
}

function createThumbnail(videoPath) {
    const originalName = path.basename(videoPath, path.extname(videoPath)).split('_')[0];
    const uniqueId = Date.now() + Math.floor(Math.random() * 10000);
    const ext = path.extname(videoPath);

    let data = [];
    try {
        if (fs.existsSync(dbFile)) {
            data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
        }
    } catch (err) {
        console.error('Error reading or parsing data file:', err);
        return;
    }

    const existingDataIndex = data.findIndex(item => item.id === originalName);

    if (existingDataIndex == -1) {
        const newUniqueVideoName = `${uniqueId}_video`;
        const newVideoPath = path.join(videoFolder, `${newUniqueVideoName}${ext}`);

        // add data to database
        updateDatabase(originalName, newVideoPath, uniqueId); // Attach ID
        
        fs.rename(videoPath, newVideoPath, (err) => {
            if (err) {
                console.error('Error renaming video file:', err);
                return;
            }

            console.log('Video file renamed successfully to:', newVideoPath);

            ffmpeg.ffprobe(newVideoPath, (err, metadata) => {
                if (err) {
                    console.error('Error getting video duration:', err);
                    return;
                }

                const durationSeconds = Math.floor(metadata.format.duration);
                const randomSecond = Math.floor(Math.random() * durationSeconds);

                ffmpeg(newVideoPath)
                    .screenshots({
                        timestamps: [randomSecond],
                        filename: `${uniqueId}_thumbnail.jpg`,  // Thumbnail using unique ID
                        folder: thumbnailFolder,
                    })
                    .on('end', () => {
                        console.log('Thumbnail generated successfully for:', newVideoPath);
                    })
                    .on('error', (err) => {
                        console.error('Error generating thumbnail:', err);
                    });
            });
        })
    } 
}

function updateDatabase(videoName, videoPath, uniqueId) {

    let data = [];
    try {
        if (fs.existsSync(dbFile)) {
            data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
        }
    } catch (err) {
        console.error('Error reading or parsing data file:', err);
        return;
    }

    const thumbnailName = `${uniqueId}_thumbnail.jpg`; // Use ID for thumbnail name
    const thumbnailPath = path.join('thumbnail', thumbnailName); // Skip 'public/' prefix
    
    const videoBaseName = path.basename(videoPath); 
    const videoNewPath = path.join('videos', videoBaseName); // Skip 'public/' prefix    

    const videoInfo = {
        id: String(uniqueId),  // Use generated ID
        title: videoName,
        name: videoNewPath,
        thumbnail: thumbnailPath
    }

    data.push(videoInfo);

    try {
        fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
        console.log('Data updated successfully in the database.');
    } catch (err) {
        console.error('Error writing data to file:', err);
    }
}

app.get('/db', verifyAPIKey, (req, res) => {

    let data = [];
    if (fs.existsSync(dbFile)) {
        data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
    }

    res.json(data);
});

const watcher = chokidar.watch(videoFolder, {
    persistent: true,
    ignoreInitial: true,
});

watcher.on('add', (videoPath) => {
    console.log('New video added:', videoPath);
    createThumbnail(videoPath);
});


const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
