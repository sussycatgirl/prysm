const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const config = require('../../config.json');
const { delay } = require('lodash');

module.exports.name         = 'ping';
module.exports.aliases      = ['latency'];
module.exports.description  = 'Measures the bot\'s ping and response delay.';
module.exports.syntax       = '';
module.exports.guildOnly    = false;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS'];
module.exports.userPerms    = [];
/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    let botPing = Math.floor(new Date().getTime() - (message.editedTimestamp || message.createdTimestamp));

    let embed = new Discord.MessageEmbed()
    .setTitle(db.clientCache.customEmojis.loading + ' Measuring...')
    .addField('`...ms`', `[❤](${config.websiteDomain}/info/heartbeat.html "The time it takes for the bot to contact the Discord API") API Heartbeat`, true)
    .addField('`...ms`', `[💬](${config.websiteDomain}/info/messagedelay.html "How long it takes for the bot to reply to your message") Message delay`, true)
    .addField('`...ms`', `[🤖](${config.websiteDomain}/info/botping.html "The time it took for the bot to receive your message.\nThis number may not be accurate due to timezone differences.") Bot ping`, true)
    .addField('`...ms`', `[🕑](${config.websiteDomain}/info/uptime.html "How long the bot has been running since the last restart") Uptime`)
    .setFooter('Tip: Hover over or click on the emojis to see what they mean!')
    .setColor('FFA800');
    let msg = await message.channel.send(embed);

    let uptimeDate = new Date(new Date() - client.uptime);

    embed.fields[0].name = `\`${Math.floor(client.ws.ping)}ms\``;
    embed.fields[1].name = `\`${Math.floor(msg.createdTimestamp - message.createdTimestamp)}ms\``;
    embed.fields[2].name = `\`${botPing}ms\``;
    embed.fields[3].name = `\`Since ${uptimeDate.getDate()}. ${uptimeDate.getMonth() + 1}. ${uptimeDate.getFullYear()} (${pain(Math.floor(client.uptime))})\``;
    embed.setTitle('Pong!');
    embed.setColor('00ff00');
    msg.edit(embed);
}

// copypasted this bullshit from my old code
function pain(uptime) {
    let d = true;
    if (d == true && uptime < 1000) { 
        uptimeStr = (`${Math.floor(uptime)} Milliseconds`);
        d = false;
    } else {uptime = uptime / 1000}

    if (d == true && uptime < 60) { 
        uptimeStr = (`${Math.floor(uptime)} Seconds`);
        d = false;
    } else {uptime = uptime / 60}
    
    if (d == true && uptime < 60) { 
        uptimeStr = (`${Math.floor(uptime)} Minutes`);
        d = false;
    } else {uptime = uptime / 60}

    if (d == true && uptime < 24) { 
        uptimeStr = (`${Math.floor(uptime)} Hours`);
        d = false;
    } else {uptime = uptime / 24}

    if (d == true && uptime < 7) { 
        uptimeStr = (`${Math.floor(uptime)} Days`);
        d = false;
    } else {uptime = uptime / 7}

    if (d == true && uptime < 4) { 
        uptimeStr = (`${Math.floor(uptime)} Weeks`);
        d = false;
    } else {uptime = uptime / 4}

    if (d == true && uptime < 12) { 
        uptimeStr = (`${Math.floor(uptime)} Months`);
        d = false;
    } 
    
    if (d) {uptimeStr = (`${Math.floor(uptime)} Years`)}

    return uptimeStr;
}