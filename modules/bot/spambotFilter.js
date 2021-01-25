const Discord = require('discord.js');
const { client } = require('../../bot');
const config = require('../../config.json');
const Enmap = require('enmap');
const { getPrefix } = require('../../functions/getPrefix');
const { getFlags } = require('../../functions/permission_flags');
const activeGuilds = new Enmap({ name: 'spambotFilter', polling: true, fetchAll: true });
const blockedBots = new Enmap({ name: 'suspiciousBots', polling: true, fetchAll: true });

if (!config || !config.spambot_verification) return;

module.exports.run = () => {
    client.on('guildMemberAdd', async (member) => {
        if (blockedBots.get(member.user.id) == true) {
        console.log('fuck');
        let banMsg = 'This bot has been identified as a malicious/spam bot. It has been automatically removed because this server has spam bot protection enabled.';
            //let removed = true;
            //if (member.bannable) member.ban({ reason: banMsg });
            //else if (member.kickable) member.kick(banMsg);
            //else removed = false;
            let removed = true;

            let addedBy;
            if (member.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
                let found = false;
                const logs = await member.guild.fetchAuditLogs({type: 'BOT_ADD', limit: 5});
                logs.entries.forEach((audit) => {
                    if (found) return;

                    if (audit.action == 'BOT_ADD' && audit.target.id == member.id) {
                        found = true;
                        addedBy = audit.executor.id;
                    }
                });

                if (addedBy) {
                    let user = client.users.cache.get(addedBy);

                    let description = `Hello there. You are receiving this message because you just added a potentially dangerous bot to the guild \`${member.guild.name}\`.\n\n`;
                    if (removed) description += `I have already removed the bot in question (${member.user.tag}).\n\n`;
                    else description += `**I was unable to kick/ban the bot in question (${member.user.tag})! Remove it immediately!**\n\n`;
                    description += `This bot may trick you into adding it to your server, either by claiming to hand out free nitro, boosting your server, or by offering something else.\n`;
                    description += `Once added, the bot either tries to trick other users from your server into adding it to their own server or attempt to delete channels, kick/ban users, etc on your guild.\n\n`;
                    description += `Never add bots that promise a paid service for free to your server! If a bot is legit, it will have a <:verified_bot_left:752978864577445958><:verified_bot_right:752978864812064889> badge next to its name.\n\n`;
                    description += `If you believe that I made a mistake, please report it [here](https://discord.com/aTRHKUY).`;

                    if (user) user.send(
                        new Discord.MessageEmbed()
                            .setTitle(removed ? 'Malicious bot removed' : 'Malicious bot detected')
                            .setDescription(description)
                            .setAuthor(member.user.tag, member.user.displayAvatarURL())
                            .setColor('ff0000')
                            .setFooter(`You can disable this using ${getPrefix(member.guild)}settings`)
                            .setTimestamp()
                    )
                    .catch();
                } else {
                    let description = `Hello there. You are receiving this message because someone just added a potentially dangerous bot to the guild \`${member.guild.name}\`. I was not able to determine who added this bot.\n\n`;
                    if (removed) description += `I have already removed the bot in question (${member.user.tag}).\n\n`;
                    else description += `**I was unable to kick/ban the bot in question (${member.user.tag})! Remove it immediately!**\n\n`;
                    description += `This bot may trick you into adding it to your server, either by claiming to hand out free nitro, boosting your server, or by offering something else.\n`;
                    description += `Once added, the bot either tries to trick other users from your server into adding it to their own server or attempt to delete channels, kick/ban users, etc on your guild.\n\n`;
                    description += `Never add bots that promise a paid service for free to your server! If a bot is legit, it will have a <:verified_bot_left:752978864577445958><:verified_bot_right:752978864812064889> badge next to its name.\n\n`;
                    description += `If you believe that I made a mistake, please report it [here](https://discord.com/aTRHKUY).`;

                    member.guild.members.cache.forEach(user => {
                        if (!user.permissions.has('ADMINISTRATOR') || user.user.bot) return;
                        user.send(
                            new Discord.MessageEmbed()
                                .setTitle(removed ? 'Malicious bot removed' : 'Malicious bot detected')
                                .setDescription(description)
                                .setAuthor(member.user.tag, member.user.displayAvatarURL())
                                .setColor('ff0000')
                                .setFooter(`You can disable this using ${getPrefix(member.guild)}settings`)
                                .setTimestamp()
                        )
                        .catch();
                    });
                }
            } else {
                // fuck
            }
        } else {
            if (member.partial) await member.fetch();
            if (!member.user.bot) return;

            let suspicious = false;
            for (const word in keywords) {
                if (member.user.username.toLowerCase().indexOf(word) >= -1 && !suspicious) {
                    suspicious = true;

                    addToApproval(member.id);
                }
            }
        }
    });

    client.once('ready', () => client.emit('guildMemberAdd', client.guilds.cache.get('637695357777739797').members.cache.get('740173664087048253')));
}

module.exports.meta = {
    name: 'spambot_filter',
    priority: 8
}

const keywords = [
    'nitro',
    'free',
    'boost',
    'event'
]

async function addToApproval(id) {
    let user = await client.users.fetch(id);
    if (!user) throw 'Couldn\'t find the user';
    if (!user.bot) return;

    const guild = client.guilds.resolve(config.spambot_verification.guild);
    if (!guild) throw 'Could not resolve guild ID provided in config.json';

    const channel = guild.channels.cache.get(config.spambot_verification.channel);
    if (!guild) throw 'Could not find channel provided in config.json';

    let invites = {
        admin:    `https://discord.com/oauth2/authorize?client_id=${user.id}&scope=bot&permissions=8`,
        standard: `https://discord.com/oauth2/authorize?client_id=${user.id}&scope=bot&permissions=0`
    }

    channel.send(
        new Discord.MessageEmbed()
            .setAuthor(user.tag, user.displayAvatarURL({ dynamic: true }))
            .setTitle('Bot flagged for review')
            .setDescription(`Client ID: ${user.id}\nName: ${user.tag}\nInvite: [Admin](${invites.admin}) | [No permissions](${invites.standard})`)
            .setFooter(user.id)
    )
    .then((msg) => {
        setTimeout(() => msg.react('✅'), 1000);
        setTimeout(() => msg.react('❌'), 2000);
    });
}

client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.channel.id != config.spambot_verification.channel) return;
    if (user.partial) await user.fetch();

    if (Object.keys(getFlags(user)).indexOf('BOT_OWNER') > -1) {
        switch(reaction.emoji.name) {
            case '✅':
                reaction.message.edit('Approved');
                // add code to actually approve the bot here
            break;
            case '❌':
                reaction.message.edit('Marked as spambot');
                // add some code here too please
            break;
        }
    }
});