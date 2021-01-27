const { SlashCommand } = require('../../bot/slashCommands');
const Discord = require('discord.js');
const { client } = require('../../../bot');
const musicManager = require('../../../functions/musicPlayer');
const { shoukaku } = require('../../bot/shoukakuSetup');
const getGuildSettings = require('../../../functions/getGuildSettings');

/**
 * 
 * @param {SlashCommand} cmd 
 */
module.exports.execute = async (cmd, callback) => {
    try {
        const guild = await client.guilds.fetch(cmd.guild_id);
        if (!guild) throw 'Unable to fetch guild';
        const channel = guild.channels.cache.get(cmd.channel_id);
        
        let player = shoukaku.getPlayer(cmd.guild_id);
        if (!player) return callback("I am currently not playing.", true);
        
        let newPos;
        if (!cmd.data.options) newPos = null; else newPos = cmd.data.options.find(d => d.name == 'position').value;
        if (!newPos) {
            return callback(new Discord.MessageEmbed()
            .setTitle('Current position')
            .setDescription('your mom (placeholder)'));
        }

        if ((!cmd.member.voice || cmd.member.voice.channelID != guild.me.voice.channelID) && guild.me.voice.channelID) 
        return callback('You are not in my voice channel.', true);

        newPos = Math.round(newPos);

        if (newPos > player.track.length) newPos = Math.floor(player.track.length);
        if (newPos < 0) newPos = 0;

        player.seekTo(newPos * 1000)
        .then(seeked => {
            if (seeked) return callback(!getGuildSettings.get(cmd.guild_id, 'music.silent'));
            else return callback('Failed to seek.');
        })
        .catch(e => {
            console.error(e);
            return callback('Failed to seek: ' + e);
        });
    } catch(e) {
        console.error(e);
        callback('' + e);
    }
}

module.exports.sendConfirmation = 'callback';
module.exports.requireGuildMember = true;