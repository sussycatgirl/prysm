const Discord = require('discord.js');
const data = require('../../bot');
const client = data.client;
const config = require('../../config.json');
const { log } = require('../../functions/logging');
const { autoRoles } = require('../commands/autoroles');

const Enmap = require('enmap');
const permmutes = new Enmap({ name: 'permmutes', polling: true, fetchAll: true }); // Stores permanently muted users who left
const { tempmutes, muteroles } = require('../commands/mute');
const { getPrefix } = require('../../functions/getPrefix');
const getGuildSettings = require('../../functions/getGuildSettings');

async function getGuildCount() {
    let serverCount = await client.shard.fetchClientValues('guilds.cache.size');
    serverCount = serverCount.reduce((p, n) => p + n, 0);
    return serverCount;
}

let logDebug = (process.env.NODE_ENV != 'production');

module.exports.run = function() {
    // Give roles to new members
    client.on('guildMemberAdd', async member => {
        try {
            if (member.partial) await member.fetch();
            let roles = autoRoles.get(member.guild.id);
            if (!roles || !member.guild.me.permissions.has('MANAGE_ROLES')) return;
            
            if (roles instanceof Array) {
                roles.forEach(async role => {
                    role = await member.guild.roles.fetch(role);
                    // Check if the bot has permission to assign that role
                    if (role.comparePositionTo(member.guild.me.roles.highest) < 0) {
                        console.log(`[Autoroles] Assigning role ${role.id} to member in guild ${member.guild.id}`);
                        member.roles.add(role).catch(console.warn);
                    }
                });
            }
        } catch(e) {
            console.error(e);
        }
    });

    client.on('guildCreate', async function(guild) {
        const count = await getGuildCount();
        log('Added to server', `The bot was added to a new server.\nNew guild size: ${count}\nGuild name: ${guild.name}\nMember count: ${guild.memberCount}\nGuild owner: ${guild.owner.user.tag}`);
        
        
        // Send a message when added to a new server
        let channels = guild.channels.cache.filter(c => 
                                    c.type == 'text' && 
                                    c.permissionsFor(guild.me).has('SEND_MESSAGES') &&
                                    c.permissionsFor(guild.me).has('EMBED_LINKS')
        );
        if (channels.size == 0) return;
        
        // Attempt to find a 'bot commands' or 'general' channel to use, or use the first channel, if none is found
        let channel = 
            channels.find(c => c.name.toLowerCase().match(/(bot(s)?)|(command(s)?)/g)) ||
            channels.find(c => c.name.toLowerCase().match(/(general)|(chat)/g)) ||
            channels.first();
        if (!channel) return;
        
        // Try to find out who added the bot
        let invitedBy = null;
        try {
            let integrations = await guild.fetchIntegrations({ includeApplications: true });
            let self = integrations.find(i => i.account.id == client.user.id);
            invitedBy = self.user;
        } catch(e) {
            console.error(e);
            invitedBy = null;
        }
        
        let embed = new Discord.MessageEmbed()
            .setTitle(`Thanks for inviting me${invitedBy ? `, ${invitedBy.username}` : ''}!`)
            .setDescription(`To get started, use \`${getPrefix(guild)}help\`. To configure the bot, use \`${getPrefix(guild)}setup\`.`)
            .setColor('0099cc');
        
        try {
            channel.send(embed);
        } catch(e) {
            console.error(e);
        }
    });
    

    client.on('guildDelete', async function(guild) {
        const count = await getGuildCount();
        log('Removed from server', `The bot was removed from a server.\nNew guild size: ${count}${
            // Only log guild details in testing mode
            require('./login').testingMode ? `\nGuild name: ${guild.name}\nMember count: ${guild.memberCount}\nGuild owner: ${guild.owner.user.tag}` : ''
        }`);
    });


    client.on('guildBanRemove', (guild, user) => {
        if (!client.guilds.cache.get(guild.id)) return;
        require('../commands/ban').refreshTimeouts();
    });


    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        try {
            // Fetch old member and new member
            if (oldMember.partial || newMember.partial) await Promise.all([oldMember.fetch(), newMember.fetch()]);
            if (!newMember.guild || !oldMember.guild) return; // Return the fuck outta here
            
            let muteRole = muteroles.get(newMember.guild.id);
            if (!muteRole) return;
            let mUsers = tempmutes.get(newMember.guild.id);
            if (mUsers && mUsers[newMember.id]) {        
                if (oldMember.roles.cache.has(muteRole) && !newMember.roles.cache.has(muteRole)) {
                    require('../commands/mute').refreshTimeouts();
                    require('../commands/mute').sendUnmuteMsg(newMember);
                }
            }

            if (permmutes.get(newMember.guild.id) && !newMember.roles.cache.has(muteRole)) {
                let guildMutes = permmutes.get(newMember.guild.id);
                guildMutes[newMember.id] = false;
                permmutes.set(newMember.guild.id, guildMutes);
            }
        } catch(e) {
            console.error(e);
        }
    });

    // Prevent users from unmuting themselves by rejoining the server
    client.on('guildMemberAdd', (member) => {
        try {
            let muteRole = muteroles.get(member.guild.id);
            if (!muteRole) return;
            let mUsers = tempmutes.get(member.guild.id);
            if ((mUsers && mUsers[member.id]) || permmutes.get(member.guild.id)?.[member.user.id]) {
                member.roles.add(muteRole, 'User was muted before they left').catch(e => console.error(e));
            }
        } catch(e) {
            console.error(e);
        }
    });
    // Perma-mutes
    client.on('guildMemberRemove', async (member) => {
        try {
            let muteRole = muteroles.get(member.guild.id);
            if (!muteRole) return;
            if (member.roles.cache.has(muteRole)) {
                if (!permmutes.get(member.guild.id)) permmutes.set(member.guild.id, {});
                let guildMutes = permmutes.get(member.guild.id);
                guildMutes[member.id] = true;
                permmutes.set(member.guild.id, guildMutes);
            }
        } catch(e) {
            console.error(e);
        }
    });

    // Unmute user when banned
    client.on('guildBanAdd', async (guild, user) => {
        // for some reason the member remove event sometimes fires after the ban event and overwrites the changes it makes to timeout it is
        await new Promise(r => setTimeout(r, 100));
        
        try {
            let guildMutes = permmutes.get(guild.id);
            if (guildMutes?.[user.id]) {
                guildMutes[user.id] = false;
                permmutes.set(guild.id, guildMutes);
            }

            guildMutes = tempmutes.get(guild.id);
            if (guildMutes?.[user.id]) {
                guildMutes[user.id] = undefined;
                tempmutes.set(guild.id, guildMutes);
            }
        } catch(e) {
            console.error(e);
        }
    });

    // Send join and leave messages
    client.on('guildMemberAdd', async (member) => {
        try {
            let sendWelcome = getGuildSettings.get(member.guild, 'welcome.sendWelcomeMessage'),
                welcomeText = getGuildSettings.get(member.guild, 'welcome.welcomeMessageText'),
                channelID   = getGuildSettings.get(member.guild, 'welcome.welcomeMessageChannel'),
                sendDM      = getGuildSettings.get(member.guild, 'welcome.sendWelcomeDM'),
                dmText      = getGuildSettings.get(member.guild, 'welcome.welcomeDMText');
            
            if (!sendWelcome && !sendDM) return;
            
            const parseMsg = (text) => String(text)
                .replace(/\%\%username\%\%/g, member.user.username)
                .replace(/\%\%usertag\%\%/g, member.user.discriminator)
                .replace(/\%\%servername\%\%/g, member.guild.name)
                .replace(/\%\%\@user\%\%/g, `<@${member.user.id}>`);
            
            if (sendWelcome == true) {
                if (!/^[0-9]{18}$/.test(channelID)) return;
                let channel = await client.channels.cache.get(channelID);
                if (!channel || !channel.isText || !channel.permissionsFor(channel.guild.me)?.has('SEND_MESSAGES')) return;
                
                channel.send(parseMsg(welcomeText).substr(0, 2000)).catch(console.warn);
            }
            if (sendDM == true) {
                member.send(parseMsg(dmText).substr(0, 2000)).catch(console.warn);
            }
        } catch(e) {
            console.warn(e);
        }
    });
    client.on('guildMemberRemove', async (member) => {
        try {
            let sendMessage = getGuildSettings.get(member.guild, 'welcome.sendLeaveMessage'),
                messageText = getGuildSettings.get(member.guild, 'welcome.leaveMessageText'),
                channelID   = getGuildSettings.get(member.guild, 'welcome.welcomeMessageChannel');
            
            const parseMsg = (text) => String(text)
                .replace(/\%\%username\%\%/g, member.user.username)
                .replace(/\%\%usertag\%\%/g, member.user.discriminator)
                .replace(/\%\%servername\%\%/g, member.guild.name)
                .replace(/\%\%\@user\%\%/g, `<@${member.user.id}>`)
                .replace(/\%\%userid\%\%/g, member.user.id);
            
            if (sendMessage) {
                if (!/^[0-9]{18}$/.test(channelID)) return;
                let channel = await client.channels.cache.get(channelID);
                if (!channel || !channel.isText || !channel.permissionsFor(channel.guild.me)?.has('SEND_MESSAGES')) return;
                
                channel.send(parseMsg(messageText).substr(0, 2000)).catch();
            }
        } catch(e) {
            console.warn(e);
        }
    });

    // Debug logging
    client.on('debug', info => {
        if (logDebug) console.debug(`${colors.fg.blue}[Debug] ${info}${colors.reset}`);
    });

    client.on('reconnecting', () => {
        console.log(`${colors.fg.yellow}[Info] Reconnecting client${colors.reset}`);
        log('Client reconnecting', 'The client is reconnecting.');
    });

    client.on('disconnect', (event) => {
        console.log(`${colors.fg.red}[Error] Client disconnected.${colors.reset}`);
        log('Client disconnected', `The client has disconnected and will no longer try to reconnect.\nEvent: ${event}`, true);
        client.destroy().catch();
    });

    client.on('error', (error) => {
        console.dir(colors.fg.red + error + colors.reset);
    });

    client.on('rateLimit', (data) => {
        console.log(colors.fg.yellow + '[Warning] Rate limited\n'+ colors.fg.cyan + `Limit: ${data.limit}\nMethod: ${data.method}\nPath: ${data.path}\nRoute: ${data.route}\nTime Difference: ${data.timeDifference}\nTimeout: ${data.timeout}` + colors.reset)
    });
}

module.exports.meta = {
    name: 'event_handler',
    priority: 0
}


// Console color "codes"
const colors = {
    fg: {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m'
    },
    bg: {
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
        white: '\x1b[47m'
    },
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m'
}
