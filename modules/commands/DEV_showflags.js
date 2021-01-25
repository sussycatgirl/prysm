const data = require('../../bot');
const fs = require('fs');
const { Message } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    name: 'showflags',
    aliases: ["showperms", "flaglist", "permlist"],
    flag: 1000,
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    execute(message, args) {
        let data = fs.readFileSync('./permission_levels.json');
        message.channel.send('```json\n' + data + '```', {allowedMentions: false})
        .catch(() => {
            message.channel.send('Uh-oh, seems like the file is too long. Check your DMs!');
            const attachment = new Discord.MessageAttachment('./permission_levels.json');
            message.author.send(attachment);
        })
    }
}

module.exports.devCommand = true;