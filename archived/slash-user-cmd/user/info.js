const { SlashCommand } = require('../../../bot/slashCommands');
const Discord = require('discord.js');
const { InteractionResponseType: resType } = require('discord-interactions');
const { client, db } = require('../../../../bot');

/**
 * 
 * @param {SlashCommand} cmd
 * @param {function(String, Discord.MessageEmbed | false, resType, boolean) : void} callback
 */
module.exports.execute = async (cmd, callback) => {
    try {
        const userID = cmd.data.options[0]?.options.find(option => option.name == 'user')?.value;
        const user = await client.users.fetch(userID);

        if (!user)
            return callback('I can\'t get details about that user.', false, resType.CHANNEL_MESSAGE, true);

        const now = new Date();
        const time = new Date(user.createdTimestamp);

        let info = `${user.bot ? db.clientCache.customEmojis.bot : ''} **${user.tag.replace(/\*/g, "\\*")}**\n`
        + `**Account creation**: ${Math.floor(Math.abs(now - time) / 86400000)} Days ago (${time.getDate()}. ${time.getMonth() + 1}. ${time.getFullYear()})\n`
        + `**Presence**: ${user.presence.status}\n`;

        const guild = client.guilds.cache.get(cmd.guild_id);
        if (guild) {
            const member = await guild.members.fetch(user.id);
            info += `**Roles**: ${member.roles.cache.size} (Highest: ${member.roles.highest || 'None'}, Hoisted: ${member.roles.hoist || 'None'})`
        }

        callback(info, false, resType.CHANNEL_MESSAGE, true);
    } catch(e) {
        callback('' + e, false, resType.CHANNEL_MESSAGE, true);
    }
}

module.exports.sendConfirmation = 'callback';