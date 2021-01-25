const data = require('../../bot');
const fs = require('fs');
const { Message } = require('discord.js');
const Discord = require('discord.js');
const Enmap = require('enmap');

const reminders = new Enmap({ name: 'reminders', polling: true, fetchAll: true });

module.exports = {
    name: 'delreminders',
    aliases: ["deletereminders", "deletereminder", "delreminder"],
    flag: 1000,
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    execute(message, args) {
        reminders.deleteAll(); // Clear the enmap
        require('../bot/remindmeManager').setTimeouts(); // Clear and (re-)set all timeouts
        message.channel.send('Successfully removed all reminders.');
    }
}

module.exports.devCommand = true;