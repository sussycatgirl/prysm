const { SlashCommand } = require('../../bot/slashCommands');

/**
 * 
 * @param {SlashCommand} cmd 
 */
module.exports.execute = (cmd, callback) => {
    callback('Test acknowledged', true);
}

module.exports.sendConfirmation = 'callback';