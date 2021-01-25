require('dotenv').config();

const request = require('request'); // i know its deprecated but axios doesnt work for some reason
const Express = require('express');
const app = Express();
const ip = require("ip").address();

const client_secret = process.env.CLIENT_SECRET;
const client_id = process.env.CLIENT_ID;
const redir_uri = 'http://localhost:3069/done'
if (!client_id || !client_id) return console.log(`No CLIENT_ID or CLIENT_SECRET env var found`);

/**
 * Redirect URI "http://localhost:3069/done" must be registered in the OAuth2 config panel of the app.
 */

app.get('/', (req, res) => {
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${client_id}&redirect_uri=${redir_uri}&response_type=code&scope=identify%20guilds.join`);
});

app.get('/done', async (req, res) => {
    try {
        if (!req.query.code) 
            return res.send('No access code found in request');
        
        console.log(`Got code ${req.query.code} - exchanging for access token`);
        
        const data = {
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'authorization_code',
        'code': req.query.code,
        'redirect_uri': redir_uri,
        'scope': 'identify guilds.join'
        }
        const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
        }

        request.post('https://discord.com/api/v6/oauth2/token', { headers: headers, form: data }, (err, resp, body) => {
            if (err) return console.error(err);
            console.log(body);
            body = JSON.parse(body);
            
            if (body.error) return res.send(body);
            else {
                request.get('https://discord.com/api/v6/users/@me', { headers: {Authorization: `Bearer ${body.access_token}` } }, (err2, resp2, body2) => {
                    if (err2) return console.error(err2);
                    console.log(body2);
                    body2 = JSON.parse(body2);
                    
                    res.send(
                        `<p>${body2.id} - ${body2.username}#${body2.discriminator}<br/><br/>` + 
                        `Access token: ${body.access_token}<br/>` +
                        `Refresh token: ${body.refresh_token}<br/><br/>` +
                        `Use '~dev register_token ${body2.id} ${body.access_token}'<br/><br/></p>` +
                        `<a href="/">Authorize again</a>`
                    );
                });
            }
        });
    } catch(e) {
        console.error(e);
        if (!res.writableFinished) res.status(500).send('Internal server error');
    }
});

app.listen(3069, () => 
    console.log(`Server running on port 3069. Visit http://localhost:3069 ${ip ? `or http://${ip}:3069 ` : ''}to get an OAuth2 token.`));