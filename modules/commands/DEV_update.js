const Discord = require('discord.js');
const config = require('../../config.json');
const data = require('../../bot');
const client = data.client;
const { exec } = require('child_process');

module.exports = {
    name: 'update',
    aliases: [],
    flag: 10000,
    execute(message, args) {
        exec('git pull', (err, stdout, stderr) => {
            message.channel.send(stdout + '\n\n' + stderr);
            if (!stderr) return; // Git outputs to stderr after successfully pulling for some reason
            exec('npm install', (err, stdout, stderr) => {
                message.channel.send(stdout + '\n' + stderr);
                require('../core/command_loader').reloadAll();
                message.channel.send('`All commands have been reloaded. A complete restart may be necessary.`');
            });
        });
        message.react('👍').catch();
    }
}

module.exports.devCommand = true;