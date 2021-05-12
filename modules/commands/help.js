const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { getPrefix } = require('../../functions/getPrefix');
const config = require('../../config.json');

let editDelay = 1500;

let sessions = {}

module.exports.name         = 'help';
module.exports.aliases      = ['h'];
module.exports.description  = 'Get a list of commands.';
module.exports.syntax       = 'help [Command name]';
module.exports.guildOnly    = false;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'READ_MESSAGE_HISTORY'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async function(message, args) {
    try {
        if (!args[0]) {
            const embedColor = '2f3136';
            const helpPages = [ /*
        ---------------- | Emoji |   Page name   |    Category Description    |   Array of command names | ---------------- */
                new helpPage('🅱️', 'General',     `General command list`,         ['calc', 'cursevideo', 'feedback', 'info', 'invite', 'perms', 'ping', 'prefix', 'remindme', 'say', 'sayas', 'virustotal', 'whois', 'activities']),
                new helpPage('💬', 'Text commands', `Simple text-based commands`, ['clientid', 'edited', 'test', 'zalgo']),
                new helpPage('⚒️', 'Moderation',  'Moderation command list',      ['ban', 'banid', 'kick', 'mute', 'unmute', 'updatemuterole', 'purge', 'snipe']),
                new helpPage('⚙', 'Configuration','Configure Prysm',             ['autoroles', 'settings', 'setup', 'slash', 'tempchannel']),
                new helpPage('🎵', 'Music',       'Play music in voice channels',  ['clearqueue', 'disconnect', 'loop', 'move', 'nowplaying', 'pause', 'play', 'queue', 'shuffle', 'skip', 'volume', 'seek', 'remove',])
            ]

            let prefix = getPrefix(message.guild);
            let embeds = {};
            embeds.default = new Discord.MessageEmbed()
                .setTitle('🤖 Prysm Bot - Help')
                .setColor(embedColor)
                .setFooter(`Use the reactions below, ${message.author.username}.`, message.author.avatarURL());

            let description = `Please select the category you want to see.\nHover over the emoji to see additional info.\nTip: Check out \`${getPrefix(message.guild)}slash\`!`;
            helpPages.forEach(page => {
                let categoryLink = `${config.websiteDomain}/commands/category/${page.internalName.replace(/\s/g, '%20')}?prefix=${getPrefix(message.guild).replace(" ", "%20")}`;
                description += `\n[${page.emoji}](${categoryLink} "${page.name}: ${page.totalCommands} commands\n${page.description}") → ${page.name}` // Add page to default page

                // Create a "page" embed for the entry
                embeds[page.internalName] = new Discord.MessageEmbed()
                    .setTitle(`Commands - ${page.name}`)
                    .setDescription(`[ℹ](${categoryLink.replace(/\s/g, '%20')} "${page.totalCommands} total commands") ${page.description}`)
                    .setColor(embedColor)
                    .setFooter(`This help window was requested by ${message.author.username}.\nHover over ℹ️ to see additional info about a command.`, message.author.avatarURL());

                let blankField = false;
                Object.keys(page.entries).forEach(key => {
                    let command = page.entries[key];

                    if (!command.restrictions.hidden) {
                        let aliasStr = '';
                        if (command.aliases) command.aliases.forEach(alias => aliasStr += `, ${prefix}${alias}`);

                        let cmdInfo = `${getPrefix(message.guild)}${command.name}`
                            cmdInfo += `${command.aliases && command.aliases.length > 0 ? `, ${command.aliases.join(', ')}` : ''}`
                            cmdInfo += ` (${command.restrictions.guildOnly ? 'Guild only' : 'Works in DMs'})\n`;
                            cmdInfo += `Description: ${command.description}`
                            cmdInfo += `${command.syntax && command.syntax != '' ? `\nSyntax: ${getPrefix(message.guild)}${command.syntax}` : ''}\n`;
                            cmdInfo += `${command.perms.bot && command.perms.bot.length > 0 ? `\nRequired permissions (Bot): ${command.perms.bot.join(', ')}` : ''}`
                            cmdInfo += `${command.perms.user && command.perms.user.length > 0 ? `\nRequired permissions (User): ${command.perms.user.join(', ')}` : ''}`

                        embeds[page.internalName].addField(`\`${prefix}${command.name}\``, `[ℹ](${categoryLink}&command=${command.name} "${cmdInfo}") ${command.description}`, true)

                        if (blankField) embeds[page.internalName].addField('\u200b', '\u200b', true); // Adds an empty embed field because discord.js v12 removed .addBlankField() for some reason reee
                        blankField = !blankField;
                    }
                })
            })
            description += `\n❔ → Show this page\n❌ → Delete this help session\n\n⚙️ To see the details of a specific\ncommand, type ${getPrefix(message.guild)}help commands.`
            embeds.default.setDescription(description);


            let s = sessions[message.author.id];
            if (s) {
                if (s.dm) {
                    client.channels.fetch(s.channel)
                    .then(channel => {
                        channel.messages.fetch(s.msgID)
                        .then(m => {
                            m.delete();
                        });
                    });
                } else {
                    client.channels.fetch(s.channel)
                    .then(channel => {
                        channel.messages.fetch(s.msgID)
                        .then(m => {
                            channel.messages.fetch(s.messageID)
                            .then(ms => {
                                channel.bulkDelete([m, ms])
                                .catch(() => m.delete());
                            });
                        });
                    });
                }
            }


            let msg = await message.channel.send(embeds.default);


            sessions[message.author.id] = {
                messageID: message.id,
                msgID: msg.id,
                channel: message.channel.id,
                dm: !message.guild
            }


            // We create a timeout to stop people from spamming reactions
            let timeoutEndsIn = Date.now();
            function timeout() {
                if (Date.now() >= timeoutEndsIn) {
                    timeoutEndsIn = Date.now() + editDelay;
                    return true;
                } else return false;
            }

            const canDelete = message.guild ? msg.channel.permissionsFor(client.user).has('MANAGE_MESSAGES') : false;

            const collector = new Discord.ReactionCollector(msg, r => r, {time: 1000 * 300}); // wtf should i put as filter

            collector.on('collect', (r, user) => {
                if (r.partial || user.partial) return; // I don't want to deal with partials right now

                if (user.id == client.user.id) return;
                if (canDelete) r.users.remove(user.id);
                if (user.id != message.author.id) return;

                if (r.emoji.name == '❌') {if (canDelete) return message.channel.bulkDelete([message.id, msg.id]); else msg.delete()};

                if (!timeout() && canDelete) return r.users.remove(user.id);

                if (r.emoji.name == '❔') {
                    msg.edit(embeds.default);
                } else {
                    let page = helpPages.find(p => p.emoji == r.emoji.name || p.emoji ==  r.emoji.id || p.emoji ==  r.emoji.identifier);
                    if (!page) return;
                    msg.edit(embeds[page.internalName]);
                }
            });

            collector.on('end', () => {
                if (msg) {
                    if (canDelete) msg.reactions.removeAll();
                    if (!msg.deleted && msg.embeds[0]) msg.edit(msg.embeds[0].setFooter('This help session has expired.', message.author.avatarURL()));

                    sessions[message.author.id] = undefined;
                }
            });


            // Add a reaction every 750ms to avoid hitting rate limits
            let index = 0;
            function react() {
                msg.react(helpPages[index].emoji);
                index += 1;
                if (!helpPages[index]) {
                    clearInterval(interval); // Clear the interval
                    delete interval; // Delete the 'interval' variable
                    msg.react('❔').then(() => setTimeout(() => msg.react('❌'), 750));
                    return;
                }
            }
            react(); // To add the first reaction immediately
            let interval = setInterval(react, 750);
        } else {
            let commands = require('../core/command_loader').commands;
            let cmd = commands.get(args[0].toLowerCase()) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0].toLowerCase()));
            if (!cmd || cmd.hidden || cmd.disabled) return message.channel.send('Sorry, I can\'t find that command. Did you spell it right?');

            let embed = new Discord.MessageEmbed()
                .setTitle(`Command: ${cmd.name}`)
                .setColor('2f3136');

            embed.addField('Description', cmd.description || 'No description', true);
            embed.addField('Syntax', getPrefix(message.guild) + cmd.syntax || cmd.name, true);
            embed.addField('\u200b', '\u200b', true);
            embed.addField('Works in DMs', cmd.guildOnly ? 'No' : 'Yes', true);
            embed.addField('Aliases', cmd.aliases ? cmd.aliases.join(', ') || 'None' : 'None', true);
            embed.addField('\u200b', '\u200b', true);
            embed.addField('Required permissions (Bot)', cmd.botPerms ? cmd.botPerms.join(', ') || 'None' : 'None', true);
            embed.addField('Required permissions (User)', cmd.userPerms ? cmd.userPerms.join(', ') || 'None' : 'None', true);
            embed.addField('\u200b', '\u200b', true);

            let msg = await message.channel.send(embed);
            msg.react('❌')
            .then(() => {
                let listener = new Discord.ReactionCollector(msg, r => r, {time: 1000 * 300});
                listener.on('collect', (reaction, user) => {
                    if (user.id === message.author.id && reaction.emoji.name == '❌') {
                        listener.stop();
                        if (msg.deletable && message.deletable) message.channel.bulkDelete([msg, message]);
                        else {
                            if (msg.deletable) msg.delete();
                            if (message.deletable) message.delete();
                        }
                    }
                });
            });
        }
    } catch(e) {
        console.error(e);
    }
}


// Help page constructor thingy (Because constructors are cool)
/**
 * @param {String} emoji 
 * @param {String} name 
 * @param {String} description 
 * @param {Array} entries 
 */
function helpPage(emoji, name, description, entries) {
    if (typeof emoji != 'string')       throw "Failed to assemble help page object: Missing 'emoji' property";
    if (typeof name != 'string')        throw "Failed to assemble help page object: Missing 'name' property";
    if (typeof description != 'string') throw "Failed to assemble help page object: Missing 'description' property";
    if (typeof entries != 'object')     throw "Failed to assemble help page object: Missing 'entries' property";
    this.emoji = emoji
    this.name = name
    this.internalName = name.toLowerCase()
    this.description = description
    this.entries = {}
    this.totalCommands = 0
    const commands = require('../core/command_loader').commands;
    entries.forEach(entry => {
        let cmd = commands.find(c => c.name.toLowerCase() === entry.toLowerCase());
        if (!cmd) throw `Command not found: ${entry}.`
        this.totalCommands += 1;
        this.entries[cmd.name] = {
            name: cmd.name,
            description: cmd.description,
            aliases: cmd.aliases,
            syntax: cmd.syntax,
            restrictions: {
                guildOnly: cmd.guildOnly,
                devOnly: cmd.devOnly,
                disabled: cmd.disabled,
                hidden: cmd.hidden
            },
            perms: {
                bot: cmd.botPerms || ["ADMINISTRATOR"],
                user: cmd.userPerms || []
            }
        }
    });
}
