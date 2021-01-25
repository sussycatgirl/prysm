const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { getUserFromMention } = require('../../functions/getMention');
const { getTimeInput } = require('../../functions/getTimeInput');
const { getPrefix } = require('../../functions/getPrefix');
const Enmap = require('enmap');
const getGuildSettings = require('../../functions/getGuildSettings');

// Create Enmap that contains all temp bans
const bans = new Enmap({ name: 'bans', polling: true, fetchAll: true });

module.exports.name         = 'ban';
module.exports.aliases      = [];
module.exports.description  = 'Bans a member from the guild';
module.exports.syntax       = 'ban [@Member] [Ban duration?] [Reason?]';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'KICK_MEMBERS', 'BAN_MEMBERS'];
module.exports.userPerms    = ['BAN_MEMBERS'];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async function(message, args) {
    /* 
     * Scan the user's permissions and refuse
     * to continue if they don't have BAN_MEMBERS
     * permission (Remove when userPerms flag works) 
     */
    if (!message.member.permissions.has('BAN_MEMBERS')) return message.channel.send(embeds.noPermission);

    let targetuser = getUserFromMention(args[0]);
    if (!targetuser) return message.channel.send(embeds.noTarget);
    let target = message.guild.members.cache.get(targetuser.id);
    if (!target) return message.channel.send(embeds.noTarget);

    args.shift();

    const { delay, text } = getTimeInput(args.join(' '));

    let reason = text;

    // Gonna do the yanderedev here
    // ELSE IF ELSE IF ELSE IF ELSE IF
    if (message.author.id == target.id)
    return message.channel.send(embeds.selfBan);
    
    else if (target.id == client.user.id)
        return message.channel.send(embeds.banMyself);

    else if (target.user.id == message.guild.owner.id)
        return message.channel.send(embeds.targetIsOwner);

    else if (!(message.member.roles.highest.comparePositionTo(target.roles.highest) > 0) && message.author.id != message.guild.owner.id) 
        return message.channel.send(embeds.targetIsHigher);

    else if (!target.bannable) 
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
        let delayMin = delay / 1000 / 60;
        let banDurationStr = delay > 0 ? `${delayMin > 60 ? `${Math.round(delayMin / 6) / 10} hour${Math.round(delayMin / 6) / 10 != 1 ? 's' : ''}` : `${Math.round(delayMin)} minute${Math.round(delayMin) != 1 ? 's' : ''}`}` : '';
        let dmUser = () => {
            return new Promise(async (resolve, reject) => {
                if (getGuildSettings.get(message.guild, 'moderation.dmOnBan')) {
                    let banEmbed = new Discord.MessageEmbed();
                    banEmbed.setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }));
                    banEmbed.setTitle('You have been banned');
                    banEmbed.setDescription(`${message.author.tag} has${delay == 0 ? ' permanently' : ''} banned you${reason ? ': ' + reason : '.'}\n${(!delay || banDurationStr.trim() == '' || !banDurationStr) ? '' : `Your ban expires in ${banDurationStr}.`}`);
                    banEmbed.setColor('ff0000');

                    if (message.attachments && message.attachments.first()) banEmbed.setImage(message.attachments.first().url);

                    await target.send(banEmbed).catch(e => {
                        console.error(e);
                        dmFailed = e;
                    });

                    resolve();
                }
            });
        };

        await dmUser();

        target.ban({"reason": `Ban requested  by ${message.author.tag} ${reason ? `with reason ${reason}` : '(no reason provided)'}`, days: 0})
        .then(() => {
            message.channel.send(
                new Discord.MessageEmbed()
                .setTitle('User banned!')
                .setDescription(`${target.user.tag} has been successfully ${delay > 0 ? 'temp-' : ''}banned.${reason ? `\nReason: ${reason}` : ''}\n${(!delay || banDurationStr.trim() == '' || !banDurationStr) ? '' : `Ban expires in ${banDurationStr}.`}\n${dmFailed ? dmFailed : ''}`)
                .setAuthor(`${target.user.tag}`, target.user.displayAvatarURL())
                .setColor('0DFF6E')
            );

            if (delay > 0) {
                let banlist = bans.get(message.guild.id);
                if (!banlist) bans.set(message.guild.id, {});
                if (!banlist) banlist = {};

                banlist[target.id] = {
                    expires: delay + Date.now(),
                    length: delay,
                    user: target.id,
                    by: message.author.id,
                    guild: message.guild.id,
                    reason: reason
                }
                bans.set(message.guild.id, banlist);
                this.refreshTimeouts();
            }
        })
        .catch(e => {
            console.error(e);
            message.channel.send(
                    new Discord.MessageEmbed()
                        .setAuthor(target.user.tag, target.user.displayAvatarURL())
                        .setTitle('Failed to ban')
                        .setDescription(`\`\`\`js\n${e}\n\`\`\``)
                        .setFooter(`Please contact the dev team (using ${getPrefix(message.guild)}feedback) if this problem re-occurs`)
                        .setColor('FF0000')
                )
                return;
        });
    }
}

let timeouts = []

module.exports.refreshTimeouts = function() {
    timeouts.forEach(t => clearTimeout(t)); // Stop previous timeouts

    bans.keyArray().forEach(guild => {
        let guildbans = bans.get(guild);
        if (guildbans) {
            Object.keys(guildbans).forEach(userid => {
                let ban = guildbans[userid];
                
                let guildObj = client.guilds.cache.get(ban.guild);
                if (!guildObj) return;

                guildObj.fetchBans().then(guildbanlist => {
                    // Delete the entry if the member was unbanned
                    let bannedmember = guildbanlist.find(b => b.user.id === ban.user);
                    if (!bannedmember) {
                        let b = bans.get(ban.guild);
                        delete b[ban.user];
                        bans.set(ban.guild, b);
                        delete b;
                    } else {
                        timeouts.push(setTimeout(function() {
                            guildObj.members.unban(ban.user, 'Temp ban has expired.')
                            .then(async (user) => {
                                if (!user.bot && getGuildSettings.get(guildObj, 'moderation.dmOnUnban')) {
                                    let inviteUser = getGuildSettings.get(guildObj, 'moderation.inviteOnUnban');

                                    let unbanEmbed = new Discord.MessageEmbed();
                                    unbanEmbed.setAuthor(guildObj.name, guildObj.iconURL({ dynamic: true }));
                                    unbanEmbed.setTitle('You have been unbanned');
                                    unbanEmbed.setColor(inviteUser ? '1989ea' : '0DFF6E');

                                    if (inviteUser) {
                                        let channel = guildObj.channels.cache.find(channel => channel.type == 'text');
                                        if (channel) {
                                            let invite = await channel.createInvite({ maxUses: 1, unique: true, reason: 'This server has the \'Invite user on unban\' setting enabled.\nUse +settings moderation.inviteOnUnban false\' to disable this.' });
                                            unbanEmbed.setDescription(`[Join server](${invite.url} "Click to join")`);
                                        }
                                    }
                                    
                                    if (client.users.cache.get(user)) {
                                        user.send(unbanEmbed).catch();
                                    }
                                }
                            });
                        }, ban.expires - Date.now()));
                    }
                });
            });
        }
    });
}


const embeds = {}

embeds.errorColor = 'ff0000';
embeds.noPermission = new Discord.MessageEmbed()
    .setTitle('Access denied')
    .setDescription('You don\'t have permission to use this command.')
    .setFooter('Required permission: BAN_MEMBERS')
    .setTimestamp()
    .setColor(embeds.errorColor);

embeds.noTarget = new Discord.MessageEmbed()
    .setTitle('Invalid syntax')
    .setDescription('You need to @mention someone to ban.')
    .setFooter(`Syntax: ${getPrefix()}ban [@Member] [Ban duration?] [Reason?]\nExample: ${getPrefix()}ban @Bob 30m Being annoying`)
    .setColor(embeds.errorColor);

embeds.targetIsHigher = new Discord.MessageEmbed()
    .setTitle('You can\'t ban that person')
    .setDescription('This person\'s highest role is higher than or equal to your highest role.')
    .setTimestamp()
    .setColor(embeds.errorColor);

embeds.botTooLow = new Discord.MessageEmbed()
    .setTitle('Unable to ban')
    .setDescription('I can\'t ban that person because my highest role is too low.')
    .setTimestamp()
    .setColor(embeds.errorColor);
    
embeds.targetIsOwner = new Discord.MessageEmbed()
    .setTitle('Unable to ban')
    .setDescription('I can\'t ban the server owner!')
    .setTimestamp()
    .setColor(embeds.errorColor);

embeds.selfBan = new Discord.MessageEmbed()
    .setTitle('You can\'t ban yourself.')
    .setDescription('Why would you ban yourself?')
    .setTimestamp()
    .setColor(embeds.errorColor);

embeds.banMyself = new Discord.MessageEmbed()
    .setTitle('I can\'t ban myself.')
    .setDescription('And even if I could, why would I?')
    .setTimestamp()
    .setColor(embeds.errorColor);

embeds.reasonTooLong = new Discord.MessageEmbed()
    .setTitle('The ban reason is too long.')
    .setDescription('Sorry, the ban reason can\'t be longer than 350 letters.')
    .setTimestamp()
    .setColor(embeds.errorColor);