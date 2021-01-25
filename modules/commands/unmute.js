const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');

const Enmap = require('enmap');

// Database that contains temp mutes
const tempmutes = new Enmap({ name: 'tempmutes', polling: true, fetchAll: true });
const muteroles = new Enmap({ name: 'muteroles', polling: true, fetchAll: true });

const { getPrefix } = require('../../functions/getPrefix');
const { getTimeInput } = require('../../functions/getTimeInput');
const { getUserFromMention } = require('../../functions/getMention');

module.exports.name         = 'unmute';
module.exports.aliases      = ['umute', 'um'];
module.exports.description  = 'Unmutes a member.';
module.exports.syntax       = 'unmute [@Member]';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_CHANNELS', 'MANAGE_ROLES'];
module.exports.userPerms    = ['MANAGE_ROLES'];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    if (!message.member.permissions.has('MANAGE_ROLES')) return message.channel.send(embeds.accessDenied);

    if (
        !muteroles.get(message.guild.id) ||
        !message.guild.roles.cache.get(muteroles.get(message.guild.id))
    ) return message.channel.send(embeds.muteNotSetUp)

    let targetuser = getUserFromMention(args[0]);
    if (!targetuser) return message.channel.send(embeds.noUserMention);
    let target = message.guild.members.cache.get(targetuser.id);
    if (!target) return message.channel.send(embeds.noUserMention);

    if (target.roles.cache.get(muteroles.get(message.guild.id)) || tempmutes.get(target.id)) {
        target.roles.remove(muteroles.get(message.guild.id));
        tempmutes.delete(target.id);
        require('./mute').refreshTimeouts();

        message.channel.send(
            new Discord.MessageEmbed()
            .setDescription(`${target.user} has been unmuted.`)
            .setColor('36393f')
        )
    } else {
        return message.channel.send(embeds.notMuted);
    }
}
let embeds = {}

embeds.errorColor = 'ff0000';


embeds.noUserMention = new Discord.MessageEmbed()
    .setTitle('Invalid syntax')
    .setDescription('You need to @mention someone to unmute.')
    .setColor(embeds.errorColor)
    .setTimestamp();

embeds.accessDenied = new Discord.MessageEmbed()
    .setTitle('Access denied')
    .setDescription('You don\'t have permission to use this command.')
    .setFooter('Required permission: MANAGE_ROLES')
    .setColor(embeds.errorColor)
    .setTimestamp();

    embeds.notMuted = new Discord.MessageEmbed()
    .setDescription('This user isn\'t muted.')
    .setColor(embeds.errorColor);

    embeds.muteNotSetUp = new Discord.MessageEmbed()
    .setDescription('There is no muted role set up for your server.')
    .setColor(embeds.errorColor);
