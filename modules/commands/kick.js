const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { getUserFromMention } = require('../../functions/getMention');
const { getTimeInput } = require('../../functions/getTimeInput');
const { getPrefix } = require('../../functions/getPrefix');
const getGuildSettings = require('../../functions/getGuildSettings');

module.exports.name         = 'kick';
module.exports.aliases      = ['remove'];
module.exports.description  = 'Kicks a member from the guild';
module.exports.syntax       = 'kick [@Member] [Reason]';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'KICK_MEMBERS'];
module.exports.userPerms    = ['KICK_MEMBERS'];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async function(message, args) {
    /* 
     * Scan the user's permissions and refuse
     * to continue if they don't have KICK_MEMBERS
     * permission (Remove when userPerms flag works) 
     */
    if (!message.member.permissions.has('KICK_MEMBERS')) return message.channel.send(embeds.noPermission);

    let targetuser = getUserFromMention(args[0]);
    if (!targetuser) return message.channel.send(embeds.noTarget);
    let target = message.guild.members.cache.get(targetuser.id);
    if (!target) return message.channel.send(embeds.noTarget);

    args.shift();

    let reason = args.join(' ');

    if (message.author.id == target.id)
    return message.channel.send(embeds.selfkick);
    
    else if (target.id == client.user.id)
        return message.channel.send(embeds.kickMyself);

    else if (target.user.id == message.guild.owner.id)
        return message.channel.send(embeds.targetIsOwner);

    else if (!(message.member.roles.highest.comparePositionTo(target.roles.highest) > 0) && message.author.id != message.guild.owner.id) 
        return message.channel.send(embeds.targetIsHigher);

    else if (!target.kickable) 
        return message.channel.send(embeds.botTooLow);

    else if (reason.length > 350)
        return message.channel.send(embeds.reasonTooLong);

    else if (target.user.bot) {
        // If the target is a bot, generate a invite URL first. If a match is found in the invitr_urls.json file, the url from there will be used instead.
        let reInviteURL = `https://discord.com/api/oauth2/authorize?client_id=${target.user.id}&scope=bot&permissions=${target.permissions.bitfield}&guild_id=${message.guild.id}&disable_guild_select=true`
        if (require('../../assets/invite_urls.json')[target.user.id]) {
            reInviteURL = require('../../assets/invite_urls.json')[target.user.id];
            reInviteURL = reInviteURL.replace('%%PERMISSIONS%%', target.permissions.bitfield);
            reInviteURL = reInviteURL.replace('%%GUILDID%%', message.guild.id);
        }
        target.kick(`Kick requested  by ${message.author.tag} ${reason ? `with reason ${reason}` : '(no reason provided)'}`)
        .then(() => {
            message.channel.send(
                new Discord.MessageEmbed()
                .setTitle('Bot removed!')
                .setDescription(`${target.user.tag} has been successfully kicked.${reason ? `\nReason: ${reason}` : ''}\nDidn't mean to? [Click here to re-invite this bot.](${reInviteURL})`)
                .setAuthor(`${target.user.tag}`, target.user.displayAvatarURL())
                .setColor('0DFF6E')
            );
        })
        .catch(e => {
            message.channel.send('Uh-oh. I\'m having trouble removing this bot.\n```js\n' + e + '\n```');
        });
    }
    else {
        let dmFailed = false;
        let dmUser = () => {
            return new Promise(async (resolve, reject) => {
                if (getGuildSettings.get(message.guild, 'moderation.dmOnKick')) {
                    let kickEmbed = new Discord.MessageEmbed();
                    kickEmbed.setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }));
                    kickEmbed.setTitle('You have been kicked');
                    kickEmbed.setDescription(`${message.author.tag} has kicked you${reason ? ': ' + reason : '.'}`);
                    kickEmbed.setColor('ff0000');

                    if (message.attachments && message.attachments.first()) kickEmbed.setImage(message.attachments.first().url);

                    await target.send(kickEmbed).catch(e => {
                        console.error(e);
                        dmFailed = e;
                    });

                    resolve();
                }
            });
        };

        await dmUser();

        target.kick({"reason": `kick requested  by ${message.author.tag} ${reason ? `with reason ${reason}` : '(no reason provided)'}`, days: 0})
        .then(() => {
            message.channel.send(
                new Discord.MessageEmbed()
                .setTitle('User kicked!')
                .setDescription(`${target.user.tag} has been successfully kicked.${reason ? `\nReason: ${reason}` : ''}\n${dmFailed ? dmFailed : ''}`)
                .setAuthor(`${target.user.tag}`, target.user.displayAvatarURL())
                .setColor('0DFF6E')
            );
        })
        .catch(e => {
            console.error(e);
            message.channel.send(
                    new Discord.MessageEmbed()
                        .setAuthor(target.user.tag, target.user.displayAvatarURL())
                        .setTitle('Failed to kick')
                        .setDescription(`\`\`\`js\n${e}\n\`\`\``)
                        .setFooter(`Please contact the dev team (using ${getPrefix(message.guild)}feedback) if this problem re-occurs`)
                        .setColor('FF0000')
                )
                return;
        });
    }
}


const embeds = {}

embeds.errorColor = 'ff0000';
embeds.noPermission = new Discord.MessageEmbed()
    .setTitle('Access denied')
    .setDescription('You don\'t have permission to use this command.')
    .setFooter('Required permission: KICK_MEMBERS')
    .setTimestamp()
    .setColor(embeds.errorColor);

embeds.noTarget = new Discord.MessageEmbed()
    .setTitle('Invalid syntax')
    .setDescription('You need to @mention someone to kick.')
    .setFooter(`Syntax: ${getPrefix()}kick [@Member] [Reason?]\nExample: ${getPrefix()}kick @Rob Violating the rules`)
    .setColor(embeds.errorColor);

embeds.targetIsHigher = new Discord.MessageEmbed()
    .setTitle('You can\'t kick that person')
    .setDescription('This person\'s highest role is higher than or equal to your highest role.')
    .setTimestamp()
    .setColor(embeds.errorColor);

embeds.botTooLow = new Discord.MessageEmbed()
    .setTitle('Unable to kick')
    .setDescription('I can\'t kick that person because my highest role is too low.')
    .setTimestamp()
    .setColor(embeds.errorColor);
    
embeds.targetIsOwner = new Discord.MessageEmbed()
    .setTitle('Unable to kick')
    .setDescription('I can\'t kick the server owner!')
    .setTimestamp()
    .setColor(embeds.errorColor);

embeds.selfkick = new Discord.MessageEmbed()
    .setTitle('You can\'t kick yourself.')
    .setDescription('Why would you kick yourself?')
    .setTimestamp()
    .setColor(embeds.errorColor);

embeds.kickMyself = new Discord.MessageEmbed()
    .setTitle('I can\'t kick myself.')
    .setDescription('And even if I could, why would I?')
    .setTimestamp()
    .setColor(embeds.errorColor);

embeds.reasonTooLong = new Discord.MessageEmbed()
    .setTitle('The kick reason is too long.')
    .setDescription('Sorry, the kick reason can\'t be longer than 350 letters.')
    .setTimestamp()
    .setColor(embeds.errorColor);