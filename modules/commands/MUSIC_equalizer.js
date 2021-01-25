const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const getGuildSettings = require('../../functions/getGuildSettings');
const { getPrefix } = require('../../functions/getPrefix');
let musicManager = require('../../functions/musicPlayer');
const { shoukaku } = require('../bot/shoukakuSetup');
const ShoukakuConstants = require('shoukaku').Constants;
const { loadImage, createCanvas, registerFont } = require('canvas');
registerFont('assets/Quicksand-Light.ttf', {family: 'Quicksand'})

module.exports.name         = 'equalizer';
module.exports.aliases      = ['eq'];
module.exports.description  = 'Change the equalizer settings.';
module.exports.syntax       = 'eq';
module.exports.guildOnly    = true;
module.exports.dev_only     = true;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'CONNECT', 'SPEAK'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    let player = shoukaku.players.get(message.guild.id);
    if (!player) return message.channel.send('I am currently not playing.');
    
    if ((!args[1] || isNaN(args[0]) || isNaN(args[1])) && args[0] != 'reset') 
        return message.channel.send(
        new Discord.MessageEmbed()
        .attachFiles(new Discord.MessageAttachment(genEQSliderThingy(player.bands), 'file.png'))
        .setImage('attachment://file.png')
        .setTitle(`${message.guild.name}'s Equalizer`)
        .setFooter(`Use '${getPrefix(message.guild)}equalizer reset' to clear the equalizer`)
        .setColor('2F3136')
    );
    
    let bands = player.bands;
    if (args[0] == 'reset') {
        for (let i = 0; i <= 14; i++) {
            let band = ShoukakuConstants.EqualizerBand;
            band.band = Number(i);
            band.gain = Number(0);
            bands[i] = band;
        }
    }
    else {
        let band = ShoukakuConstants.EqualizerBand;
        band.band = Number(args[0]);
        band.gain = Number(args[1]);
        bands[Number(args[0])] = band;
    }
    
    player.setEqualizer(bands);
    console.log(player.bands);
    message.channel.send(
        new Discord.MessageEmbed()
        .attachFiles(new Discord.MessageAttachment(genEQSliderThingy(bands), 'file.png'))
        .setImage('attachment://file.png')
        .setTitle('Equalizer adjusted')
        .setFooter(`Use '${getPrefix(message.guild)}equalizer reset' to clear the equalizer`)
        .setColor('2F3136')
    );
}

let genEQSliderThingy = (bands) => {
    if (!bands || !Array.isArray(bands)) throw 'Bands supplied are of invalid type';
    
    const canvas = createCanvas(400, 150)
    const ctx = canvas.getContext('2d')
    
    // i have no fucking idea how and why this works
    let magicNumber = (input) => ((input*0.5)*-(canvas.height*1.25))+(canvas.height/2)+20
    let distance = canvas.width / 15
    
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath();
    ctx.lineTo(distance/2, magicNumber(0));
    ctx.lineTo(canvas.width-(distance/2), magicNumber(0));
    ctx.stroke();
    
    let oldPosX = 0;
    let oldPosY = 0;
    for (let i = 0; i <= 14; i++) {
        let gain = bands[i] ? bands[i].gain : 0;
        
        let pos = distance*(i+1)-(distance/2);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.font = '15px Quicksand'
        ctx.beginPath();
        ctx.lineTo(pos, 0);
        ctx.lineTo(pos, canvas.height - 35);
        ctx.stroke();
        ctx.fillText(i+1, pos - (i+1>9 ? 7 : 5), canvas.height - 15);
        
        ctx.strokeStyle = 'rgba(255,255,255,1)'
        ctx.beginPath();
        if (i!=0) ctx.lineTo(oldPosX, oldPosY);
        let newPosX = pos;
        let newPosY = magicNumber(gain);
        ctx.lineTo(newPosX, newPosY);
        oldPosX=newPosX;
        oldPosY=newPosY;
        ctx.stroke();
        /*ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        ctx.arc(newPosX, newPosY, 3, 0, 2 * Math.PI);
        ctx.fill();*/
    }
    
    return canvas.toBuffer();
}