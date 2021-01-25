const data = require('../../bot');
const { Message } = require('discord.js');
const { getPermissionLevel } = require('../../functions/permission_flags');
const db = data.db;
const client = data.client;


module.exports = {
    name: 'getpermissions',
    aliases: ["getperms", "getperm"],
    flag: 1000,
    execute(message, args) {
        if (!isNaN(args[0]) || message.mentions.users.first()) client.users.fetch(message.mentions.users.first() ? message.mentions.users.first().id : args[0]).then(user => {
            let perms = db.permissionFlags.get(user.id);
            if (!perms) return message.channel.send('No permission flags set for this user.');
            message.channel.send(`Permissions for ${user.username}#${user.discriminator}\`\`\`json\n${JSON.stringify(perms, null, 4)}\`\`\`\n${user.username}'s permission level is \`${getPermissionLevel(user)}\``);
        }).catch(() => message.channel.send('I can\'t find that user.'));
        else {
            if (!args[0]) return message.channel.send('No user provided.');
            else return message.channel.send('Invalid user ID provided.');
        }   
    }
}

module.exports.devCommand = true;