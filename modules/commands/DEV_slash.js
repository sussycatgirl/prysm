const data = require('../../bot');
const client = data.client;
const Discord = require('discord.js');

/**
 * This command is used to manage slash commands.
 */

module.exports = {
    name: 'slash',
    aliases: [],
    flag: 1000,
    /**
     * 
     * @param {Discord.Message} message 
     * @param {*} args 
     */
    async execute(message, args) {
        try {
            if (!process.env.ENABLE_SLASH) return message.channel.send('Slash commands are not enabled. Please set the ENABLE_SLASH environment variable.');
            const { interaction } = require('../bot/slashCommands');
            if (!interaction) return message.channel.send('`Interaction` object is undefined');
            
            switch(args[0]) {
                case 'add':
                    if (!args[2]) return message.channel.send('Missing argument(s): `~dev slash add [guild or \'global\'] [JSON]`\nDocs: <https://discord.com/developers/docs/interactions/slash-commands#create-guild-application-command>');

                    let arg1 = args[1];
                    args.shift();
                    args.shift();
                    let json = JSON.parse(args.join(' '));

                    interaction.createApplicationCommand(json, arg1.toLowerCase() == 'global' ? undefined : arg1)
                    .catch(e => message.channel.send(`\`\`\`js\n${e}\`\`\``))
                    .then(data => message.channel.send(`\`\`\`js\n${JSON.stringify(data) || 'ok'}\`\`\``));
                break;
                case 'remove':
                    if (!args[2]) return message.channel.send('Missing argument(s): `shit-dev remove [guild or \'global\'] [command id]`\nDocs: <https://discord.com/developers/docs/interactions/slash-commands#delete-guild-application-command>');

                    interaction.deleteApplicationCommand(args[2], args[1].toLowerCase() == 'global' ? undefined : args[1])
                    .catch(e => message.channel.send(`\`\`\`js\n${e}\`\`\``))
                    .then(data => message.channel.send(`\`\`\`js\n${JSON.stringify(data) || 'ok'}\`\`\``).catch(e => console.error(e)));
                break;
                case 'list':
                    message.channel.send(`Global:\`\`\`js\n${JSON.stringify(await interaction.getApplicationCommands(), null, 4) || 'None'}\`\`\`\nGuild:\`\`\`js\n${JSON.stringify(await interaction.getApplicationCommands(message.guild.id), null, 4) || 'None'}\`\`\``).catch(async e => {
                        console.log(JSON.stringify(await (interaction.getApplicationCommands()), null, 4));
                        console.log(JSON.stringify(await (interaction.getApplicationCommands(message.guild.id)), null, 4));
                    });
                break;
                default: return message.channel.send('Missing or invalid argument: [add/remove/list]');
            }
        } catch(e) {
            console.error(e);
            message.channel.send('Error: ' + e).catch();
        }
    }
}

module.exports.devCommand = true;