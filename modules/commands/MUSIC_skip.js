const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { shoukaku } = require('../bot/shoukakuSetup');
let musicManager = require('../../functions/musicPlayer');

module.exports.name         = 'skip';
module.exports.aliases      = ['s', 'next'];
module.exports.description  = 'Skip the current song.';
module.exports.syntax       = 'play [Search term or URL]';
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
    if (player.track) player.stopTrack();
    else musicManager.startPlaying(message.guild, message.member.voice.channel, message.channel, true)
}