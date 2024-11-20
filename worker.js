const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const ffmpeg = require('fluent-ffmpeg');
const cron = require('node-cron');

const videoFolder = 'public/videos';
const thumbnailFolder = 'public/thumbnail';
const dbFolder = 'public/db';
const dbFile = path.join(dbFolder, 'data.json');

function verifyAPIKey(req, res, next) {
    const apiKey = req.query.apikey;
    if (apiKey && apiKey === 'asd') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

function getDatabase() {
    let data = [];
    try {
        if (fs.existsSync(dbFile)) {
            data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
        }
    } catch (err) {
        console.error('Error reading or parsing data file:', err);
    }
    return data;
}

function updateDatabase(videoName, videoPath, uniqueId) {
    let data = getDatabase();

    const thumbnailName = `${uniqueId}_thumbnail.jpg`;
    const thumbnailPath = path.join('thumbnail', thumbnailName);

    const videoBaseName = path.basename(videoPath);
    const videoNewPath = path.join('videos', videoBaseName);

    const videoInfo = {
        id: String(uniqueId),
        title: videoName,
        name: videoNewPath,
        thumbnail: thumbnailPath
    };

    data.push(videoInfo);

    try {
        fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
        console.log('Data updated successfully in the database.');
    } catch (err) {
        console.error('Error writing data to file:', err);
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

        updateDatabase(originalName, newVideoPath, uniqueId);

        fs.rename(videoPath, newVideoPath, (err) => {
            if (err) {
                console.error('Error renaming video file:', err);
                return;
            }

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
                        filename: `${uniqueId}_thumbnail.jpg`,
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
            createThumbnail(videoPath);
            modified = true;
        }

        return true;
    });

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

function watcher() {
    const watcher = chokidar.watch(videoFolder, {
        persistent: true,
        ignoreInitial: true,
    });

    watcher.on('add', (videoPath) => {
        console.log(`New file detected: ${videoPath}. Waiting for the file to finish copying...`);
        
        fs.readFile(videoPath, (err, data) => {
            if (err) {
                setTimeout(() => {
                    checkFileComplete(videoPath);
                }, 1000);
            } else {
                console.log(`File ${videoPath} has been fully copied.`);
                createThumbnail(videoPath);
            }
        });
    });

    return watcher;
}

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

cron.schedule('*/20 * * * *', checkingFileAda);

function startWorkerTasks() {
    watcher();  
    checkingFileAda(); 
}


startWorkerTasks();
