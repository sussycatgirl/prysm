const data = require('../../bot');
const client = data.client;
const Discord = require('discord.js');
const Enmap = require('enmap');


module.exports = {
    name: 'statusmsg',
    aliases: [],
    flag: 1000,
    /**
     * 
     * @param {Discord.Message} message 
     * @param {*} args 
     */
    async execute(message, args) {
        message.channel.send(new Discord.MessageEmbed()
        .setTitle('Channel set!')
        .setDescription('Restart the bot for changes to take effect')
        .setImage('https://api.janderedev.xyz/files/v2/graph.png'))
        .then(msg => {
            data.db.stats.set('status_message', {msgID: msg.id, channelID: msg.channel.id, guildID: msg.guild.id});
        });
    }
}

module.exports.devCommand = true;