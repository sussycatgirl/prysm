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
    let type = cmd.data.options.find(d => d.name == 'type').value;
    if (!type) throw '"type" not found'
    
    const guild = await client.guilds.fetch(cmd.guild_id);
    if (!guild) throw 'Unable to fetch guild';
    const channel = guild.channels.cache.get(cmd.channel_id);
    
    if ((!cmd.member.voice || cmd.member.voice.channelID != guild.me.voice.channelID) && guild.me.voice.channelID) 
    return callback('You are not in my voice channel.');
    
    let oldLoopType = musicManager.setLooping(cmd.guild_id, type);
    
    cmd.webhook.send(new Discord.MessageEmbed().setDescription(`<@${cmd.member.id}>: Changed the loop type from **${oldLoopType}** to **${type}**`));
    callback(false);
}

module.exports.sendConfirmation = 'callback';
module.exports.requireGuildMember = true;