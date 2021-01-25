const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { shoukaku } = require('../bot/shoukakuSetup');
let musicManager = require('../../functions/musicPlayer');

module.exports.name         = 'nowplaying';
module.exports.aliases      = ['np', 'playing'];
module.exports.description  = 'Shows the currently playing song.';
module.exports.syntax       = 'np';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'CONNECT', 'SPEAK'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    let np = musicManager.getNowPlaying(message.guild.id);
    let player = shoukaku.players.get(message.guild.id);
    if (!np || !player || !message.guild.me.voice) return message.channel.send('I am currently not playing.');
    
    let posSeconds = player.position/1000;
    let lengthSeconds = np.info.length/1000;

    let loopMode = musicManager.getLooping(message.guild.id);
    let queueLength = musicManager.queues.get(message.guild.id)?.length || 0;
    let description = `[${np.info.title}](${np.info.uri}) by **${np.info.author.replace(/\*/g, '\\*').replace(/\_/g, '\\_').replace(/\`/g, '\\`')}**\n`
    + `\`🔀 ${musicManager.getShuffle(message.guild.id) ? 'On' : 'Off'}\` `
    + `\`${loopMode == 'single' ? '🔂' : '🔁'} ${loopMode.charAt(0).toUpperCase() + loopMode.slice(1)}\` `
    + `\`⏩ ${queueLength}\` `
    + (player.paused ? `\`⏸️ Paused\` ` : '')
    + `${process.env.WEB_BASE_URL ? `| [Open web player](${process.env.WEB_BASE_URL}/dashboard/server/${message.guild.id}/index.ejs)` : ''}\n`;
    
    // The length of the progress bar
    const barLength = 40;
    
    let progressBar = '';
    let pieceLength = (lengthSeconds / barLength);
    let knobPrinted = false;
    
    if (np.info.isStream) {
        for (i = 0; i < barLength - 1; i++) {
            progressBar += '▬';
        }
        progressBar += '⚪';
    } else {
        for (i = 0; i < barLength; i++) {
            if ((pieceLength*(i+1) > posSeconds && !knobPrinted) || (i == barLength - 1 && !knobPrinted)) {
                progressBar += '⚪';
                knobPrinted = true;
            } else
                progressBar += knobPrinted ? '┅' : '━';
        }
    }
    
    description += `${np.info.isStream ? 
            `${createTimestamp(posSeconds)}/${db.clientCache.customEmojis.streaming}**Live**` :
            `\`\`\`${progressBar}\n${createTimestamp(posSeconds)}/${createTimestamp(lengthSeconds)}\`\`\``}`;
    
    let embed = new Discord.MessageEmbed()
        .setTitle('Now playing')
        .setDescription(description);

    let thumbnail;
    if (np.info.uri)
    try {
        thumbnail = await require('../../functions/getTrackInfo').getThumbnail(np.info.uri);
        embed.setThumbnail(thumbnail);
    } catch(e) {
        console.error(e);
    }
    
    message.channel.send(embed);
}

const createTimestamp = (seconds) => {
    let h = 0;
    let m = 0;
    let s = Math.round(seconds);

    while (s >= 60) {
        m += 1;
        s -= 60;
    }
    
    while (m >= 60) {
        h += 1;
        m -= 60;
    }
    
    let str = '';
    if (h > 0) {
        if (h >= 10)
            str += `${h}:`
        else
            str += `0${h}:`
    }
    
    if (m >= 10)
        str += `${m}:`
    else
        str += `0${m}:`
    
    if (s >= 10)
        str += s;
    else
        str += `0${s}`
    
    return str;
}