const Discord = require('discord.js');
const config = require('../../config.json');
const data = require('../../bot');
const client = data.client;
const { log } = require('../../functions/logging');

module.exports.run = () => {
    let token = config.token;
    if (process.env.NODE_ENV != 'production') { token = config.test_token; this.testingMode = true; }

    console.log(`[Shard ${client.shard.ids[0]}] Logging in...`);
    client.login(token)
    .catch((reason) => {
        console.log(`[Shard ${client.shard.ids[0]}] ${'\x1b[31m'}Login failed${'\x1b[0m'}`);
        console.error(reason);
        client.destroy();
    });

    client.once('ready', () => {
        log(`Shard ${JSON.stringify(client.shard.ids)} Ready`, `Successfully logged in as ${client.user.username}#${client.user.discriminator}.`);
        client.shard.broadcastEval(`this.users.cache.get("${config.botOwner}")`).then(owner => data.db.botOwner = owner[0]); // "Cache" the bot owner to a variable for easy access

        require('../commands/ban').refreshTimeouts();
        require('../commands/mute').refreshTimeouts();
    });
}

module.exports.testingMode = false;
module.exports.meta = {
    name: 'login',
    priority: 3
}