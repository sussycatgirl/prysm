const { SlashCommand } = require('../../bot/slashCommands');
const { InteractionResponseType: resType } = require('discord-interactions');
const Discord = require('discord.js');
const chrono = require('chrono-node');
const { client } = require('../../../bot');

/**
 * 
 * @param {SlashCommand} cmd
 * @param {function(String, import('discord.js').MessageEmbed | false, resType, boolean) : void} callback
 */
module.exports.execute = async (cmd, callback) => {
    let reminderTextInput = cmd.data.options.find(d => d.name == 'reminder')?.value;
    let timeInput         = cmd.data.options.find(d => d.name == 'time'    )?.value;
    
    let reminderText,
        reminderTime,
        reminderTimeInput;
    
    if (timeInput) {
        reminderText = reminderTextInput;
        reminderTime = chrono.parseDate(timeInput);
        if (!reminderTime) {
            reminderTime = chrono.parseDate('in ' + timeInput);
        }
    } else {
        let input = chrono.parse(reminderTextInput);
        if (input?.[0]) {
            reminderTimeInput = input[0].text;
            reminderText = reminderTextInput
                .replace(input[0].text, '')
                .trim();
            reminderTime = input[0].date();
        }
    }
    
    reminderText = reminderText?.replace(/`/g, '\'');
    
    if (!reminderText || !reminderTime) {
        callback(
            `Sorry, I can't parse that. Make sure to clearly tell me for when you want your reminder to be set.`,
            false,
            resType.CHANNEL_MESSAGE_WITH_SOURCE,
            true
        );
    } else if (reminderTime.getTime() + 10 < Date.now()) {
        callback(
            `How do you expect me to remind your past self? I can't time travel, you know?`,
            false,
            resType.CHANNEL_MESSAGE_WITH_SOURCE,
            true
        );
    } else {
        callback(
            null,
            new Discord.MessageEmbed()
                .setAuthor('Reminder set')
                .setDescription(`\`${reminderText}\` ${reminderTimeInput || timeInput || ''}`)
                .setTimestamp(reminderTime),
            resType.CHANNEL_MESSAGE_WITH_SOURCE,
            false
        );
        
        require('../../bot/remindmeManager.js').setReminder(
            await client.users.fetch(cmd.member?.id),
            reminderTime,
            reminderText,
            {
                isSlash: true,
                id: cmd.id,
                createdAt: Date.now()
            });
    }
}

module.exports.sendConfirmation = 'callback';