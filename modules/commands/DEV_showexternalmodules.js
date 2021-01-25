const data = require('../../bot');
const fs = require('fs');
const { Message } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    name: 'showexternalmodules',
    aliases: ["showexternalcommands", "showextmodules", "showextcommands", "showextmods", "showextcmds", "showextmod", "showextcmd", "showexternal", "showext"], // tf
    flag: 0,
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    execute(message, args) {
        let loaded = {
            commands: fs.readdirSync('./modules/external_commands'),
            modules:  fs.readdirSync('./modules/external_modules')
        }

        let out = '';

        if (loaded.commands.length > 0) {
            out += '**Commands**'

            loaded.commands.forEach(file => {
                out += '\n↳ ' + file;
            });
        }

        if (loaded.modules.length > 0) {
            out += '\n\n'
            out += '**Modules**'

            loaded.modules.forEach(file => {
                out += '\n↳ ' + file;
            });
        }

        message.channel.send(
            new Discord.MessageEmbed()
            .setTitle('Loaded external modules')
            .setDescription(out || 'No external modules or commands loaded.')
            .setColor('36393f')
        );
    }
}

module.exports.devCommand = true;