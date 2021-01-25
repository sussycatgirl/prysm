const { SlashCommand } = require('../../bot/slashCommands');
const Discord = require('discord.js');
const { client } = require('../../../bot');
const musicManager = require('../../../functions/musicPlayer');
const { shoukaku } = require('../../bot/shoukakuSetup');
const getGuildSettings = require('../../../functions/getGuildSettings');
const { getPrefix } = require('../../../functions/getPrefix');
const Url = require('url');

/**
 * 
 * @param {SlashCommand} cmd 
 */
module.exports.execute = async (cmd, callback) => {
    try {
        const guild = await client.guilds.fetch(cmd.guild_id);
        if (!guild) throw 'Unable to fetch guild';
        const channel = guild.channels.cache.get(cmd.channel_id);
        
        let platform = cmd.data.options.find(d => d.name == 'source');
        let search = cmd.data.options.find(d => d.name == 'track').value;
        
        if (Url.parse(search).hostname) platform = null; 
        else platform = platform ? platform.value : getGuildSettings.get(cmd.guild_id, 'music.soundcloudSearchIsDefault') ? 'soundcloud' : 'youtube';

        if (platform == 'yt') platform = 'youtube';
        if (platform == 'sc') platform = 'soundcloud';

        if ((!cmd.member.voice || cmd.member.voice.channelID != guild.me.voice.channelID) && guild.me.voice.channelID || !cmd.member.voice.channel) 
        return callback('You are not in my voice channel.');
        
        let vcPerms = cmd.member.voice.channel.permissionsFor(guild.me);
        if (!vcPerms.has("CONNECT") || !vcPerms.has("VIEW_CHANNEL")) {
            callback(true);
            return channel.send(
                new Discord.MessageEmbed()
                .setTitle(`I am unable to join ${message.member.voice.channel.name}.`)
                .setDescription('Please check the channel settings and make sure I have permission to join the channel.')
                .setImage('https://cdn.discordapp.com/attachments/749609184219103334/771754787665739776/unknown.png')
                .setColor('36393f')
            );
        }

        let data = await musicManager.resolveTrack(search, platform);

        if (!data || !data || (data.type == 'PLAYLIST' ? !data.tracks : !data.tracks[0])) return callback(`Could not find anything${platform == 'youtube' ? ' on YouTube' : platform == 'soundcloud' ? ' on SoundCloud' : ''} for '${search.substring(0, 200)}'.`);

        let track;

        if (data.type == 'SEARCH') track = data.tracks.shift();
        if (data.type == 'TRACK') track = data.tracks[0];
        if (data.type == 'PLAYLIST') track = data.tracks;

        if (!track) return callback(`Nothing was found.`);

        try {
            musicManager.enqueue(track, guild, cmd.member.voice.channel, channel, true);
        } catch(e) {
            return callback('Something went wrong.\n' + e);
        }

        let t = track;
        let trackCount = 1;
        if (Array.isArray(t)) {
            t = track[0];
            trackCount = track.length;
        }

        let embed = (await musicManager.buildEmbed(t, (shoukaku.getPlayer(guild.id).track ? true : false), guild));
        if (trackCount > 1) embed.setAuthor(`Enqueued ${trackCount} tracks`, cmd.member.user.avatarURL());
        embed.setFooter(`Enqueued by ${cmd.member.user.tag}`, cmd.member.user.displayAvatarURL({ dynamic: true }));

        await channel.send(embed);
        callback(false);
    } catch(e) {
        console.error(e);
    }
}

module.exports.sendConfirmation = 'callback';
module.exports.requireGuildMember = true;