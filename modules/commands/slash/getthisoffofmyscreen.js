const { SlashCommand } = require('../../bot/slashCommands');
const Discord = require('discord.js');
const { InteractionResponseType: resType } = require('discord-interactions');

/**
 * 
 * @param {SlashCommand} cmd
 * @param {function(String, Discord.MessageEmbed | false, resType, boolean) : void} callback
 */
module.exports.execute = (cmd, callback) => {
    const line = '\u200b\n';
    let text = '';
    for (let i=0; i<40; i++) text += line; // 40 lines is enough for Discord on normal zoom on a full HD screen
    callback(text, false, resType.CHANNEL_MESSAGE, true);
}

module.exports.sendConfirmation = 'callback';