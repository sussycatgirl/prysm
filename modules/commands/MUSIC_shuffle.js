const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { shoukaku } = require('../bot/shoukakuSetup');
let musicManager = require('../../functions/musicPlayer');
const getGuildSettings = require('../../functions/getGuildSettings');

module.exports.name         = 'shuffle';
module.exports.aliases      = ['sh'];
module.exports.description  = 'Shuffle the queue.';
module.exports.syntax       = 'shuffle ["modify"?]';
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
    
    let modifyQueue = getGuildSettings.get(message.guild, 'music.shuffleModifiesQueue');
    if (args[0] == 'modify' || modifyQueue) {
        let queue = musicManager.queues.get(message.guild.id);
        if (!queue) return message.channel.send('The queue is currently empty.');
        queue = shuffle(queue);
        musicManager.queues.set(message.guild.id, queue);
        message.channel.send('The queue has been randomized.');
    } else {
        let shuffleMode = !musicManager.getShuffle(message.guild.id);
        musicManager.setShuffle(message.guild.id, shuffleMode);
        return message.channel.send(
            new Discord.MessageEmbed()
                .setDescription(`Shuffling has been **${shuffleMode ? 'enabled' : 'disabled'}**.`)
        )
    }
}
// stolen from stackoverflow
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}