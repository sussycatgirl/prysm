const Discord = require('discord.js');
const client = require('../bot').client;

const checkOverwrites = [
	"ADD_REACTIONS",
	"VIEW_CHANNEL",
	"SEND_MESSAGES",
	"SEND_TTS_MESSAGES",
	"MANAGE_MESSAGES",
	"EMBED_LINKS",
	"ATTACH_FILES",
	"READ_MESSAGE_HISTORY",
	"MENTION_EVERYONE",
	"USE_EXTERNAL_EMOJIS",
]

/**
 * @param {object} command 
 * @param {Discord.Guild} guild
 * @param {Discord.Message} message
 */
module.exports.check = async (command, guild, message) => {

	// Always return true if message was sent in DMs
	if (!guild) return true;

	// Return when the bot can't send messages
	if (!message.channel.permissionsFor(guild.me).has('SEND_MESSAGES')) return false;

	// Permission check happens here - Bot only
    let reqPerms = new Discord.Permissions(0);
    let missingPerms = new Discord.Permissions(0);
	if (command.botPerms == undefined) {reqPerms.add('ADMINISTRATOR'); command.botPerms = ['ADMINISTRATOR']}
    else if (command.botPerms.length == 0) {reqPerms.add('ADMINISTRATOR'); command.botPerms = ['ADMINISTRATOR']}
    
    let bot_member = guild.members.cache.get(client.user.id);

	command.botPerms.forEach(p => {
		const has = message.channel.permissionsFor(bot_member).has(p);
		reqPerms.add(p);
		if (!has) missingPerms.add(p);
	});
	
	let reqPermsStr = '`' + missingPerms.toArray().join('`, `') + '`';
	if (message.channel.permissionsFor(bot_member).has(reqPerms) || bot_member.permissions.has('ADMINISTRATOR')) {
        // Bot has the required permission
        return true;
	} else {
		if (bot_member.permissions.has('SEND_MESSAGES') && bot_member.permissions.has('EMBED_LINKS')) {
			
			
			// Bot does not have the required permissions, but can send embeds
			
			let newPerms = new Discord.Permissions(missingPerms.bitfield);
			const integrationRole = message.guild.me.roles.cache.find(role => role.managed && role.id != guild.roles.everyone.id);
			if (integrationRole)
				integrationRole.permissions.toArray().forEach(perm => newPerms.add(perm));
			
			const inviteURL = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands&permissions=${newPerms.bitfield}&guild_id=${guild.id}&disable_guild_select=true`;
			
			let embed = new Discord.MessageEmbed()
			.setDescription(`I am missing the following permissions to execute this command:\n${reqPermsStr}\n`
			+ `Click [here](${inviteURL}) to resolve this issue.`)
			.setColor('ff0000')
            message.channel.send(embed);
			return false;
			
		} else if (bot_member.permissions.has('SEND_MESSAGES')) {

            // Bot does not have the required permissions and can't send embeds
            message.channel.send('I am mising the \'Embed links\' permission to function porperly.');
			return false;

		} else return false;
	}
}