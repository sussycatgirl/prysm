const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { vibecheck, submitSample } = require('../../functions/virustotal');
const axios = require('axios').default;
const fs = require('fs');


module.exports.name         = 'virustotal';
module.exports.aliases      = ['virus'];
module.exports.description  = 'Check a file or hash for viruses.';
module.exports.syntax       = 'virustotal [file or hash]';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS'];
module.exports.userPerms    = [];

// Prevent users from spamming files by ratelimiting them
let ratelimits = {}

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    if (ratelimits[message.author.id] > Date.now())
        return message.channel.send('Please wait a moment before doing this again. This is to avoid hitting VirusTotal\'s rather strict API ratelimits.');
    
    if (!message.attachments?.first())
        return message.channel.send('You need to attach a file.');
    
    // Filter by file extension
    // List yeeted from various places on the internet
    let extension = message.attachments.first().name.toLowerCase().split('.');
    extension = extension[extension.length - 1];
    if ([
        'exe',
        'doc', 'docx', 'docm', 'xls', 'ppt', 'docm', 'dotm', 'xlsm', 'xltm', 'xlam', 'pptm', 'potm', 'ppam', 'ppsm', 'sldm', // why the fuck are there so many
        'hta', 'html', 'htm',
        'js', 'jar', 'ts', 'py',
        'vbs', 'vb',
        'pdf',
        'sfx',
        'bat', 'com',
        'dll',
        'tmp',
        'msi',
        'msp',
        'gadget',
        'cmd', 'vbe', 'jse', 'ps1', 'ps1xml', 'psc1', 'psc2',
        'lnk', 'inf', 'scf',
        'reg', 'scf',
        'sh',
        'zip', 'rar', '7z', 'gz'
    ].indexOf(extension) == -1) {
        message.channel.send(`This file type (.${extension}) is not supported.`);
        return;
    }
    
    ratelimits[message.author.id] = Date.now() + 60000;
    
    try {
        let { data } = await axios.get(message.attachments.first().url, { responseType: 'arraybuffer' });
        let filename = `${message.id}-${message.attachments.first().name}`;
        await fs.promises.writeFile(`temp/malware/${filename}`, Buffer.from(data));
        
        let enqueueMsg;
        vibecheck(filename, () => enqueueMsg = message.channel.send(`<@${message.author.id}>: The file \`${message.attachments.first().name}\` has been enqueued for analysis.`))
            .then(async res => {
                let engines_total = Object.keys(res.attributes.last_analysis_results).length;
                let engines_malicious = res.attributes.last_analysis_stats.malicious;
                let signature = res.attributes.signature_info;
                let voteHarmless = res.attributes.total_votes.harmless, voteMalicious = res.attributes.total_votes.malicious;
                
                let enginePercent = Math.round((engines_malicious / engines_total) * 100) || 0;
                let votePercent = Math.round((voteMalicious / (voteMalicious + voteHarmless)) * 100) || 0;
                
                let embed = new Discord.MessageEmbed()
                    .setAuthor(signature ? `${signature['internal name']} (${signature['original name']}) ${signature['file version']}` : message.attachments.first().name)
                    .setDescription(`Detected by **${engines_malicious}** out of **${engines_total}** engines (${enginePercent}%).\n` +
                    `**${voteMalicious}** out of **${voteMalicious + voteHarmless}** users (${votePercent}%) marked this file as malicious.`)
                    .setColor(engines_malicious > 3 ? 'ff6600' : engines_malicious > 0 ? 'ff6600' : '009933')
                    .setFooter(res.id)
                
                if (votePercent > 70 || enginePercent > 50) {
                    let deletable = message.channel.permissionsFor(message.guild.me).has('MANAGE_MESSAGES');
                    if (deletable) message.delete().catch(); // Delete the original message, if possible
                    
                    embed.setColor('cc0000');
                    embed.description += `\n\n\`\`\`diff\n- This file is dangerous, do NOT open it! -\`\`\``;
                }
                else if (votePercent > 40 || enginePercent > 7) {
                    embed.setColor('ff3300');
                    embed.description += `\n\n\`This file seems to be dangerous. It is advised to delete it immediately.\``;
                }
                
                enqueueMsg = await enqueueMsg;
                
                if (enqueueMsg) {
                    // Do a direct API call instead of using discord.js to utilize the new reply feature, which discord.js doesn't support at the moment
                    axios.post(`https://discord.com/api/v8/channels/${message.channel.id}/messages`, {
                        embed: embed, message_reference: {
                            message_id: enqueueMsg.id,
                            guild_id: message.guild.id
                        }
                    }, {
                        headers: {
                            'Authorization': `Bot ${client.token}`
                        }
                    })
                    .catch(() => message.channel.send(`https://discord.com/channels/${message.guild.id}/${message.channel.id}/${enqueueMsg.id}`, { embed: embed }));
                } else {
                    message.channel.send(embed);
                }
            })
            .catch(async res => {
                console.log(res);
                let embed = new Discord.MessageEmbed()
                    .setAuthor('No result')
                    .setDescription('No result was found for this file.')
                    .setColor('0099cc')
                    .setFooter(res.hash || 'An error has occurred.');
                message.channel.send(embed);
                
                if (res.data?.error?.code) await submitSample('temp/malware/' + filename, filename);
            });
        
        fs.promises.unlink('temp/malware/' + filename); // Delete the file
    } catch(e) {
        console.error(e);
        message.channel.send('' + e);
    }
}