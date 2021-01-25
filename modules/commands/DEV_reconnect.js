const Discord = require('discord.js');
const data = require('../../bot');
const client = data.client;

module.exports = {
    name: 'reconnect',
    flag: 1000,
    execute(message, args) {
        const reconnectMsg = new Discord.MessageEmbed()
        .setDescription('Reconnecting...');
        message.channel.send(reconnectMsg);
        const token = client.token;

        client.destroy();
        client.login(token).then(() => {
            const reconnectMsg2 = new Discord.MessageEmbed()
            .setDescription('Done!');
            message.channel.send(reconnectMsg2);

            delete token;
        });
    }
}

module.exports.devCommand = true;