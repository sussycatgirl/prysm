const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');

module.exports.name         = 'clientid';
module.exports.aliases      = ['cid'];
module.exports.description  = 'Sends your own client ID or the client ID of someone else.';
module.exports.syntax       = 'clientid [@Member?]';
module.exports.guildOnly    = false;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = (message, args) => {
    if (!message.mentions.users.first()) 
        message.channel.send('Your Client ID is ' + message.member.id);

    else
        message.channel.send(`${message.mentions.users.first().username}'s Client ID is ${message.mentions.users.first().id}`);
}