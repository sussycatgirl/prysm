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
    let type = cmd.data.options.find(d => d.name == 'type').value;
    
    const guild = await client.guilds.fetch(cmd.guild_id);
    if (!guild) throw 'Unable to fetch guild';
    
    if (!type) {
        callback(`Current loop mode: **${musicManager.getLooping(guild.id)}**`);
        return;
    }
    
    if ((!cmd.member.voice || cmd.member.voice.channelID != guild.me.voice.channelID) && guild.me.voice.channelID) 
    return callback('You are not in my voice channel.', false, resType.CHANNEL_MESSAGE, true);
    
    let oldLoopType = musicManager.setLooping(cmd.guild_id, type);
    
    if (getGuildSettings.get(cmd.guild_id, 'music.silent')) {
        callback(`Changed the loop mode from **${oldLoopType}** to **${type}**`, false, resType.CHANNEL_MESSAGE, true);
    } else {
        cmd.webhook.send(new Discord.MessageEmbed().setDescription(`<@${cmd.member.id}>: Changed the loop mode from **${oldLoopType}** to **${type}**`));
        callback(false);
    }
}

module.exports.sendConfirmation = 'callback';
module.exports.requireGuildMember = true;