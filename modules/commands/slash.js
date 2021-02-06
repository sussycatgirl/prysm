const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const fs = require('fs').promises;

module.exports.name         = 'slash';
module.exports.aliases      = [];
module.exports.description  = 'Enable support for commands with auto completion';
module.exports.syntax       = 'slash';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    let url = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=applications.commands&guild_id=${message.guild.id}`;
    let embed = new Discord.MessageEmbed();
    embed.setTitle('Slash commands');
    embed.setDescription(`Slash commands are a new easy way to interact with bots. To enable them for this server, simply ${message.member.permissions.has('MANAGE_GUILD') ? `click [here](${url})` : `tell someone with \`Manage Server\` permission to [authorize](${url}) the bot`}.\n[Learn more](https://support.discord.com/hc/sv/articles/1500000368501-Slash-Commands-FAQ) about slash commands.`);
    if (message.channel.type != 'dm' && message.channel.permissionsFor(message.guild?.me).has('ATTACH_FILES'))
        embed.attachFiles([ new Discord.MessageAttachment(await fs.readFile('assets/slash.gif'), 'image.gif') ]);
    embed.setImage('attachment://image.gif');
    
    message.channel.send(embed);
}

