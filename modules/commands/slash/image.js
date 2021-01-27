const { SlashCommand } = require('../../bot/slashCommands');
const Discord = require('discord.js');
const { client } = require('../../../bot');

const images = require('../image').db;

/**
 * 
 * @param {SlashCommand} cmd 
 */
module.exports.execute = async (cmd, callback) => {
    try {
        const imgname = cmd.data.options.find(d => d.name == 'image');
        if (!imgname) throw 'Missing \'image\' argument';
        
        if (imgname.value == 'list') {
            let imgs = images.get(cmd.member.user.id);
            let count;
            if (imgs) count = Object.keys(imgs).length;
            if (!imgs || count == 0) return callback('You don\'t have any saved images.', true);
            
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
            
            callback(embed);
            return;
        }
        i = images.get(cmd.member.user.id);
        if (!i || !i[imgname.value]) return callback(`<@${cmd.member.user.id}>: Could not find that image.`);
        i = i[imgname.value];
        
        if (!cmd.botIsGuildMember) return callback(i);
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
                .catch(e => callback('Failed to send: ' + e, true));
                callback(false);
            } else {
                callback(i);
            }
        }
    } catch(e) {
        console.error(e);
        callback('' + e);
    }
}

module.exports.sendConfirmation = 'callback';
module.exports.requireGuildMember = false;