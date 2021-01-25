const { client } = require('../bot');
const OAuth2 = require('discord-oauth2');
const oauth = new OAuth2({ clientId: client.user.id, clientSecret: process.env.CLIENT_SECRET, redirectUri: process.env.WEB_BASE_URL + '/oauth2/authorized' });

const Express = require('express');

/**
 * 
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 */
module.exports.signin = async (req, res) => {
    try {
        let code = req.query.code;
        if (!code) return res.status(403).send('No code provided');

        const grant = await oauth.tokenRequest({
            grantType: 'authorization_code',
            code: code,
            scope: process.env.SCOPES || 'identify'
        });
        if (!grant.access_token) return res.status(403).send('Invalid code');

        const user = await oauth.getUser(grant.access_token);
        req.session['oauth2'] = grant;
        req.session['user'] = user;
        req.session['logged_in'] = true;

        console.log(`User ${user.username}#${user.discriminator} logged in`);

        res.redirect(req.query.state ? Buffer.from(req.query.state, 'base64').toString('ascii') : '/?logged_in=true');
    } catch(e) {
        res.status(500).send('error');
        console.error(e);
    }
}

module.exports.oauth = oauth;