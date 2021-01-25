module.exports = {
    name: 'reloadcommands',
    aliases: ["rlcmds", "reloadcmds", "rlc"],
    flag: 1000,
    execute(message, args) {
        require('../core/command_loader').reloadAll();
        message.channel.send('Reloading.');
    }
}

module.exports.devCommand = true;