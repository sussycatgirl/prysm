const Discord = require('discord.js');
const config = require('../../config.json');
const data = require('../../bot');
const client = data.client;

module.exports = {
    name: 'terminate',
    aliases: ["exit"],
    flag: 10000,
    execute(message, args) {
        message.channel.send('Terminating process.')
        .then(() => {
            process.exit(0);
        });
    }
}

module.exports.devCommand = true;