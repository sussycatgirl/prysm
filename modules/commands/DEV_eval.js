const data = require('../../bot');
const client = data.client;
const fs = require('fs');
const Discord = require('discord.js');
const { db } = data;
const { shoukaku } = require('../bot/shoukakuSetup');
const { inspect } = require('util');

module.exports = {
    name: 'eval',
    aliases: ["e", "evaluate", "exec"],
    flag: 10000,
    /**
     * 
     * @param {Discord.Message} message 
     * @param {*} args 
     */
    execute(message, args) {
        try {
            const exec = args.join(' ');
            eval(
                `(async () => {` +
                `${exec.replace(/(```\w*\n)|\n```$/g, '')}\n` +
                `})()`
            )
            .then(res => {
                if (res == undefined)
                    message.react('✅')
                        .catch(() => message.channel.send('```js\nundefined\n```'));
                else
                    message.channel.send(`\`\`\`js\n${inspect(res).slice(0, 1989)}\n\`\`\``);
            })
            .catch(e => {
                message.channel.send(`\`\`\`js\n${(e && e.name && e.message ? `${e.name}: ${e.message}` : `Error: ${e}`).slice(0, 1989)}\n\`\`\``)
                    .catch(a => message.channel.send(a));
            });
        } catch(e) {
            message.channel.send(`\`\`\`js\n${(e && e.name && e.message ? `${e.name}: ${e.message}` : `Error: ${e}`).slice(0, 1989)}\n\`\`\``)
                .catch(a => message.channel.send(a));
        }
    }
}

module.exports.devCommand = true;