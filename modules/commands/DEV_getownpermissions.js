const { getPermissionLevel, getFlags } = require('../../functions/permission_flags');

/**
 * This command allows users to see their own flags and permission level.
 */

module.exports = {
    name: 'getownpermissions',
    aliases: ["getownperms", "ownperms"],
    flag: 0,
    execute(message, args) {
        let msg = '';
        msg += `Your permission level is \`${getPermissionLevel(message.author)}\`.`;
        
        let flags = getFlags(message.author);
        if (flags) {
            msg += `\nYou have the following flags:`;
            Object.keys(flags).forEach(flag => {
                msg += `\n\`${flag}: ${flags[flag]}\``;
            });
        } else msg += `\nYou don't have any flags set.`;

        message.channel.send(msg);
    }
}

module.exports.devCommand = true;