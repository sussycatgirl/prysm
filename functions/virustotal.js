const api_key = process.env.VIRUSTOTAL_API_KEY;

const nvt = require('node-virustotal');
const vt = nvt.makeAPI(15000);
if (api_key) vt.setKey(api_key);

const crypto = require('crypto');
const fs = require('fs');

// Cache info about hashes
let cache = {}


/**
 * Vibechecks a file using the VirusTotal API.
 * @param {ReadableStream} filename
 */
module.exports.vibecheck = (filename, sendEnqueueMsg) => new Promise(async (resolve, reject) => {
    // Hashing witchcraft
    const hash = crypto
        .createHash('sha256')
        .update(await fs.promises.readFile('temp/malware/' + filename))
        .digest('hex');
    
    if (cache[hash]) {
        console.log('Returning cached result for ' + hash);
        resolve(cache[hash]);
        return;
    }
    
    console.log('Enqueued for vibecheck: ' + hash);
    sendEnqueueMsg();
    
    vt.fileLookup(hash, (err, res) => {
        if (err) {
            console.log(`${hash} failed to analyze`);
            reject({ data: JSON.parse(err), hash: hash });
            console.log(err);
            return;
        }
        console.log(`Received results for ${hash}`);
        resolve(JSON.parse(res).data);
        cache[hash] = JSON.parse(res).data;
    });
});


module.exports.submitSample = (path, filename) => new Promise(async (resolve, reject) => {
    console.log('Submitting file to VirusTotal');
    vt.uploadFile(path, filename, 'application/x-msdownload', resolve);
})
