const data = require('../../bot');
const client = data.client;
const Discord = require('discord.js');
const request = require('request'); // YES I KNOW ITS DEPRECATED
const Enmap = require('enmap');
const tokens = new Enmap({ name: "oauth2_tokens" });

/**
 * This allows devs to join any server the
 * bot is on with invite user permission.
 * 
 * This will only be used for technical assistance
 * and only with consent of the server's admins.
 */

module.exports = {
    name: 'join',
    aliases: ["invite"],
    flag: 1000,
    /**
     * 
     * @param {Discord.Message} message 
     * @param {*} args 
     */
    async execute(message, args) {
        const authorid = message.author.id;
        const token = tokens.get(authorid);
        if (!token) return message.channel.send('No access token found. OAuth2 authorization required.');
        
        let guild = await client.guilds.fetch(args[0]);
        if (!guild) return message.channel.send('Cannot find this guild.');
        
        if (!guild.me.permissions.has('CREATE_INSTANT_INVITE'))
            return message.channel.send('I do not have permission to create invites in this guild.');
        else {
            guild.addMember(message.author, { accessToken: token })
                .then((member) => {
                    message.react('👍').catch(() => message.channel.send('Done!'));
                })
                .catch((reason) => {
                    message.channel.send('Cannot join you to this server. ' + reason);
                    console.error(reason);
                });
        }
    }
}

module.exports.devCommand = true;