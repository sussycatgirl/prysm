const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const axios = require('axios').default;

const appIDs = {
    youtube:    '755600276941176913',
    poker:      '755827207812677713',
    betrayal:   '773336526917861400',
    fishing:    '814288819477020702',
}

/**
 * Credits go to https://github.com/RemyK888/discord-together
 * I didn't feel like adding another dependency
 * because npm is a slow piece of shit, so I
 * just yoinked the code. Thanks, RemyK888
 */

module.exports.name         = 'activities';
module.exports.aliases      = ['games', 'game'];
module.exports.description  = 'Start a game or YouTube session in VC';
module.exports.syntax       = 'activities';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'CREATE_INSTANT_INVITE'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    let vc = message.member.voice?.channel;
    if (!vc)
        return message.channel.send('You\'re not in a voice channel.');
    
    if (!vc.permissionsFor(message.guild.me).has('CREATE_INSTANT_INVITE'))
        return message.channel.send(`I don\'t have permission to create invites in <#${vc.id}>.`)
    
    let embed = new Discord.MessageEmbed()
        .setAuthor('Start VC activities')
        .setDescription(`Start one of the following activities in <#${vc.id}>\n\n`
            + `${db.clientCache.customEmojis.loading} Fetching invites...`)
            .setColor('2F3136');
    
    let msg = message.channel.send(embed);
    
    Promise.allSettled([
        await createInvite(appIDs.betrayal, vc),
        await createInvite(appIDs.fishing,  vc),
        await createInvite(appIDs.poker,    vc),
        await createInvite(appIDs.youtube,  vc),
    ]).then(invites => {
        embed.setDescription(`Start one of the following activities in <#${vc.id}>\n\n`);
        
        /* This is stupid */
        invites[0].appName = 'Betrayal';    invites[0].emoji = '<:betrayal:842127016269971496>';
        invites[1].appName = 'Fishing';     invites[1].emoji = '<:fishington:842127016076509210>';
        invites[2].appName = 'Poker';       invites[2].emoji = '<:poker:842127016308506624>';
        invites[3].appName = 'YouTube';     invites[3].emoji = '<:youtube:842127016294612992>';
        
        invites.forEach(invite => {
            if (invite.status != 'fulfilled') {
                embed.description += `${invite.emoji} **Failed to fetch** ${invite.appName}` + (invite.reason ? ` (${invite.reason})\n` : '\n');
            } else {
                embed.description += `${invite.emoji} **[Create](${invite.value})** ${invite.appName}\n`;
            }
        });
        
        msg.then(msg => msg.edit(embed));
    });
}

/**
 * @param {String} appId
 * @param {Discord.VoiceChannel} channel
 */
let createInvite = (appId, channel) =>  new Promise(async (resolve, reject) => {
    axios.post(`https://discord.com/api/v8/channels/${channel.id}/invites`, {
        max_age: 86400,
        max_uses: 0,
        target_application_id: appId,
        target_type: 2,
        temporary: false,
        validate: null
    }, { headers: { 'Authorization': `Bot ${client.token}`, 'Content-Type': 'application/json' } })
    .then(res => {
        let code = res.data?.code;
        if (!code) return reject('No code found in response');
        resolve(`https://discord.com/invite/${code}`);
    })
    .catch(reject);
});