const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { shoukaku } = require('../bot/shoukakuSetup');

module.exports.name         = 'disconnect';
module.exports.aliases      = ['dc', 'leave', 'die', 'kys', 'death'];
module.exports.description  = 'Make the bot leave the voice channel.';
module.exports.syntax       = 'dc';
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
    let ownID = message.guild.me.voice.channelID;
    let memberID = message.member.voice.channelID;
    if  (!(
        (ownID && memberID == ownID) || 
        (ownID && message.guild.me.voice.channel.permissionsFor(message.member).has('MOVE_MEMBERS')) ||
        (ownID && ownID != memberID && message.guild.me.voice.channel.members.filter(m => !m.user.bot).size == 0)
        ) && message.guild.me.voice.channelID) return message.channel.send('You are not in my voice channel.');
    
    let player = shoukaku.getPlayer(message.guild.id);
    if (player && player.voiceConnection.state == 'CONNECTED')
        player.disconnect();
    else if (message.guild.me.voice && message.guild.me.voice.channel)
        message.guild.me.voice.channel.leave();
    else return message.channel.send('I am not connected to a voice channel.');
}