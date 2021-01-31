const { SlashCommand } = require('../../../bot/slashCommands');
const Discord = require('discord.js');
const { InteractionResponseType: resType } = require('discord-interactions');
const { client } = require('../../../../bot');

/**
 * 
 * @param {SlashCommand} cmd
 * @param {function(String, Discord.MessageEmbed | false, resType, boolean) : void} callback
 */
module.exports.execute = async (cmd, callback) => {
    try {
        const userID = cmd.data.options[0]?.options.find(option => option.name == 'user')?.value;
        const format = cmd.data.options[0]?.options.find(option => option.name == 'format')?.value;
        if (!userID) throw 'Unknown UserID';

        const user = await client.users.fetch(userID);
        let avatarURL = user?.displayAvatarURL(format ? { format: format } : { dynamic: true });
        if (avatarURL) {
            avatarURL = `\`${user.tag.replace(/\`/g, "'")}\`'s avatar: ${avatarURL}?size=2048`
        } else avatarURL = 'I cannot find that user.';
        callback(avatarURL, false, resType.CHANNEL_MESSAGE, true);
    } catch(e) {
        callback('' + e, false, resType.CHANNEL_MESSAGE, true);
    }
}

module.exports.sendConfirmation = 'callback';