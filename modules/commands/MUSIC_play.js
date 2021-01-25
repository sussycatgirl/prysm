const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { shoukaku } = require('../bot/shoukakuSetup');
const getGuildSettings = require('../../functions/getGuildSettings');
let musicManager = require('../../functions/musicPlayer');
const spotifyInfo = require('../../functions/spotify');

module.exports.name         = 'play';
module.exports.aliases      = ['p', 'pl'];
module.exports.description  = 'Plays music.';
module.exports.syntax       = 'play [Search term or URL]';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'CONNECT', 'SPEAK'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    if ((!message.member.voice || message.member.voice.channelID != message.guild.me.voice.channelID) && message.guild.me.voice.channelID) 
        return message.channel.send('You are not in my voice channel.');
    
    if (!message.member.voice.channel) return message.channel.send("You are not connected to a voice channel.");
    if (message.guild.me.voice.channelID != message.member.voice.channelID && message.guild.me.voice.channelID != undefined) return message.channel.send('You are not in my voice channel.');
    let vcPerms = message.member.voice.channel.permissionsFor(client.user.id);
    if (!vcPerms.has("CONNECT") || !vcPerms.has("VIEW_CHANNEL")) return message.channel.send(
        new Discord.MessageEmbed()
        .setTitle(`I am unable to join ${message.member.voice.channel.name}.`)
        .setDescription('Please check the channel settings and make sure I have permission to join the channel.')
        .setImage('https://cdn.discordapp.com/attachments/749609184219103334/771754787665739776/unknown.png')
        .setColor('36393f')
    );
    if (!args[0]) return message.channel.send("No search term or URL specified.");

    let { platform, search } = musicManager.resolvePlatformFromString(args.join(' '), message.guild);
    
    let searchEmbed, isSpotifyQuery = (platform == 'spotify');
    if (platform == 'spotify') {
        if (!spotifyInfo.spotifyEnabled) return message.channel.send('Sorry, Spotify support is currently not available.');
        
        searchEmbed = new Discord.MessageEmbed()
            .setAuthor(`Fetching info from Spotify...`, 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fantidote71.com%2Fwp-content%2Fuploads%2F2018%2F11%2Fspotify-logo.png&f=1&nofb=1')
            .setColor('1DB954');
    } else {
        searchEmbed = new Discord.MessageEmbed()
            .setDescription(`Searching ${platform == 'youtube' ? ' on YouTube...' : platform == 'soundcloud' ? ' on SoundCloud...' : '...'}`)
            .setColor('2F3136');
        
    if (getGuildSettings.get(message.guild, 'music.surpressEmbed')) message.suppressEmbeds(true);
    } 
    
    let msg = await message.channel.send(searchEmbed);
    
    let data;
    try {
        if (isSpotifyQuery) {
            let { tracks, failed } = await spotifyInfo.resolveSpotifyURL(search);
            data = {}
            data.tracks = tracks;
            data.type = 'SPOTIFY';
            
            if (failed > 0) searchEmbed.setDescription(`Failed to load ${failed} track${failed == 1 ? '' : 's'}.`);
            searchEmbed.setDescription(`Successfully fetched ${tracks.length} tracks from Spotify`)
            searchEmbed.author = undefined;
        } else data = await musicManager.resolveTrack(search, platform);
    } catch(e) {
        console.error(e);
        return msg.edit(msg.embeds[0].setDescription(e));
    }

    if (!data || !data || (data.type == 'PLAYLIST' ? !data.tracks : !data.tracks[0])) return msg.edit(
        new Discord.MessageEmbed()
        .setDescription(`Could not find anything${platform == 'youtube' ? ' on YouTube' : platform == 'soundcloud' ? ' on SoundCloud' : ''}.`)
        .setColor('2F3136')
    );

    let track;

    if (data.type == 'SEARCH') track = data.tracks.shift();
    if (data.type == 'TRACK') track = data.tracks[0];
    if (data.type == 'PLAYLIST') track = data.tracks;
    if (data.type == 'SPOTIFY') track = data.tracks;

    if (!track) return msg.edit(msg.embeds[0].setDescription('Nothing was found.'));

    try {
        musicManager.enqueue(track, message.guild, message.member.voice.channel, message.channel, true);
    } catch(e) {
        return message.channel.send(
            new Discord.MessageEmbed()
            .setTitle(Math.round(Math.random()*100) == 69 ? 'We did a little fucky wucky ;-;' : 'Something went wrong')
            .setDescription(e)
        )
    }
    
    let t = track;
    let trackCount = 1;
    if (Array.isArray(t)) {
        t = track[0];
        trackCount = track.length;
    }
    let embed = isSpotifyQuery ? searchEmbed : (await musicManager.buildEmbed(t, (shoukaku.getPlayer(message.guild.id).track ? true : false), message.guild));
    if (trackCount > 1 && !isSpotifyQuery) embed.setAuthor(`Enqueued ${trackCount} tracks`, searchEmbed.author ? searchEmbed.author.iconURL : message.author.avatarURL());
    embed.setFooter(`Enqueued by ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }))
    msg.edit(embed);
}

module.exports.queues = new Discord.Collection();