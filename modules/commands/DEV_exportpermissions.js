const data = require('../../bot');
const fs = require('fs');
const { Message } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    name: 'exportpermissions',
    aliases: ["exportperms"],
    flag: 1000,
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    execute(message, args) {
        message.channel.send('Export started, finished file will be sent to your DMs');
        let exported_json = {}
        data.db.permissionFlags.forEach((value, key) => {
            exported_json[key] = value;
        });
        fs.writeFile(`./data-storage/export-files/permission-export-${message.id}.json`, JSON.stringify(exported_json, null, 4), function(err) {
            const attachemnt = new Discord.MessageAttachment(`./data-storage/export-files/permission-export-${message.id}.json`);
            message.author.send(attachemnt);
        });
    }
}

module.exports.devCommand = true;