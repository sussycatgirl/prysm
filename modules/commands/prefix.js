const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { getPrefix } = require('../../functions/getPrefix');

module.exports.name         = 'prefix';
module.exports.aliases      = ['pre'];
module.exports.description  = 'Show/Change the bot\'s prefix';
module.exports.syntax       = 'prefix [New prefix?]';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES'];
module.exports.userPerms    = [];


/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    if (!args[0] || !message.member.permissions.has("MANAGE_GUILD")) return message.channel.send(`This guild's prefix is ${getPrefix(message.guild.id)}`);

    let newPrefix = args.join(" ");
    if (newPrefix.length > 30) return message.channel.send(`Sorry, that prefix is too long.`);
    let guildSettings = db.guildSettings.get(message.guild.id);
    if (!guildSettings) guildSettings = {}

    if (!guildSettings.general) guildSettings.general = {}

    if (newPrefix.toLowerCase() == "reset" ||
        newPrefix.toLowerCase() == "clear" ||
        newPrefix.toLowerCase() == "delete") 
    {
        guildSettings.general.prefix = undefined;
        guildSettings.general.acceptSpaceAfterPrefix = false;
        db.guildSettings.set(message.guild.id, guildSettings);
        return message.channel.send("Prefix has been reset.");
    }
    
    guildSettings.general.prefix = newPrefix;

    guildSettings.general.acceptSpaceAfterPrefix = (newPrefix.indexOf(" ") > -1 || (newPrefix.match(/^[^a-zA-Z0-9]+$/) ? false : true));

    db.guildSettings.set(message.guild.id, guildSettings);
    
    message.channel.send(`Prefix changed to \`${newPrefix}\` - You can change the prefix at any time by running ${client.user} prefix <New prefix>.`);
}