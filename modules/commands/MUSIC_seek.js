const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { shoukaku } = require('../bot/shoukakuSetup');
let musicManager = require('../../functions/musicPlayer');
const getGuildSettings = require('../../functions/getGuildSettings');

module.exports.name         = 'seek';
module.exports.aliases      = ['goto'];
module.exports.description  = 'Go to a specific position in currently playing track, in seconds.';
module.exports.syntax       = 'seek [Position]';
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
    if ((!message.member.voice || message.member.voice.channelID != message.guild.me.voice.channelID) && message.guild.me.voice.channelID) 
        return message.channel.send('You are not in my voice channel.');
    
    let player = shoukaku.getPlayer(message.guild.id);
    if (!player) return message.channel.send("I am currently not playing.");
    
    if (!args[0]) return message.channel.send('You have to tell me to which position you want to seek.');
    
    let newPos = Number(args[0]);
    if (newPos == NaN || (!newPos && newPos != 0)) return message.channel.send('That is not a valid number.');
    
    newPos = Math.round(newPos);
    
    if (newPos > player.track.length) newPos = Math.floor(player.track.length);
    if (newPos < 0) newPos = 0;
    
    player.seekTo(newPos * 1000)
    .then(seeked => {
        if (seeked) return message.react('✅');
        else return message.channel.send('Failed to seek.');
    })
    .catch(e => {
        console.error(e);
        return message.channel.send('Failed to seek: ' + e);
    });
}
