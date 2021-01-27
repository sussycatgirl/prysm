const Discord = require('discord.js');
const { client } = require('../../bot');
const config = require('../../config.json');
const Enmap = require('enmap');
const { getPrefix } = require('../../functions/getPrefix');
const reminders = new Enmap({ name: 'reminders', polling: true, fetchAll: true });

let timeouts = [];

module.exports = {
    setReminder(user, time, msg, message) {
        let userReminders = reminders.get(user.id);
        if (!userReminders) {
            reminders.set(user.id, {});
            userReminders = reminders.get(user.id);
        };
        userReminders[message.id] = {}; 
        userReminders[message.id].time = time;
        userReminders[message.id].msg = msg;
        userReminders[message.id].url = message.url;
        userReminders[message.id].createdAt = message.createdTimestamp;
        reminders.set(user.id, userReminders);

        this.setTimeouts();
        let doneEmbed = new Discord.MessageEmbed()
        .setTitle('Reminder set!')
        .setDescription(`You will receive a DM when your reminder is due.\nTo delete your reminders, type ${config.prefix}remindme delall.`)
        .setThumbnail('https://cdn.discordapp.com/attachments/670669491956482049/705452981101002843/checksecondary61.gif')
        .setFooter('Reminder set for')
        .setTimestamp(time)
        .setColor('04d3c3');
        message.channel.send(doneEmbed);
    },
    delReminder(user, time, timer) {

    },
    delAllReminders(user) {
        reminders.delete(user.id);
        this.setTimeouts();
    },
    setTimeouts() {
        // So this sets the timeouts for each reminder. Don't ask me how it works, it just does.
        timeouts.forEach(t => {
            clearTimeout(t);
        })
        timeouts = [];
        reminders.keyArray().forEach(u => {
            Object.keys(reminders.get(u)).forEach(o => {
                try {
                    const now = Date.now();
                    const details = reminders.get(u)[o];
                    const timer = details.time - now;
                    timeouts.push(setTimeout(function() {
                        let mesg = new Discord.MessageEmbed()
                        .setTitle('Here\'s your reminder!')
                        .setDescription(
                            `${details.msg ? `> ${
                                details.msg.replace(new RegExp('\n', 'g'), '')}\n[Jump to message](${details.url})` : `You didn't set a message, click [here](${details.url}) to show context`
                            }`
                        )
                        .setFooter(`You received this message because you used the ${getPrefix()}remindme command.`)
                        .setTimestamp(details.createdAt)
                        .setColor('4f545c')
                        if (client.users.cache.get(u)) client.users.cache.get(u).send(mesg).catch(console.warn);
                        let l = reminders.get(u);
                        delete l[o];
                        reminders.set(u, l);
                        delete l;
                    }, timer));
                } catch(e) {
                    console.error(e);
                }
            });
        })
    }
}

module.exports.meta = {
    name: 'reminder_manager',
    priority: 6
}

module.exports.run = () => {
    require('./remindmeManager.js').setTimeouts(); // Start all timers
}