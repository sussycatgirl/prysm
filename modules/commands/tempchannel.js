const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const Enmap = require('enmap');
const { getPrefix } = require('../../functions/getPrefix');
const tempChannels = new Enmap({ name: 'temp_channels' });
const activeTempChannels = new Enmap({ name: 'temp_channels_active' });

module.exports.name         = 'tempchannel';
module.exports.aliases      = ['tempchannels', 'tempvoice'];
module.exports.description  = 'Create temporary voice channels automatically.';
module.exports.syntax       = 'tempchannel';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'MOVE_MEMBERS', 'MANAGE_CHANNELS'];
module.exports.userPerms    = ['MANAGE_CHANNELS'];

/**
 * @param {Discord.Message} message 
 * @param {Array<string>} args 
 */
module.exports.execute = async (message, args) => {
    if (!message.member.permissions.has('MANAGE_CHANNELS')) {
        return message.channel.send('You don\'t have permission to use this command.');
    }
    
    let guildConfig = tempChannels.get(message.guild.id);
    if (!guildConfig || !(guildConfig instanceof Object)) {
        guildConfig = { channelID: null, enabled: false }
    }
    switch(args[0]?.toLowerCase()) {
        case 'off':
        case 'disable':
            guildConfig.enabled = false;
            tempChannels.set(message.guild.id, guildConfig);
            message.channel.send(new Discord.MessageEmbed().setDescription('Temp channels are now **disabled**'));
        break;
        case 'on':
        case 'set':
        case 'setchannel':
            if (!args[1]) return message.channel.send(`You need to tell tell me which voice channel to use, for example: \n`
            + `\`${getPrefix(message.guild)}tempchannel setchannel ${message.guild.channels.cache.filter(c=>c.type=='voice')?.first()?.name || 'General'}\``);
            
            let channel;
            if (/^[0-9]{18}$/.test(args[1])) {
                channel = message.guild.channels.cache.filter(c => c.type == 'voice').get(args[1]);
            }
            if (!channel) {
                let channelName = args;
                channelName.shift();
                channelName = channelName.join(' ').toLowerCase();
                channel = message.guild.channels.cache.find(c => c.type == 'voice' && c.name.toLowerCase() == channelName);
            }
            if (!channel) return message.channel.send(`I cannot find that channel.`);
            
            guildConfig.channelID = channel.id;
            guildConfig.enabled = true;
            tempChannels.set(message.guild.id, guildConfig);
            message.channel.send(new Discord.MessageEmbed().setDescription(`Status: **${message.guild.me.permissions.has("ADMINISTRATOR") ?
                'enabled' : 'disabled (missing permissions)'}**\nChannel: **<#${channel.id}>**\n\n`
            + (message.guild.me.permissions.has("ADMINISTRATOR") ? '' : 
                `**Warning**: Unless you grant me administrator permissions, I will not create temp channels. `
                + `This is because users would otherwise be able to disallow me from deleting the channel.`)));
        break;
        default:
            let embed = new Discord.MessageEmbed()
                .setAuthor('Temporary voice channels')
                .setColor('2F3136');
            
            if (guildConfig.enabled === true) {
                embed.setDescription(`Status: **${message.guild.me.permissions.has("ADMINISTRATOR") ?
                'enabled' : 'disabled (missing permissions)'}**\n`
                + `Channel: **${(await message.guild.channels.cache.get(guildConfig.channelID)) ? `<#${guildConfig.channelID}>` : '(Deleted)'}**`);
                embed.setFooter(`Run '${getPrefix(message.guild)}tempchannel setchannel' to change the target channel.`);
                
                if (message.guild.mfaLevel > 0) {
                    embed.description += `\n\n**Warning:** Your server requires 2FA for moderators. `
                    + `This prevents users from altering their own channel's settings unless they enabled 2FA on their account.`
                }
                if (!message.guild.me.permissions.has("ADMINISTRATOR")) {
                    embed.description += `\n\n**Warning**: Unless you grant me administrator permissions, I will not create temp channels. `
                    + `This is because users would otherwise be able to disallow me from deleting the channel.`
                }
            } else {
                embed.setDescription('Status: **disabled**');
                embed.setFooter(`Run '${getPrefix(message.guild)}tempchannel setchannel' to enable`);
            }
            
            message.channel.send(embed);
    }
}

/* Event stuff */

// Create and delete channels
client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
        if (oldState.channelID != newState.channelID) {
            if (tempChannels.get(newState.guild?.id)?.enabled && newState.channelID == tempChannels.get(newState.guild?.id)?.channelID) {
                if (!newState.guild.me.permissions.has('ADMINISTRATOR')) return;
                if (newState.member.user.bot) return;
                
                let channel = newState.guild.channels.cache.get(newState.channelID);
                
                let cID = activeTempChannels.get(newState.guild.id)?.[newState.member.id];
                if (!cID ||
                    !newState.guild.channels.cache.get(cID) ||
                    newState.guild.channels.cache.get(cID).deleted
                ) {
                    let newChannel = await newState.guild.channels.create(`⏳ [${newState.member.user.username}]`, {
                        type: 'voice',
                        parent: channel.parent,
                        reason: 'Create temp channel',
                        permissionOverwrites: [
                            {
                                id: newState.member.id,
                                type: 'member',
                                allow: new Discord.Permissions(858784792) // manage channel, manage permissions, and a few administrative voice permissions
                            },
                            {
                                id: newState.guild.roles.everyone.id,
                                type: 'role',
                                allow: new Discord.Permissions(536870912) // manage webhooks permission to allow anyone to see the channel's settings
                            }
                        ]
                    });
                    
                    let active = activeTempChannels.get(newState.guild.id);
                    if (!(active instanceof Object)) active = {};
                    active[newState.member.id] = newChannel.id;
                    activeTempChannels.set(newState.guild.id, active);
                    
                    newState.member.voice.setChannel(newChannel).catch(console.warn);
                }
                else {
                    let newChannel = newState.guild.channels.cache.get(cID);
                    newState.member.voice.setChannel(newChannel).catch(console.warn);
                }
            } else if (Object.entries(activeTempChannels.get(newState.guild.id) ?? {}).find(([userID, channelID]) => channelID == oldState.channelID)) {
                // Delete empty channels
                if (!oldState.channel.deleted && oldState.channel.members.size == 0 && oldState.channel.deletable) {
                    oldState.channel.delete('Remove empty temp channel').catch(console.warn);
                }
            }
        }
    } catch(e) {
        console.warn(e);
    }
});

// Force temp channel names to start with ⏳
client.on('channelUpdate', async (oldChannel, newChannel) => {
    try {
        if (newChannel.type != 'voice') return;
        if (newChannel.guild?.me.permissions.has('ADMINISTRATOR') &&
            Object.entries(activeTempChannels.get(newChannel.guild.id) ?? {}).find(([userID, channelID]) => channelID == newChannel.id)) {
                newChannel = await client.channels.fetch(newChannel.id);
                if (newChannel.manageable && !newChannel.name.startsWith('⏳')) {
                    newChannel.setName(`⏳ ${newChannel.name?.trim()}`).catch(console.warn);
                }
        }
    } catch(e) {
        console.warn(e);
    }
});
