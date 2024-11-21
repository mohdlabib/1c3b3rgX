const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const cors = require('cors');
const cron = require('node-cron');
const {
    exit
} = require('process');
const fsExpert = require('graceful-fs')

const app = express();
const videoFolder = 'public/videos';
const thumbnailFolder = 'public/thumbnail';
const dbFolder = 'public/db';
const dbFile = path.join(dbFolder, 'data.json');

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
                        filename: `${uniqueId}_thumbnail.jpg`, // Thumbnail using unique ID
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
        id: String(uniqueId), // Use generated ID
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

// checking after file in
function checkingFileAda() {
    let data = [];
    try {
        if (fs.existsSync(dbFile)) {
            data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
        }
    } catch (err) {
        console.error('Error reading or parsing data file:', err);
        return;
    }

    let modified = false;

    data = data.filter(video => {
        const videoPath = path.join('public', video.name);
        const thumbnailPath = path.join('public', video.thumbnail);

        const videoExists = fs.existsSync(videoPath);
        const thumbnailExists = fs.existsSync(thumbnailPath);

        if (!videoExists) {
            console.log(`Video with ID ${video.id} (${video.title}) is missing. Removing from database.`);
            modified = true;
            return false;
        }

        if (!thumbnailExists) {
            console.log(`Thumbnail for video ID ${video.id} (${video.title}) is missing. Creating new thumbnail.`);
            createThumbnailExit(videoPath); 
            modified = true;
        }

        return true; 
    });

    // Check for videos in the video folder that are not in the database
    const videoFiles = fs.readdirSync(videoFolder);
    const existingVideoPaths = data.map(video => path.join(videoFolder, path.basename(video.name)));

    videoFiles.forEach(file => {
        const videoPath = path.join(videoFolder, file);
        const isRegistered = existingVideoPaths.includes(path.join(videoFolder, file));

        if (!isRegistered) {
            console.log(`Video ${file} is not registered in the database. Creating thumbnail.`);
            createThumbnail(videoPath);
        }
    });

    if (modified) {
        try {
            fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
            console.log('Database updated after checking files.');
        } catch (err) {
            console.error('Error writing updated data to file:', err);
        }
    } else {
        console.log('No changes needed after checking files.');
    }
}


function createThumbnailExit(videoPath) {
    const originalName = path.basename(videoPath, path.extname(videoPath));
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

    const videoData = data.find(item => item.name === path.join('videos', originalName + ext));

    if (videoData) {
        const uniqueId = videoData.id; 
        const thumbnailPath = path.join(thumbnailFolder, `${uniqueId}_thumbnail.jpg`);

        if (!fs.existsSync(thumbnailPath)) {
            console.log(`Thumbnail for video ID ${uniqueId} is missing. Creating new thumbnail.`);

            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) {
                    console.error('Error getting video duration:', err);
                    return;
                }

                const durationSeconds = Math.floor(metadata.format.duration);
                const randomSecond = Math.floor(Math.random() * durationSeconds);

                ffmpeg(videoPath)
                    .screenshots({
                        timestamps: [randomSecond],
                        filename: `${uniqueId}_thumbnail.jpg`,
                        folder: thumbnailFolder,
                    })
                    .on('end', () => {
                        console.log('Thumbnail generated successfully for:', videoPath);
                    })
                    .on('error', (err) => {
                        console.error('Error generating thumbnail:', err);
                    });
            });
        } else {
            console.log(`Thumbnail for video ID ${uniqueId} already exists.`);
        }
    } else {
        console.error('Video data not found in the database.');
    }
}

const watcher = chokidar.watch(videoFolder, {
    persistent: true,
    ignoreInitial: true,
});

watcher.on('add', (videoPath) => {
    console.log(`New file detected: ${videoPath}. Waiting for the file to finish copying...`);
    
    fs.readFile(videoPath, (err, data) => {
        if (err) {
            console.log('Retrying in 1 second...');

            setTimeout(() => {
                checkFileComplete(videoPath);
            }, 1000);
        } else {
            console.log(`File ${videoPath} has been fully copied.`);
            createThumbnail(videoPath);
        }
    });
});

function checkFileComplete(filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            setTimeout(() => {
                checkFileComplete(filePath); 
            }, 1000);
        } else {
            console.log(`File ${filePath} is now ready.`);
            createThumbnail(filePath); 
        }
    });
}

// schedule
cron.schedule('*/20 * * * *', checkingFileAda);

checkingFileAda();
