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

// Load env vars from .env file
require('dotenv').config();

const config = require('./config.json');
const Discord = require('discord.js');
const client = new Discord.Client({ partials: [ 'MESSAGE' ], disableMentions: 'everyone' });
const fs = require('fs');
const path = require('path');

// Setup the database
const Enmap = require('enmap');
let db = {
    reactionroles: new Enmap({ name: 'reactionroles', polling: true, fetchAll: true }),
    guild: new Enmap({ name: 'guilddata', polling: true, fetchAll: true }),
    user: new Enmap({ name: 'userdata', polling: true, fetchAll: true }),
    stats: new Enmap({ name: 'botStats', polling: true, fetchAll: true }),
    guildSettings: new Enmap({ name: 'guildSettings', polling: true, fetchAll: true, }),
    permissionFlags: new Enmap({ name: 'permission_flags', polling: true, fetchAll: true }),
    clientCache: {
        guildSize: client.guilds.size,
        userSize: client.users.size,
        customEmojis: {
            "botBadge": '<:botLogo:707194782832656446>',
            "banhammer": '<:bamhammer:744651906542075914>',
            "webhook": '<:webhook:749213694717853716>',
            "bot": '<:bot:749216305529487392>',
            "loading": '<a:loading:751519912757035039>',
            "bool_true": '<:true:766647853786726411>',
            "bool_false": '<:false:766646519259725845>',
            "streaming": '<:streaming:774712509885448272>',
            "slash": '<:slash:789851125615689728>'
        }
    }
}


// Load modules
let modules = new Discord.Collection();

module.exports = {
    db: db,
    client: client,
    modules: modules
}

// Do shit to make bot not commit die
if (!fs.existsSync(`modules/external_modules`)) fs.mkdirSync(`modules/external_modules`);
if (!fs.existsSync(`modules/external_commands`)) fs.mkdirSync(`modules/external_commands`);

let loadModules = (results) => {
    // Load modules
    let loadedModules = 0;
    results.forEach(dir => {
        if (path.extname(dir) != '.js') return console.log(`[Shard ${client.shard.ids[0]}] Can't load file: ${dir}`);
        if (path.dirname(dir).endsWith('commands')) return;
        let module = require(dir);
        if (module.disabled)                         return;
        if (!module.meta)                            return console.log(`Module ${dir} is missing metadata.`);
        if (!module.meta.name)                       return console.log(`Module ${dir} is missing 'name' property.`);
        if (typeof module.meta.priority != 'number') return console.log(`Module '${module.meta.name}' is missing 'priority' property.`);
        if (typeof module.run != 'function')         return console.log(`Module '${module.meta.name}' does not have a 'run()' function.`);
        modules.set(module.meta.name, module);
        loadedModules += 1;
    });
    console.log(`[Shard ${client.shard.ids[0]}] Loading ${loadedModules} modules.`);

    // Sort modules and execute them in order
    modules.sort((a, b) => a.meta.priority - b.meta.priority)
    .forEach(module => {
        console.log(`[Shard ${client.shard.ids[0]}] Running module \x1b[33m${module.meta.priority}\x1b[0m ${module.meta.name}`);
        module.run();
    });

    console.log(`[Shard ${client.shard.ids[0]}] All modules executed.`);
}

let { walk } = require('./functions/walk.js');
let mods = [];

let load1 = () => {
    // Get all files in modules/*
    walk(`${__dirname}/modules`, function(err, results) {
        if (err) throw err;
        if (typeof results != 'object') {
            console.error('Invalid results');
            process.exit(1);
        }
        mods = mods.concat(results);
        load2();
    });
}

let load2 = () => {
    // Get all files in modules/external/*
    walk(`${__dirname}/modules/external_modules`, function(err, results) {
        if (err) throw err;
        if (typeof results != 'object') {
            console.error('Invalid results');
            process.exit(1);
        }
        mods = mods.concat(results);
    });
    
    loadModules(mods);
}

load1();

/* --- [[ To-Do ]] ---
 * - Make reminder list/allow someone to delete a single reminder
 * 
 * --- [[ Done ]] ---
 * - Make ban command actually support temp banning
 * - Copy/paste ban.js and make kick command
 * - Fucking finish the help command
 * - Changeable prefix
 * - Volume command
 * - Seeking
 * - Spotify support
 * - Port old commands
 */


// Professional error handling
client.on('error', console.warn);
//process.on('uncaughtException', console.warn);
//process.on('unhandledRejection', console.warn);


// Destroy client when SIGINT
process.on('SIGINT', async () => {
    process.stdin.resume(); // Don't exit immediately
    
    console.log('\nSIGINT received.');
    
    try {
        await client.destroy();
    } catch(e) {
        console.log('Failed to destroy client');
        process.exit();
    }
    
    console.log('Logged out client, exiting.');
    process.exit();
});

client.on('error', console.warn);

let handleCrash = async (error, isRejection) => {
    process.stdin.resume();
    if (error == 'DiscordAPIError: Unknown Message' || error.message == 'DiscordAPIError: Unknown Message') return; // discord.js is borked
    
    const timestamp = new Date();
    const errLog = `--- Crash log - Uncaught ${isRejection ? 'Promise Rejection' : 'Exception'} ---\n`
    + `${error} - ${timestamp.toUTCString()}\n\n`
    + `${error.stack}\n\n`
    + `--- End of stack trace ---\n\n`;
    
    let filename = `error-logs/${timestamp.getDate()}-${timestamp.getMonth() + 1}_`
        + `${timestamp.getHours()}-${timestamp.getMinutes()}-${timestamp.getSeconds()}-`
        + `${isRejection ? 'rejection' : 'exception'}.log`;
    
    fs.writeFileSync(filename, errLog);
    console.log(`--- Uncaught ${isRejection ? 'Promise Rejection' : 'Exception'} ---\n`);
    console.trace(error);
    console.log(`\nError has been dumped to ${filename}`);
    try {
        await require('./functions/logging').log(isRejection ? 'Unhandled Promise Rejection' : 'Unhandled Exception',
        `\`\`\`js\n${errLog.substr(0, 1900).replace('```', '\\`\\`\\`')}\`\`\`\n\`Error log has been dumped to ${filename}\``, true);
    } catch(e) {}
    console.log(`--- Exiting ---`);
    setTimeout(() => process.exit(1), 2000);
}
process.on('uncaughtException', e => handleCrash(e, false));
process.on('exit', (reason) => reason && reason.stack && handleCrash(reason, false));
//process.on('unhandledRejection', (reason) => handleCrash(new Error(reason), true));
