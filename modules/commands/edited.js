const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { getPrefix } = require('../../functions/getPrefix');
const fs = require('fs').promises;

let character = '\u202b';

module.exports.name         = 'edited';
module.exports.aliases      = [];
module.exports.description  = '(edited)';
module.exports.syntax       = 'edited [text]';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    let content = args.join(' ');
    if (!content || content.indexOf('(edited)') == -1) return message.channel.send(
        new Discord.MessageEmbed()
        .setAuthor(`Syntax: ${getPrefix(message.guild)}edited [text]`)
            .setTitle(`Example:`)
            .attachFiles(new Discord.MessageAttachment(await fs.readFile('assets/edited.png'), 'edited.png'))
            .setImage('attachment://edited.png')
    );
    else content = content.split('(edited)');
    message.channel.send(args.join(' '))
        .then(msg => msg.edit(`${character}${content[1]} ${character}${content[0]}`));
}