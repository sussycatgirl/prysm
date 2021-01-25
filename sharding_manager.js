/* Prysm - A Discord Bot
 * Copyright (C) 2019-2020 Im_Verum
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * 
 * Contact: https://discord.gg/aTRHKUY
 */

console.log('[Sharding Manager] Starting.');

const config = require('./config.json');
const Discord = require('discord.js');
const manager = new Discord.ShardingManager('./bot.js', {
    totalShards: 1, // Sharding is fucked and needs to be fixed
    respawn: false,
    token: config.token
});
console.log(`[Sharding Manager] Spawning ${manager.totalShards == 'auto' ? 'the recommended amount of' : manager.totalShards} shard${manager.totalShards != 1 ? 's' : ''}.`);

// Spawn the shards
manager.spawn()
.then(shards => {
    console.log(`[Sharding Manager] ${'\x1b[34m'}Successfully spawned ${'\x1b[33m'}${shards.size}${'\x1b[34m'} shards.${'\x1b[0m'}`);
    manager.broadcast('ALL_SHARDS_READY'); // idk how to receive broadcasts help pls
})
.catch(reason => {
    console.log('[Sharding Manager] Failed to spawn shards.');
    console.error(reason);
    process.exit(1);
});

// Log a message when a shard gets launched
manager.on('launch', (shard) => {
    console.log(`[Sharding Manager] ${'\x1b[34m'}Shard ${'\x1b[33m'}${shard.id}${'\x1b[34m'} launched.${'\x1b[0m'}`);
});
