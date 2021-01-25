const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');

module.exports.name         = 'sayas';
module.exports.aliases      = ['as'];
module.exports.description  = 'Send a message as someone else.';
module.exports.syntax       = 'sayas [@Mention] [Message]';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    if (args[0] == undefined) {
        message.channel.send(replies.invalidUser);
        return;
    }
    let target;
    if (message.guild.member(args[0].replace(/[\\<>@#&!]/g, ""))) { // what the actual fuck did i create
        target = client.users.cache.get(args[0].replace(/[\\<>@#&!]/g, "")); // why the actual fuck did i create
    } else {
        message.channel.send(replies.invalidUser);
        return;
    }

    let msg = args.slice(1).join(' ');

    if (msg.length < 1) {
        message.channel.send(replies.invalidSyntax);
        return;
    }

    message.delete();

    function sendHook(webhook) {
        let nick;
        if (message.guild.members.cache.get(target.id).nickname == null) nick = target.username; else nick = message.guild.members.cache.get(target.id).nickname;
        webhook.send(msg, {
            username: nick,
            avatarURL: target.displayAvatarURL()
        });
    }
    
    let webhook;
    let hooks = (await message.channel.fetchWebhooks()).array();
    let index = 0;
    while (hooks[index] && !webhook) {
        if (hooks[index].type != 'incoming') webhook = hooks[index];
        index++;
    }

    if (!webhook && hooks.length < 10) webhook = await message.channel.createWebhook('Prysm', {avatar: client.user.avatarURL()});
    else if (hooks.length >= 10) return message.channel.send(`Sorry, I am unable to create a new webhook. This usually happens because this channel follows too many other channels.`);
    
    sendHook(webhook);
}

let replies = {
    invalidSyntax: 'You need to tell me what you want the person to say.',
    invalidUser: 'You need to @mention someone for this to work.'
}