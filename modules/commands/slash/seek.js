const { SlashCommand } = require('../../bot/slashCommands');
const Discord = require('discord.js');
const { InteractionResponseType: resType } = require('discord-interactions');
const { client } = require('../../../bot');
const musicManager = require('../../../functions/musicPlayer');
const { shoukaku } = require('../../bot/shoukakuSetup');
const getGuildSettings = require('../../../functions/getGuildSettings');

/**
 * 
 * @param {SlashCommand} cmd
 * @param {function(String, Discord.MessageEmbed | false, resType, boolean) : void} callback
 */
module.exports.execute = async (cmd, callback) => {
    try {
        const guild = await client.guilds.fetch(cmd.guild_id);
        if (!guild) throw 'Unable to fetch guild';
        
        let player = shoukaku.getPlayer(cmd.guild_id);
        if (!player) return callback("I am currently not playing.", false, resType.CHANNEL_MESSAGE, true);
        
        let newPos;
        if (!cmd.data.options) newPos = null; else newPos = cmd.data.options.find(d => d.name == 'position').value;
        if (newPos == undefined) return callback('Error: No position specified', false, resType.CHANNEL_MESSAGE, true);

        if ((!cmd.member.voice || cmd.member.voice.channelID != guild.me.voice.channelID) && guild.me.voice.channelID) 
        return callback('You are not in my voice channel.', false, resType.CHANNEL_MESSAGE, true);

        newPos = Math.round(newPos);

        if (newPos > player.track.length) newPos = Math.floor(player.track.length);
        if (newPos < 0) newPos = 0;

        player.seekTo(newPos * 1000)
        .then(seeked => {
            if (seeked) return callback(null, false, getGuildSettings.get(cmd.guild_id, 'music.silent') ? resType.ACKNOWLEDGE : resType.ACKNOWLEDGE_WITH_SOURCE);
            else return callback('Failed to seek.', false, resType.CHANNEL_MESSAGE, true);
        })
        .catch(e => {
            console.error(e);
            return callback('Failed to seek: ' + e, false, resType.CHANNEL_MESSAGE, true);
        });
    } catch(e) {
        console.error(e);
        callback('' + e, false, resType.CHANNEL_MESSAGE, true);
    }
}

module.exports.sendConfirmation = 'callback';
module.exports.requireGuildMember = true;