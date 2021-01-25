const data = require('../../bot');
const client = data.client;

const { getFlags, setFlag, clearFlags } = require('../../functions/permission_flags');
const { log } = require('../../functions/logging');
const permissionFlags = require('../../permission_levels.json');

module.exports = {
    name: 'setpermissions',
    aliases: ["setperms", "setperm", "setflag"],
    flag: 1000,
    execute(message, args) {
        let mention = message.mentions.users.first();
        let target;
        
        if (mention) {
            target = mention;
            cont();
        }
        else if (args[0]) {
            client.users.fetch(args[0], true).then(user => {
                target = user;
                cont();
            }).catch(e => {
                if (!isNaN(args[0])) {
                    return message.channel.send('Can\'t set flags for this user: User not found.');
                } else {
                    return message.channel.send('The provided user ID is not valid.');
                }
            });
        } else return message.channel.send('Error: No user provided.');

        function cont() {
            if (target.bot) return message.channel.send('Can\'t set permission flags for bots.');
            if (args[1] == 'CLEAR' ||args[1] == 'RESET') {
                message.channel.send('Clearing all permission flags for that user.');
                clearFlags(target);
                log('Permission flags cleared', `Cleared permission flags for ${target.id || target} <@${target.id || target}>\nExecuted by ${message.author.id} <@${message.author.id}>`, true)
            }
            else if (args[1] && args[2]) {
                // Check if author is allowed to change the flag
                let highest = 0;
                let userFlags = getFlags(message.author);
                if (!userFlags) userFlags = {}
                Object.keys(userFlags).forEach(flag => {
                    if (userFlags[flag]) {
                        if (permissionFlags[flag] && message.author.id != data.db.botOwner.id) if (permissionFlags[flag] > highest) highest = permissionFlags[flag];
                    }
                });
                if (permissionFlags[args[1].toUpperCase()] >= highest && message.author.id != data.db.botOwner.id) {
                    log('Permission flag update failed', `Failed to update flag '${args[1].toUpperCase()}' for ${target.id || target} <@${target.id || target}>:\nThe author has a lower permission level than the target flag (${permissionFlags[args[1].toUpperCase()]} > ${highest})`)
                    return message.channel.send('You are not permitted to change this flag');
                }

                // Update the flag
                if (!isNaN(args[2])) args[2] = Number(args[2]);
                if (args[2] == 'true') args[2] = true;
                if (args[2] == 'false') args[2] = false;
                if (args[2] == 'undefined' || args[2] == 'clear') args[2] = undefined;
                setFlag(target, args[1].toUpperCase(), args[2]);
                log('Permission flags updated', `Permission flag '${args[1].toUpperCase()}' was set to ${args[2]} for user ${target.id || target} <@${target.id || target}>\nExecuted by ${message.author.id} <@${message.author.id}>`)
                message.channel.send('Permission flag updated.');
            } else {
                if (!args[1]) return message.channel.send('No permission flag provided');
                if (!args[2]) return message.channel.send('No value provided');
            }
        }
    }
}

module.exports.devCommand = true;