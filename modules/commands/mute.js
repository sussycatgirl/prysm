const Discord = require('discord.js');
const { client, db, modules } = require('../../bot');

const Enmap = require('enmap');

// Database that contains temp mutes
const tempmutes = new Enmap({ name: 'tempmutes', polling: true, fetchAll: true });
const muteroles = new Enmap({ name: 'muteroles', polling: true, fetchAll: true });

module.exports.tempmutes = tempmutes;
module.exports.muteroles = muteroles;

const { getPrefix } = require('../../functions/getPrefix');
const { getTimeInput } = require('../../functions/getTimeInput');
const { getUserFromMention } = require('../../functions/getMention');
const getGuildSettings = require('../../functions/getGuildSettings').get;

module.exports.name         = 'mute';
module.exports.aliases      = ['m'];
module.exports.description  = 'Mutes a user.';
module.exports.syntax       = 'mute [@User] [Mute duration?] [Reason?]';
module.exports.guildOnly    = true;
module.exports.dev_only     = false;
module.exports.disabled     = false;
module.exports.hidden       = false;
module.exports.botPerms     = ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_CHANNELS', 'MANAGE_ROLES'];
module.exports.userPerms    = ['MANAGE_ROLES'];

/**
 * @param {Discord.Message} message 
 * @param {Array} args 
 */
module.exports.execute = async function(message, args) {
    if (!message.member.permissions.has('MANAGE_ROLES')) return message.channel.send(embeds.accessDenied);

    let role = await this.generateRole(message.guild, message.channel);

    let targetuser = getUserFromMention(args[0]);
    if (!targetuser) return message.channel.send(embeds.noUserMention);
    let target = message.guild.members.cache.get(targetuser.id);
    if (!target) return message.channel.send(embeds.noUserMention);
    args.shift();


    let { delay, text } = getTimeInput(args.join(' '));

    if (target.permissions.has('ADMINISTRATOR')) return message.channel.send(embeds.adminMute);

    target.roles.add(role)
    .then(() => {
        let delayMin = delay / 1000 / 60;
        let delayString = delayMin > 60 ? `${Math.round(delayMin / 6) / 10} hour${Math.round(delayMin / 6) / 10 != 1 ? 's' : ''}` : `${Math.round(delayMin)} minute${Math.round(delayMin) != 1 ? 's' : ''}`;
        let mutedMSG = message.channel.send(
            new Discord.MessageEmbed()
            .setAuthor(target.user.tag, target.user.displayAvatarURL())
            .setTitle('User muted')
            .setDescription(`${target.user.username} has been muted${delay > 0 ? ` for ${delayString}` : ''}.`)
            .setColor('0DFF6E')
        )
        if (target.permissions.has('MANAGE_ROLES')) message.channel.send(embeds.selfUnmuteWarn);

        if (!target.user.bot && getGuildSettings(message.guild, 'moderation.dmOnMute')) {
            let dmEmbed = new Discord.MessageEmbed();
            dmEmbed.setTitle(`You have been muted in ${message.guild.name}.`);
            dmEmbed.setDescription(`[${message.author.tag}](${message.url}) has ${delay == 0 ? 'permanently ' : ''}muted you${delay == 0 ? '' : ` for ${delayString}`}${text ? `: ${text}` : '.'}`);
            dmEmbed.setColor('ff0000');

            if (message.attachments && message.attachments.first()) dmEmbed.setImage(message.attachments.first().url);
            
            target.user.send(dmEmbed)
            .catch(e => {
                console.error(e);
                mutedMSG.then(m => m.edit(m.embeds[0].setDescription(m.embeds[0].description + `\n${e}`))).catch();
            });
        }

        if (delay > 0) {
            let mutelist = tempmutes.get(message.guild.id);
            if (!mutelist) tempmutes.set(message.guild.id, {});
            if (!mutelist) mutelist = {};
    
            mutelist[target.id] = {
                expires: delay + Date.now(),
                length: delay,
                user: target.id,
                by: message.author.id,
                guild: message.guild.id,
                reason: text
            }
    
            tempmutes.set(message.guild.id, mutelist);
            setTimeout(() => {require('./mute').refreshTimeouts()}, 1000);
        }
    })
    .catch(e => {
        console.error(e);
        message.channel.send(
                new Discord.MessageEmbed()
                    .setAuthor(target.user.tag, target.user.displayAvatarURL())
                    .setTitle('Failed to mute')
                    .setDescription(`\`\`\`js\n${e}\n\`\`\``)
                    .setFooter(`Please contact the dev team (using ${getPrefix(message.guild)}feedback) if this problem re-occurs`)
                    .setColor('FF0000')
            )
            return;
    });
}

module.exports.sendUnmuteMsg = (mutemember) => {
    if (!mutemember.user.bot && getGuildSettings(mutemember.guild, 'moderation.dmOnMute')) {
        let dmEmbed = new Discord.MessageEmbed();
        dmEmbed.setAuthor(mutemember.guild.name, mutemember.guild.iconURL({dynamic: true}));
        dmEmbed.setTitle(`You have been unmuted.`);
        dmEmbed.setDescription(`Your mute has either expired or was manually removed.`);
        dmEmbed.setColor('0DFF6E');
        
        mutemember.user.send(dmEmbed)
        .catch(e => {
            console.error(e);
        });
    }
}


// Efficient code
let timeouts = []

module.exports.refreshTimeouts = function() {
    timeouts.forEach(t => clearTimeout(t)); // Stop previous timeouts

    tempmutes.keyArray().forEach(guild => {
        let guildmutes = tempmutes.get(guild);
        if (guildmutes) {
            try {
                Object.keys(guildmutes).forEach(userid => {
                    let mute = guildmutes[userid];

                    let guildObj = client.guilds.cache.get(mute ? mute.guild : null);
                    if (!guildObj) return;

                    guildObj.members.fetch({withPresences: false, user: mute.user}).then(mutemember => {
                        try {
                            // Delete the entry if the member lost the muted role
                            if (!mutemember) {
                                let b = tempmutes.get(mute.guild);
                                delete b[mute.user];
                                tempmutes.set(mute.guild, b);
                                delete b;
                            } else if (!mutemember.roles.cache.find(r => r.id == muteroles.get(guild))) {
                                let b = tempmutes.get(mute.guild);
                                delete b[mute.user];
                                tempmutes.set(mute.guild, b);
                                delete b;
                            } else {
                                timeouts.push(setTimeout(() => {
                                    try {
                                        let b = tempmutes.get(mute.guild);
                                        delete b[mute.user];
                                        tempmutes.set(mute.guild, b);
                                        delete b;

                                        // Check if user is still a member
                                        if (guildObj.members.cache.get(mutemember?.user?.id)) {
                                            mutemember.roles.remove(muteroles.get(guild))
                                            .then(() => {
                                                this.sendUnmuteMsg(mutemember);
                                            })
                                            .catch(e => {
                                                console.error(e);
                                            });
                                        }
                                    } catch(e) {
                                        console.error(e);
                                    }
                                }, mute.expires - Date.now()));
                            }
                        } catch(e) {
                            console.error(e);
                        }
                    });
                });
            } catch(e) {
                console.error(e);
            }
        }
    });
}

/**
 * 
 * @param {Discord.Guild} guild 
 * @param {Discord.TextChannel} channel
 */
module.exports.generateRole = async function(guild, channel) {

    let role = guild.roles.cache.get(muteroles.get(guild.id));
    if (role) return role;

    let infomsg = await channel.send('Creating muted role...');

    // Create a new role
    role = await guild.roles.create({
        data: {
            hoist: false,
            mentionable: false,                     // Make the role not mentionable
            name: 'Muted',                          // Give it a fancy name
            permissions: new Discord.Permissions(0) // Don't set any permissions for the role
        }, 
        reason: 'Created mute role for "mute" command'
    })
    muteroles.set(guild.id, role.id);

    infomsg.edit('Updating channel permission overrides...');

    // Set permission overwrites for every channel
    let failed = [];
    guild.channels.cache
    .filter(c => c.type != 'store')
    .forEach(c => {
        if (!c.manageable) failed.push(c.name);
        else { 
            c.updateOverwrite(role, {
                SEND_MESSAGES: false,
                ADD_REACTIONS: false,
                CONNECT: false
            }, 'Update permission overrides for muted role')
            .catch(e => {
                failed.push(c.name);
                console.error(e);
            });
        }
    });
    
    let m = failed.length ? `I failed to set permissions for \`@${role.name}\` in the following channel${failed.length > 1 ? 's:\n' : ': '}\`${failed.join(',\n')}\`\n\nGive Prysm permissions to manage that channel and run ${getPrefix(guild)}updatemute` : 'Muted role created!';
    if (m.length > 2000) m = m.substring(0, 1994) + '[...]';
    infomsg.edit(m, {disableMentions: "all"}).then(m => m.delete({timeout: 60000}));

    return role;
}


let embeds = {}

embeds.errorColor = 'ff0000';


embeds.noUserMention = new Discord.MessageEmbed()
    .setTitle('Invalid syntax')
    .setDescription('You need to @mention someone to mute.')
    .setColor(embeds.errorColor)
    .setTimestamp();

embeds.accessDenied = new Discord.MessageEmbed()
    .setTitle('Access denied')
    .setDescription('You don\'t have permission to use this command.')
    .setFooter('Required permission: MANAGE_ROLES')
    .setColor(embeds.errorColor)
    .setTimestamp();

embeds.selfUnmuteWarn = new Discord.MessageEmbed()
    .setDescription('The target has permission to manage roles, they might be able to remove the muted role from themself.')
    .setColor('2f3136');

embeds.adminMute = new Discord.MessageEmbed()
    .setDescription('You can\'t mute an Administrator.')
    .setColor('2f3136');
