const { Guild } = require("discord.js");
const config = require("../config.json");
const db = require('../bot').db;
const client = require('../bot').client;

/** @param {string | Guild | undefined} guild The guild to get the prefix from. (Needs to be on the same shard) 
 */
module.exports.getPrefix = function(guild) {
    if (typeof guild == 'string') guild = client.guilds.cache.get(guild);
    if (!guild) return require('../modules/core/login').testingMode ? config.testPrefix : config.prefix;

    let guildSettings = db.guildSettings.get(guild.id);
    if (!guildSettings) guildSettings = {}
    let prefix;
    if (guildSettings.general && guildSettings.general.prefix) prefix = guildSettings.general.prefix;

    // Return the prefix (or the testing prefix, if the test account is being used)
    if (!prefix) return require('../modules/core/login').testingMode ? config.testPrefix : config.prefix;
    else {
        return prefix;
    }
}