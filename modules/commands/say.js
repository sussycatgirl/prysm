const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');

module.exports.name         = 'say';
module.exports.aliases      = ['say'];
module.exports.description  = 'say';
module.exports.syntax       = 'say';
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
    if (args[0]) 
        message.channel.send(args.join(' '));
    else
        message.channel.send('no u');
}