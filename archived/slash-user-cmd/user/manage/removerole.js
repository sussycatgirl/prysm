const { SlashCommand } = require('../../../../bot/slashCommands');
const Discord = require('discord.js');
const { InteractionResponseType: resType } = require('discord-interactions');
const { client } = require('../../../../../bot');

/**
 * 
 * @param {SlashCommand} cmd
 * @param {function(String, Discord.MessageEmbed | false, resType, boolean) : void} callback
 */
module.exports.execute = (cmd, callback) => {
    callback('taek roel', false, resType.CHANNEL_MESSAGE, true);
}

module.exports.sendConfirmation = 'callback';
module.exports.requireGuildMember = true;