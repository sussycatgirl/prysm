const { Shoukaku } = require('shoukaku');
const { client } = require('../../bot');


const LavalinkServer = [
    {
        name: 'default', 
        host: process.env.LAVALINK_HOST || 'localhost', 
        port: process.env.LAVALINK_PORT || 2333, 
        auth: process.env.LAVALINK_PASS || 'youshallnotpass' 
    }
];


const ShoukakuOptions = {
    moveOnDisconnect: false, 
    resumable: false, 
    resumableTimeout: 30, 
    reconnectTries: 2, 
    restTimeout: 10000 
};

module.exports.nodePresets = {
    ShoukakuOptions: ShoukakuOptions,
    LavalinkServer: LavalinkServer
}

let shoukaku;

module.exports.connect = () => {
    console.log(`Connecting to Lavalink server at ${LavalinkServer[0].host}:${LavalinkServer[0].port} with password ${LavalinkServer[0].auth.substr(0, 5)}*******`);
    shoukaku = new Shoukaku(client, LavalinkServer, ShoukakuOptions);
    
    this.addDefaultEvents(shoukaku);
    
    return shoukaku;
}

module.exports.addDefaultEvents = (s) => {
    s.on('ready', (name) => console.log(`Lavalink ${name}: Ready!`));
    s.on('error', (name, error) => console.error(`Lavalink ${name}: Error Caught,`, error));
    s.on('close', (name, code, reason) => console.warn(`Lavalink ${name}: Closed, Code ${code}, Reason ${reason || 'No reason'}`));
    s.on('disconnected', (name, reason) => console.warn(`Lavalink ${name}: Disconnected, Reason ${reason || 'No reason'}`));
}

module.exports.shoukaku = this.connect();