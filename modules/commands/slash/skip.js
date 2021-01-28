const { SlashCommand } = require('../../bot/slashCommands');
const { InteractionResponseType: resType } = require('discord-interactions');
const { client } = require('../../../bot');
const musicManager = require('../../../functions/musicPlayer');
const { shoukaku } = require('../../bot/shoukakuSetup');
const getGuildSettings = require('../../../functions/getGuildSettings');

/**
 * 
 * @param {SlashCommand} cmd
 * @param {function(String, import('discord.js').MessageEmbed | false, resType, boolean) : void} callback
 */
module.exports.execute = async (cmd, callback) => {
    const guild = await client.guilds.fetch(cmd.guild_id);
    if (!guild) throw 'Unable to fetch guild';
    const channel = guild.channels.cache.get(cmd.channel_id);
    
    if ((!cmd.member.voice || cmd.member.voice.channelID != guild.me.voice.channelID) && guild.me.voice.channelID) 
    return callback('You are not in my voice channel.', false, resType.CHANNEL_MESSAGE, true);
    
    let player = shoukaku.getPlayer(guild.id);
    if (!player) return callback("I am currently not playing.", false, resType.CHANNEL_MESSAGE, true);
    if (player.track) player.stopTrack();
    else musicManager.startPlaying(guild, cmd.member.voice.channel, channel, true);
    callback(null, false, getGuildSettings.get(cmd.guild_id, 'music.silent') ? resType.ACKNOWLEDGE : resType.ACKNOWLEDGE_WITH_SOURCE);
}

module.exports.sendConfirmation = 'callback';
module.exports.requireGuildMember = true;