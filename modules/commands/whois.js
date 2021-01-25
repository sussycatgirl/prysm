const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { getUserFromMention } = require('../../functions/getMention');
const { getPrefix } = require('../../functions/getPrefix');
const fs = require("fs");
const request = require("request");
const colorThief = require("color-thief-node");

module.exports.name         = 'whois';
module.exports.aliases      = ['userinfo', 'user', 'who'];
module.exports.description  = 'Show some stats about a specific user';
module.exports.syntax       = 'whois [@Member]';
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
    // Who ts is the target
    let noMention = false;
    let target = getUserFromMention(args[0]);
    if (!target) noMention = true;
    if (!target) target = message.author;
    target = await message.guild.members.fetch({user: target});
    if (!target) return message.channel.send('Uh-oh, I can\'t find this user. If you see this, shit hit the fan really bad. Uh, try again I guess?');

    let info = new UserInfo(target, message.guild);
    let embed = await info.generateEmbed();

    if (noMention) embed.setFooter(`Hint: Type ${getPrefix(message.guild)}whois @User to get info about someone else!`);
    message.channel.send(embed);
}


// I don't fucking need to use classes here and I probably spent way too much time doing this but I need to learn about them for school and also they're cool so fuck it
// wait what the fuck is this
// what the fuck did i do here
class UserInfo {
    /**
     * @param {Discord.GuildMember} member 
     * @param {Discord.Guild} guild 
     */
    constructor(member, guild) {
        this.username = member.user.username;
        this.discriminator = member.user.discriminator;
        this.nickname = member.nickname;
        this.createdAt = member.user.createdAt;
        this.highestRole = member.roles.highest;
        this.hoistedRole = member.roles.hoist || guild.roles.everyone;
        this.displayColor = member.roles.highest.hexColor || null;
        this.avatarURL = member.user.displayAvatarURL({dynamic: true, size: 2048});
        this.userID = member.user.id;
        this.bot = member.user.bot;
        this.presence = 'Unavailable';
        this.memberStatus = 'Member';
        this.guild = guild;

        this.user = member.user;
        
        let now = new Date();
        let time = new Date(member.user.createdTimestamp);
        this.createdAt = `${Math.floor(Math.abs(now - time) / 86400000)} Days ago\n(${time.getDate()}. ${time.getMonth() + 1}. ${time.getFullYear()})`;

        /* Set the Member status variable */
        // Check if the target has "elevated" permissions. ALso if there is a built-in function for this pls kill me lol
        if (member.permissions.has('BAN_MEMBERS')
        ||  member.permissions.has('MANAGE_GUILD')
        ||  member.permissions.has('MANAGE_ROLES')
        ||  member.permissions.has('KICK_MEMBERS')
        ||  member.permissions.has('MANAGE_WEBHOOKS')
        ||  member.permissions.has('MANAGE_MESSAGES')
        ||  member.permissions.has('MANAGE_CHANNELS')) {
            this.memberStatus = 'Moderator';
        }
        
        if (member.permissions.has('ADMINISTRATOR')) this.memberStatus = 'Administrator';
        if (guild.owner.id == member.user.id) this.memberStatus = 'Owner';
        
        let clientStatus = member.user.presence.clientStatus;

        if (!clientStatus) {
            this.presence = 'Offline';
        }
        else if (this.bot) {
            this.presence = clientStatus.web || clientStatus.desktop || clientStatus.mobile || 'Unavailable';
        }
        else if (clientStatus.desktop || clientStatus.mobile || clientStatus.web) {
            let presenceArray = [];
            if (clientStatus.desktop) presenceArray.push('Desktop');
            if (clientStatus.web) presenceArray.push('Web');
            if (clientStatus.mobile) presenceArray.push('Mobile');
            this.presence = `${clientStatus.desktop || clientStatus.mobile || clientStatus.web} (${presenceArray.join(', ')})`;
        }
    }
    async generateEmbed() {
        let color = await colorThief.getColorFromURL(this.user.displayAvatarURL({ format: 'png' }));
        
        let embed = new Discord.MessageEmbed()
        .setTitle(`${this.username} ${this.bot ? `${db.clientCache.customEmojis.botBadge}` : ''}`)
        .setDescription(`**#${this.discriminator}** ${this.nickname ? `\n***aka*** *${this.nickname}*` : ''}`)
        .addField('Registered', this.createdAt, true)
        .addField('Avatar URL', `[Click here](${this.avatarURL.replace(')', '\\)')} "${this.username.replace(')', '\\)')}'s Avatar - Click to view")`, true)
        .addField('\u200b', '\u200b', true)
        .addField('Presence', this.presence, true)
        .addField('Status', this.memberStatus, true)
        .addField('User ID', this.userID, true)
        .addField('Highest Role', this.highestRole, true)
        .addField('Hoisted Role', this.hoistedRole, true)
        .addField('Display Color', this.displayColor || 'Unavailable', true)
        .setThumbnail(this.avatarURL)
        .setColor(color);
        
        // Show extra application info about other bots
        if (this.bot) {
            let integrations = await this.guild.fetchIntegrations({ includeApplications: true });
            let bot = integrations.find(i => i.application.id == this.userID);
            if (bot) {
                if (bot.user)                               embed.addField('Added by', bot.user.tag, true);
                if (bot.application.name != this.username)  embed.addField('Application name', bot.application.name, true);
                if (bot.application.description)            embed.addField('Description', bot.application.description, true);
            }
        }
        
        return embed;
    }
}