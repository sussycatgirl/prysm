const Discord = require('discord.js');
const data = require('../../bot');
const client = data.client;

/**
 * This beautiful piece of code refreshes the "cache".
 * It fetches values from other clients and saves them
 * to a variable for easier access.
 */

module.exports.run = function() {
    setInterval(() => {
        // This throws an error when not all shards are ready, but I have no idea how to check if shards have been spawned so .catch() must do the job
        client.shard.fetchClientValues(`guilds.cache.size`)
        .then(guildsArr => {
            let guilds = 0;
            guildsArr.forEach(size => guilds += size);
            data.db.clientCache.guildSize = guilds;
        })
        .catch();
            
        client.shard.fetchClientValues(`users.cache.size`)
        .then(usersArr => {
            let users = 0;
            usersArr.forEach(size => users += size);
            
            data.db.clientCache.userSize = users;
        })
        .catch();
    }, 3000);
}

module.exports.meta = {
    name: 'update_cache',
    priority: 7
}