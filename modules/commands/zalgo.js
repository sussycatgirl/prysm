const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');

module.exports.name         = 'zalgo';
module.exports.aliases      = ['z', 'curse'];
module.exports.description  = 'Makes text super c̩͊̊u̲̎̓r̸̴̼s͇̉̉e̹̮ͅd̩̘͊';
module.exports.syntax       = 'example [Text to curse]';
module.exports.guildOnly    = false;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS'];
module.exports.userPerms    = [];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = (message, args) => {

    let input = args.slice(0).join(' ');
    let output = [];

    let o = 1;
    let p = input.length;
    
    for (o; o <= p; o++) {

        var i;
        var zalgotext = [];
        for (i = 1; i < random(1, zalgosymbols.length); i++) {
            zalgotext = (zalgotext + zalgosymbols[Math.floor(Math.random()*zalgosymbols.length)]);
        }

        output[o-1] = (input.charAt(o-1) + zalgotext);
    }

    let reply = output.join('');
    if (reply.length < 1) {
        let errEmbed = new Discord.MessageEmbed()
            .setColor('ff0000')
            .setTitle('Invalid Arguments')
            .setDescription('You have to type the text you want to c͢u̕͟͜rse!');
            
        message.channel.send(errEmbed)
        .then(msg => {
            msg.delete({timeout: 10000});
            message.delete({timeout: 10000});
        })
    } else {
        message.channel.send(reply.slice(0, 1999));

        if (reply.length > 1999) {
            message.channel.send('I shortened your message to avoid hitting the 2000 character limit.')
            .then(msg => {
                msg.delete({timeout: 5000});
            });
        }
    }
}

let random = require('../../functions/random.js').execute;

// These characters are inserted into the input to create "cursed" text
var zalgosymbols = [
    '\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u0305', '\u0306', '\u0307',
    '\u0308', '\u0309', '\u030A', '\u030B', '\u030C', '\u030D', '\u030E', '\u030F',
    '\u0310', '\u0312', '\u0313', '\u0314', '\u0315', '\u031A', '\u031B', '\u033D',
    '\u033E', '\u033F', '\u0340', '\u0341', '\u0342', '\u0343', '\u0344', '\u0346',
    '\u034A', '\u034B', '\u034C', '\u0350', '\u0351', '\u0352', '\u0357', '\u0358',
    '\u035B', '\u035D', '\u035E', '\u0360', '\u0361', '\u0316', '\u0317', '\u0318',
    '\u0319', '\u031C', '\u031D', '\u031E', '\u031F', '\u0320', '\u0321', '\u0322',
    '\u0323', '\u0324', '\u0325', '\u0326', '\u0327', '\u0328', '\u0329', '\u032A',
    '\u032B', '\u032C', '\u032D', '\u032E', '\u032F', '\u0330', '\u0331', '\u0332',
    '\u0333', '\u0339', '\u033A', '\u033B', '\u033C', '\u0345', '\u0347', '\u0348',
    '\u0349', '\u034D', '\u034E', '\u0353', '\u0354', '\u0355', '\u0356', '\u0359',
    '\u035A', '\u035C', '\u035F', '\u0362', '\u0334', '\u0335', '\u0337', '\u0338',
    '\u0363', '\u0364', '\u0365', '\u0366', '\u0367', '\u0368', '\u0369', '\u036A',
    '\u036B', '\u036C', '\u036D', '\u036E', '\u036F'
];