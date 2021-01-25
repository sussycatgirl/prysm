const URL = require('url');
const { shoukaku } = require('../modules/bot/shoukakuSetup');

module.exports.resolveSpotifyURL = async (url) => {
    return new Promise(async (resolve, reject) => {
        try {
            const urlInfo = URL.parse(url);
            if (urlInfo.hostname != 'open.spotify.com') return reject('The provided URL is not a spotify URL.');
            if (urlInfo.path.startsWith('/playlist/') || urlInfo.path.startsWith('/album/')) {
                let isAlbum = urlInfo.path.startsWith('/album/');

                let playlistID = urlInfo.path;
                playlistID = playlistID.split(isAlbum ? '/album/' : '/playlist/')[1];
                let ampersandPosition = playlistID.indexOf('?');
                if(ampersandPosition != -1)
                    playlistID = playlistID.substring(0, ampersandPosition);

                if (!playlistID) return reject('No valid playlist URL provided.');
                await getPlaylist(playlistID, isAlbum)
                    .then(playlist => {
                        let error = playlist.error ? '`' + JSON.stringify(playlist.error) + '`' : '';
                        if (!playlist) return reject('Could not get playlist tracks. (1)\n' + error);
                        if (!playlist.tracks) return reject('Could not get playlist tracks. (2)\n' + error);
                        if (!playlist.tracks.items) return reject('Could not get playlist tracks. (3)\n' + error);

                        let node = shoukaku.getNode();
                        let failed = 0;
                        let searched = 0;
                        let foundTracks = {}
                        playlist.tracks.items.forEach(async (item) => {
                            let trackName = isAlbum ? item.name : item.track.name;
                            let artistName = isAlbum ? item.artists[0].name : item.track.artists[0].name;
                            node.rest.resolve(`${trackName} ${artistName}`, 'soundcloud')
                            .then(results => {
                                if (searched <= 100) {
                                    searched++;
                                    if (!results || !results.tracks || !results.tracks[0]) failed++;
                                    else {
                                        foundTracks[trackName + '\n' + artistName] =  results.tracks[0];
                                    }
                                    if (searched == playlist.tracks.items.length || searched == 100) {
                                        // This sorts the tracks in the same order they have in the spotify playlist
                                        let returnArr = [];
                                        playlist.tracks.items.forEach(item => {
                                            trackName = isAlbum ? item.name : item.track.name;
                                            artistName = isAlbum ? item.artists[0].name : item.track.artists[0].name;
                                            
                                            if (foundTracks[trackName + '\n' + artistName]) returnArr.push(foundTracks[trackName + '\n' + artistName]);
                                        });
                                        resolve({tracks: returnArr, failed: failed});
                                    }
                                }
                            })
                            .catch(e => {
                                console.error(e);
                                failed++;
                                searched++;
                            });
                        });
                    })
                    .catch(e => {
                        console.error(e);
                        reject(e);
                    });
            }
        } catch(e) {
            console.error(e);
            reject(e);
        }
    });
}

const fetch = require("node-fetch");

async function getPlaylist(playlist, isAlbum) {
    var accessToken = await fetch(`https://open.spotify.com/${isAlbum ? 'album' : 'playlist'}/${playlist}`, {
		headers: {
			"user-agent":
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
		},
    });
	accessToken = await accessToken.text();
	global.test = accessToken;
	accessToken = accessToken.matchAll(/"accessToken":"([\d\w_-]+)"/g).next().value[1];

	var playlist = await fetch(`https://api.spotify.com/v1/${isAlbum ? 'albums' : 'playlists'}/${playlist}?type=track%2Cepisode&market=DE`, {
		headers: {
			"app-platform": "WebPlayer",
			authorization: "Bearer " + accessToken,
			"spotify-app-version": "1.1.44.408.gf400d279",
		},
	});

	return playlist.json();
}

module.exports.spotifyEnabled = true;