const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { getUserFromMention } = require('../../functions/getMention');
const { getPrefix } = require('../../functions/getPrefix');
const { autoRoles } = require('../commands/autoroles');

module.exports.name         = 'setup';
module.exports.aliases      = [];
module.exports.description  = 'Set up and configure the bot';
module.exports.syntax       = 'setup';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'USE_EXTERNAL_EMOJIS'];
module.exports.userPerms    = ['MANAGE_GUILD'];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    try {
        if (!message.member.permissions.has('MANAGE_GUILD')) return message.channel.send('You need manage guild permission for this.');
        
        //message.channel.send(
        //    new Discord.MessageEmbed()
        //    .setTitle('Prysm - Setup')
        //    .setDescription('Warning: This setup doesn\'t actually work yet!\nRunning this doesn\'t change any settings!')
        //    .setColor('ff0000')
        //);
        
        //let sysChannelID;
        let newPrefix;
        let prefixAcceptSpace;
        //if (await question('Do you want to set up a channel for system messages?', 'yesno')) {
        //    sysChannelID = await question('Which channel do you want to receive these messages in?\n' + 
        //    'This channel should ideally only be visible to moderators/admins.', 'channel');
        //}
        
        if (await question(`Do you want to change the current prefix (\`${getPrefix(message.guild)}\`)?`, 'yesno')) {
            let passed = false;
            while (!passed) {
                let p = await question('What do you want the new prefix to be?', 'text');
                if (p.length > 30) message.channel.send('The prefix needs to be shorter than 30 characters.');
                else {
                    passed = true;
                    newPrefix = p;
                    prefixAcceptSpace = newPrefix.match(/^[^a-zA-Z0-9]+$/) ? false : true;
                    
                    let guildSettings = db.guildSettings.get(message.guild.id);
                    if (!guildSettings['general']) guildSettings['general'] = {}
                    guildSettings['general']['prefix'] = newPrefix;
                    guildSettings['general']['acceptSpaceAfterPrefix'] = prefixAcceptSpace;
                    db.guildSettings.set(message.guild.id, guildSettings);
                    
                    message.channel.send(
                        new Discord.MessageEmbed()
                        .setTitle('Prefix changed!')
                        .setDescription(`You changed the prefix to \`${newPrefix}\`. ` +
                        `\`Reset it with ${newPrefix}${prefixAcceptSpace ? ' ' : ''}prefix reset\`.\n` + 
                        `You can also invoke commands by @mentioning me, e.g. '<@${client.user.id}> help'.`)
                    );
                }
            }
        }
        
        if (message.member.permissions.has('MANAGE_ROLES')) {
            if (await question('Do you want to set up automatic roles for new users?', 'yesno')) {
                if (autoRoles.get(message.guild.id) instanceof Array && autoRoles.get(message.guild.id).length > 0) {
                    message.channel.send(new Discord.MessageEmbed()
                        .setTitle('Prysm - Setup')
                        .setDescription('Seems like autoroles have already been set up.\n'
                        + `Use \`${getPrefix(message.guild)}autoroles\` to configure.`));
                } else {
                    let role = await question('Which role do you want to give to new members?', 'role');
                    message.channel.send(new Discord.MessageEmbed().setDescription(`<@&${role}> will be given to new members.`));
                }
            }
        } else {
            message.channel.send(new Discord.MessageEmbed()
            .setTitle('Prysm - Setup')
            .setDescription('~~Do you want to set up join/leave messages and autoroles?~~\n'
            + 'You are lacking \'Manage Roles\' permission to configure this.')
            .setFooter(`Ask someone with permission to manage roles to set this up using '${getPrefix(message.guild.id)}autoroles'.`));
        }
        
        //if (await question('Do you want to configure welcome messages?', 'yesno')) {
        //    message.channel.send('too fucking bad');
        //}
        
        
        
        message.channel.send(
            new Discord.MessageEmbed()
            .setTitle('Prysm - Setup')
            .setDescription(`That's it! You're ready to go. Please note that this bot is still in development, `
                + `so if you encounter any issues feel free to use \`${getPrefix(message.guild)}feedback\` `
                + `or join [our server](https://discord.gg/aTRHKUY "Click to open")!`)
        );
        
        
        
        /**
         * 
         * @param {string} question 
         * @param {'yesno'|'channel'|'role'|'text'} replyType 
         */
        async function question(question, replyType) {
            return new Promise(async (resolve, reject) => {
                let replyWith = '';
                switch(replyType) {
                    case 'yesno':
                        replyWith = 'Please respond with \'yes\' or \'no\'.';
                    break;
                    case 'channel':
                        replyWith = 'Please respond with a #channel.';
                    break;
                    case 'role':
                        replyWith = 'Please respond with a @role mention or role ID.';
                    break;
                    case 'text':
                        replyWith = 'Please type your response.';
                    break;
                    default:
                        throw 'Invalid replyType';
                }
                
                let embed = new Discord.MessageEmbed()
                    .setTitle('Prysm - Setup')
                    .setDescription(question)
                    .setFooter(replyWith + '\nTo cancel, type \'exit\'');
                
                message.channel.send(embed);
                
                let collector = message.channel.createMessageCollector(m => m.author.id == message.author.id, { time: 300000 });
                collector.on('collect', async (collected) => {
                    let content = collected.content.toLowerCase();
                    let resData = null;
                    
                    if (content == 'exit') {
                        collector.stop();
                        message.channel.send('Stopped.');
                        return;
                    }
                    
                    switch(replyType) {
                        case 'yesno':
                            switch(content) {
                                case 'yes':
                                case 'true':
                                case 'y':
                                    resData = true;
                                break;
                                case 'no':
                                case 'false':
                                case 'n':
                                    resData = false;
                                break;
                            }
                        break;
                        
                        case 'channel':
                            // pain
                            if (/<(#\d+)>/.test(content)) {
                                let cID = content.split('<#')[1].split('>')[0];
                                if (message.guild.channels.cache.get(cID)) resData = cID;
                            }
                        break;
                        case 'role':
                            let roleID = getUserFromMention(content || '', true);
                            if (roleID && (await message.guild.roles.fetch(roleID))) resData = roleID;
                        break;
                        case 'text':
                            if (content.length <= 500) 
                                resData = content;
                        break;
                    }
                    
                    if (resData !== null && resData !== '') {
                        collector.stop();
                        resolve(resData);
                        try {
                            collected.react('👍');
                        } catch(e) { console.error(e) }
                    } else {
                        message.channel.send(replyWith);
                    }
                });
            });
        }
    } catch(e) {
        console.error(e);
        message.channel.send('' + e);
    }
}
