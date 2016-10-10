var Promise =   require('promise');
var MusicMatch = require('musicmatch');
var FallbackSearchController = require('./../search-song');

var music = new MusicMatch({
        format:"json",
        appid:"spotify-bot"
});
music.uri = "http://api.musixmatch.com/ws/1.1/";
music._datas.apikey = "6995679de06e8e70a21b0c0a26c7d8fd";

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
                    title: el.track.track_name
                });
            }))
        })
        .then(function (results) {
            if (results && results.length){
                return Promise.resolve(results);
            }else{
                return FallbackSearchController.search(query, count)
            }
        });
};