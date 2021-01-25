const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { getFlags } = require('../../functions/permission_flags');

let cooldowns = {}

module.exports.name         = 'feedback';
module.exports.aliases      = [];
module.exports.description  = 'Send a message to the devs. Can only be used once a minute.';
module.exports.syntax       = 'feedback [Feedback message]';
module.exports.guildOnly    = false;
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
    let msg = args.join(' ');
    if (!msg) return message.channel.send('You need to tell me what you want to say to the owners!');
    
    if (getFlags(message.author).DM_SILENT_BLACKLIST) {
        message.channel.send(
            new Discord.MessageEmbed()
            .setDescription('Your message could not be delivered.')
            .setColor('ff0000')
        );
        return;
    }
    if (getFlags(message.author).DM_BLACKLIST) {
        message.channel.send(
            new Discord.MessageEmbed()
            .setDescription('You are currently not allowed to do this.')
            .setColor('ff0000')
        );
        return;
    }

    if (!cooldowns[message.author.id]) cooldowns[message.author.id] = Date.now() + 1000*60; // Only allow one message per minute
    else {
        if (cooldowns[message.author.id] >= Date.now()) return message.channel.send('Please wait a moment before doing this again.');
        else cooldowns[message.author.id] = Date.now() + 1000*60;
    }

    const owner = await client.users.fetch(db.botOwner.id);
    if (!owner) return message.channel.send('Your message could not be delivered.');
    owner.send(
        new Discord.MessageEmbed()
        .setTitle(`Message from ${message.author.username}`)
        .setAuthor(`${message.author.id} | ${message.author.tag}`, message.author.displayAvatarURL())
        .setDescription(msg)
        .setColor('36393f')
    )
    .then(() => {
        message.channel.send('Sent successfully!');
    })
    .catch(() => {
        message.channel.send('Your message could not be delivered.');
    });
}