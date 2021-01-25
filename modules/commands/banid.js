const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');

module.exports.name         = 'banid';
module.exports.aliases      = [];
module.exports.description  = 'Bans a specific user by his ID. Does not support temp banning.';
module.exports.syntax       = 'banid [ID]';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'BAN_MEMBERS'];
module.exports.userPerms    = ['BAN_MEMBERS'];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    if (!message.member.permissions.has('BAN_MEMBERS')) return message.channel.send(
        new Discord.MessageEmbed()
            .setTitle('Access denied')
            .setDescription('You don\'t have permission to use this command.')
            .setFooter('Required permission: BAN_MEMBERS')
            .setTimestamp()
            .setColor('ff0000')
    );

    if (!args[0] || isNaN(args[0])) return message.channel.send('Invalid target: Make sure to add their user ID.');
    let msg = await message.channel.send('Banning ' + args[0] + '...');
    message.guild.members.ban(args[0])
        .then(member => {
            // Ban succeeded
            msg.edit(`${member.username}#${member.discriminator} has been banned.`);
            console.log(member);
        })
        .catch(() => {
            msg.edit('I couldn\'t ban that ID.');
        });
}