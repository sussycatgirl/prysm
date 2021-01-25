const { client, db } = require('../bot');
const guildSettingsDB = db.guildSettings;
const { Guild } = require('discord.js');

const defaultSettings = require('../modules/commands/settings').settingPages;

module.exports = {
    /**
     * Returns a specific guild setting.
     * @param {string | Guild} guild The guild to get the setting for
     * @param {string} key The wanted setting. Format: 'key' or 'category.key'
     * @returns {string | number | boolean} The value of the requested key. Returns the default value if key is not set
     */
    get(guild, key) {
        if (!guild) throw 'No guild specified'
        if (!key) throw 'No key specified'
        if (typeof guild != 'object') guild = client.guilds.cache.get(guild);
        if (!guild) throw 'Cannot find guild'

        let keys = key.split(".");
        if (keys.length > 2) throw 'there are no subcategories dumbass'

        let category = null;
        if (keys.length == 2) {
            category = keys[0];
            key = keys[1];
        } else key = keys[0];
        
        if ((category ? defaultSettings[category][key] : defaultSettings[key]) == undefined) throw 'Key not found'

        let guildSettings = guildSettingsDB.get(guild.id);

        if (!guildSettings) return category ? defaultSettings[category][key] : defaultSettings[key]
        if ( category && guildSettings[category] == undefined)      return defaultSettings[category][key]
        if ( category && guildSettings[category][key] == undefined) return defaultSettings[category][key]
        if (!category && guildSettings[key] == undefined)           return defaultSettings[key]
        return category ? guildSettings[category][key] : guildSettings[key]
    }
}