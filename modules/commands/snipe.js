const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const getGuildSettings = require('../../functions/getGuildSettings');
const { getPrefix } = require('../../functions/getPrefix');

let deleted = {}

module.exports.name         = 'snipe';
module.exports.aliases      = ['undelete'];
module.exports.description  = 'Shows the last deleted messages.';
module.exports.syntax       = 'snipe [Amount or \'clear\']';
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
    if (getGuildSettings.get(message.guild, 'general.disableSnipe'))
        return message.channel.send('Snipe is disabled on this server.');
    
    if (getGuildSettings.get(message.guild, 'general.restrictSnipeToMods') && !message.member.permissions.has('MANAGE_MESSAGES'))
        return message.channel.send('You can\'t use this command here.');
    
    let showMax = 3;
    if (!isNaN(args[0])) showMax = Math.round(Number(args[0]));
    if (showMax > 25) return message.channel.send('Sorry, I can\'t show more than 25 messages.');

    if (args[0] && args[0].toLowerCase() == 'clear') {
        if (!message.member.permissions.has('MANAGE_MESSAGES')) return message.channel.send('You need permission to manage messages to do this.');
        if (!deleted[message.channel.id] || !deleted[message.channel.id][0]) return message.channel.send('There is nothing to clear.');
        deleted[message.channel.id] = {};
        return message.channel.send('Cleared!');
    }

    let embed = new Discord.MessageEmbed()
        .setTitle(`Recently deleted message${showMax != 1 ? 's' : ''}`)
        .setColor('2f3136');

    if (message.member.permissions.has('MANAGE_MESSAGES')) embed.setFooter(`Use '${getPrefix(message.guild)}snipe clear' to clear this list.`);

    if (!deleted[message.channel.id] || !deleted[message.channel.id][0]) {
        let embed = new Discord.MessageEmbed()
            .setTitle('Recently deleted messages')
            .setDescription('No recently deleted messages found');

        return message.channel.send(embed);
    }

    let index = 0;
    deleted[message.channel.id].forEach(msg => {
        if (index >= showMax || index >= 25) return;
        index += 1;
        let author = msg.author.tag;
        if (msg.webhookID) author = `${msg.author.username} ${db.clientCache.customEmojis.webhook}`;
        else if (msg.author.bot) author += ` ${db.clientCache.customEmojis.bot}`;

        let content = msg.content;
        if (!content) content = '[Message was empty]';
        if (content.length > 1024) {
            content = content.substring(0, 1018);
            content += ' [...]';
        }
        
        embed.addField(
            author, // Embed field title
            content, // Embed field content
            true // Inline?
        );
    });

    message.channel.send(embed)
    .catch(() => message.channel.send('Hm, seems like the messages are too long to display. I can only show a total of 6000 letters in one message.'));
}

client.on('messageDelete', async (message) => {
    try {
        //if (message.partial) await message.fetch();
        if (!message.guild) return;
        if (getGuildSettings.get(message.guild, 'general.disableSnipe')) return;
        //if (process.env.NODE_ENV != 'production') console.log(`Shard ${client.shard.ids[0]}: Message by ${message.author.tag} was deleted: ${message.content}`);
        if (!deleted[message.channel.id]) deleted[message.channel.id] = []
        deleted[message.channel.id].unshift(message);
        if (deleted[message.channel.id].size > 25) deleted[message.channel.id].splice(-1, 1);
    } catch(e) {
        console.error(e);
    }
});