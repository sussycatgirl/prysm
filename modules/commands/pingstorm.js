const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');

module.exports.name         = 'pingstorm';
module.exports.aliases      = [];
module.exports.description  = '(Pingstorm has been removed)';
module.exports.syntax       = '';
module.exports.guildOnly    = false;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = true;
module.exports.botPerms     = ['SEND_MESSAGES'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = (message, args) => {
    message.channel.send('Sorry, this feature has been removed to comply with the top.gg rules.')
    .then(m => {
        if (m.deletable && message.deletable) setTimeout(() => message.channel.bulkDelete([m, message]), 30000);
        else {
            if (m.deletable) m.delete({timeout: 30000});
            if (message.deletable) message.delete({timeout: 30000});
        }
    });
}