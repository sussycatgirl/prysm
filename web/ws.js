const { client } = require('../bot');
const { Application } = require('express');
const musicPlayer = require('../functions/musicPlayer');
const { shoukaku } = require('../modules/bot/shoukakuSetup');
const { ShoukakuPlayer } = require('shoukaku');


/**
 * @param { Application } app 
 */
module.exports.init = async (app) => {
    app.ws('/ws/music/:guildID', async (ws, req) => {
        try {
            if (!req.session.logged_in || !req.params.guildID) return ws.close(1000, 'Unauthorized');
            let uID = req.session.user?.id;
            if (!uID) return ws.close(1000, 'No user is attached to this session.');
            
            let user = await client.users.fetch(uID);
            if (!user) return ws.close(1000, 'User not found');
            
            let guild = await client.guilds.fetch(req.params.guildID);
            if (!guild) return ws.close(1000, 'Cannot find guild');
            
            ws.on('message', async msg => {
                let sendDone = () => ws.readyState != ws.CLOSED && ws.readyState != ws.CLOSING && ws.send('DONE');
                
                if (typeof msg != 'string') return;
                let vcID = player.voiceConnection?.voiceChannelID;
                let channel = await client.channels.fetch(vcID).catch();
                let isInVoice = !!channel.members?.get(req.session?.user?.id);
                if (msg == 'PAUSE') {
                    if (isInVoice)
                        player && player.voiceConnection && player.track && player.setPaused(!player.paused).then(sendDone);
                    else
                        setTimeout(() => sendDone, 1000);
                }
                if (msg == 'SKIP') {
                    if (isInVoice)
                        player && player.voiceConnection && player.track && player.stopTrack().then(sendDone);
                    else
                        setTimeout(sendDone, 1000);
                }
                if (msg.split(':')?.[0] == 'SEEK' && !isNaN(msg.split(':')?.[1])) {
                    let pos = msg.split(':')?.[1];
                    try {
                        if (isInVoice) player.seekTo(Number(pos) || 0).catch();
                        else setTimeout(sendDone, 1000);
                    } catch(e) { console.warn(e) }
                }
            });
            
            /**
             * 
             * @param {ShoukakuPlayer} player 
             */
            let emitUpdate = async (player) => {
                let playbackData = {}
                
                let track = musicPlayer.getNowPlaying(guild.id);
                if (!player || !track) playbackData.playing = false;
                else {
                    playbackData = {
                        playing: true,
                        track: track,
                        thumbnail: await musicPlayer.getThumbnail(track.info.uri),
                        channel: guild.channels.cache.get(player.voiceConnection.voiceChannelID),
                        progress: player.position,
                        paused: player.paused,
                        volume: player.volume,
                        looping: musicPlayer.getLooping(guild.id),
                        shuffle: musicPlayer.getShuffle(guild.id)
                    }
                }
                
                try {
                    if (ws.readyState == ws.CLOSED || ws.readyState == ws.CLOSING) return;
                    sendJsonMsg(ws, playbackData);
                } catch(e) {
                    console.error(e);
                }
            };
            
            /**
             * @param {ShoukakuPlayer} player 
             */
            let attachEvents = (player) => {
                let events = ['closed', 'end', 'error', 'nodeDisconnect', 'playerUpdate', 'resumed', 'start', 'trackException'];
                let upd = () => {
                    if (ws.readyState == ws.CLOSED || ws.readyState == ws.CLOSING) return removeEvents();
                    emitUpdate(player);
                }
                let removeEvents = () => {
                    events.forEach(event => player.removeListener(event, upd));
                    playing = false;
                    if (ws.readyState != ws.CLOSED && ws.readyState != ws.CLOSING) emitUpdate(null);
                }
                
                playing = true;
                events.forEach(event => player.on(event, upd));
                
                player.once('closed', removeEvents);
            }
            
            emitUpdate(shoukaku.getPlayer(guild.id)); // Send the initial playback status
            
            // Watch the player and emit an update when its state changes
            let player = shoukaku.getPlayer(guild.id);
            let playing = !!player;
            
            if (player) attachEvents(player);
            
            setInterval(() => {
                if (ws.readyState == ws.CLOSED || ws.readyState == ws.CLOSING) return clearInterval(this);
                if ((!playing || !player.voiceConnection) && player) {
                    playing = false;
                    player = null;
                    emitUpdate();
                }
                
                if (!player) {
                    let newPlayer = shoukaku.players.get(guild.id);
                    if (newPlayer) {
                        player = newPlayer;
                        attachEvents(player);
                    }
                }
            }, 500);
        } catch(e) {
            console.error(e);
        }
    });
}

let sendJsonMsg = (ws, msg) => ws.send(Buffer.from(JSON.stringify(msg)).toString('base64'));
