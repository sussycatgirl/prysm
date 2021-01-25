const ytdl = require('youtube-dl');
const URL = require('url');
const axios = require('axios').default;
let noImageURL = "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fedisonetea.org%2Ffiles%2F2013%2F07%2FNo-image-available.jpg&f=1&nofb=1";
let cache = {}

/**
 * 
 * @param {String} url SoundCloud/YouTube/etc URL
 */
module.exports.getThumbnail = (url) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (cache[url?.toLowerCase()]) return resolve(cache[url?.toLowerCase()]);
            
            let urlInfo = URL.parse(url);
            switch (urlInfo.hostname) {
                case 'www.youtube.com':
                case 'youtube.com':
                    let video_id = urlInfo.query.split('v=')[1];
                    let ampersandPosition = video_id.indexOf('&');
                    if(ampersandPosition != -1)
                        video_id = video_id.substring(0, ampersandPosition);

                    // This gets the highest resolution thumbnail from YT
                    let promises = [];
                    let res = ['sd', 'mq', 'hq', 'maxres'];
                    res.forEach(res => {
                        let url = `https://img.youtube.com/vi/${video_id}/${res}default.jpg`;
                        promises.push(axios.get(url));
                    });
                    let i = 0;
                    let hi = -1;
                    let finalRes = null;
                    Promise.allSettled(promises)
                    .then(p => {
                        p.forEach(promise => {
                            if (promise.status == 'fulfilled' && promise.value?.status == 200) {
                                r = res[i];
                                if (i > hi) {
                                    hi = i;
                                    finalRes = r;
                                }
                            }
                            i++;
                        });
                    })
                    .then(() => {
                        resolve(`https://img.youtube.com/vi/${video_id}/${finalRes || 'maxres'}default.jpg`);
                        finalRes && (cache[url.toLowerCase()] = `https://img.youtube.com/vi/${video_id}/${finalRes}default.jpg`);
                    });
                break;
                case 'www.soundcloud.com':
                case 'soundcloud.com':
                    // Use axios to request info about the track

                    let scURL = `https://soundcloud.com/oembed?url=${url}&format=json`;
                    let response;
                    try {
                        response = await axios.get(scURL);
                    } catch(e) {
                        console.error(e);
                        return reject(e);
                    }

                    try {
                        resolve(response.data['thumbnail_url']);
                    } catch(e) {
                        console.error(e);
                        return reject(e);
                    }
                break;
                default:
                    //ytdl.getInfo(url, [], (err, info) => {
                    //    if (err) reject(err);
                    //    else {
                    //        resolve(info.thumbnail || noImageURL);
                    //        info.thumbnail && (cache[url.toLowerCase()] = info.thumbnail);
                    //    }
                    //});
                    resolve(noImageURL);
                break;
            }
        } catch(e) {
            console.error(e);
        }
    });
}