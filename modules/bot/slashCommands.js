const Discord = require('discord.js');
const { client } = require('../../bot');
const config = require('../../config.json');
const Enmap = require('enmap');
const fs = require('fs');
const { DiscordInteractions } = require("slash-commands");

const bodyParser = require('body-parser');
const Express = require('express');
const app = Express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

if (!process.env.ENABLE_SLASH) return;
const port = process.env.SLASH_PORT || 3000;
const publicKey = process.env.PUBLIC_KEY;
const endpoint = process.env.SLASH_ENDPOINT || '/';


(async function() {
    await awaitLogin();
    let interaction = new DiscordInteractions({ applicationId: client.user.id, authToken: client.token, publicKey: publicKey });
    await updateCommandList(interaction).catch(console.warn);
    
    module.exports.interaction = interaction;
})();

module.exports.run = async () => {    
    app.listen(port, () => console.log('[Slash] Listening on port ' + port));
}

const commands = fs.readdirSync('modules/commands/slash').filter(cmd => cmd.endsWith('.js'));

// Listen for POST requests to the specified API endpoint
app.post(endpoint, async (req, res) => {
    if (!client.readyAt) return;
    try {
        if (!(await checkSig(req, res))) return;

        const body = req.body;
        if (!body) return console.log('[Slash] Received POST with empty body; aborting');

        console.log('[Slash] POST received');

        // Interactions endpoint verification
        if (body.type == 1) {
            res.status(200).send({ type: 1 });
            console.log('[Slash] Server sent a PING');
            return;
        }
        
        const cmd = new SlashCommand(body);
        
        //cmd.webhook.send('you used the command ' + cmd.command_name + ' with arguments ' + JSON.stringify(cmd.data.options));
        
        let c = '../commands/slash/' + (commands.filter(c => c.split('.js')[0].toLowerCase() == cmd.command_name));
        
        /**
         * Interaction response codes:
         * https://discord.com/developers/docs/interactions/slash-commands#interaction-interaction-response
         */
        
        let exists = true;
        try { require(c) } catch(e) { exists = false }
        c = exists ? require(c) : null;
        if (!c || !c.execute || typeof c.execute != 'function') return res.status(200).send({ 
            type: 4, 
            data: { 
                content: `Error: The command \`${cmd.command_name}\` does not exist or is misconfigured.` 
            } 
        });

        if (c.requireGuildMember && !cmd.botIsGuildMember) return res.status(200).send({
            type: 4, 
            data: { 
                embeds: [
                    new Discord.MessageEmbed()
                    .setDescription(`To use this command, I need to be a member of this guild. Click [here](https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands&permissions=1073216886&guild_id=${cmd.guild_id}) to invite me.`)
                ]
            }
        });

        try {
            if (c.sendConfirmation != 'callback') res.status(200).send({ type: c.sendConfirmation ? 5 : 2 });
            require('./statusMessage').cmdExec();
            c.execute(cmd, (sendMsg, ephemeral) => {
                // retarded code
                let isEmbed = sendMsg instanceof Discord.MessageEmbed;
                if (c.sendConfirmation == 'callback') res.status(200).send({ 
                    type: (sendMsg == true && ephemeral == false) ? 5 : (sendMsg == false && ephemeral == false) ? 2 : (ephemeral ? 3 : 4), 
                    data: typeof sendMsg == 'string' || typeof sendMsg == 'object' ? 
                    (
                        isEmbed ? {
                            embeds: [
                                sendMsg
                            ],
                            content: '',
                            flags: ephemeral ?  1 << 6 : undefined
                        } : {
                            content: sendMsg,
                            flags: ephemeral ?  1 << 6 : undefined
                        }) : undefined
                });
            });
        } catch(e) {
            console.error(e);
            cmd.webhook.send(`<@${cmd.member.id}>: An error has ocurred: ${e}`);
        }
    } catch(e) {
        console.error(e);
        res.status(501).send('The server is ded');
    }
});




/**
 * Do the signature verification and send 401 if it doesn't match
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
const checkSig = async (req, res) => {
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    const rawBody = JSON.stringify(req.body);

    let isVerified = await this.interaction.verifySignature(signature, timestamp, rawBody);

    if (!isVerified) {
        res.status(401).send('no');
        console.log('[Slash] Failed to verify signature of incoming request');
        return false;
    } else return true;
}




module.exports.meta = {
    name: 'slash_commands',
    priority: 10
}


// shitass class that makes it easier to work with the api response
class SlashCommand {
    constructor(data) {
        try {
            const guild = client.guilds.cache.get(data.guild_id);

            this.type = data.type;
            this.token = data.token;
            this.member = guild ? guild.members.cache.get(data.member.user.id) : data.member;
            this.id = data.id;
            this.guild_id = data.guild_id;
            this.data = {
                options: data.data.options,
                name: data.data.name,
                id: data.data.id
            };
            this.channel_id = data.channel_id;
            this.command_name = data.data.name;
            this.webhook = new Discord.WebhookClient(client.user.id, this.token, {});
            this.botIsGuildMember = guild ? true : false;
        } catch(e) {
            console.error(e);
        }
    }
}
module.exports.SlashCommand = SlashCommand;

async function awaitLogin() { return new Promise(async (resolve, reject) => client.on('ready', resolve)) }

/**
 * 
 * @param {import('slash-commands').DiscordInteractions} interaction 
 */
async function updateCommandList(interaction) {
    return new Promise(async (resolve, reject) => {
        try {
            const commandList = require('../../slash_commands.json');
            
            // This refreshes the slash commands globally (null) and, if given, in the test guild (process.env.SLASH_TEST_GUILD_ID).
            const gs = [null];
            if (process.env.SLASH_TEST_GUILD_ID) gs.push(process.env.SLASH_TEST_GUILD_ID);
            
            gs.forEach(async G => {
                console.log('[Slash] ' + (G ? `Updating slash commands for ${G}` : 'Updating global slash commands'));
                let commands = await interaction.getApplicationCommands(G);
                if (!(commands instanceof Array)) commands = [];
                
                const toCreate = commandList.filter(c => !commands.find(co => co.name == c.name));
                const toDelete = commands.filter(c => !commandList.find(co => co.name == c.name));
                const toUpdate = commands.filter(c => {
                    const cmd = commandList.find(co => co.name == c.name);
                    return (
                        (
                            cmd?.description != c?.description ||
                            JSON.stringify(cmd.options) != JSON.stringify(c.options)
                        ) && !toDelete.find(dCMD => dCMD.name == cmd?.name)
                    );
                });
                
                if (toCreate.length == 0 && toUpdate.length == 0 && toDelete.length == 0)
                    console.log(`[Slash] [${G ?? 'Global'}] Commands are up to date!`);
                
                toCreate.forEach(async cmd => {
                    console.log(`[Slash] [${G ?? 'Global'}] Creating command ${cmd.name}`);
                    await interaction.createApplicationCommand(cmd, G);
                });
                
                toDelete.forEach(async cmd => {
                    console.log(`[Slash] [${G ?? 'Global'}] Deleting command ${cmd.name}`);
                    await interaction.deleteApplicationCommand(cmd.id, G);
                });
                
                toUpdate.forEach(async cmd => {
                    console.log(`[Slash] [${G ?? 'Global'}] Patching command ${cmd.name}`);
                    await interaction.editApplicationCommand(cmd.id, cmd, G);
                });
                
                resolve();
            });
        } catch(e) {
            console.error(e);
            reject();
        }
    });
}