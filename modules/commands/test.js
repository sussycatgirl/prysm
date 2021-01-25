const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');

module.exports.name         = 'test';
module.exports.aliases      = [];
module.exports.description  = 'Literally a test command.';
module.exports.syntax       = '';
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
module.exports.execute = async (message, args) => {
    message.channel.send('Hey there, I\'m online!');
}