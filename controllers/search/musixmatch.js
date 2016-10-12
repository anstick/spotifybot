var Promise =   require('promise');
var MusicMatch = require('musicmatch');

var music = new MusicMatch({
    format:"json",
    appid:"spotify-bot"
});

music.uri = "http://api.musixmatch.com/ws/1.1/";
music._datas.apikey = process.env.MUSIXMATCH_API_KEY || "";

exports.search = function (query, count) {
    var count = count || 5;
    return music.trackSearch({
            page:1,
            page_size: count,
            q_lyrics: query,
            f_has_lyrics: 1,
            s_track_rating: 'desc'
        })
        .then(function(data){
            return Promise.all(data.message.body.track_list.map(function (el) {
                return Promise.resolve({
                    artist: el.track.artist_name,
                    title: el.track.track_name,
                    url: el.track.track_share_url
                });
            }))
        })
        .then(function (results) {
            if (results && results.length){
                return Promise.resolve(results);
            }
            return Promise.resolve([]);
        }).
        catch(function (err) {
            return Promise.resolve([]);
        });
};
