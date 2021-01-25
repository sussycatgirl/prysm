const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const getGuildSettings = require('../../functions/getGuildSettings');
const { getPrefix } = require('../../functions/getPrefix');
let musicManager = require('../../functions/musicPlayer');

module.exports.name         = 'move';
module.exports.aliases      = ['mv', 'movetrack'];
module.exports.description  = 'Moves a track to a specific position in the queue.';
module.exports.syntax       = 'move [Track number] [New position]';
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
    
    if (!args[0]) return message.channel.send('You need to tell me which song to move.');
    
    let index = Number(args[0]);
    let newPos = isNaN(args[1]) ? 1 : Number(args[1]);
    
    if (index == NaN || newPos == NaN) return message.channel.send('That is not a valid number.');
    
    let queue = musicManager.queues.get(message.guild.id);
    if (!queue) return message.channel.send('I am currently not playing anything in this guild.');
    
    if (index > queue.length || index < 0) index = queue.length;
    if (index != 0) index = index - 1;
    
    if (newPos > queue.length || newPos < 0) newPos = queue.length;
    if (newPos != 0) newPos = newPos - 1;
    
    if (!queue[index] || !queue[newPos]) return message.channel.send('Woops, the queue is fucked up.');
    
    queue.splice(newPos, 0, queue.splice(index, 1)[0]);
    musicManager.queues.set(message.guild.id, queue);
    
    message.channel.send(new Discord.MessageEmbed()
        .setDescription(`Moved [${
            queue[newPos].info.title
                .replace('\\', '\\\\')
                .replace('`', '\\`')
                .replace(']', '\\]')
        }](${queue[newPos].info.uri}) to position ${newPos + 1}.`));
}