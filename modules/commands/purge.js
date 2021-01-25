const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { getPrefix } = require('../../functions/getPrefix');

module.exports.name         = 'purge';
module.exports.aliases      = ['clear', 'cl'];
module.exports.description  = 'Removes up to 100 messages from the chat at once.';
module.exports.syntax       = 'purge [Amount]';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'];
module.exports.userPerms    = ['MANAGE_MESSAGES'];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = (message, args) => {
    let prefix = getPrefix(message.guild);

    if (!(message.channel.permissionsFor(message.author).has('MANAGE_MESSAGES') || message.member.permissions.has('ADMINISTRATOR'))) {
        let errEmbed = new Discord.MessageEmbed()
        .setTitle('Access denied')
        .setDescription('You need MANAGE_MESSAGES permission to use this command.')
        .setColor('ff0000');
        return (message.channel.send(errEmbed))
    }

    if (args[0] == undefined || isNaN(args[0]) == true) {
        let errEmbed = new Discord.MessageEmbed()
        .setTitle('Invalid Arguments.')
        .setDescription(`You have to specify how many Messages you want to delete.\nExample: \`${prefix}clear 20\``)
        .setFooter('Please note that you can\'t delete more than 100 Messages at once, or Messages that are older than 14 Days. Messages that are pinned will also be ignored.')
        .setColor('ff0000');
        message.channel.send(errEmbed);
        return;
    } else if (args[0] > 100) {
        let errEmbed = new Discord.MessageEmbed()
        .setTitle('Invalid Number.')
        .setDescription('You can\'t delete more than 100 Messages at once.')
        .setColor('ff0000');
        message.channel.send(errEmbed);
        return;
    } else if (args[0] < 1) {
        let errEmbed = new Discord.MessageEmbed()
        .setTitle('Stop!')
        .setDescription('No, you can\'t delete less than one Message at once.')
        .setColor('ff0000');
        message.channel.send(errEmbed);
        return;
    } else {
        if (Math.floor(args[0]) == 100) args[0] = 99;

        let targets = [];
        var i = 0;

        var count = Math.floor(args[0]) + 1;
        let now = new Date();
        let failedAttempt = false;
        let failedMessages = 0;

        message.channel.messages.fetch({limit: count})
        .then(mesg => {
            mesg.forEach(msg => {
            if (!msg.pinned) {
                if (now - msg.createdTimestamp >= 1209600000) {
                    failedAttempt = true;
                    failedMessages = failedMessages + 1;
                } else {
                targets[i] = msg;
                i = i + 1;
                }
            }
            })
            message.channel.bulkDelete(targets);
            if (failedAttempt) {
            let errEmbed = new Discord.MessageEmbed()
                .setTitle('I couldn\'t delete some messages.')
                .setDescription(`I couldn't delete ${failedMessages} messages because they were more than 14 days old.`)
                .setFooter('Due to limitations on Discord\'s end, I am not able to clear messages that are older than 14 days.')
                .setColor('ff0000');
                message.channel.send(errEmbed)
                .then(msg => {msg.delete(15000)});
            }
        });
    }
}