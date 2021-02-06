const Discord = require('discord.js');
const config = require('../config.json');
const client = require('../bot').client;
const whClient = new Discord.WebhookClient(config.loggingWebhook.id, config.loggingWebhook.token);
const { get: getGuildSettings } = require('./getGuildSettings');
const fs = require('fs');
const escapeHtml = require('escape-html');

const embedColor = '2F3136';

/**
 * @param {string} title 
 * @param {string} description 
 * @param {boolean} important 
 */
module.exports.log = function(title, description, important) {
    return new Promise(async (resolve, reject) => {
        const { testingMode } = require('../modules/core/login');
        let embed = new Discord.MessageEmbed()
        .setTitle(title)
        .setDescription(description)
        .setAuthor(`Shard ${JSON.stringify(client.shard?.ids)}${testingMode == true ? ' [Testing mode]' : ''}`, client.user?.avatarURL())
        .setFooter(client.user?.username, client.user?.avatarURL());
        if (important) embed.setColor('ff0000');
        //console.log(`${important == true ? '[!] ' : ''}${title}: ${description}`);
        if (!testingMode || important) whClient.send(embed)
        .then(resolve)
        .catch(e => {
            console.log('Failed to execute webhook');
            console.log(e);
            reject();
        });
    });
}

/**
 * 
 * @param {Discord.Guild | String} guild 
 * @param {'slash'|'command'|'joinLeave'|'messageEdit'|'messageDelete'|'memberUpdate'|'moderation'} logType 
 * @param {*} change
 */
module.exports.guildLog = async (guild, logType, change) => {
    try {
        if (typeof guild == 'string') guild = await client.guilds.fetch(guild).catch(console.warn);
        if (!getGuildSettings(guild, 'logging.enableLogging')) return;
        const channelID = getGuildSettings(guild, 'logging.logChannel');
        const channel = await client.channels.fetch(channelID).catch(console.warn);
        if (!channel || channel.guild?.id != guild.id || !channel.isText()) return;
        
        switch(logType) {
            case 'slash':
                if (!getGuildSettings(guild, 'logging.logSlashCommands')) return;
                
                let commandString = `/${change.command_name} `;
                let options = change.data.options;
                
                // Display subcommands and subcommand groups
                // To-do: check if this works
                while (options && (options[0]?.type == 1 || options[0]?.type == 2)) {
                    commandString += options[0].name + ' ';
                    options = options.options[0];
                }
                
                options?.forEach(option => commandString += `${option.name}: ${option.value} `);
                
                channel.send(
                    new Discord.MessageEmbed()
                        .setAuthor(change.member?.user?.tag,change.member?.user?.displayAvatarURL({ dynamic: true }) )
                        .setTitle('Slash command executed')
                        .setDescription(commandString)
                        .setColor(embedColor)
                        .setTimestamp()
                )
            break;
            case 'command':
                if (!getGuildSettings(guild, 'logging.logAllCommands') || !(change instanceof Discord.Message)) return;
                
                channel.send(
                    new Discord.MessageEmbed()
                    .setAuthor(change.author.tag, change.author.displayAvatarURL({ dynamic: true }))
                    .setTitle('Command executed')
                    .setDescription(change.content)
                    .setColor(embedColor)
                    .setTimestamp()
                )
            break;
            case 'joinLeave':
                if (!getGuildSettings(guild, 'logging.logJoinLeaveEvents') || !(change instanceof Discord.GuildMember)) return;
                
                const joined = !!guild.member(change.user);
                if (joined && change.partial) await change.fetch().catch(console.warn);
                
                if (!change.user.bot) {
                    channel.send(
                        new Discord.MessageEmbed()
                        .setAuthor(change.user.tag, change.user.displayAvatarURL({ dynamic: true }))
                        .setTitle(`Member ${joined ? 'joined' : 'left'}`)
                        .setDescription(`<@${change.id}> ${joined ? 'joined' : 'left'} the server.`)
                        .setColor(embedColor)
                        .setTimestamp()
                    )
                } else {
                    if (joined) {
                        // Fetch the user who added the bot
                        let addedBy = null;
                        try {
                            let integrations = await guild.fetchIntegrations({ includeApplications: true }).catch();
                            let bot = integrations.find(i => i.application.id == change.id);
                            if (bot) {
                                addedBy = bot.user;
                            }
                        } catch(e){}
                        
                        channel.send(
                            new Discord.MessageEmbed()
                            .setAuthor(change.user.tag, change.user.displayAvatarURL({ dynamic: true }))
                            .setTitle(`Bot added`)
                            .setDescription(`<@${change.id}> was added${addedBy?.id ? ` by <@${addedBy?.id}> \`${addedBy?.tag?.replace(/\`/g, "'")}\`` : ''}.`)
                            .setColor(embedColor)
                            .setTimestamp()
                        )
                    } else {
                        /**
                         * Afaik there is no good way to find the user who removed the bot or to find out if it left by itself,
                         * but if there was one, I'd use it here.
                         */
                        channel.send(
                            new Discord.MessageEmbed()
                            .setAuthor(change.user.tag, change.user.displayAvatarURL({ dynamic: true }))
                            .setTitle(`Bot removed`)
                            .setDescription(`<@${change.id}> was removed.`)
                            .setColor(embedColor)
                            .setTimestamp()
                        )
                    }
                }
            break;
            case 'messageEdit':
                if (!getGuildSettings(guild, 'logging.logMessageEdits')) return;
                const { old: oldMsg, new: newMsg } = change;
                if (!(oldMsg instanceof Discord.Message) || !(newMsg instanceof Discord.Message)) return;
                
                const editID = String(Date.now() + Number(newMsg.id)).substr(0, 18);
                
                let dispOldMsg = oldMsg.content?.substr(0, 800);
                let dispNewMsg = newMsg.content?.substr(0, 800);
                channel.send(
                    new Discord.MessageEmbed()
                    .setAuthor(newMsg.author.tag, newMsg.author.displayAvatarURL({ dynamic: true }))
                    .setTitle(`Message edited`)
                    .setDescription(
                        `Old message:\n\`\`\`${dispOldMsg?.replace(/\`/g, '\`\u200b') ?? '(Empty)'}${dispOldMsg != oldMsg.content ? ' ...' : ''}\`\`\`\n` +
                        `New message:\n\`\`\`${dispNewMsg?.replace(/\`/g, '\`\u200b') ?? '(Empty)'}${dispNewMsg != newMsg.content ? ' ...' : ''}\`\`\`\n` +
                        (process.env.WEB_BASE_URL ?
                            `[View online](${process.env.WEB_BASE_URL}/dashboard/server/${oldMsg.guild.id}/logs/edit/${editID})` : '')
                    )
                    .setColor(embedColor)
                    .setTimestamp()
                )
                
                let data = { oldMsg: oldMsg.content, newMsg: newMsg.content, authortag: newMsg.author.tag, guildname: guild.name }
                if (!fs.existsSync('temp/guildLogs/edited/' + oldMsg.guild.id)) await fs.promises.mkdir('temp/guildLogs/edited/' + oldMsg.guild.id);
                fs.promises.writeFile(`temp/guildLogs/edited/${oldMsg.guild.id}/${editID}.json`, JSON.stringify(data));
            break;
            case 'messageDelete':
                if (!getGuildSettings(guild, 'logging.logMessageDeletions')) return;
                const { message, bulk } = change;
                
                if (!bulk) {
                    if (!(message instanceof Discord.Message)) return;
                    channel.send(
                        new Discord.MessageEmbed()
                        .setAuthor(message.author?.tag || 'Unknown author', message.author?.displayAvatarURL({ dynamic: true }))
                        .setTitle(`Message deleted`)
                        .setDescription(
                            message.content ?
                                `\`\`\`\n${message.content?.replace(/\`/g, '\`\u200b').substr(0, 2000)}\`\`\`` :
                                message.embeds[0] ?
                                    'Message did not contain any text.' :
                                    'Message was either empty or its content is unknown.'
                            )
                        .setColor(embedColor)
                        .setTimestamp()
                    )
                } else {
                    if (!(message instanceof Discord.Collection)) return;
                    let authors = [];
                    let noAuthor = false;
                    message.forEach(msg => msg.author && (authors.find(a => a.id == msg.author.id) || authors.push(msg.author)) || (noAuthor = true));
                    
                    channel.send(
                        new Discord.MessageEmbed()
                        .setAuthor(
                            !noAuthor && authors.length == 1 && authors[0] ?
                                authors[0].tag :
                                (`${authors.length}${noAuthor ? ' or more' : ''} author${authors.length == 1 ? '' : 's'}`),
                                !noAuthor && authors.length == 1 && authors[0] ? authors[0]?.displayAvatarURL({ dynamic: true }) : null
                        )
                        .setTitle(`Bulk delete`)
                        .setDescription(`${message.size} message${message.size == 1 ? '' : 's'} deleted`)
                        .setColor(embedColor)
                        .setTimestamp()
                    )
                }
            break;
//            case 'memberUpdate':
//                if (!getGuildSettings(guild, 'logging.logMemberUpdates')) return;
//
//            break;
//            case 'moderation':
//                if (!getGuildSettings(guild, 'logging.logModerationEvents')) return;
//
//            break;
        }
    } catch(e) {
        console.warn(e);
    }
}
