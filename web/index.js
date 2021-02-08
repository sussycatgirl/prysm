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
    
    /**
     * 
     * @param {Express.Request} req 
     * @param {Express.Response} res 
     */
    const verifyGuildMember = async (req, res) => {
        const login = () => { res.redirect(`${loginUrl}&state=${Buffer.from(req.path).toString('base64')}`); return false }
        const send403 = () => { res.render(__dirname + '/views/403.ejs'); return false }
        if (!req.session['user'])
            return login();
        if (!(await client.guilds.fetch(req.params.serverid).catch(console.log))?.member(req.session['user']?.id)) return send403();
        else return true;
    }
    
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
    
    app.get('/dashboard/server/:serverid/logs/:type/:logid', async (req, res, next) => {
        try {
            if (await verifyGuildMember(req, res)) {
                let path;
                switch(req.params.type) {
                    case 'edit':
                        path = `${__dirname}/../temp/guildLogs/edited/${req.params.serverid}/${req.params.logid}.json`;
                        if (!path || !fs.existsSync(path)) return next(); // Essentially triggers a 404
                        res.render(__dirname + '/templates/edited_log.ejs', require(path));
                    break;
                    //case 'delete':
                    //    path = `${__dirname}/../temp/guildLogs/deleted/${req.params.serverid}/${req.params.logid}.json`;
                    //break;
                }
            }
        } catch(e) {
            console.warn(e);
            if (res.writable) res.status(500).send('Internal server error');
        }
    });
    
    app.get('/dashboard/server/:serverid/*', async (req, res) => {
        try {
            if (!client.user) return res.status(500).send('Server is still starting!');
            
            let path = `${__dirname}/views/${req.path.replace(req.params.serverid, ':serverid')}`;
            
            if (verifyGuildMember(req, res)) {
                res.render(path, { 
                    user: req.session['user'] || {}, 
                    inviteURL, loginUrl, guild,
                    page_b64: Buffer.from(req.path).toString('base64')
                });
            }
        } catch(e) {
            console.warn(e);
            if (res.writable) res.status(500).send('Internal server error');
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
            if (res.writable) res.status(500).send('Internal server error');
        }
    });

    // Handle 404 and 500
    // i know this is fucking stupid
    app.use(function(error, req, res, next) {
        if (`${error}`.startsWith('Error: Failed to lookup view')) {
            res.status(404).render('404.ejs');
        } else {
            console.warn(error);
            if (res.writable) res.status(500).send('Internal Server Error');
        }
    });
});
