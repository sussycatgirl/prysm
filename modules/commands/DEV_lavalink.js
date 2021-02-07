const data = require('../../bot');
const client = data.client;
const Discord = require('discord.js');
const shoukakuModule = require('../bot/shoukakuSetup');

module.exports = {
    name: 'lavalink',
    aliases: ["lava"],
    flag: 1000,
    /**
     * 
     * @param {Discord.Message} message 
     * @param {Array<string>} args 
     */
    async execute(message, args) {
        let nodes = shoukakuModule.shoukaku.nodes;
        
        if (!args[0]) args[0] = '';
        switch(args[0].toLowerCase()) {
            case 'addnode':
            case 'add':
                let lavaServer = shoukakuModule.nodePresets.LavalinkServer;

                lavaServer[0].name = `node_${message.id}`;

                let optionArgs = args;
                optionArgs.shift();
                ['host', 'port', 'auth', 'name'].forEach(str => {
                    optionArgs.forEach(arg => {
                        if (arg.toLowerCase().startsWith(str + '=')) lavaServer[0][str] = arg.substr(str.length + 1, arg.length);
                    });
                });
                if (lavaServer[0].auth?.toLowerCase() == 'none') lavaServer[0].auth = null;

                shoukakuModule.shoukaku.addNode(lavaServer[0]);
                let newNode = shoukakuModule.shoukaku.nodes.get(lavaServer[0].name);
                //shoukakuModule.addDefaultEvents(newNode);

                let pass = lavaServer[0].auth;
                let msg = message.channel.send(
                    new Discord.MessageEmbed()
                    .setTitle('New node summoned')
                    .setDescription(`Name: ${newNode.name}\n`
                        + `Host: ${lavaServer[0].host}\n`
                        + `Port: ${lavaServer[0].port}\n`
                        + `Pass: ${pass ? pass.substr(0, 6) + '\\*\\*\\*\\*\\*\\*\\*\\*\\*\\*' : '(None)'}`)
                    .setFooter('Status: Connecting...')
                )

                // this is so stupid
                let readyFunc = (nodeName) => {
                    if (nodeName != newNode.name) return;
                    newNode.shoukaku.removeListener('ready', readyFunc);
                    newNode.shoukaku.removeListener('disconnected', errFunc);
                    msg.then(msg => msg.edit(msg.embeds[0].setFooter('Status: Connected')));
                }, errFunc = (nodeName) => {
                    if (nodeName != newNode.name) return;
                    newNode.shoukaku.removeListener('ready', readyFunc);
                    newNode.shoukaku.removeListener('disconnected', errFunc);
                    msg.then(msg => msg.edit(msg.embeds[0].setFooter('Status: Failed to connect')));
                }
                newNode.shoukaku.on('ready', readyFunc);
                newNode.shoukaku.on('disconnected', errFunc);
            break;

            case 'listnodes':
            case 'list':
            case 'ls':
                let nodeSize = nodes.size;
                let out = '';
                if (!args[1]) {
                    nodes.forEach(node => {
                        out += `**${node.name}** (${node.url})\n`;
                        out += `State: ${node.state}\n`;
                        out += `Reconnects: ${node.reconnectAttempts}\n`;
                        out += `Players: ${node.players.size}\n`;
                        out += '\n';
                    });
                } else {
                    if (!nodes.get(args[1])) out = `Node '${args[1]}' could not be found.`
                    else {
                        let node = nodes.get(args[1]);
                        out += `**${node.name}** (${node.url})\n`;
                        out += `State: ${node.state}\n`;
                        out += `Reconnects: ${node.reconnectAttempts}\n`;
                        out += `Players: Total ${node.stats.players}, Playing ${node.stats.playingPlayers}\n`;
                        out += `Stats:\n`;
                        out += `- CPU: ${Math.round(node.stats.cpu.lavalinkLoad)}% on ${node.stats.cpu.cores} cores\n`;
                        out += `- RAM: ${node.stats.memory.used} used\n`;
                        out += `- Uptime: ${node.stats.uptime}\n`;
                        out += `- FrameStats:\n`;
                        out += `-- Sent: ${node.stats.frameStats ? node.stats.frameStats.sent : 'None'}\n`
                        out += `-- Nulled: ${node.stats.frameStats ? node.stats.frameStats.nulled : 'None'}\n`
                        out += `-- Deficit: ${node.stats.frameStats ? node.stats.frameStats.deficit : 'None'}\n`
                    }
                }
                message.channel.send(
                    new Discord.MessageEmbed()
                    .setTitle(`${nodeSize} node${nodeSize != 1 ? 's' : ''}`)
                    .setDescription(out.substr(0, 2000) || 'No nodes available')
                )
            break;

            case 'removenode':
            case 'remove':
            case 'destroy':
            case 'terminate':
            case 'delete':
            case 'death':
            case 'kill':
            case 'rm':
                if (!args[1]) return message.channel.send(`You need to tell me which node to ${args[0].toLowerCase() != 'death' ? 'destroy' : 'commit die'}!`);

                let node = shoukakuModule.shoukaku.nodes.get(args[1]);
                if (!node) return message.channel.send('Node not found.');
                
                // Move all players to a different node, if available
                let newNodes = Array.from(nodes).filter(n => n[1].name != node.name);
                let p = []; // Stores the promises
                if (nodes.size >= 2) {
                    node.players.forEach(player => {
                        let newNode = newNodes[Math.round(Math.random() * newNodes.length-1)]?.[0];
                        if (newNode) {
                            console.log(`Moving ${player.voiceConnection.guildID} to ${newNode}`);
                            p.push(player.moveToNode(newNode));
                        }
                    });
                }
                
                if (p.length > 0) message.channel.send('Moving players to different nodes...');
                await Promise.allSettled(p);
                shoukakuModule.shoukaku.removeNode(args[1], `Node has been removed by ${message.author.id} ${message.author.tag}.`);
                
                message.channel.send('Node has been killed successfully.');
            break;
            
            case 'move':
                try {
                    if (!args[2]) return message.channel.send(`Missing argument: \`dev lava move [PLAYER] [NODE]\``);

                    let player = shoukakuModule.shoukaku.getPlayer(args[1] == 'this' ? message.guild.id : args[1]);
                    if (!player) return message.channel.send(`I can\'t find this player; Use either the guild ID or 'this'.`);

                    let toNode = shoukakuModule.shoukaku.nodes.get(args[2]);
                    if (!toNode) return message.channel.send(`I can't find that node.`);

                    await player.moveToNode(toNode.name);
                    message.channel.send(`Moved player \`${player.voiceConnection.guildID}\` to \`${toNode.name}\`.`);
                } catch(e) {
                    console.error(e);
                    message.channel.send('' + e);
                }
            break;
            
            case 'moveall':
                try {
                    if (!args[1]) return message.channel.send(`You need to tell me from which node to move players!`);
                    let fromNode = shoukakuModule.shoukaku.nodes.get(args[1]);
                    if (!fromNode) return message.channel.send(args[1] + ': Node not found.');

                    if (!args[2]) return message.channel.send(`You need to tell me to which node to move players!`);
                    let targetNode = shoukakuModule.shoukaku.nodes.get(args[2]);
                    if (!targetNode) return message.channel.send(args[2] + ': Node not found.');

                    let promises = [];
                    fromNode.players.forEach(player => {
                        promises.push(player.moveToNode(targetNode.name));
                    });

                    await Promise.allSettled(promises);
                    message.channel.send(`Moved ${promises.length} players to \`${targetNode.name}\`.`);
                } catch(e) {
                    console.error(e);
                    message.channel.send('' + e);
                }
            break;
            
            default:
                return message.channel.send(
                    new Discord.MessageEmbed()
                    .setDescription('Valid options:\n- addnode\n- removenode\n- listnodes\n- move\n- moveall')
                )
        }
    }
}

module.exports.devCommand = true;