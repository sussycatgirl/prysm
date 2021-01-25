const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const Enmap = require('enmap');
const { getPrefix } = require('../../functions/getPrefix');
const { getUserFromMention } = require('../../functions/getMention');
const autoRoles = new Enmap('autoroles');

module.exports.name         = 'autoroles';
module.exports.aliases      = ['autorole', 'joinroles', 'joinrole'];
module.exports.description  = 'Sets role(s) that will be given to every new member.';
module.exports.syntax       = 'autoroles help';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'];
module.exports.userPerms    = ['MANAGE_ROLES'];

/**
 * @param {Discord.Message} message 
 * @param {Array<string>} args 
 */
module.exports.execute = async (message, args) => {
    if (!message.member.permissions.has('MANAGE_ROLES')) {
        message.channel.send('You are not permitted to use this command.');
        return;
    }
    
    let guildRoles = autoRoles.get(message.guild?.id);
    if (!guildRoles) {
        autoRoles.set(message.guild?.id, []);
        guildRoles = [];
    }
    
    // Validate that all roles still exist
    guildRoles = guildRoles.filter(async roleID => (await message.guild.roles.fetch(roleID)) ? true : false);
    
    let roleID; // switches are cringe
    switch(args[0]?.toLowerCase()) {
        case 'add':
            roleID = getUserFromMention(args[1] || '', true);
            if (roleID) {
                let role = await message.guild.roles.fetch(roleID);
                
                if (!role || role.id == message.guild.roles.everyone?.id)
                    return message.channel.send('I can\'t find that role.');
                
                if (guildRoles.length >= 5)
                    return message.channel.send('You cannot add more than 5 roles.');
                
                if (guildRoles.indexOf(roleID) > -1)
                    return message.channel.send('That role has already been added.');
                
                if (role.comparePositionTo(message.member.roles.highest) >= 0 && message.member.guild.ownerID != message.member.id)
                    return message.channel.send('You can\'t manage that role.');
                
                guildRoles.push(roleID);
                message.channel.send(`\`@${role.name.replace(/\`/g, '\'')}\` has been added!\n`
                    + (role.comparePositionTo(message.guild.me.roles.highest) >= 0 ?
                    'Please note that due to this erver\'s role configuration, I may not be able to give that role to users.'
                    : ''), { disableMentions: 'all' });
                
                autoRoles.set(message.guild.id, guildRoles);
            } else {
                message.channel.send('Please tell me which role to add. Either @mention it or type it\'s ID like this: '
                + `\`${getPrefix(message.guild)}autoroles add ${message.guild.roles.everyone?.id || '702570118982402058'}\``)
            }
        break;

        case 'remove':
            roleID = getUserFromMention(args[1] || '', true);
            if (roleID) {
                let role = await message.guild.roles.fetch(roleID);
                
                if (!role || role.id == message.guild.roles.everyone?.id)
                    return message.channel.send('I can\'t find that role.');
                
                if (role.comparePositionTo(message.member.roles.highest) >= 0 && message.member.guild.ownerID != message.member.id)
                    return message.channel.send('You can\'t manage that role.');
                
                let index = guildRoles.indexOf(roleID);
                if (index == -1)
                    return message.channel.send(`\`@${role.name.replace(/\`/g, '\'')}\` is not on the list.`);
                
                guildRoles.splice(index, 1);
                message.channel.send(`\`@${role.name.replace(/\`/g, '\'')}\` has been removed!`);
                autoRoles.set(message.guild.id, guildRoles);
            }
        break;

        default:
            let embed = new Discord.MessageEmbed()
                .setAuthor(`${guildRoles.length || 0}/5 Autoroles`)
                .setFooter(`Use '${getPrefix(message.guild.id)}autoroles add' to add a role `
                    + `or '${getPrefix(message.guild.id)}autoroles remove' to remove a role.`)
                .setColor('2F3136');
            
            if (guildRoles.length > 0) {
                embed.setDescription(`<@&${guildRoles.join('>\n<@&')}>`)
            } else {
                embed.setDescription(`No roles added yet.`);
            }
            
            message.channel.send(embed);
        break;
    }
}

module.exports.autoRoles = autoRoles;