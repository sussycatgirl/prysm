const Discord = require('discord.js');
const data = require('../../bot');
const client = data.client;
const getPrefix = require('../../functions/getPrefix').getPrefix;
const checkPermissions = require('../../functions/check_permissions');
const { getFlags } = require('../../functions/permission_flags');
const config = require('../../config.json');
const getGuildSettings = require("../../functions/getGuildSettings").get;
const { guildLog } = require('../../functions/logging');

module.exports.run = () => {
    
    // Listen for incoming messages
    client.on('message', message => {
        try {
            messageReceived(message, false);

            if (message.content.toLowerCase().indexOf('#botbot') > -1) message.react('671389061331812362').catch();
        } catch(e) {
            console.error(e);
        }
    });

    // Listen for message updates
    client.on('messageUpdate', (old, message) => {
        try {
            if (!old || !message) return;
            if (old.content == message.content || !message.content || old.embeds[0] && !message.embeds[0]) return;
            messageReceived(message, true);
        } catch(e) {
            console.error(e);
        }
    });

    /**Reveive and handle the message
     * @param {Discord.Message} message The message that was received
     * @param {boolean} wasEdited If the message was received via messageUpdate event or not 
     */
    async function messageReceived(message, wasEdited) {

        if (message.partial) await message.fetch();
        if (message.author.bot) return;
        
        if (wasEdited && message.guild && !getGuildSettings(message.guild.id, "general.replyToMessageEdits")) return;

        try {
            // Remove duplicate spaces from message
            let content = message.content.replace(/\s+/g, ' ');

            let prefix = getPrefix(message.guild ? message.guild.id : undefined);
            if (prefix && prefix.length > 30) {
                if (content.startsWith(prefix)) return message.channel.send("The prefix is too long. Please change it to something shorter using <@" + client.user.id + "> prefix <New Prefix>.");
                prefix = getPrefix;
            }
            if (!content.startsWith(prefix) && !content.startsWith(`<@${client.user.id}>`) && !content.startsWith(`<@!${client.user.id}>`)) return;

            let command, commandName, args;
            let acceptSpace = false;
            if (message.guild) {
                let guildSettings = data.db.guildSettings.get(message.guild.id);
                if (!guildSettings) guildSettings = {}
                if (guildSettings.general && guildSettings.general.acceptSpaceAfterPrefix) acceptSpace = true;
            }

            // Figure out how long the prefix is
            let cutMsgLength = 0;
            let startsWithMention = false;
                 if (message.guild && message.content.startsWith(prefix + " ")  && acceptSpace) cutMsgLength = prefix.length + 1;
            else if (content.startsWith(prefix)) cutMsgLength = prefix.length;
            else if (content.startsWith(`<@${client.user.id}>`))  { cutMsgLength = `<@${client.user.id}>`.length; startsWithMention = true; }
            else if (content.startsWith(`<@!${client.user.id}>`)) { cutMsgLength = `<@!${client.user.id}>`.length; startsWithMention = true; }

            // Split the message into command and arguments
            const commands = require('./command_loader').commands;
            content = message.content.slice(cutMsgLength);
            if (startsWithMention && content.startsWith(' ')) content = content.slice(1);
            args = content.replace(/\s+/g, ' ').split(' ');
            commandName = args.shift().toLowerCase();
            command = commands.get(commandName) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

            if (!command) return;
            if (command.guildOnly && !message.guild) return message.channel.send('Sorry, this command can not be used in DMs.')
            
            const flags = getFlags(message.author);
            if (flags) {
                if (flags["BLACKLIST"]) return message.channel.send(`${message.author}, you are currently blacklisted from using this bot.`);
                if (flags["SILENT_BLACKLIST"]) return;
            }
            
            // Increase total command counter
            data.db.stats.inc('total_commands');

            // Check if the command is dev-only or disabled
            if (command.disabled) return;
            if (command.dev_only) {
                if (!flags['EXECUTE_DEV_COMMANDS']) return message.channel.send('Sorry, this command is currently in development, and can only be used by developers.');
            }

            // Check if the bot has the required permissions to execute the command
            if (!await checkPermissions.check(command, message.guild, message)) return;
            
            // Finally, let's execute the command. Also, console log the command execution to console because why tf not
            console.log(`Shard ${client.shard.ids}: \x1b[36m[${data.db.stats.get('total_commands')}]\x1b[0m [\x1b[33m${message.author.tag}\x1b[0m/${message.guild ? `\x1b[32m${message.guild.name}\x1b[0m #\x1b[32m${message.channel.name}\x1b[0m` : '\x1b[34mDMs\x1b[0m'}]: ${commandName} ${args.join(' ')}`);
            try {
                require('../bot/statusMessage').cmdExec();
                if (message.guild) guildLog(message.guild, 'command', message);
                command.execute(message, args);
            } catch(e) {
                console.log('Failed to execute command');
                console.error(e);
                message.channel.send(`Uh-oh. I failed to execute that command.\n\`\`\`js\n${e}\`\`\`If this keeps happening, please contact \`${data.db.botOwner.username}#${data.db.botOwner.discriminator}\``).catch(e => message.channel.send('Uh-oh. Something went wrong.'));
            }
        } catch(e) {
            // Send a message when something bad happens
            console.log('Failed to execute command');
            console.error(e);
            message.channel.send(`Uh-oh. An error has occurred. This is not good.\n\`\`\`js\n${e}\`\`\`If this keeps happening, please contact \`${data.db.botOwner.username}#${data.db.botOwner.discriminator}\``).catch(e => message.channel.send('Uh-oh. Something went wrong.'));
            return;
        }
    }
}

module.exports.meta = {
    name: 'message_handler',
    priority: 2
}