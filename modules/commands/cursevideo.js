const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const config = require('../../config.json');

const checkurl = require('valid-url');
const axios = require('axios').default;
var url = require("url");
var p = require("path");
const fs = require('fs');

String.prototype.splice = function(start, delCount, newSubStr) {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};

module.exports.name         = 'cursevideo';
module.exports.aliases      = ['cursevid'];
module.exports.description  = 'Does funny stuff to a video';
module.exports.syntax       = 'cursevid help';
module.exports.guildOnly    = false;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = (message, args) => {

    if (!fs.existsSync('data-storage/conversions/')) fs.mkdirSync('conversions');

    if (!args[0]) args[0] = '';

    if (args[0].toLowerCase() == 'help' || args[0].toLowerCase() == 'h' || args[0] == '') {
        let embed = new Discord.MessageEmbed()
        .setTitle('Cursed videos')
        .setDescription(`> Cursed videos are videos with an "impossible" length.\n> Please note that only .webm videos are supported.\n\nTo create one, type: ${config.prefix}cursevid [Curse type] [Video link]\nCurse type can be one of the following:`)
        .addField('"increasing_length" or "il', `The videos length will increase as you watch the video.`)
        .addField('"zero_length" or "zl', `The video length will always be zero.`)
        .addField('"negative_length" or "nl', `A really big, cursed, negative number. (-14458517:-23)`)
        .addField('How it works', 'Read [this](https://github.com/ImVerum/prysm/blob/v2/modules/commands/cursevideo.js#L153) to learn more.')
        .setTimestamp();
        message.channel.send(embed);
        return;
    }

    if (args[1] == undefined && message.attachments.first() == undefined) return message.channel.send('You need to either attach a video or add a link to the video you are trying to fuck with.');

    let targetURL;
    let targetName;
    if (checkurl.isWebUri(args[1])) {
        if (!(args[1].startsWith('https://cdn.discordapp.com/attachments/') || args[1].startsWith('https://media.discordapp.net/attachments/'))) return message.channel.send('Sorry, you can only use Discord links.');

        targetURL = args[1];
        targetName = p.basename(url.parse(targetURL).pathname);
    } else {
        targetURL = message.attachments.first().url;
        targetName = message.attachments.first().name;
    }
    if (!fs.existsSync('data-storage/conversions/' + message.id)) fs.mkdirSync('data-storage/conversions/' + message.id);

    let isWebm = targetName.endsWith('.webm');
    if (!isWebm) targetName += '.webm';

    let writeStream = fs.createWriteStream('data-storage/conversions/' + message.id + '/' + targetName);

    if (!isWebm) return message.channel.send('Sorry, only .webm files are supported right now.');

    axios({
        method: 'get',
        url: targetURL,
        responseType: 'stream'
    })
    .then(function(res) {
        if (isWebm) {
            res.data.pipe(writeStream);
        } else {
            // Tjis part should convert the file to .webm, but this is slow, resource intensive and doesn't work well.
            /*
             * console.log('Conversion to WEBM started.');
             * message.channel.send('Processing...').then(m => {
             *     let lastUpdate = Date.now();
             *     try {
             *         new ffmpeg(res.data).toFormat('webm').on('error', e => {
             *             console.log('FFMPEG error');
             *             console.error(e);
             *             return message.channel.send(e); 
             *         }).on('progress', info => {
             *             if (Date.now() > lastUpdate + 2500) {
             *                 m.edit('Processing... Frame ' + info.frames);
             *                 lastUpdate = Date.now();
             *             }
             *         }).on('end', () => {
             *             m.delete();
             *         }).pipe(writeStream);
             *     } catch (e) {
             *         // Send an error when FFMPEG fails
             *         console.log('FFMPEG error');
             *         console.log(e);
             *         return message.channel.send('Error: FFMPEG failed to convert the video: ' + e + ' \n Please use a video with the .webm format instead.');
             *     }
             *     
             * });
             */
            return message.channel.send('woops, unsupported file type');
        }
    });

    let repwith;
    switch (args[0].toLowerCase()) {
        case 'increasing_length': 
        case 'inc_length':
        case 'inclength':
        case 'il':
            repwith = '4489883ff0000000';
        break;
        case 'zero_length':
        case 'zerolength':
        case 'zl':
            repwith = '4489000000000000';
        break;
        case 'negative_length':
        case 'neg_length':
        case 'neglength':
        case 'nl':
            repwith = '44898842FFB060';
        break;
        default: 
        return message.channel.send(`Invalid curse type, check ${config.prefix}cursevid help`);
    }

    writeStream.on('close', s => {
        if (!isWebm) console.log('Write Stream closed.');
        if (p.extname(`data-storage/conversions/${message.id}/${targetName}`) != '.webm') return message.channel.send('Invalid file format: Only video files are supported.');

        const size = fs.statSync('data-storage/conversions/' + message.id + '/' + targetName).size / 1000000.0;
        if (size > 8) return message.channel.send('This video is too large.');

        // This is where the magic happens
        let file = fs.readFileSync(`data-storage/conversions/${message.id}/${targetName}`);
        let str = file.toString('hex');
        let ind = str.indexOf('4489');
        if (!ind || ind < 0) return message.channel.send('Can\'t convert this video.');
        let newstr = str.toString().splice(ind, ind + repwith.length, repwith);
        str = newstr.substr(0, ind + 16) + str.substr(ind + 16);
        let buf = Buffer.from(str, 'hex');
        fs.writeFileSync(`data-storage/conversions/${message.id}/result.webm`, buf, {encoding: 'utf-8'});
        message.channel.send('Done!', { files: [`./data-storage/conversions/${message.id}/result.webm`]});
    });
}

/* --- How it works ---
 *  
 * To achieve the "buggy" look, we directly 
 * change the video file's duration value.
 *  
 * If you want to do this yourself, follow this:
 * - Using a hex editor, open the .webm file
 * - Search for the hex string "44 89"
 * - Replace the values to the right of it with one of the following:
 *     - Increasing duration:   88 3f f0 00 00 00
 *     - Duration is always 0:  00 00 00 00 00 00
 *     - Negative duration:     88 42 FF B0 60
 * - Now just save the file and send it to someone on discord.
 *  
 * To do this from code, we do the following:
 *   1) Download the file, using Axios (line 70) and pipe it into a readable stream (line 77)
 *   2) Use the FS module to read the content of the file (line 141), then turn it into a hex string (line 142)
 *   3) find the index of the duration header 4489 (line 143)
 *   4) replace the part next to it with the "cursed" value (line 141, 146)
 *   5) Create a Buffer (A thing that stores binary data iirc) from the changed hex value, with 'hex' encoding (line 147)
 *   6) Write the result back to the disk (with utf-8 encoding!!) (line 148)
 *   7) Send that file to the text chat and delete it from the disk afterwards
 */