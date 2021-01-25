const { SlashCommand } = require('../../bot/slashCommands');

/**
 * 
 * @param {SlashCommand} cmd 
 */
module.exports.execute = (cmd) => {
    cmd.webhook.send('Test acknowledged');
}

module.exports.sendConfirmation = true;