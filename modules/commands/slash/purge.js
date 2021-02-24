const { SlashCommand } = require('../../bot/slashCommands');
const { InteractionResponseType: resType } = require('discord-interactions');
const { client } = require('../../../bot');
const Discord = require('discord.js');

/**
 * 
 * @param {SlashCommand} cmd
 * @param {function(String, import('discord.js').MessageEmbed | false, resType, boolean) : void} callback
 */
module.exports.execute = async (cmd, callback) => {
    try {
        let startPos = cmd.data.options.find(d => d.name == 'startpos')?.value;
        let endPos   = cmd.data.options.find(d => d.name == 'endpos'  )?.value;
        let channel  = await client.channels.fetch(cmd.channel_id);
        let guild    = await client.guilds.fetch(cmd.guild_id);
        if (!(channel instanceof Discord.TextChannel)) return; // Remove this before committing as it fucks announcement channels and is simply there to unfuck intellisense
        
        if (!cmd.member?.permissions.has('MANAGE_MESSAGES'))
            return callback('You do not have permission to use this.', false, resType.CHANNEL_MESSAGE, true);
        
        // Verify the input is numeric
        if (isNaN(startPos) || (endPos && isNaN(endPos)))
            return callback(`Error: Input is not numeric.`, false, resType.CHANNEL_MESSAGE, true);
        
        // Check if the bot has the permissions it needs
        if (
            ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'MANAGE_MESSAGES']
            .filter(perm => !channel.permissionsFor(guild.me).has(perm))
            .length > 0
        ) return callback('I do not have the required permissions to execute this command.', false, resType.CHANNEL_MESSAGE, true);
        
        /**
         * If endPos is provided or startPos looks like
         * a message ID, both arguments will* be treated
         * as message IDs and all messages between those
         * IDs will be deleted. Otherwise startPos needs
         * to be a number between 1-100.
         */
        if (endPos || /^[0-9]{18}$/.test(`${startPos}`)) {
            if (endPos && !/^[0-9]{18}$/.test(`${endPos}`))
                return callback(`Invalid message ID: ${endPos}`, false, resType.CHANNEL_MESSAGE, true);
            
            if (!endPos) endPos = channel.lastMessage.id;
            
            // Bring startPos and endPos in the correct order
            let startMsg = await channel.messages.fetch(startPos);
            let endMsg   = await channel.messages.fetch(endPos);
            if (startMsg.createdAt < endMsg.createdAt)
                [ startMsg, endMsg ] = [ endMsg, startMsg ];
            
            const beforeMessages = await channel.messages.fetch({ before: startMsg.id, limit: 100 });
            const afterMessages  = await channel.messages.fetch({ after: endMsg.id, limit: 100 });
            
            let messages = beforeMessages.filter(msg => afterMessages.get(msg.id));
            messages = messages.array();
            if (!messages.find(msg => msg.id == startMsg.id)) messages.push(startMsg);
            if (!messages.find(msg => msg.id == endMsg.id))   messages.push(endMsg);
            messages = messages.filter(msgFilter);
            
            channel.bulkDelete(messages)
                .then(() => callback(`Successfully deleted ${messages.length} messages.`, false, resType.CHANNEL_MESSAGE, true))
                .catch(e => { console.error(e); callback(`An error has occurred: ${e}`, false, resType.CHANNEL_MESSAGE, true) });
        } else {
            startPos = Math.round(Number(startPos));
            if (startPos > 100 || startPos < 1)
                return callback(`Invalid parameter \`startPos\`: needs to be a number between 1-100, received \`${startPos}\`.`,
                false, resType.CHANNEL_MESSAGE, true);
            
            const fetched = (await channel.messages.fetch({ limit: startPos }))
                .filter(msgFilter);
            channel.bulkDelete(fetched)
                .then(() => callback(`Successfully deleted ${fetched.size} messages.`, false, resType.CHANNEL_MESSAGE, true))
                .catch(e => { console.error(e); callback(`An error has occurred: ${e}`, false, resType.CHANNEL_MESSAGE, true) });
        }
    } catch(e) {
        console.warn(e);
        callback(''+e, false, resType.CHANNEL_MESSAGE, true);
    }
}

module.exports.sendConfirmation = 'callback';
module.exports.requireGuildMember = true;

const msgFilter = msg => !msg.pinned && new Date() - msg.createdTimestamp < 1209500000;