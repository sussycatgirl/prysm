const Discord = require('discord.js');
const client = require('../../bot').client;
const axios = require('axios').default;
const { get: getGuildSettings } = require('../../functions/getGuildSettings');

client.on('message', async message => {
    try {
        if (!message.guild ||
            !getGuildSettings(message.guild, 'censorship.blockStickers') ||
            (
                message.channel.permissionsFor(message.member)?.has('MANAGE_MESSAGES') &&
                getGuildSettings(message.guild, 'censorship.allowStickersForMods'))
            ) return;
        
        // discord.js sticker support when
        // check if message contains no text, and if it does, request full message from api to check for stickers
        if (!message.content) {
            let msg = await axios.get(
                `https://discord.com/api/channels/${message.channel.id}/messages/${message.id}`,
                { headers:
                    {
                        'Authorization': `Bot ${client.token}`
                    }
                }
            ).catch(console.warn);
            
            if (msg.data?.stickers != undefined) {
                if (message.deletable) {
                    message.delete({ reason: 'sticker begone' })
                        .catch(console.warn);
                    
                    message.channel.send(`<@${message.author.id}>, stickers are not allowed here`)
                        .then(m => m.delete({ timeout: 2000 }))
                        .catch(console.warn);
                }
            }
        }
    } catch(e) {
        console.error(e);
    }
});