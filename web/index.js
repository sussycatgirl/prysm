require('dotenv').config();

const PORT = process.env.WEB_PORT || 3001;
const BASE_URL = process.env.WEB_BASE_URL || `http://localhost:${PORT}`;
process.env.SCOPES = 'identify%20guilds';

const fs = require('fs');
const bodyParser = require('body-parser');
const Express = require('express');
const enableWs = require('express-ws');
const session = require('express-session');
const app = Express();
const axios = require('axios').default;

enableWs(app);

let { client } = require('../bot');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('views', __dirname + '/views');

app.set('view engine', 'ejs');
app.set('trust proxy', 2);

const SQLiteStore = require('connect-sqlite3')(session);
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV == 'production' ? true : false
    },
    store: new SQLiteStore
}));


let server = app.listen(PORT, async () => {
    console.log(`Express => Running on Port \x1b[33m${PORT}\x1b[0m`);
    await new Promise(resolve => client.once('ready', resolve));
    
    let inviteURL = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands&permissions=607505494`;
    let loginUrl = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&redirect_uri=${BASE_URL}/oauth2/authorized&response_type=code&scope=${process.env.SCOPES}&prompt=none`;
    
    
    app.use('/assets', Express.static('web/views/assets'));
    
    app.get('/oauth2/authorized', (req, res) => {
        require('./oauth2').signin(req, res);
    });
    
    app.get('/oauth2/logout', (req, res) => {
        req.session['oauth2'] = undefined;
        req.session['user'] = undefined;
        req.session['logged_in'] = false;
        res.redirect('/?logout=true');
    });
    
    require('./ws.js').init(app);
    
    app.get('/favicon.ico', (req, res) => res.sendFile(__dirname + '/views/favicon.ico'));
    app.get('/api*', (req, res) => require('./api')(req, res));
    app.get('/dashboard/server/:serverid/*', async (req, res) => {
        try {
            if (!client.user) return res.status(500).send('Server is still starting!');
            
            let path = `${__dirname}/views/${req.path.replace(req.params.serverid, ':serverid')}`;
            
            if (!req.session['user'])
                return res.redirect(`${loginUrl}&state=${Buffer.from(req.path).toString('base64')}`);
            let guild = await client.guilds.fetch(req.params.serverid);
            if (!guild) return res.redirect(loginUrl + `&state=${Buffer.from(req.path).toString('base64')}`);
            
            res.render(path, { 
                user: req.session['user'] || {}, 
                inviteURL, loginUrl, guild,
                page_b64: Buffer.from(req.path).toString('base64')
            });
        } catch(e) {
            console.warn(e);
            res.status(500).send('Internal server error');
        }
    });
    
    app.get('/*', async (req, res) => {
        try {
            if (!client.user) return res.status(500).send('Server is still starting!');
            let path = __dirname + '/views' + req.path;
            
            if (!req.session['user'] && req.path.startsWith('/dashboard'))
                return res.redirect(`${loginUrl}&state=${Buffer.from(req.path).toString('base64')}`);
            
            res.render(path, {
                inviteURL, loginUrl,
                user: req.session['user'] || {},
                page_b64: Buffer.from(req.path).toString('base64')
            });
        } catch(e) {
            console.warn(e);
            res.status(500).send('Internal server error');
        }
    });

    // Handle 404 and 500
    // i know this is fucking stupid
    app.use(function(error, req, res, next) {
        if (`${error}`.startsWith('Error: Failed to lookup view')) {
            res.status(404).render('404.ejs');
        } else {
            console.warn(error);
            res.status(500).send('Internal Server Error');
        }
    });
});
