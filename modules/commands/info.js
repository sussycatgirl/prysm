const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { getPrefix } = require('../../functions/getPrefix');

module.exports.name         = 'info';
module.exports.aliases      = [];
module.exports.description  = 'Show some stats and details about the bot.';
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
    let prefix = getPrefix(message.guild);
    let commands = require('../core/command_loader').commands;

    let embed = new Discord.MessageEmbed()
        .setColor('2f3136')
        .setTitle(`Hey there, ${message.author.username}!`)
        .setDescription(`Here is some information about myself.\nUse the \`${prefix}help\` command to see all my commands.\nJoin the support server [here](https://discord.gg/aTRHKUY) or view the project on [GitHub](https://github.com/ImVerum/prysm).`);

    embed.addField(`Stats`, `Servers: ${db.clientCache.guildSize}\nUsers: ${db.clientCache.userSize}\nShard: ${client.shard.ids[0]}`, true);
    embed.addField(`Commands`, `Enabled commands: ${commands.filter(cmd => !cmd.disabled).size}\nTotal commands: ${commands.size}\nCommands ran: ${db.stats.get('total_commands')}`, true);
    embed.addField(`Technical`, `Made with [Discord.js](https://discord.js.org)\nDiscord.js: [ver. ${Discord.version}](https://discord.js.org)\nHosted on [Raspberry Pi](https://www.raspberrypi.org/)`, true);
    embed.addField(`Developer`, `Source code is found [here](https://github.com/ImVerum/prysm).\nPrysm was made by ${db.botOwner.tag}.\nThanks for using my bot :)`, true);

    message.channel.send(embed);
}