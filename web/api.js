const { request, response } = require('express');
const { client } = require('../bot');
const { Permissions } = require('discord.js');
const { oauth } = require('./oauth2');

const cache = {}

/**
 * Handles requests to the /api endpoint
 * @param {request} req 
 * @param {response} res 
 */
module.exports = async (req, res) => {
    try {
        // Ah yes cookie authentification
        if (!req.session.logged_in) return res.status(403).send('Unauthorized');
        
        switch(req.path.split('/api/')[1]) {
            case 'servers':
                let access_token = req.session.oauth2?.access_token;
                if (!access_token || !req.session?.logged_in) return res.status(403).send('Unauthorized');
                
                // Return cached result, if possible
                let cached = cache[`guilds:${req.query.accessibleOnly ? 'accessible' : 'all'}:${req.session?.user?.id}`];
                if (cached) return res.send(cached);
                
                let guilds = [];
                (await oauth.getUserGuilds(access_token)).forEach(guild => {
                    guild.botIsMember = !!client.guilds.cache.get(guild.id);
                    guilds.push(guild);
                });
                let temp = guilds;
                guilds = [];
                temp.forEach(guild => { guild.memberIsMod = new Permissions(guild.permissions || 0).has('MANAGE_GUILD'); guilds.push(guild) });
                if (req.query.accessibleOnly) guilds = guilds.filter(async guild => new Permissions(guild.permissions || 0).has('MANAGE_GUILD'));
                res.send(guilds);
                if (req.session?.user?.id) {
                    // Cache the result
                    cache[`guilds:${req.query.accessibleOnly ? 'accessible' : 'all'}:${req.session?.user?.id}`] = guilds;
                    // Clear the cached result after 1 minute
                    setTimeout(() => cache[`guilds:${req.query.accessibleOnly ? 'accessible' : 'all'}:${req.session?.user?.id}`] = null, 60000);
                };
            break;
            default:
                res.status(404).send('404 Not found');
        }
    } catch(e) {
        console.error(e);
        if (res.writable) res.status(500).send('Internal server error');
    }
}