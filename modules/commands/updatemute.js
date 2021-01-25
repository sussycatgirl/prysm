const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');

const Enmap = require('enmap');
const { getPrefix } = require('../../functions/getPrefix');
const muteroles = new Enmap({ name: 'muteroles', polling: true, fetchAll: true });

module.exports.name         = 'updatemuterole';
module.exports.aliases      = ['updatemute'];
module.exports.description  = 'Updates permision overrides for the \'Muted\' role.';
module.exports.syntax       = '';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_CHANNELS', 'MANAGE_ROLES'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    let guild = message.guild;
    let channel = message.channel;
    let role = guild.roles.cache.get(muteroles.get(guild.id));
    if (!role) {
        message.channel.send('No muted role found, creating one...');
        require('./mute').generateRole(message.guild, message.channel);
    }
    else {

        let infomsg = await channel.send('Updating role...');
        muteroles.set(guild.id, role.id);

        infomsg.edit('Updating permission overrides...');

        // Set permission overwrites for every channel
        let failed = [];
        guild.channels.cache
        .filter(c => c.type != 'store')
        .forEach(c => {
            if (!c.manageable) failed.push(c.name);
            else {
                c.updateOverwrite(role, {
                    SEND_MESSAGES: false,
                    ADD_REACTIONS: false,
                    CONNECT: false
                }, 'Update permission overrides for muted role')
                .catch(e => {
                    failed.push(c.name);
                    console.error(e);
                });
            }
        });

        let m = failed.length ? `I failed to set permissions for \`@${role.name}\` in the following channel${failed.length > 1 ? 's:\n' : ': '}\`${failed.join(',\n')}\`\n\nGive Prysm permissions to manage that channel and run ${getPrefix(guild)}updatemute` : 'Muted role updated!';
        if (m.length > 2000) m = m.substring(0, 1994) + '[...]';
        infomsg.edit(m, {disableMentions: "all"});
    }
}
