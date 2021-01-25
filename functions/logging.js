const Discord = require('discord.js');
const config = require('../config.json');
const client = require('../bot').client;
const whClient = new Discord.WebhookClient(config.loggingWebhook.id, config.loggingWebhook.token);

/**
 * @param {string} title 
 * @param {string} description 
 * @param {boolean} important 
 */
module.exports.log = function(title, description, important) {
    return new Promise(async (resolve, reject) => {
        const { testingMode } = require('../modules/core/login');
        let embed = new Discord.MessageEmbed()
        .setTitle(title)
        .setDescription(description)
        .setAuthor(`Shard ${JSON.stringify(client.shard?.ids)}${testingMode == true ? ' [Testing mode]' : ''}`, client.user?.avatarURL())
        .setFooter(client.user?.username, client.user?.avatarURL());
        if (important) embed.setColor('ff0000');
        //console.log(`${important == true ? '[!] ' : ''}${title}: ${description}`);
        if (!testingMode || important) whClient.send(embed)
        .then(resolve)
        .catch(e => {
            console.log('Failed to execute webhook');
            console.log(e);
            reject();
        });
    });
}