const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const { getTimeInput } = require('../../functions/getTimeInput');
const Enmap = require('enmap');
const { getFlags } = require('../../functions/permission_flags');
const config = require('../../config.json');
const reminders = new Enmap({ name: 'reminders', polling: true, fetchAll: true });

module.exports.name         = 'remindme';
module.exports.aliases      = ['remind', 'reminder'];
module.exports.description  = 'Sends you a message after a certain period of time';
module.exports.syntax       = 'remindme [Delay (Example: 1d12h)] [Text]';
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
    if (!args[0]) args[0] = '';

    if (args[0].toLowerCase() == 'delall'
    ||  args[0].toLowerCase() == 'deleteall'
    ) {
        require('../bot/remindmeManager.js').delAllReminders(message.author);
        return message.channel.send('Deleted all reminders.');
    }
    
    let helpEmbed = new Discord.MessageEmbed()
    .setTitle('Remind me')
    .setDescription(`Sends you a message after a specific amount of time.`)
    .addField(`Setting a reminder`, `To set a reminder, simply type \`${config.prefix}remindme [Time] [Text]\`. \nExample: \`${config.prefix}remindme 10m Call Bob\``, false)
    .addField(`Deleting all reminders`, `To delete all reminders, simply type \`${config.prefix}remindme deleteall\`.`, false)
    .setColor('4f545c');

    if (args[0].toLowerCase() == 'help') {
        return message.channel.send(helpEmbed);
    }

    let helpStr = `Usage: ${config.prefix}remindme [Time] [Reminder]\nExample: ${config.prefix}remindme 30m Call Bob\nFor more info, use ${config.prefix}remindme help.`;
    if (!args[0]) return message.channel.send(helpEmbed);

    // Limit the maximum amount of reminders the user can have
    let flags = getFlags(message.author);
    let maxReminders = flags.MAXREMINDERS || 5;
    if (isNaN(maxReminders)) maxReminders = 5;
    delete flags;
    let userReminders = reminders.get(message.author.id);
    if (userReminders) if (userReminders.size >= maxReminders) return message.channel.send(`You can\'t have more then ${maxReminders} reminders at once.`);

    // Pass the data to the reminder manager
    let { delay, text } = getTimeInput(args.join(' '));
    if (!delay || delay < 1000) return message.channel.send(helpStr);
    require('../bot/remindmeManager.js').setReminder(message.author, delay + Date.now(), text || '', message);
}
