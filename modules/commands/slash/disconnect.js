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
        
        let ownID = guild.me.voice.channelID;
        let memberID = cmd.member.voice.channelID;
        if  (!(
            (ownID && memberID == ownID) || 
            (ownID && guild.me.voice.channel.permissionsFor(cmd.member).has('MOVE_MEMBERS')) ||
            (ownID && ownID != memberID && guild.me.voice.channel.members.filter(m => !m.user.bot).size == 0)
            ) && cmd.guild.me.voice.channelID) return message.channel.send('You are not in my voice channel.');
        
        let player = shoukaku.getPlayer(guild.id);
        if (!player || !player.track) return callback("I am currently not playing.", true);
        if (player.track) player.disconnect();
        callback(true);
    } catch(e) {
        console.warn(e);
    }
}

module.exports.sendConfirmation = 'callback';
module.exports.requireGuildMember = true;