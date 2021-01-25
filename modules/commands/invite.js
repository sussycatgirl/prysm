const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');

module.exports.name         = 'invite';
module.exports.description  = 'Invite Prysm to your server!';
module.exports.syntax       = '';
module.exports.guildOnly    = false;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = (message, args) => {
    let url = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands&permissions=`;
    let slashOnlyURL = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=applications.commands`;
    let perms = {
        admin: new Discord.Permissions([ 
            'ADMINISTRATOR' 
        ]).bitfield,
        recommended: new Discord.Permissions([ 
            'ADD_REACTIONS', 
            'ATTACH_FILES', 
            'BAN_MEMBERS', 
            'CHANGE_NICKNAME', 
            'CONNECT', 
            'EMBED_LINKS', 
            'KICK_MEMBERS', 
            'MANAGE_CHANNELS', 
            'MANAGE_WEBHOOKS', 
            'READ_MESSAGE_HISTORY', 
            'SEND_MESSAGES', 
            'SPEAK', 
            'USE_EXTERNAL_EMOJIS', 
            'VIEW_CHANNEL'
        ]).bitfield,
        limited: new Discord.Permissions([
            'VIEW_CHANNEL',
            'ATTACH_FILES',
            'USE_EXTERNAL_EMOJIS',
            'ADD_REACTIONS',
            'READ_MESSAGE_HISTORY',
            'MANAGE_MESSAGES',
            'EMBED_LINKS'
        ]).bitfield
    }
    let descs = {
        admin: `Give Prysm full \(Administrator\) permissions on your server.`,
        recommended: `It is recommended to use this link.\nUse this if you want to use most features without giving Prysm Administrator permissions.`,
        limited: `Only give basic permissions to Prysm.\nMost features will not work with this.`,
        slashOnly: `Add Prysm's slash commands without adding the bot itself. The majority of commands will not work with this.\nYou can also use this to enable slash commands on a server where the bot is already added without them.`
    }

    let description = 'Use one of these links to invite Prysm.\nUnless you need to, go with "Recommended".\nHover over a link to see more details.\n\n';
    description += `[Recommended](${url}${perms.recommended} "${descs.recommended}") - `;
    description += `[Administrator](${url}${perms.admin} "${descs.admin}") - `;
    description += `[Minimal](${url}${perms.limited} "${descs.limited}") - `;
    description += `[Commands only](${slashOnlyURL} "${descs.slashOnly}") ([?](https://support.discord.com/hc/sv/articles/1500000368501-Slash-Commands-FAQ "Click to learn more about slash commands"))`;

    const invEmbed = new Discord.MessageEmbed()
        .setTitle('Invite Prysm to your Server!')
        .setDescription(description)
        .setThumbnail(client.user.avatarURL)
        .setColor('0089d2');

    message.channel.send(invEmbed);
}

