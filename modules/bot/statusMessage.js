const Discord = require('discord.js');
const data = require('../../bot');
const client = data.client;
const fs = require('fs');
const { shoukaku } = require('./shoukakuSetup');
const { createCanvas, loadImage } = require('canvas');
const http = require('http');



let temps = [];
let cmdPerMin = 0;
let prevPerMin = [0];
let oldPerMin = [];
setInterval(() => {
    prevPerMin.push(cmdPerMin);
    if (prevPerMin.length >= 3) prevPerMin.splice(0, 1);
}, 15000);

module.exports.cmdExec = () => {
    cmdPerMin++;
    setTimeout(() => cmdPerMin--, 60000);
}

module.exports.run = async function() {
    let msgData = data.db.stats.get('status_message');
    if (!msgData) return;
    
    let { msgID, channelID, guildID } = msgData;
    if (!msgID || !channelID || !guildID) return;
    
    await awaitReady();
    
    let guild = await client.guilds.fetch(guildID);
    if (!guild) return;
    let channel = guild.channels.cache.get(channelID);
    if (!channel) return;
    let msg;
    try {
        msg = await channel.messages.fetch(msgID);
    } catch(e) {
        return console.log('Failed to fetch status message: ' + e);
    }
    if (!msg.editable) return console.log('Cannot edit status message');
    
    let update = async () => {
        if (!process.env.ENABLE_GRAPH) return;
        temps.push(Math.round(Number(fs.readFileSync('/sys/class/thermal/thermal_zone0/temp')) / 1000));
        oldPerMin.push(prevPerMin.length ? prevPerMin.reduce((prev, cur) => prev + cur) / prevPerMin.length : cmdPerMin);
        try {
            const canvas = createCanvas(400, 150);
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = 1;

            let magicNumber = (input, h) => (((input/h)*0.5)*-(canvas.height*1.25))+(canvas.height/2)+75
            
            let r = 15;
            let mkGraph = (data, color, ceil, unit) => {
                ctx.strokeStyle = color;
                ctx.fillStyle = color;
                
                ctx.fillText(`${Math.round(data[data.length - 1])}${unit}`, 370, r);
                r += 15;
                
                ctx.beginPath();
                let h = 0;
                let lastVal = 0;
                for (let x = 380; x >= 20; x -= (temps.length <= 24 ? 15 : (temps.length <= 72 ? 5 : 1))) {
                    let val = data[data.length - (h + 1)] || 0;
                    if (isNaN(val)) val = lastVal; else lastVal = val;
                    let y = magicNumber(val || 0, ceil);
                    ctx.lineTo(x - 20, y);
                    h++;
                }
                ctx.stroke();
            }

            mkGraph(temps, 'rgb(255, 112, 0)', 65, '°C');
            let cpmData = oldPerMin;
            mkGraph(cpmData, 'rgb(255, 255, 255)', (cpmData || [cmdPerMin]).reduce((old, cur) => cur > old ? cur : old), '/min');
            
            await fs.promises.writeFile(`temp/graph.png`, canvas.toBuffer());
            /* Turns out this was a bad idea
            let now = new Date();
            let path = `temp/old_temps/${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}/${now.getHours()}/${now.getMinutes()}`;
            if (!fs.existsSync(path)) await fs.promises.mkdir(path, {recursive: true});
            await fs.promises.copyFile('temp/graph.png', `${path}/${Date.now()}.png`);
            */
            
            let embed = new Discord.MessageEmbed()
                .setTitle('Status')
                .addField('Guilds', data.db.clientCache.guildSize || client.guilds.cache.size, true)
                .addField(`CPU temp`, temps[temps.length - 1] + '°C', true)
                .addField('Lavalink players', shoukaku.nodes ? shoukaku.players.size : 0, true)
                .addField(`Uptime`, millisecondsToStr(client.uptime), true)
                .addField(`Commands per minute`, oldPerMin[oldPerMin.length - 1], true)
                .setColor('2F3136')
                .setFooter('Last updated')
                .setTimestamp()
                .setImage(`https://${process.env.GRAPH_DOMAIN}${process.env.GRAPH_PATH}?uselessflag=${Date.now()}`) // useless flag is there so discord doesn't cache the image
                
            msg.edit('', embed).catch(console.warn);
        } catch(e) {
            console.error(e);
        }
    }

    update();
    setInterval(update, 15000);

}

module.exports.meta = {
    name: 'status_message',
    priority: 11
}

let awaitReady = () => new Promise((res, rej) => client.once('ready', res));


// Yeeted from stackoverflow
function millisecondsToStr (milliseconds) {
    function numberEnding (number) {
        return (number > 1) ? 's' : '';
    }

    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    if (years) {
        return years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks? 
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        return days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds) {
        return seconds + ' second' + numberEnding(seconds);
    }
    return 'Less than a second'; //'just now' //or other string you like;
}

if (!process.env.ENABLE_GRAPH) return;
http.createServer(async (req, res) => {
    if (req.url.split('?')[0] == process.env.GRAPH_PATH) {
        res.write(await fs.promises.readFile('temp/graph.png'));
        res.end();
    }
}).listen(process.env.GRAPH_PORT || 6429);