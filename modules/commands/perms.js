const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { getUserFromMention } = require('../../functions/getMention');
const getGuildSettings = require('../../functions/getGuildSettings');

module.exports.name         = 'perms';
module.exports.aliases      = ['permissions'];
module.exports.description  = 'Tells you which permissions you have.';
module.exports.syntax       = 'perms [User]';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    if (getGuildSettings.get(message.guild, 'general.restrictPermsCMD') && !message.member.permissions.has('MANAGE_ROLES'))
        return message.channel.send('You can\'t use this command here.');
    
    const target = await message.guild.members.fetch(getUserFromMention(args[0] || '') || message.author);
    
    const embed = new Discord.MessageEmbed()
        .setAuthor(`Permissions for ${target.user.username}`, target.user.displayAvatarURL({ dynamic: true }));
    
    if (message.guild.ownerID == target.id) {
        embed.setDescription('✅ Server Owner');
    }
    else if (target.permissions.has("ADMINISTRATOR")) {
        embed.setDescription('✅ Administrator');
    } else {
        const aliases = {
            'ADMINISTRATOR':            'Administrator',
            'VIEW_AUDIT_LOG':           'View audit log',
            'VIEW_GUILD_INSIGHTS':      'View server insights',
            'MANAGE_GUILD':             'Manage guild',
            'MANAGE_ROLES':             'Manage roles',
            'KICK_MEMBERS':             'Kick members',
            'BAN_MEMBERS':              'Ban members',
            'CREATE_INSTANT_INVITE':    'Create invite',
            'CHANGE_NICKNAME':          'Change nickname',
            'MANAGE_NICKNAMES':         'Manage nicknames',
            'MANAGE_EMOJIS':            'Manage emojis',
            'MANAGE_WEBHOOKS':          'Manage webhooks',
            
            'VIEW_CHANNEL':             'Read messages',
            'SEND_MESSAGES':            'Send messages',
            'SEND_TTS_MESSAGES':        'Send TTS messages',
            'MANAGE_MESSAGES':          'Manage messages',
            'EMBED_LINKS':              'Embed links',
            'ATTACH_FILES':             'Attach files',
            'READ_MESSAGE_HISTORY':     'Read message history',
            'MENTION_EVERYONE':         'Mention everyone',
            'USE_EXTERNAL_EMOJIS':      'Use external emojis',
            'ADD_REACTIONS':            'Add reactions',

            'CONNECT':                  'Connect',
            'SPEAK':                    'Speak',
            'STREAM':                   'Stream',
            'MUTE_MEMBERS':             'Mute members',
            'DEAFEN_MEMBERS':           'Deafen members',
            'MOVE_MEMBERS':             'Move members',
            'USE_VAD':                  'Use voice activity',
            'PRIORITY_SPEAKER':         'Priority speaker'
        }
        
        let generalPerms = '';
        let textPerms = '';
        let voicePerms = '';
        ['ADMINISTRATOR', 'VIEW_AUDIT_LOG', 'VIEW_GUILD_INSIGHTS', 'MANAGE_GUILD', 'MANAGE_ROLES', 'KICK_MEMBERS', 'BAN_MEMBERS', 'CREATE_INSTANT_INVITE',
        'CHANGE_NICKNAME', 'MANAGE_NICKNAMES', 'MANAGE_EMOJIS', 'MANAGE_WEBHOOKS']
        .forEach(perm => {
            generalPerms += `${target.permissions.has(perm) ? '✅' : '❌'} ${aliases[perm]}\n`;
        });
        ['VIEW_CHANNEL', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY',
        'MENTION_EVERYONE', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS']
        .forEach(perm => {
            textPerms += `${target.permissions.has(perm) ? '✅' : '❌'} ${aliases[perm]}\n`;
        });
        ['CONNECT', 'SPEAK', 'STREAM', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'USE_VAD', 'PRIORITY_SPEAKER']
        .forEach(perm => {
            voicePerms += `${target.permissions.has(perm) ? '✅' : '❌'} ${aliases[perm]}\n`;
        });
        embed.addField('General permissions', generalPerms, true);
        embed.addField('Text permissions', textPerms, true);
        embed.addField('Voice permissions', voicePerms, true);
    }
    message.channel.send(embed);
}