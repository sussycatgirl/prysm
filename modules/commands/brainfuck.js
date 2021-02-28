const Discord = require('discord.js');
const { run: runBrainfuck } = require('../../functions/brainfuck');

module.exports.name         = 'brainfuck';
module.exports.aliases      = ['bf'];
module.exports.description  = 'Run brainfuck code. (Somewhat broken)';
module.exports.syntax       = 'brainfuck +[.+]';
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
    try {
        let { out, outStr, stats } = runBrainfuck(args.join(' '));
        outStr = outStr.replace(/\`/g, '\\`');
        
        message.channel.send(`${outStr}\n\n\`${out.join(', ').substr(0, 1000) || 'No output'}\`\n\nExecuted instructions: ${stats.executions}`);
    } catch(e) {
        message.channel.send(`\`\`\`brainfuck\n${e}\`\`\``);
    }
}