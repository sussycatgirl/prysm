const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');

module.exports.name         = 'example';                        // The name of the command
module.exports.aliases      = ['sample'];                       // The alias(es) of the command
module.exports.description  = 'Description here.';              // The description that appears in the help command
module.exports.syntax       = 'example [Arg1] [Arg2]';          // The syntax that appears in the help command
module.exports.guildOnly    = true;                             // Disallows command use in DMs
module.exports.dev_only     = false;                            // Only devs can execute this command
module.exports.disabled     = true;                             // Completely disables this command
module.exports.hidden       = true;                             // Whether this command should be hidden in the help list
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS']; // The permissions that the bot requires. Will be ignored in DMs.
module.exports.userPerms    = [];                               // The permissions that the user requires. Will be ignored in DMs. (Not implemented yet)
//                                                              // All permission names: https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS

/**
 * @param {Discord.Message} message 
 * @param {Array<string>} args 
 */
module.exports.execute = async (message, args) => {

}