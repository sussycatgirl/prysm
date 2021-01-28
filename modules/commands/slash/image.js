const { SlashCommand } = require('../../bot/slashCommands');
const Discord = require('discord.js');
const { InteractionResponseType: resType } = require('discord-interactions');
const { client } = require('../../../bot');

const images = require('../image').db;

/**
 * 
 * @param {SlashCommand} cmd
 * @param {function(String, Discord.MessageEmbed | false, resType, boolean) : void} callback
 */
module.exports.execute = async (cmd, callback) => {
    try {
        const imgname = cmd.data.options.find(d => d.name == 'image');
        if (!imgname) throw 'Missing \'image\' argument';
        
        if (imgname.value == 'list') {
            let imgs = images.get(cmd.member.user.id);
            let count;
            if (imgs) count = Object.keys(imgs).length;
            if (!imgs || count == 0) return callback('You don\'t have any saved images.', false, resType.CHANNEL_MESSAGE, true);
            
            let embed = new Discord.MessageEmbed()
                .setTitle(`${count} image${count != 1 ? 's' : ''}`)
                .setColor(0x2f3136);
            
            let i = 0;
            
            Object.entries(imgs).forEach(([key, value]) => {
                i += 1;
                if (i <= 25) {
                    embed.addField(key, `[View image](${value})`, Object.keys(imgs).length > 3);
                } else embed.setFooter('Only the first 25 entries are shown.');
            });
            
            callback(null, embed, resType.CHANNEL_MESSAGE_WITH_SOURCE, false);
            return;
        }
        i = images.get(cmd.member.user.id);
        if (!i || !i[imgname.value]) return callback(`Could not find '${imgname.value}'.`, null, resType.CHANNEL_MESSAGE, true);
        i = i[imgname.value];
        
        if (!cmd.botIsGuildMember) return callback(i, false, resType.CHANNEL_MESSAGE_WITH_SOURCE, false);
        else {
            const guild = await client.guilds.fetch(cmd.guild_id);
            if (!guild) throw 'Unable to fetch guild';
            const channel = guild.channels.cache.get(cmd.channel_id);
            
            if (channel.permissionsFor(guild.me).has('MANAGE_WEBHOOKS')) {
                let webhooks = (await channel.fetchWebhooks()).filter(hook => hook.type.toLowerCase() == 'incoming');
                let webhook;
                if (!webhooks || webhooks.size == 0) webhook = await channel.createWebhook('Prysm', {avatar: client.user.avatarURL()});
                else webhook = webhooks.first();
                webhook.send({ files: [i], username: cmd.member.displayName, avatarURL: cmd.member.user.displayAvatarURL() })
                .catch(e => callback('Failed to send: ' + e, false, resType.CHANNEL_MESSAGE, true));
                callback();
            } else {
                callback(i);
            }
        }
    } catch(e) {
        console.error(e);
        callback('' + e, null, resType.CHANNEL_MESSAGE, true);
    }
}

module.exports.sendConfirmation = 'callback';
module.exports.requireGuildMember = false;