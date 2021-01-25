const db = require('../bot').db;
const permLevels = require('../permission_levels.json');
const { User } = require('discord.js');

/**
 * Get all flags from [user]
 * @param {User | string} user
 * @returns {Object} The permission flags
 */
module.exports.getFlags = function(user) {
    if (!user) return db.permissionFlags;
    else {
        let f = db.permissionFlags.get(user.id || user);
        if (!f) f = {}
        return f;
    }
}

/**
 * Returns the highest permission level the user has (specified in permission_levels.json)
 * @param {User | string} user
 */
module.exports.getPermissionLevel = function(user) {
    let perms = db.permissionFlags.get(user.id || user);
    if (!perms) return 0;

    let highest = 0;
    Object.keys(perms).forEach(perm => {
        if (permLevels[perm]) {
            if (highest < permLevels[perm]) highest = permLevels[perm];
        }
    });
    return highest;
}

/**
 * Set the flag [flag] for user [user] to value [value]
 * @param {User | string} user 
 * @param {string} flag 
 * @param {string | boolean | number} value 
 */
module.exports.setFlag = function(user, flag, value) {
    db.permissionFlags.set(user.id || user, value, flag.toUpperCase());
    if (Object.keys(db.permissionFlags.get(user.id)).length == 0) db.permissionFlags.delete(user.id);
    return true;
}

/**
 * Delete all permission flags for [user]
 * @param {User | string} user 
 */
module.exports.clearFlags = function(user) {
    db.permissionFlags.delete(user.id || user);
    return true;
}