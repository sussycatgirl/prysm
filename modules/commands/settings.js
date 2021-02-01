const Discord = require('discord.js');
const { client, db } = require('../../bot');
const { getPrefix } = require('../../functions/getPrefix');
const config = require("../../config.json");
const guildSettingsDB = db.guildSettings;

module.exports.name         = 'settings';
module.exports.aliases      = ['options'];
module.exports.description  = 'Manage Prysm\'s behaviour. Does not actually work.';
module.exports.syntax       = 'settings [Option name?] [New value]\nExample: +settings general.prefix -';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS', 'READ_MESSAGE_HISTORY'];
module.exports.userPerms    = ['MANAGE_GUILD'];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    if (!message.member.permissions.has('MANAGE_GUILD')) return message.channel.send('Sorry, you need the \'Manage Guild\' permission to do this.');

    if (args[0]) {
        switch(args[0].toLowerCase()) {
            case 'list':
            case 'listall':
            case 'show':
            case 'showall':
                let output = "";
                Object.entries(settingPages).forEach(([key, value]) => {
                    switch(typeof value) {
                        case 'object':
                            output += `${key}\n`
                            Object.entries(value).forEach(([k, v]) => {
                                switch(typeof v) {
                                    case 'string':
                                        output += `↳ **String** ${k}: "${v}"`
                                    break;
                                    case 'number':
                                        output += `↳ **Number** ${k}: **${v}**`
                                    break;
                                    case 'boolean':
                                        output += `↳ **Boolean** ${k}: **${v}**`
                                    break;
                                }
                                output += '\n'
                            });
                        break;
                        case 'string':
                            output += `**String** ${key}: "${value}"`
                        break;
                        case 'number':
                            output += `**Number** ${key}: **${value}**`
                        break;
                        case 'boolean':
                            output += `**Boolean** ${key}: **${value}**`
                        break;
                    }
                    output += '\n'
                });
                message.channel.send(
                    new Discord.MessageEmbed()
                        .setTitle('Settings list')
                        .setDescription(output)
                        .setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL({dynamic: true}))
                )
            break;
            default:
                function ded() {
                    message.channel.send("There is no such setting.");
                }

                let split = args[0].split(".");
                if (split.length > 2 || split.length == 0) return ded();

                let category, setting;
                if (split.length == 2) {
                    category = split[0];
                    setting  = split[1]
                } else {
                    setting = split[0]
                }

                if ( category && settingPages[category]          == undefined) return ded();
                if ( category && settingPages[category][setting] == undefined) return ded();
                if (!category && settingPages[setting]           == undefined) return ded();

                let guildSettings = guildSettingsDB.get(message.guild.id);
                if (!guildSettings || typeof guildSettings != "object") guildSettings = {}

                let oldValue, newValue, defaultValue = category ? settingPages[category][setting] : settingPages[category];
                if (
                    category && !guildSettings[category] ||
                    category && guildSettings[category][setting] == undefined ||
                    !category && guildSettings[setting] == undefined
                ) {
                    oldValue = defaultValue;
                } else {
                    oldValue = category ? guildSettings[category][setting] : guildSettings[setting]
                }

                let h = typeof defaultValue == 'string' ? '"' : '**'
                if (!args[1]) return message.channel.send(`${split.join(".")} has the value ${h}${oldValue}${h} ${oldValue != defaultValue ? `(Default value: ${h}${defaultValue}${h})` : ''}`);

                args.shift();
                newValue = args.join(" ");

                if (typeof defaultValue == "number") {
                    if (isNaN(newValue)) return message.channel.send("You need to imput a valid number.");
                    newValue = Number(newValue);
                }
                if (typeof defaultValue == "boolean") {
                    switch(newValue.toLowerCase()) {
                        case 'true':
                        case 'tru':
                        case 't':
                        case 'yes':
                        case 'y':
                        case 'j':
                            newValue = true;
                        break;
                        case 'false':
                        case 'fals':
                        case 'f':
                        case 'no':
                        case 'n':
                        case 'dont':
                        case 'fuck you': // hmmmmmmmm
                            newValue = false;
                        break;
                        default:
                            return message.channel.send('You need to either input "yes" or "no".')
                    }
                }
                
                if (category  && !guildSettings[category]) guildSettings[category] = {}
                
                if (category) guildSettings[category][setting] = newValue;
                if (!category) guildSettings[setting] = newValue;

                if (oldValue == newValue) return message.channel.send(`Value for ${split.join(".")} has not changed.`);

                guildSettingsDB.set(message.guild.id, guildSettings);

                message.channel.send(`Changed value for ${split.join(".")} from ${h}${oldValue}${h} to ${h}${newValue}${h}`);
            break;
        }
    } else {
        let botMember = message.guild.members.cache.get(client.user.id);

        if (!args[0] && !message.channel.permissionsFor(botMember).has('MANAGE_MESSAGES')) {
            return message.channel.send(`I don\'t have the permissions required to show the settings menu. I need permission to manage messages in this channel. You can change settings manually by using ${getPrefix(message.guild)}settings <option> <new value> and list available options using ${getPrefix(message.guild)}settings list.`);
        }
        
        let embed = new Discord.MessageEmbed()
            .setDescription(db.clientCache.customEmojis.loading + ' Constructing menu, please wait...')
            .setColor('2f3136');

        const msg = await message.channel.send(embed);
        

        // Add the reactions to the message
        let reactions = ['⏪','⬆','⬇','🆗','❌']
        let i = 0;
        let interval = setInterval(function() {
            if (!reactions[i]) {
                clearInterval(interval);
                delete interval;
                initEmbed();
            }
            else {
                if (!msg.deleted) {
                    msg.react(reactions[i]);
                    i++;
                }
            }
        }, 1000);



        let initEmbed = () => {

            let guildSettings = guildSettingsDB.get(message.guild.id);
            if (!guildSettings || typeof guildSettings != "object") 
            {
                guildSettings = {}
                guildSettingsDB.set(message.guild.id, guildSettings);
            }

            /**
             * This function generates the embed description
             * @returns {String} The generated description
             */
            let genDescription = () => {

                embed.setFooter(`Settings menu invoked by ${message.author.username} - Use the reactions below`, message.author.displayAvatarURL({ dynamic: true }));

                let entries = Object.entries(currentPage ? settingPages[currentPage] : settingPages);
                let txt = '**' + (currentPage || 'category selection') + ` - ${entries.length} entries\n**`;

                let i = 0;
                let currentKey;
                entries.forEach(([key, value]) => {
                    if (currentPage && !guildSettings[currentPage]) guildSettings[currentPage] = {}
                    let setting = currentPage ? guildSettings[currentPage][key] : guildSettings[key];
                    let nValue = value;
                    if (setting != undefined) nValue = setting;
                    
                    txt += '\n';
                    if (typeof index == 'number' && index == i) {
                        txt += '> ';
                        currentKey = key;
                    }

                    switch(typeof nValue) {
                        case "object":
                            let l = Object.keys(value).length;
                            txt += `**${settingAttributes[currentPage]?.[key]?.title || key}** - ${l} ${l != 1 ? 'entries' : 'entry'}`;
                        break;
                        case "string":
                            txt += `**${settingAttributes[currentPage]?.[key]?.title || key}**: "${nValue}"`
                        break;
                        case "number":
                            txt += `**${settingAttributes[currentPage]?.[key]?.title || key}**: ${nValue}`
                        break;
                        case "boolean":
                            txt += `${db.clientCache.customEmojis[nValue ? 'bool_true' : 'bool_false']} ${settingAttributes[currentPage]?.[key]?.title || key}`
                        break;
                        case "function":
                            txt += `${key}()`
                        break;
                        default:
                            txt += "*Invalid*"
                    }
                    
                    i++;
                });
                
                let description = settingAttributes[currentPage]?.[currentKey]?.description;
                if (description) txt += `\n\n**${currentKey}**: ${description}`;
                return txt;
            }
            
            
            let updateMsg = async () => {
                if (msg.deleted) return;
                await msg.edit(embed);
                return;
            }

            
            // Reaction listeners                                 ⬇ also fuck these filters
            const collector = new Discord.ReactionCollector(msg, r => r, { time: 300000 });
            
            
            // Variables and stuff
            let index = 0;
            let currentPage = null;
            let awaitingInput = false;
            
            
            collector.on('collect', (reaction, user) => {
                if (awaitingInput | user.id != message.author.id) return;
                
                switch(reaction.emoji.name) {
                    
                    // Delete the embed
                    case '❌':
                        collector.stop();
                        index = -1; // So the "cursor" doesn't show up anymore
                        embed.setDescription(genDescription());
                        embed.setFooter(`This session has ended - Create a new one using ${getPrefix(message.guild)}settings`, message.author.displayAvatarURL({ dynamic: true }));
                        if (message.channel.permissionsFor(client.user).has('MANAGE_MESSAGES')) msg.reactions.removeAll().catch();
                        updateMsg();
                    break;
                    
                    // Scroll up
                    case '⬆':
                        if (index > 0) {
                            index--;
                            embed.setDescription(genDescription());
                            updateMsg();
                        }
                    break;
                    
                    // Scroll down
                    case '⬇':
                        if (index < Object.keys(currentPage ? settingPages[currentPage] : settingPages).length-1) {
                            index++;
                            embed.setDescription(genDescription());
                            updateMsg();
                        }
                    break;
                    
                    // Change the selection
                    case '🆗':
                        let page = Object.keys(currentPage ? settingPages[currentPage] : settingPages);
                        switch(typeof (currentPage ? settingPages[currentPage][page[index]] : settingPages[page[index]])) {
                            case 'string':
                            case 'number':
                                awaitingInput = true;
                                const fieldInfo = settingAttributes[currentPage]?.[page[index]];
                                embed.setDescription(`Enter the new value for **${page[index]}** or click ❌ to cancel.\n\n`
                                + `${fieldInfo.title ? `**${fieldInfo.title}**: ${fieldInfo.description}` : ''}`);
                                embed.setFooter('Send the new value as a message into this text channel.');
                                updateMsg();
                                
                                let mCollector = message.channel.createMessageCollector(m => m.content != "");
                                let rCollector = new Discord.ReactionCollector(msg, r => r);
                                
                                let newContent;
                                
                                mCollector.on("end", c => {
                                    if (!rCollector.ended) rCollector.stop();
                                });
                                
                                rCollector.on("end", () => {
                                    if (!mCollector.ended) mCollector.stop();

                                    if (newContent) {
                                        if (typeof (currentPage ? settingPages[currentPage][page[index]] : settingPages[page[index]]) == 'number') newContent = Number(newContent);

                                        if (currentPage) guildSettings[currentPage][page[index]] = newContent;
                                        else guildSettings[page[index]] = newContent;

                                        guildSettingsDB.set(message.guild.id, guildSettings);
                                    }

                                    awaitingInput = false;
                                    embed.setDescription(genDescription());
                                    updateMsg();
                                });

                                rCollector.on("collect", (reaction, user) => {
                                    if (user.id != message.author.id) return;

                                    reaction.users.remove(user.id);

                                    if (reaction.emoji.name == "❌") {
                                        rCollector.stop();
                                    }
                                });
                                
                                mCollector.on("collect", (m) => {
                                    if (m.author.id == message.author.id && m.content) {
                                        if (typeof (currentPage ? settingPages[currentPage][page[index]] : settingPages[page[index]]) == 'number' && isNaN(m.content)) return message.channel.send("You need to input a number.").then(ms => {ms.delete({timeout: 10000}); if (m.deletable) m.delete({timeout: 10000})})
                                        if (m.deletable) m.delete();
                                        newContent = m.content;
                                        mCollector.stop();
                                    }
                                });
                            break;
                            case 'boolean':
                                if (currentPage) guildSettings[currentPage][page[index]] = !(guildSettings[currentPage][page[index]] == undefined ? settingPages[currentPage][page[index]] : guildSettings[currentPage][page[index]]);
                                else guildSettings[page[index]] = !(guildSettings[page[index]] == undefined ? settingPages[page[index]] : guildSettings[page[index]]);
                                embed.setDescription(genDescription());
                                updateMsg();
                            break;
                            case 'object':
                                if (currentPage) return message.channel.send("code borken");
                                currentPage = page[index];
                                index = 0;
                                embed.setDescription(genDescription());
                                updateMsg();
                            break;
                            default:
                                message.channel.send(`Index: ${index} Page: ${page[index]} Type: ${typeof currentPage ? settingPages[currentPage][page[index]] : settingPages[page[index]]}`);
                        }
                        guildSettingsDB.set(message.guild.id, guildSettings);
                    break;
                    
                    // Go one up
                    case '⏪':
                        if (currentPage) {
                            currentPage = null;
                            index = 0;
                            embed.setDescription(genDescription());
                            updateMsg();
                        }
                    break;
                }
                
                reaction.users.remove(user.id);
            });


            // Here we "finish up" the embed and update the message
            embed.setTitle(`Settings for **${message.guild.name}**`);
            embed.setDescription(genDescription());
            updateMsg();
        }
    }
}

// The """""blueprint""""" for the settings menu
const settingPages = {
    "general": {
        "prefix": process.env.NODE_ENV == "production" ? config.prefix : config.testPrefix,
        "acceptSpaceAfterPrefix": false,
        "replyToMessageEdits":    true,
        "restrictSnipeToMods":    false,
        "disableSnipe":           false,
        "restrictPermsCMD":       false
    },
    "music": {
        "soundcloudSearchIsDefault": true,
        "announceTrack":             true,
        "surpressEmbed":             true,
        "shuffleModifiesQueue":      false,
        "silent":                    false
    },
    "moderation": {
        "dmOnMute":      true,
        "dmOnKick":      true,
        "dmOnBan":       true,
        "dmOnUnmute":    false,
        "dmOnUnban":     false,
        "inviteOnUnban": false
    },
    "welcome": {
        "sendWelcomeMessage":    false,
        "sendLeaveMessage":      false,
        "welcomeMessageText":    "Welcome %%@user%% to %%servername%%!",
        "leaveMessageText":      "%%username%%#%%usertag%% left.",
        "welcomeMessageChannel": "123456789012345678",
        "sendWelcomeDM":         false,
        "welcomeDMText":         "Welcome to %%servername%%!"
    },
    "logging": {
        "enableLogging":        false,
        "logChannel":           "123456789012345678",
        "logSlashCommands":     false,
        "logAllCommands":       false,
        "logJoinLeaveEvents":   false,
        "logMessageEdits":      false,
        "logMessageDeletions":  false,
        "logMemberUpdates":     false,
        "logModerationEvents":  false
    }
}

const welcomeFormattingRules = '\n`%%username%%`: The user\'s name.\n'
    + '`%%usertag%%`: The user\'s 4-digit tag.\n'
    + '`%%servername%%`: This server\'s name.\n'
    + '`%%@user%%`: @mentions the user.\n'
    + '`%%userid%%`: The user\'s ID.';
const settingAttributes = {
    "general": {
        "prefix":                 {title: "Prefix",                    description: "The bot's prefix."},
        "acceptSpaceAfterPrefix": {title: "Accept space after prefix", description: "Respond to a command when a space comes between the prefix and the command.\nExample: if this setting is turned off, the bot will respond to '+help', but not to '+ help'."},
        "replyToMessageEdits":    {title: "Reply to edited messages",  description: "Whether the bot responds when you edit a message. \nExample: If this setting is on, the bot responds when you edit a message containing '+helo' to '+help'."},
        "restrictSnipeToMods":    {title: "Restrict snipe to mods",    description: "If enabled, manage message permission will be required to use the ~snipe command."},
        "disableSnipe":           {title: "Disable snipe",             description: "If enabled, Prysm will not log any deleted messages and disable the ~snipe command."},
        "restrictPermsCMD":       {title: "Restrict perms command",    description: "If enabled, the ~perms command will require manage roles permission."}
    },
    "music": {
        "soundcloudSearchIsDefault": {title: "Use SoundCloud for music search", description: "Use soundCloud instead of YouTube for searching for music. \nExample: '+play polish cow' will search on SoundCloud for 'polish cow'"},
        "announceTrack":             {title: "Announce now playing",            description: "Announce currently playing track. If this is on, the bot will send a message containing the current track name everytime a new song starts playing."},
        "surpressEmbed":             {title: "Surpress embed on play command",  description: "Removes embeds from +play command to avoid spamming the channel. Example: Discord normally shows a preview when you send '+play https://youtu.be/dQw4w9WgXcQ' If this is on, that preview is automatically removed."},
        "shuffleModifiesQueue":      {title: "Shuffling modifies queue",        description: "If this is on, the +shuffle command changes the queue's content."},
        "silent":                    {title: "Silent command execution",        description: "Disables some command output, for example when skipping and seeking."}
    },
    "moderation": {
        "dmOnMute":      {title: "DM users on mute",     description: "Send a message to users when they get muted, including mute reason and duration."},
        "dmOnKick":      {title: "DM users on kick",     description: "Message users when they get kicked from the server, including reason."},
        "dmOnBan":       {title: "DM users on ban",      description: "Message users when they get banned, including ban duration and reason."},
        "dmOnUnmute":    {title: "DM users on unmute",   description: "Message users when their mute expires or someone manually unmuted them."},
        "dmOnUnban":     {title: "DM users on unban",    description: "Attempt to message a user when their ban expires or is manually removed by a moderator. This only works when the bot shares a server with the user. Only works with temporary bans."},
        "inviteOnUnban": {title: "Invite user on unban", description: "When 'DM users on unban' AND this setting is enabled, the unban notification will also include a invite link. Only works with temporary bans."}
    },
    "welcome": {
        "sendWelcomeMessage":       {title: "Send Welcome Message", description: "Whether to send a welcome message."},
        "sendLeaveMessage":         {title: "Send Leave message",   description: "Whether to send a leave message."},
        "welcomeMessageText":       {title: "Welcome Text",         description: "The welcome message to send. Formatting rules: " + welcomeFormattingRules},
        "leaveMessageText":         {title: "Leave message text",   description: "The message to send when a user leaves. Formatting rules: " + welcomeFormattingRules},
        "welcomeMessageChannel":    {title: "Welcome Channel",      description: "The ID of the channel where you want your welcome messages to go. [Learn how to get a channel ID](https://www.swipetips.com/how-to-get-channel-id-in-discord/)"},
        "sendWelcomeDM":            {title: "DM new users",         description: "Whether to send a direct message to new users."},
        "welcomeDMText":            {title: "DM text",              description: "The message you want to DM to new users. Formatting rules: " + welcomeFormattingRules}
    },
    "logging": {
        "enableLogging":        {title: "Enable logging",           description: "Enables logging in the channel specified below."},
        "logChannel":           {title: "Log Channel",              description: "The ID of the log channel. [Learn how to get a channel ID](https://www.swipetips.com/how-to-get-channel-id-in-discord/)"},
        "logSlashCommands":     {title: "Log slash commands",       description: "Logs every time a slash command is executed."},
        "logAllCommands":       {title: "Log all Commands",         description: "Logs every time a \"normal\" (non-slash) command is executed."},
        "logJoinLeaveEvents":   {title: "Log join/leave events",    description: "Logs every time a users joins or leaves or a bot is added or removed."},
        "logMessageEdits":      {title: "Log message edits",        description: "Logs when a user edits a message."},
        "logMessageDeletions":  {title: "Log message deletions",    description: "Logs when a user deletes a message."},
        "logMemberUpdates":     {title: "Log member updates",       description: "(Currently unsupported) Logs when a user's state updates, for example when they change their name or avatar."},
        "logModerationEvents":  {title: "Log moderation events",    description: "(Currently unsupported) Logs when moderative actions are executed, for example when a channel is created or a user gets banned."}
    }
}

module.exports.settingPages = settingPages;