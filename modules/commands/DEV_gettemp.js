const data = require('../../bot');
const client = data.client;
const fs = require('fs').promises;
const Discord = require('discord.js');

module.exports = {
    name: 'gettemp',
    aliases: ["temp", "temperature"],
    flag: 0,
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async execute(message, args) {
        let temp = 69420;
        if (process.platform != "linux") return message.channel.send('Not running on Linux: Unable to read temperature.');
        try {
            temp = await fs.readFile("/sys/class/thermal/thermal_zone0/temp");
            
        } catch (e) {
            return message.channel.send('Unable to read temperature: ' + e);
        }
        message.channel.send(
            new Discord.MessageEmbed()
            .setDescription(`Host System CPU temperature: ${Math.floor(temp/100)/10}°C`)
            .setFooter(`/sys/class/thermal/thermal_zone0/temp : ${temp}`)
            .setColor(temp > 60000 ? 'ff0000' : temp > 50000 ? 'ffff00' : '00ff00')
        )
    }
}

module.exports.devCommand = true;