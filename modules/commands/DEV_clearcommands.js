const data = require('../../bot');
const { Message } = require('discord.js');
const Discord = require('discord.js');
const { interaction } = require('../bot/slashCommands');

module.exports = {
    name: 'clearcommands',
    aliases: ["clearslash"],
    flag: 1000,
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async execute(message, args) {
        if (!message.guild) return message.channel.send('Run this in a guild.');
        if (!interaction) return message.channel.send('Interaction handler is not initialized yet. Use \'rlc\' dev command first.');
        const commands = await interaction.getApplicationCommands(message.guild.id);
        
        if (!commands) return message.channel.send('I can\'t find any guild specific commands here.');
        
        commands.forEach(async command => {
            await interaction.deleteApplicationCommand(command.id, message.guild.id);
        });
        message.channel.send(`Deleted ${commands.length} commands.`);
    }
}

module.exports.devCommand = true;