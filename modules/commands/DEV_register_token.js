const data = require('../../bot');
const client = data.client;
const Discord = require('discord.js');
const Enmap = require('enmap');
const { getPrefix } = require('../../functions/getPrefix');
const tokens = new Enmap({ name: "oauth2_tokens" });

/**
 * Add OAuth2 tokens for the "join" dev command
 */

module.exports = {
    name: 'register_token',
    aliases: [],
    flag: 1000,
    /**
     * 
     * @param {Discord.Message} message 
     * @param {*} args 
     */
    async execute(message, args) {
        const uid = args[0];
        const token = args[1];
        
        if (!uid || !token) return message.channel.send(`Missing argument. Syntax: \`${getPrefix(message.guild)}dev register_token [User ID] [Token]\`. ` +
        `Use \`misc/oauth2.js\` to get a token.`);
        
        if (token == 'clear') {
            tokens.delete(uid);
            message.channel.send(`Cleared token for ${uid}`);
        }
        else {
            tokens.set(uid, token);
            message.channel.send(`Registered token \`${token}\` for \`${uid}\``);
        }
    }
}

module.exports.devCommand = true;