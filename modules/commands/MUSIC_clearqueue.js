const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const getGuildSettings = require('../../functions/getGuildSettings');
const { getPrefix } = require('../../functions/getPrefix');
let musicManager = require('../../functions/musicPlayer');

module.exports.name         = 'clearqueue';
module.exports.aliases      = ['clearq', 'qclear'];
module.exports.description  = 'Delete the entire queue, apart from the currently playing track.';
module.exports.syntax       = 'clearqueue';
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
    
    let queue = musicManager.queues.get(message.guild.id);
    if (!queue || queue.length == 0) return message.channel.send('Queue is currently empty.');
    
    musicManager.queues.set(message.guild.id, []);
    
    let embed = new Discord.MessageEmbed()
        .setDescription(`Cleared ${queue.length} tracks from the queue.`);
    
    return message.channel.send(embed);
}