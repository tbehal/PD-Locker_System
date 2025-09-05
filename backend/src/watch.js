const fs = require('fs');
const path = require('path');
const config = require('./config');
const cache = require('./cache'); // Ensure this 'cache' module has a .del() method that returns a Promise
const CACHE_KEY = 'availability_all_weeks';

function watchFile() {
    if (config.useGraph) return;

    const p = path.resolve(config.localExcelPath);
    const folder = path.dirname(p);
    const filenameToWatch = path.basename(p); // Get the base name of the file to watch

    // Use try-catch around fs.watch in case the folder doesn't exist or there are permission issues
    try {
        fs.watch(folder, async (eventType, filename) => { // <<< Make the callback function async
            if (!filename) {
                console.log('Detected nameless change event.'); // Sometimes events can fire with null filename
                return;
            }

            // Ensure we are only acting on changes to the specific Excel file
            if (filename === filenameToWatch) {
                console.log(`Detected change to Excel file '${filename}' — invalidating cache.`);
                try {
                    await cache.del(CACHE_KEY); // <<< Await the promise from cache.del()
                    console.log('Cache invalidation successful.');
                } catch (error) {
                    console.error('Error invalidating cache:', error); // <<< Log any errors
                }
            }
        });
        console.log(`Watching for changes in directory: ${folder} for file: ${filenameToWatch}`);
    } catch (error) {
        console.error(`Failed to set up file watcher for ${folder}:`, error);
    }
}

module.exports = { watchFile };