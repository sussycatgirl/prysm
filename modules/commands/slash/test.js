const { SlashCommand } = require('../../bot/slashCommands');
const { InteractionResponseType: resType } = require('discord-interactions');

/**
 * 
 * @param {SlashCommand} cmd
 * @param {function(String, import('discord.js').MessageEmbed | false, resType, boolean) : void} callback
 */
module.exports.execute = (cmd, callback) => {
    callback('Test acknowledged', false, resType.CHANNEL_MESSAGE, true);
}

module.exports.sendConfirmation = 'callback';