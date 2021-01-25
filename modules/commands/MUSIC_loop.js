const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const getGuildSettings = require('../../functions/getGuildSettings');
const { getPrefix } = require('../../functions/getPrefix');
let musicManager = require('../../functions/musicPlayer');

module.exports.name         = 'loop';
module.exports.aliases      = ['l', 'looping', 'setloop'];
module.exports.description  = 'Toggle queue looping.';
module.exports.syntax       = 'loop [all | single | none]';
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
    
    if (!args[0]) {
        let out = '';
        switch(musicManager.getLooping(message.guild.id)) {
            case "all":
                out = "Currently looping **the queue**."
            break;
            case "single":
                out = "Currently looping **this track**."
            break;
            case "none":
                out = "Currently **not looping**."
            break;
        }
        let embed = new Discord.MessageEmbed()
            .setDescription(out)
            .setFooter(`Use ${getPrefix(message.guild)}loop [all | single | none] to change the loop mode.`)
            .setColor('2F3136')
        
        return message.channel.send(embed);
    }

    if (args.join(" ") == '[all | single | none]' || args.join(" ") == '[all | single | none] to change the loop mode.')
        return message.channel.send('haha very funny');

    let newLoopType;
    switch(args[0].toLowerCase()) {
        case 'a':
        case 'all':
        case 'queue':
            newLoopType = 'all';
        break;
        case 's':
        case 'c':
        case 'single':
        case 'track':
        case 'current':
        case 'song':
        case 'this':
            newLoopType = 'single';
        break;
        case 'n':
        case 'o':
        case 'd':
        case 'none':
        case 'off':
        case 'disable':
        case 'disabled':
        case 'dont':
            newLoopType = 'none';
        break;
        default: 
            return message.channel.send(new Discord.MessageEmbed().setDescription('Invalid argument. Please use `all`, `single` or `none`.'));
    }
    
    let oldLoopType = musicManager.setLooping(message.guild.id, newLoopType);

    let embed = new Discord.MessageEmbed()
        .setDescription(`Looping set from \`${oldLoopType}\` to \`${newLoopType}\``)
        .setColor('2F3136')

    message.channel.send(embed);
}