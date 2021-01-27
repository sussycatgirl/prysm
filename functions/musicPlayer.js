const { Guild, VoiceChannel, TextChannel, MessageEmbed } = require('discord.js');
const { ShoukakuTrack, ShoukakuTrackList } = require('shoukaku');
const { shoukaku } = require('../modules/bot/shoukakuSetup');
const getThumbnail = require("./getTrackInfo").getThumbnail;
const getGuildSettings = require('./getGuildSettings');
const { client } = require('../bot');
const Enmap = require("enmap");
const url = require('url');

// Saving temporary data in non-persistent enmaps
const queues = new Enmap();
const looping = new Enmap();
const shuffle = new Enmap();
const nowPlaying = new Enmap();
const lastNPMessage = new Enmap();


let soundcloudIconURL = 'https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fwww.myiconfinder.com%2Fuploads%2Ficonsets%2F256-256-9550d3f08a15ca1777c5deb465b95be6-soundcloud.png&f=1&nofb=1';
let youtubeIconURL    = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn3.iconfinder.com%2Fdata%2Ficons%2F2018-social-media-logotypes%2F1000%2F2018_social_media_popular_app_logo_youtube-512.png&f=1&nofb=1';
let ytNoThumbIconURL  = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn57.androidauthority.net%2Fwp-content%2Fuploads%2F2019%2F01%2FYouTube-Logo.jpg&f=1&nofb=1';
let scNoThumbIconURL  = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.gannett-cdn.com%2F-mm-%2F645d391b181f5190541845780cfea9f7733562b5%2Fc%3D0-223-1024-802%2Flocal%2F-%2Fmedia%2F2016%2F06%2F14%2FUSATODAY%2FUSATODAY%2F636015190457589047-soundcloud-icon.png%3Fwidth%3D3200%26height%3D1680%26fit%3Dcrop&f=1&nofb=1';

/**
 * Enqueue a song in a guild's queue
 * @param {ShoukakuTrack | Array<ShoukakuTrackList>} track 
 * @param {Guild} guild 
 * @param {VoiceChannel} voiceChannel 
 * @param {TextChannel} textChannel 
 * @param {boolean} startPlaying Whether to automatically start playing the track if nothing else is currently playing
 * @returns {Promise<ShoukakuPlayer|undefined>} Returns a Shoukaku player if startPlaying is true
 */
module.exports.enqueue = async (track, guild, voiceChannel, textChannel, startPlaying) => {
    return new Promise(async (resolve, reject) => {
        let queue = queues.get(guild.id);
        if (!queue || !Array.isArray(queue)) queue = [];

        if (Array.isArray(track)) {
            track.forEach(t => queue.push(t));
        } else queue.push(track);
        
        queues.set(guild.id, queue);
        
        if (startPlaying) {
            try {
                let player = await this.startPlaying(guild, voiceChannel, textChannel);
                resolve(player);
            } catch(e) {
                reject(e);
            }
        } else {
            resolve();
        }
    });
}

/**
 * Create a new Player and play the current queue in the target channel
 * @param {Guild} guild 
 * @param {VoiceChannel} voiceChannel 
 * @param {TextChannel} textChannel 
 * @param {boolean} announce
 * @returns {Promise<ShoukakuPlayer>} The Player created for the voice channel, or a already existing one
 */
module.exports.startPlaying = async (guild, voiceChannel, textChannel, announce) => {
    return new Promise(async (resolve, reject) => {
        if (shoukaku.nodes.size == 0 || !shoukaku.getNode()) return reject('No nodes available; Not connected to lavalink.');
        let player = shoukaku.getPlayer(guild.id);
        let node = player ? player.voiceConnection.node : shoukaku.getNode();

        // Delete the player when the bot is no longer connected to the voice channel
        if (player && player.voiceConnection.state != 'CONNECTED') {
            player.disconnect();
            player = undefined;
        }

        try {
            if (!player) player = await node.joinVoiceChannel({
                guildID: guild.id,
                voiceChannelID: voiceChannel.id,
                deaf: true
            });
        }
        catch(error) {
            console.error(error);
            textChannel.send('Failed to create voice connection: ' + error).catch();
            return;
        };
        
        let queue = queues.get(guild.id);
        if (!queue || !queue[0]) return;
        
        if (!player.track) {
            let track;
            if (!getGuildSettings.get(guild, 'music.shuffleModifiesQueue') && shuffle.get(guild.id)) {
                let random = Math.round(Math.random() * queue.length);
                track = queue.splice(random, 1);
                track = track[0];
            } else
                track = queue.shift();
            
            if (!track) return;
            queues.set(guild.id, queue);
            player.playTrack(track).then(async (p) => {
                console.log(`Lavalink \x1b[33m${guild.id} ${guild.name}\x1b[0m: Playing \x1b[36m${track.info.identifier}\x1b[0m`);
                
                nowPlaying.set(guild.id, track);
                
                try {
                    let lastMSG = lastNPMessage.get(guild.id);
                    if (announce) {
                        let newMSG = await textChannel.send(await this.buildEmbed(track, false, guild));
                        lastNPMessage.set(guild.id, newMSG.id);
                    }
                    if (lastMSG) {
                        let msg = textChannel.messages.cache.get(lastMSG);
                        if (msg) await msg.fetch();
                        if (msg && msg.deletable && !msg.deleted) msg.delete();
                    }
                } catch(e) {
                    console.error(e);
                }
                
                if (p) {
                    player.on('end', (r) => {
                        player.removeAllListeners();
                        
                        let vcMembers = voiceChannel.members;
                        if (!vcMembers.get(client.user.id)) return;
                        
                        let q = queues.get(guild.id);
                        if (this.getLooping(guild.id) == 'all') {
                            q.push(track); // Push current track back to the end of the queue
                            queues.set(guild.id, q);
                        }
                        if (this.getLooping(guild.id) == 'single') {
                            q.splice(0, 0, track); // Insert current track at index 0
                            queues.set(guild.id, q);
                        }
                        
                        nowPlaying.delete(guild.id);
                        this.startPlaying(guild, voiceChannel, textChannel, (getGuildSettings.get(guild, 'music.announceTrack') && vcMembers.size > 1)); // Play the next track
                    });
                    
                    for (const event of ['closed, nodeDisconnect']) player.on(event, () => player.disconnect());
                    
                    player.on('error', (error) => console.error(error));
                } else textChannel.send('No player created.').catch();
            })
            .catch(error => {
                console.error(error);
                textChannel.send('Cannot play this right now: ' + error).catch();
            });
        }
        
        resolve(player);
    });
}

/**
 * @param {string} input 
 * @returns {Promise<ShoukakuTrackList>}
 */
module.exports.resolveTrack = (input, platform) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (shoukaku.nodes.size == 0 || !shoukaku.getNode()) return reject('Unable to resolve track. No nodes available; Not connected to lavalink.');
            const node = shoukaku.getNode();
            let data = await node.rest.resolve(input, platform);
            resolve(data);
        } catch(e) {
            reject(e);
        }
    });
}

/**
 * @param {string} input 
 * @param {Guild} guild
 */
module.exports.resolvePlatformFromString = (input, guild) => {
    let platform = require('./getGuildSettings').get(guild.id, 'music.soundcloudSearchIsDefault') ? 'soundcloud' : 'youtube';
        
    if (input.startsWith('sc:')) {
        input = input.substring(3);
        platform = 'soundcloud';
    }
    else if (input.startsWith('yt:')) {
        input = input.substring(3);
        platform = 'youtube';
    }
    else if (input.startsWith('https://open.spotify.com')) platform = 'spotify';
    else if (input.startsWith('https://') || input.startsWith('http://')) platform = undefined;

    return {platform: platform, search: input};
}

/**
 * 
 * @param {ShoukakuTrack} track 
 * @param {boolean} enqueued 
 * @param {Guild} guild
 */
async function buildEmbed(track, enqueued, guild) {
    if (!track) throw 'No track';
    let service = null;
    let parsedURI = url.parse(track.info.uri);
    if (parsedURI) {
        if (parsedURI.hostname.indexOf('soundcloud') > -1) service = 'soundcloud';
        if (parsedURI.hostname.indexOf('youtube') > -1) service = 'youtube';
    }

    let thumb;
    try {
        thumb = await getThumbnail(track.info.uri);
    } catch(e) {
        thumb = service == 'soundcloud' ? scNoThumbIconURL : ytNoThumbIconURL;
    }

    return new MessageEmbed()
    .setAuthor((!enqueued ? 'Now playing' : 'Enqueued') + 
                (service ? ' from ' + (service == 'soundcloud' ? 'SoundCloud' : 'Youtube') : ''), 
                service ? (service == 'soundcloud' ? soundcloudIconURL : youtubeIconURL) : null)
    .setTitle(track.info.title)
    .setDescription(`By **${track.info.author.replace('*', '\\*').replace('`', '\\`').replace('_', '\\_')}**`
        + `${process.env.WEB_BASE_URL && guild ?
            ` | [Open web player](${process.env.WEB_BASE_URL}/dashboard/server/${guild.id}/index.ejs "Click to open web player")` : ''}`)
    .setImage(thumb)
    .setURL(track.info.uri)
    .setColor('2F3136');
}

/**
 * Returns the loop type for the guild.
 * @param {string} guildID 
 * @returns {"single"|"all"|"none"}
 */
module.exports.getLooping = (guildID) => {
    if (!guildID || typeof guildID != 'string') throw "Invalid or no Guild ID provided; Cannot get looping status"
    let loopMode = looping.get(guildID);
    if (!loopMode || loopMode == "none") return "none"
    else if (loopMode == "single")       return "single"
    else if (loopMode == "all")          return "all"
    else {
        if (client.guilds.cache.get(guildID)) looping.set(guildID, "none");
    }
}

/**
 * Toggles queue looping for a guild.
 * @param {string} guildID 
 * @param {"all"|"single"|"none"} loopType 
 * @returns {"all"|"single"|"none"} The *previous* loop type
 */
module.exports.setLooping = (guildID, loopType) => {
    if (!guildID || typeof guildID != 'string') throw "Invalid or no Guild ID provided; Cannot set looping status"
    if (!client.guilds.cache.get(guildID)) throw "Cannot set looping mode for unknown guild"
    let oldLoopType = this.getLooping(guildID);
    switch(loopType) {
        case "all":
            looping.set(guildID, "all");
        return oldLoopType;
        case "single":
            looping.set(guildID, "single");
        return oldLoopType;
        default:
            looping.set(guildID, "none");
        return oldLoopType;
    }
}
/**
 * Returns the shuffle mode for the guild.
 * @param {string} guildID 
 * @returns {boolean}
 */
module.exports.getShuffle = (guildID) => {
    if (!guildID || typeof guildID != 'string') throw "Invalid or no Guild ID provided; Cannot get shuffle"
    let returnedShuffle = shuffle.get(guildID);
    if (!returnedShuffle) return false;
    else return true;
}

/**
 * Toggles shuffling for a guild.
 * @param {string} guildID 
 * @param {boolean} shuffleMode
 */
module.exports.setShuffle = (guildID, shuffleMode) => {
    if (!guildID || typeof guildID != 'string') throw "Invalid or no Guild ID provided; Cannot set shuffle"
    if (!client.guilds.cache.get(guildID)) throw "Cannot set shuffle for unknown guild"
    if (typeof shuffleMode != 'boolean') throw "Non-boolean provided."
    shuffle.set(guildID, shuffleMode);
}

/**
 * 
 * @param {string} guildID 
 * @returns {ShoukakuTrack | null}
 */
module.exports.getNowPlaying = (guildID) => {
    return nowPlaying.get(guildID) || null;
}

module.exports.getThumbnail = getThumbnail;
module.exports.buildEmbed = buildEmbed;
module.exports.queues = queues;


const leaveTimeout = 40000;
const leaveTimeouts = {}
client.on('voiceStateUpdate', (oldState, newState) => {
    // This automatically clears the queue when the bot leaves the voice channel.
    if (newState.member.user.id == client.user.id && oldState.channel && !newState.channel) {
        nowPlaying.delete(newState.guild.id);
        queues.delete(newState.guild.id);
    }
    
    // This disconnects the bot automatically when everyone else left the channel
    if (!newState.member.user.bot &&
        oldState.member.user.id == newState.member.user.id &&
        oldState.channelID && !newState.channelID &&
        oldState.channel?.members.get(client.user.id) &&
        oldState.channel?.members.filter(member => !member.user.bot).size == 0 &&
        shoukaku.players.get(oldState.channel?.guild.id)) 
    {
        const timeout = setTimeout(() => {
            if (!oldState.channel) return;
            const player = shoukaku.players.get(oldState.channel.guild.id);
            if (player) player.disconnect();
            
            if (leaveTimeouts[newState.guild.id])
                delete leaveTimeouts[newState.guild.id];
        }, leaveTimeout);
        
        leaveTimeouts[newState.guild.id] =  timeout;
    }
    
    // This clears the disconnect timeout for a channel once someone joins it
    if (!newState.member.user.bot &&
        newState.channelID &&
        newState.channel.members.get(client.user.id) &&
        shoukaku.players.get(newState.guild.id) &&
        newState.channel.members.filter(member => !member.user.bot).size > 0) 
        {
            if (leaveTimeouts[newState.guild.id]) {
                clearTimeout(leaveTimeouts[newState.guild.id]);
                delete leaveTimeouts[newState.guild.id];
            }
        }
});


shoukaku.on('error', console.warn);