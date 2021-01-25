const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { shoukaku } = require('../bot/shoukakuSetup');
let musicManager = require('../../functions/musicPlayer');

// The length of the progress bar
const barLength = 25;

module.exports.name         = 'volume';
module.exports.aliases      = ['v', 'vol'];
module.exports.description  = 'Set the bot\'s volume.';
module.exports.syntax       = 'volume [0-200]';
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
    
    let player = shoukaku.getPlayer(message.guild.id);
    if (!player) return message.channel.send("I am currently not playing.");
    
    if (args[0]) {
        let newVolume;
        if      (args[0].toLowerCase() == 'max') newVolume = 200;
        else if (args[0].toLowerCase() == 'min') newVolume = 0;
        else {
            newVolume = Math.round(Number(args[0]));
            if (newVolume < 0)   newVolume = 0;
            if (newVolume > 200) newVolume = 200;
        }
        await player.setVolume(newVolume);
    }
    
    let embed = new Discord.MessageEmbed()
        .setTitle(`${message.guild.name}'s volume`)
        .setDescription('```ini\n' + generateSliderThingy(player.volume) + '```');
    
    return message.channel.send(embed);
}

let sliderLength = 25;
function generateSliderThingy(volume) {
    let v = 200 / sliderLength;
    let knobPrinted = false;
    let slider = ' ';
    for (let i = 0; i < sliderLength; i++) {
        if ((v*(i+1) > volume || i == sliderLength-1) && !knobPrinted) {
            knobPrinted = true;
            slider += '⚪';
        } else slider += knobPrinted ? '┅' : '━';
    }
    return `${slider} ${Math.round(volume)}/200`;
}