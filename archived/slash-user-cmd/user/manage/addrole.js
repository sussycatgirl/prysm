const { SlashCommand } = require('../../../../bot/slashCommands');
const Discord = require('discord.js');
const { InteractionResponseType: resType } = require('discord-interactions');
const { client } = require('../../../../../bot');

/**
 * 
 * @param {SlashCommand} cmd
 * @param {function(String, Discord.MessageEmbed | false, resType, boolean) : void} callback
 */
module.exports.execute = async (cmd, callback) => {
    try {
        const userID = cmd.data.options[0]?.options[0]?.options.find(option => option.name == 'user')?.value;
        const roleID = cmd.data.options[0]?.options[0]?.options.find(option => option.name == 'role')?.value;
        const guild = await client.guilds.fetch(cmd.guild_id);
        
        if (!cmd.member?.permissions.has('MANAGE_ROLES'))
            return callback(`\`You do not have permission to use this.\``, false, resType.CHANNEL_MESSAGE, true);
        if (!guild.me.permissions.has('MANAGE_ROLES'))
            return callback(`\`I can't manage roles in this guild.\``, false, resType.CHANNEL_MESSAGE, true);
        
        if (cmd.member.roles.highest.comparePositionTo(roleID) > 0 && guild.ownerID != cmd.member.user.id)
            return callback(`You can't access the role <@&${roleID}>`, false, resType.CHANNEL_MESSAGE, true);
        if (guild.me.roles.highest.comparePositionTo(roleID) <= 0)
            return callback(`I can't access the role <@&${roleID}>`, false, resType.CHANNEL_MESSAGE, true);
        
        const target = await guild.members.fetch(userID);
        if (target.roles.cache.has(roleID))
            return callback(`<@${userID}> already has the role <@&${roleID}>`, false, resType.CHANNEL_MESSAGE, true);
        
        target.roles.add(roleID, `Requested by ${cmd.member?.user?.tag}`)
            .then(() => callback(`Assigned <@&${roleID}> to <@${userID}>.`, false, resType.CHANNEL_MESSAGE, true))
            .catch(e => callback('`Failed to assign role: ' + e + '`', false, resType.CHANNEL_MESSAGE, true));
            
    } catch(e) {
        console.warn(e);
        callback(String(e), false, resType.CHANNEL_MESSAGE, true);
    }
}

module.exports.sendConfirmation = 'callback';
module.exports.requireGuildMember = true;