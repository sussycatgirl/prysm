const Discord = require('discord.js');
const client = require('../bot').client;
const { log } = require('./logging.js');

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
module.exports.check = function(command, guild, message) {
    // Old, re-used code, not fancy but it does the job
	
	// Logs an error when a command uses "old" variable names
	if (command.perms && !command.reqPerms) {
		log('Command update required', `Command ${command.name} is using 'perms' instead of 'botPerms'.`);
		message.channel.send('Sorry, this command is misconfigured. Please contact a developer.');
		return false;
	}

	// Always return true if message was sent in DMs
	if (!guild) return true;

	// Permission check happens here - Bot only
    let reqPerms = new Discord.Permissions(0);
	let reqPermsStr = '';
	if (command.botPerms == undefined) {reqPerms.add('ADMINISTRATOR'); command.botPerms = ['ADMINISTRATOR']}
    else if (command.botPerms.length == 0) {reqPerms.add('ADMINISTRATOR'); command.botPerms = ['ADMINISTRATOR']}
    
    let bot_member = guild.members.cache.get(client.user.id);

	command.botPerms.forEach(p => {
		function check() {if (message.channel.permissionsFor(bot_member).has(p)) return '✅ '; else return '❌ '}
		reqPerms.add(p);
		reqPermsStr = reqPermsStr + check() + '`' + p + '`\n';
	});

	if (message.channel.permissionsFor(bot_member).has(reqPerms) || bot_member.permissions.has('ADMINISTRATOR')) {
        // Bot has the required permission
        return true;
	} else {
		if (bot_member.permissions.has('SEND_MESSAGES') && bot_member.permissions.has('EMBED_LINKS')) {

            // Bot does not have the required permissions, but can send embeds
			let embed = new Discord.MessageEmbed()
			.setTitle('Missing permissions')
			.setDescription(`I require the following permissions to execute this command:\n${reqPermsStr}${!command.guildOnly ? '\n**You can try to run this command in DMs instead.**' : ''}`)
			.setColor('ff0000')
			.setFooter('You need to give these permissions to Prysm if you want to use this command.');
            message.channel.send(embed);
			return false;
			
		} else if (bot_member.permissions.has('SEND_MESSAGES')) {

            // Bot does not have the required permissions and can't send embeds
            message.channel.send('I am mising the \'Embed links\' permission to function porperly.');
			return false;

		} else return false;
	}
}