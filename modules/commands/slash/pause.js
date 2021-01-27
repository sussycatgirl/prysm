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
    const guild = await client.guilds.fetch(cmd.guild_id);
    if (!guild) throw 'Unable to fetch guild';
    const channel = guild.channels.cache.get(cmd.channel_id);
    
    if ((!cmd.member.voice || cmd.member.voice.channelID != guild.me.voice.channelID) && guild.me.voice.channelID) 
    return callback('You are not in my voice channel.');
    
    let player = shoukaku.getPlayer(guild.id);
    if (!player) return callback("I am currently not playing.", true);
    if (player.track) player.setPaused(!player.paused);
    else musicManager.startPlaying(guild, cmd.member.voice.channel, channel, true);
    
    cmd.webhook.send(
        new Discord.MessageEmbed()
        .setDescription(`${player.paused ? '▶️' : '⏸️'} <@${cmd.member.user.id}> ${player.paused ? 'Unpaused' : 'Paused'} the player`)
    );
    callback(false);
}

module.exports.sendConfirmation = 'callback';
module.exports.requireGuildMember = true;