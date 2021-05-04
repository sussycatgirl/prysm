/**
 * Watches for when someone says "shitcord",
 * then replies with the Discord API status
 * if an outage is detected.
 */

const axios = require('axios').default;
const { MessageEmbed } = require('discord.js');
const { client } = require('../../bot');

let last_cache_api_status = 0;
let api_status_cache = {}
let send_status_cooldown = {}

let fetch_api_status = () => new Promise((resolve, reject) => {
    if (last_cache_api_status > Date.now() - (1000 * 60)) {
        return resolve(api_status_cache);
    }
    
    console.log('Fetching Discord API status');
    last_cache_api_status = Date.now();
    const summary = axios.get('https://srhpyqt94yxb.statuspage.io/api/v2/summary.json');
    const responseTime = axios.get('https://discordstatus.com/metrics-display/5k2rt9f7pmny/day.json');
    
    Promise.all([ summary, responseTime ])
        .catch(reject)
        .then(res => {
            api_status_cache = { summary: res[0]?.data, responseTime: res[1]?.data }
            resolve(api_status_cache);
        });
});

client.on('message', async message => {
    if (message.channel.type == 'text' &&
        message.channel.permissionsFor(message.guild.me).has('SEND_MESSAGES') &&
        message.channel.permissionsFor(message.guild.me).has('READ_MESSAGES') &&
        message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS')
    ) {
        // Ensure this is only sent once every 10 minutes
        if (send_status_cooldown[message.channel.id] || send_status_cooldown[message.channel.id] < Date.now() - (1000 * 60 * 10)) return;
        
        let keywords = message.content?.toLowerCase().match(/(shitcord)|(pisscord)/gi);
        if (message.content && !message.author.bot && keywords?.length > 0) {
            try {
                const { summary, responseTime } = await fetch_api_status();
                
                let ping = Math.floor(responseTime?.summary?.mean) || 'Unknown ';
                
                if (summary?.status?.indicator != 'none') {
                    send_status_cooldown[message.channel.id] = Date.now();
                    
                    let embed = new MessageEmbed()
                        .setAuthor(summary?.status?.description)
                        .setColor(summary?.status?.indicator == 'minor' ? 'ffbf00' : summary?.status?.indicator == 'major' ? 'ff2600' : 'a70000')
                        .setDescription(`Discord is currently experiencing a ${summary?.status?.indicator} server outage. \n`
                            + `[View details](https://discordstatus.com/) | ${ping}ms response time`)
                        .setFooter(`Triggered by keyword: ${keywords[0]}`)
                    
                    // doesn't seem like discord.js lets me use inline replies yet
                    axios.post(`https://discord.com/api/v8/channels/${message.channel.id}/messages`, {
                        embed: embed,
                        message_reference: {
                            message_id: message.id,
                            guild_id: message.guild.id
                        },
                        allowed_mentions: {
                            replied_user: false
                        }
                    }, {
                        headers: {
                            'Authorization': `Bot ${client.token}`
                        }
                    })
                }
            } catch(e) {
                console.error(e);
            }
        }
    }
});