const Discord = require('discord.js');
const { client, db } = require('../../bot');
const config = require('../../config.json');
const { getFlags } = require('../../functions/permission_flags');

/**
 * Yes, Prysm forwards DMs.
 * Don't send shit to bots.
 */

let dmBlockMSGSent = {}
module.exports.run = () => {
    client.on('message', async (message) => {
        if (message.partial) await message.fetch();
        if (message.channel.type != 'dm') return;
        if (message.author.bot) return;

        console.log(`${message.author.tag} in DMs => ${message.content}`);

        const owner = await client.users.fetch(db.botOwner.id);
        if (!owner) return;

        if (message.author.id != owner.id) {
            if (getFlags(message.author).DM_SILENT_BLACKLIST) return console.log(`↳ User is silent blacklisted`);
            if (getFlags(message.author).DM_BLACKLIST) {
                if (!dmBlockMSGSent[message.author?.id]) {
                    console.log(`↳ User has been informed that they're DM-blacklisted`);
                    let embed = new Discord.MessageEmbed()
                        .setDescription('You are currently blacklisted from talking to this bot in direct messages. '
                        + 'You can still execute commands, but your messages won\'t get forwarded.')
                        .setColor('ff0000');
                    message.author?.send(embed);
                    dmBlockMSGSent[message.author.id] = true;
                    setTimeout(() => dmBlockMSGSent[message.author.id] = false, 1000 * 60 * 10);
                } else {
                    console.log(`↳ User is DM-blacklisted`);
                }
                return;
            }
            
            let msgEmbed = new Discord.MessageEmbed()
                .setAuthor(message.author.tag, message.author.displayAvatarURL( { dynamic: true } ))
                .setDescription(message.content)
                .setColor(0x2f3136)
                .setFooter(message.author.id);

            if (message.attachments.first()) msgEmbed.setImage(message.attachments.first().url);

            owner.send(msgEmbed).catch();
        } else {
            let args = message.content.split(' ');
            if (isNaN(args[0]) || (!args[1] && !message.attachments.first())) return;

            const target = await client.users.fetch(args[0]);
            if (!target) return;

            if (getFlags(target).DM_BLACKLIST || getFlags(target).DM_SILENT_BLACKLIST) return message.channel.send(`${target?.tag} is currently blacklisted.`);

            args.shift();
            target.send(args.join(' '), message.attachments.first() ? new Discord.MessageAttachment(message.attachments.first().url) : undefined)
            .then(() => message.react('✅').catch(() => {owner.send(`Message${message.attachments.first() ? ' and attachment' : ''} sent to ${target.tag}!`)}))
            .catch(reason => owner.send('Failed to send: ' + reason));
        }
    });
}

module.exports.meta = {
    name: 'forwardDMs',
    priority: 9
}