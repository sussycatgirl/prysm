const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const getGuildSettings = require('../../functions/getGuildSettings');
const { getPrefix } = require('../../functions/getPrefix');
let musicManager = require('../../functions/musicPlayer');

module.exports.name         = 'remove';
module.exports.aliases      = ['rm', 'delete'];
module.exports.description  = 'Delete a track from the queue. If a second track is specified, all tracks between these two tracks will be removed.';
module.exports.syntax       = 'remove [Track number] [End track number]';
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
    
    if (!args[0]) return message.channel.send('You need to tell me which song to remove.');
    let queue = musicManager.queues.get(message.guild.id);
    if (!queue) return message.channel.send('The queue is currently empty.');
    
    let trackIndex = Number(args[0]);
    let endTrackIndex = args[1] ? Number(args[1]) : trackIndex;
    
    if (isNaN(trackIndex) || isNaN(endTrackIndex)) return message.channel.send('That is not a valid number.');
    if (trackIndex != 0)    trackIndex--;
    if (endTrackIndex != 0) endTrackIndex--;
    if (!queue[trackIndex])    return message.channel.send('Track not found in queue.');
    if (!queue[endTrackIndex]) return message.channel.send('End track index out of bounds.');
    if (endTrackIndex < trackIndex) {
        let temp = endTrackIndex;
        endTrackIndex = trackIndex;
        trackIndex = temp;
    }
    
    let removed = queue.splice(trackIndex, (endTrackIndex - trackIndex) + 1);
    
    let embed = new Discord.MessageEmbed()
        .setDescription(removed.length > 1 ? `Removed ${removed.length} tracks.` : `Removed [${
            removed[0].info.title
                .replace('\\', '\\\\')
                .replace('`', '\\`')
                .replace(']', '\\]')
            }](${removed[0].info.uri}) from the queue.`);
    
    message.channel.send(embed);
    
    musicManager.queues.set(message.guild.id, queue);
}