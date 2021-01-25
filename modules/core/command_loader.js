const Discord = require('discord.js');
const data = require('../../bot');
const client = data.client;
var readline = require('readline');

const fs = require('fs');

module.exports.commands = new Discord.Collection();
module.exports.available = 0;
module.exports.disabled = 0;
module.exports.run = (verbose = true) => {
    if (verbose) process.stdout.write('Loading commands');

    this.available = 0;
    this.disabled = 0;

    // Load all files in the commands folder
    const commandFiles = [];
    fs.readdirSync('modules/commands').filter(file => file.endsWith('.js')).forEach(file => commandFiles.push('../commands/' + file));
    fs.readdirSync('modules/external_commands').filter(file => file.endsWith('.js')).forEach(file => commandFiles.push('../external_commands/' + file));
    for (const file of commandFiles) {
        if (verbose) readline.clearLine(process.stdout);
        if (verbose) readline.cursorTo(process.stdout, 0);
        if (verbose) process.stdout.write(`[Shard ${client.shard.ids[0]}] Loading commands ${'\x1b[34m'}${file}${'\x1b[0m'}`);
        
        const command = require(file);
        if (!command.devCommand) {
            this.commands.set(command.name, command);
            if (command.disabled || command.dev_only) this.disabled += 1; else this.available += 1;
        }
    }
    if (verbose) readline.clearLine(process.stdout);
    if (verbose) readline.cursorTo(process.stdout, 0);
    if (verbose) process.stdout.write(`[Shard ${client.shard.ids[0]}] Loaded ${this.commands.size} commands.\n`);
}
module.exports.reloadAll = () => {
    const commandFiles = [];
    fs.readdirSync('modules/commands').filter(file => file.endsWith('.js')).forEach(file => commandFiles.push('../commands/' + file));
    fs.readdirSync('modules/external_commands').filter(file => file.endsWith('.js')).forEach(file => commandFiles.push('../external_commands/' + file));

    for (const file of commandFiles) {
        var name = require.resolve(file);
        delete require.cache[name];

        const command = require(file);
        if (!command.devCommand) {
            this.commands.set(command.name, command);
        }

        console.log(`[Shard ${client.shard.ids[0]}] Reloaded ${file}`);
    }
    console.log(`[Shard ${client.shard.ids[0]}] Reloaded all commands.`);
}

module.exports.meta = {
    name: 'command_loader',
    priority: 1
}