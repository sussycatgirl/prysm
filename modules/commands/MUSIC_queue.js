const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const getGuildSettings = require('../../functions/getGuildSettings');
let musicManager = require('../../functions/musicPlayer');
let hastebin = require('hastebin');
const loadPlaylistFromFile = require('../../functions/loadPlaylistFromFile');
const { shoukaku } = require('../bot/shoukakuSetup');
const { getPrefix } = require('../../functions/getPrefix');
const axios = require('axios').default;

module.exports.name         = 'queue';
module.exports.aliases      = ['q', 'qu'];
module.exports.description  = 'Display the guild\'s queue or import/export it.';
module.exports.syntax       = 'queue [show/export/load/help]';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'CONNECT', 'SPEAK'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array<string>} args 
 */
module.exports.execute = async (message, args) => {
    let queues = musicManager.queues;
    let queue = queues.get(message.guild.id);
    let np = musicManager.getNowPlaying(message.guild.id);
    
    switch(args[0] ? args[0].toLowerCase() : args[0]) {
    case 'export': // Export the queue as file
    if ((!message.member.voice || message.member.voice.channelID != message.guild.me.voice.channelID) && message.guild.me.voice.channelID) 
        return message.channel.send('You are not in my voice channel.');
        if ((!queue || !queue[0] || !Array.isArray(queue)) && !np) return message.channel.send('I cannot save an empty queue.');
        
        args.shift();
        
        let exportString = '';
        exportString += `# Queue export - ${message.guild.name} ${args.join(' ').substr(0, 50)}\n`;
        exportString += `# Exported by ${message.author.tag} at ${new Date().toUTCString()}\n`;
        
        let name = args.join(' ').substr(0, 50);
        if (name) exportString += `$QUEUENAME=${name}\n`;
        
        if (np) queue.splice(0, 0, np); // Insert currently playing track into the queue
        
        // "Indent" the comments after the URL
        let commentIndent = 0;
        queue.forEach(item => {
            if (item.info.uri.length > commentIndent) commentIndent = item.info.uri.length;
        });
        
        queue.forEach(item => {
            let indent = ''; for (let i = 0; i < (commentIndent - item.info.uri.length) + 1; i++) indent += ' ';
            exportString += `\n${item.info.uri} ${indent}# ${item.info.author}  -  ${item.info.title}`
        });
        
        let file = Buffer.from(exportString);
        message.channel.send(new Discord.MessageAttachment(file, `${args.join(' ').substr(0, 50) || message.id}.queue`));
    break;
    case 'save': // Save the queue to database
    if ((!message.member.voice || message.member.voice.channelID != message.guild.me.voice.channelID) && message.guild.me.voice.channelID) 
        return message.channel.send('You are not in my voice channel.');
        return message.channel.send('feature coming soon:tm:');
    break;
    case 'load': // Load and play a .queue file
        if (!message.member.voice.channelID) return message.channel.send('You need to be in a voice channel to do this.');
        if ((!message.member.voice || message.member.voice.channelID != message.guild.me.voice.channelID) && message.guild.me.voice.channelID) 
            return message.channel.send('You are not in my voice channel.');
        
        let playlistFile = message.attachments.first();
        if (!playlistFile) return message.channel.send(`Please attach the .queue file to your message.`);
        if (playlistFile.size > 1000000) return message.channel.send(`The file exceeds the size limit of 1mb.`);
        
        let fileContent;
        try {
            fileContent = (await axios.get(playlistFile.url, { responseType: 'arraybuffer', timeout: 10000 })).data;
        } catch(e) {
            console.error(e);
            return message.channel.send('Failed to download file: ' + e);
        }
        
        let metadata, trackURLs;
        try {
            let res = loadPlaylistFromFile(fileContent.toString());
            metadata = res.metadata;
            trackURLs = res.trackURLs;
        } catch(e) {
            console.error(e);
            return message.channel.send('Failed to parse file content. ' + e);
        }
        
        try {
            let player = shoukaku.getPlayer(message.guild.id);
            if (!player) player = await shoukaku.getNode().joinVoiceChannel({ voiceChannelID: message.member.voice.channelID, guildID: message.guild.id, deaf: true });
            let enqueueMsg = await message.channel.send(
                new Discord.MessageEmbed()
                .setTitle('Queue loaded')
                .setDescription(`Found ${trackURLs.length} tracks${metadata.QUEUENAME ? ` from playlist '${metadata.QUEUENAME}'.` : '.'}`
                + ` Do you want to play them now or move them to the end of the current queue?\n`)
                .setColor('653aff')
                .addField('\u200b', `▶️ → ${player.track ? 'Replace the current queue' : 'Play now'}`, true)
                .addField('\u200b', `⏩ → ${player.track ? 'Move to end of queue' : 'Enqueue without playing'}`, true)
            )
            enqueueMsg.react('▶️');
            enqueueMsg.react('⏩');
            let collector = new Discord.ReactionCollector(enqueueMsg, r => ['▶️', '⏩'].includes(r.emoji.name), {time: 300000});
            collector.on('collect', async (reaction, user) => {
                if (user.id != message.author.id) return;
                switch(reaction.emoji.name) {
                    case '▶️':
                        collector.stop('PLAY NOW');
                    break;
                    case '⏩':
                        collector.stop('ENQUEUE');
                        musicManager.queues.set(message.guild.id, []);
                    break;
                    default: return reaction.users.remove(user);
                }
            });
            
            collector.on('end', async (collected, reason) => {
                let sendReply = reason == 'PLAY NOW' || reason == 'ENQUEUE';
                if (sendReply) {
                    if (enqueueMsg.channel.permissionsFor(message.guild.me).has('MANAGE_MESSAGES')) enqueueMsg.reactions.removeAll();
                    enqueueMsg.edit(
                        new Discord.MessageEmbed()
                        .setColor('653aff')
                        .setTitle('Queue loaded')
                        .setDescription('Fetching tracks...')
                    );
                    let { tracks, failed } = await resolveAllTracks(trackURLs);
                    if (reason == 'PLAY NOW') {
                        musicManager.queues.set(message.guild.id, tracks);
                        if (player.track) await player.stopTrack();
                        else musicManager.startPlaying(message.guild, message.member.voice.channel, message.channel, true);
                    } else if (reason == 'ENQUEUE') {
                        let curQueue = musicManager.queues.get(message.guild.id);
                        if (!curQueue || !Array.isArray(curQueue)) curQueue = [];
                        tracks.forEach(t => curQueue.push(t));
                        musicManager.queues.set(message.guild.id, curQueue);
                    }
                    
                    enqueueMsg.edit(
                        new Discord.MessageEmbed()
                        .setColor('653aff')
                        .setTitle('Queue loaded')
                        .setDescription(`Successfully fetched ${tracks.length} tracks`
                        + `${reason == 'PLAY NOW' ? `. Playback will begin now.` : ` and added them to the end of the queue.`}\n`
                        + `${failed>0 ? `${failed} track${failed==1 ? '' : 's'} failed to load and ${failed==1 ? 'has' : 'have'} been skipped.` : ''}`)
                    )
                }
            });
            
            async function resolveAllTracks(trackArray) {
                return new Promise(async (resolve, reject) => {
                    if (!trackArray || !Array.isArray(trackArray)) return reject('Track list is not of type array');
                    try {
                        let nodeRest = shoukaku.getNode().rest;
                        let promises = [];
                        trackArray.forEach(t => promises.push(nodeRest.resolve(t)));
                        let failed = 0;
                        let resolvedTracks = [];
                        Promise.allSettled(promises).then(results => {
                            results.forEach(res => {
                                if (res.status != 'fulfilled')
                                    failed++;
                                else {
                                    if (!res.value || !res.value.tracks || !res.value.tracks[0])
                                        failed++;
                                    else
                                        resolvedTracks.push(res.value.tracks[0]);
                                }
                            });
                            resolve({ failed: failed, tracks: resolvedTracks });
                        });
                    } catch(e) {
                        console.error(e);
                        reject(e);
                    }
                });
            }
        } catch(e) {
            console.error(e);
            return message.channel.send(e);
        }
        
        
    break;
    case null:
    case undefined:
    case '':
    case 'show': // Send the queue
        let queueStr = '';
        let i = 0;
        let done = false;
        
        if (np) {
            let title = np.info.title;
            if (title.length > 100) title = title.substr(0, 150) + '...';
            queueStr += `> **Now playing:** [${title}](${np.info.uri} "Click to open") by ${np.info.author}\n`;
        }

        if ((!queue || !Array.isArray(queue) || !queue[0]) && !np) return message.channel.send('The queue is currently empty.');

        queue.forEach(track => {
            if (track) {
                i++;
                let oldStr = queueStr;
                title = track.info.title;
                if (title.length > 100) title = title.substr(0, 100) + '...';
                if (!done) queueStr += `\n**${i == 1 && !(
                    musicManager.getShuffle(message.guild.id) == true && 
                    !getGuildSettings.get(message.guild, 'music.shuffleModifiesQueue')
                ) ? 'Next:' : `${i})`}** [${title}](${track.info.uri} "Click to open") by ${track.info.author}`
                if (queueStr.length > 1800) {
                    queueStr = oldStr;

                    if (!done) queueStr += `\n\n${1 + queue.length - i} more track${1 + queue.length - i == 1 ? '' : 's'}.`
                    if (done) return;
                    done = true;

                    let fullQueueStr = '';
                    let j = 0;
                    let k = i-1;
                    queue.forEach(t => {
                        j++;
                        title = t.info.title;
                        if (title.length > 100) title = title.substr(0, 100) + '...';
                        fullQueueStr += `\n${j}) ${title} by ${t.info.author}: ${t.info.uri}`;
                    });
                    fullQueueStr = fullQueueStr.substr(1);

                    hastebin.createPaste(fullQueueStr, {
                        raw: true,
                        contentType: 'text/plain',
                        server: 'https://hastebin.janderedev.xyz'
                    })
                    .then((url) => {
                        queueStr = oldStr + `\n\n[${queue.length - k} more tracks.](${url.replace('/raw/', '/')} "Click to view")`;
                        msg.then(m => m.edit(embed.setDescription(queueStr)).catch(e => message.channel.send(e + '\nCheck the queue here: ' + url.replace('/raw/', '/'))));
                    })
                    .catch((requestError) => {
                        console.error(requestError);
                    })
                }
            }
        });


        let embed = new Discord.MessageEmbed()
        .setAuthor(`${message.guild.name}'s queue - ${queue.length} ${queue.length == 1 ? 'track' : 'tracks'}`, message.guild.iconURL({ dynamic: true }))
        .setDescription(queueStr)
        .setFooter(`Loop mode: ${musicManager.getLooping(message.guild.id)}${getGuildSettings.get(message.guild.id, 'music.shuffleModifiesQueue') ? '' : ` | ${musicManager.getShuffle(message.guild.id) ? 'shuffling' : 'not shuffling'}`} | More options with ${getPrefix(message.guild)}queue help`)
        .setColor('2F3136');

        let msg = message.channel.send(embed).catch(e => console.error(e));
    break;
    case 'help':
    default:
        message.channel.send(
            new Discord.MessageEmbed()
            .setTitle('Queue management')
            .setDescription(`${getPrefix(message.guild)}queue show → Show the current queue\n`
            + `${getPrefix(message.guild)}queue export → Export the queue as a file\n`
            + `${getPrefix(message.guild)}queue load → Load the queue from a file\n`)
            .setColor('653aff')
        )
    break;
    }
}

module.exports.queues = new Discord.Collection();
