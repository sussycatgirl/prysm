const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');
const url = require('url');

const Enmap = require('enmap');
const { getPrefix } = require('../../functions/getPrefix');
const images = new Enmap({ name: 'reaction_images', polling: true, fetchAll: true });

module.exports.name         = 'image';
module.exports.aliases      = ['img', 'r'];
module.exports.description  = 'Save an image once, then access it anywhere with this command';
module.exports.syntax       = "image [image name or 'save' or 'list' or 'delete']";
module.exports.guildOnly    = false;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'MANAGE_WEBHOOKS'];
module.exports.userPerms    = ['EMBED_LINKS', 'ATTACH_FILES'];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async (message, args) => {
    if (!message.member.permissions.has('ATTACH_FILES')) return message.channel.send('You can\'t send images here.');
    try {
        // add the user to the database or fix somehow corrupted entries idfk
        if (typeof images.get(message.author.id) != 'object') images.set(message.author.id, {});

        // what the fuck does the user want to do
        if (!args[0]) args[0] = '';
        switch (args[0].toLowerCase()) {
            case 'add':
            case 'save':
            case 'safe': // lol
                let link = message.attachments.first() ? message.attachments.first().url : args[2];
                let info = url.parse(link);
                console.log(info.hostname);
                console.log(info.hostname.match(/[cdn.]?discord[app]?.com/));
                if (!info.hostname.match(/(cdn.)?discord(app)?.com/)) 
                    return message.channel.send('You can only use Discord image URLs.');

                let allowed = false;
                [
                    '.png',
                    '.jpg',
                    '.jpeg',
                    '.jfif',
                    '.gif',
                    '.mp4',
                    '.flv',
                    '.mov',
                    '.webp',
                    '.webm'
                ]
                .forEach(str => {
                    if (info.pathname.endsWith(str)) allowed = true;
                });
            
                if (!allowed) return message.channel.send('This file type is not allowed.');
            
                let name = args[1];
                if (!args[1]) return message.channel.send('You need to tell me how to call the file.');
                name = name.toLowerCase();
            
                if ([
                    'add',
                    'save',
                    'safe',
                    'delete',
                    'del',
                    'yoink',
                    '',
                    'help',
                    'list',
                    'show',
                    'aaaaaaaaaaaaaaaaaaa'
                ].indexOf(name) > -1) return message.channel.send('You can\'t use that name!');
                if (name.length > 20) return message.channel.send('The name must be less than 20 characters long.');
            
                console.log(images.get(message.author.id, name));
                if (images.get(message.author.id, name)) return message.channel.send('You already have an image with that name!');
                if (Object.entries(images.get(message.author.id)).length >= 25) return message.channel.send('Sorry, you can\'t save more than 25 images.');
            
                let d = images.get(message.author.id);
                d[name] = link;
                images.set(message.author.id, d);

                message.react(':thumbsup:').catch(e => message.channel.send('Saved!'));
            break;
            case 'delete':
            case 'del':
            case 'yoink':
                let nom = args[0];
                if (!args[0]) return message.channel.send('You need to tell me what to delete!');
                nom = args[1].toLowerCase();
                if (!images.get(message.author.id, nom)) return message.channel.send('You don\'t have an image with that name saved.');
                let userdata = images.get(message.author.id);
                delete userdata[nom];
                images.set(message.author.id, userdata);
                message.channel.send(`Deleted \`${nom}\`!`);
            break;
            case 'show':
            case 'list':
                    let imgs = images.get(message.author.id);
                    let count = Object.keys(imgs).length;
                    if (!imgs || count == 0) return message.channel.send('You don\'t have any saved images.');


                    let emb = new Discord.MessageEmbed()
                        .setTitle(`${count} image${count != 1 ? 's' : ''}`)
                        .setColor(0x2f3136);

                    let i = 0;

                    Object.entries(imgs).forEach(([key, value]) => {
                        i += 1;
                        if (i <= 25) {
                            emb.addField(key, `[View image](${value})`, Object.keys(imgs).length > 3);
                        } else emb.setFooter('Only the first 25 entries are shown.');
                    });

                    message.channel.send(emb);
            break;
            case 'deleteall':
            case 'delall':
                    let all = images.get(message.author.id);
                    all = all ? all.size : 0;
                    images.delete(message.author.id);
                    message.channel.send(`Deleted ${all} images.`);
            break;
            case '':
            case 'help':
                let prefix = getPrefix(message.guild);
                message.channel.send(
                    new Discord.MessageEmbed()
                        .setTitle('Help - Saving images')
                        .setDescription(`This feature allows you to save images and then quickly access them with one command.`)
                        .addField(`Saving images`, `To save an image, type:\n> ${prefix}r save [Name] [Image URL]`)
                        .addField(`Sending an image`, `To send an image, simply type:\n> ${prefix}r [Name]`)
                        .addField(`List all saved images`, `List all images using this command:\n> ${prefix}r list`)
                        .addField(`Deleting images`, `You can delete a single image by typing:\n> ${prefix}r delete [Name]\nYou can delete all images at once using:\n> ${prefix}r deleteall`)
                        .setColor('2f3136')
                        .setFooter('Tip: You can also attach an image to your message instead of including the image URL.')
                );
            break;
            default:
                let data = images.get(message.author.id, args[0]);
                console.log(data);
                if (!data) return message.channel.send('I can\'t find that image.');

                if (message.guild) {
                    let webhook;
                    let hooks = (await message.channel.fetchWebhooks()).array();
                    let index = 0;
                    while (hooks[index] && !webhook) {
                        if (hooks[index].type != 'incoming') webhook = hooks[index];
                        index++;
                    }

                    if (!webhook && hooks.length < 10) webhook = await message.channel.createWebhook('Prysm', {avatar: client.user.avatarURL()});
                    else if (hooks.length >= 10) return message.channel.send(`*I am unable to create a webhook.*`, {files: [data]})
                    .catch(error => message.channel.send(`Failed to send: ${error}`));

                    webhook.send({
                        files: [data],
                        username: message.member.displayName,
                        avatarURL: message.author.displayAvatarURL()
                    })
                    .then(() => {
                        if (message.deletable) message.delete();
                    })
                    .catch(e => message.channel.send(`*I am unable to create a webhook.*`, {files: [data]})
                    .catch(error => message.channel.send(`Failed to send: ${error}`)));
                } else {
                    message.channel.send({files: [data]}).catch(error => message.channel.send(`Failed to send: ${error}`));
                }
        }
    } catch(e) {
        console.error(e);
        message.channel.send('An error has occurred: ' + e);
    }
}

module.exports.db = images;
