const URL = require('url');
/**
 * @param {string} playlist 
 */
module.exports = (playlist) => {
    if (typeof playlist != 'string') throw '\'playlist\' argument is not of type string';
    let metadata = {}
    let trackURLs = []
    try {
        let lines = playlist.split('\n');
        let lineNumber = 0;
        lines.forEach(line => {
            lineNumber++;
            if (line.indexOf('#') > -1) line = line.substr(0, line.indexOf('#')); // Ignore anything after character # (Comments)
            if (line.length != 0) {
                if (line.startsWith('$')) { // "Metadata" such as the playlist name
                if (line.indexOf('=') == -1) throw 'Invalid metadata argument';
                    line = line.substr(1); // Remove the $ character
                    let argName = line.split('=')[0];
                    let argValue = line.substr(line.indexOf('=') + 1);
                    metadata[argName] = argValue;
                } else { // Treat the line as playlist entry, and parse it as URL
                    line = line.replace(' ', ''); // Remove any spaces from the line
                    let url = URL.parse(line);
                    if (!url.host) throw `Error at line ${lineNumber}: Invalid URL`;
                    trackURLs.push(url.href);
                }
            }
        });
        return {
            metadata: metadata,
            trackURLs: trackURLs
        }
    } catch(e) {
        throw e;
    }
}