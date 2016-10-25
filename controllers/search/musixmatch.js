var Promise     =   require('promise');
var MusicMatch  =   require('musicmatch');
var winston     =   require('winston');
var Scrapper    =   require('../scrapper/scrapper');
var _           =   require('underscore');
var utils       =   require('../../utils/search');
const KEY = "MUSIX_CONTROLLER";

var music = new MusicMatch({
    format:"json",
    appid:"spotify-bot"
});

music.uri = "http://api.musixmatch.com/ws/1.1/";
music._datas.apikey = process.env.MUSIXMATCH_API_KEY || "";

exports.search = function (query, count) {
    var count = count || 5;
    winston.debug(KEY, 'start', {
        query: query,
        count: count
    });
    return music.trackSearch({
            page:1,
            page_size: count,
            q_lyrics: query,
            f_has_lyrics: 1,
            s_track_rating: 'desc'
        })
        .then(function(data){
            return Promise.all(data.message.body.track_list.map(function (el) {
                return music.trackLyrics({
                        track_id: el.track.track_id
                    })
                    .then(function (data) {
                        return Promise.resolve({
                            "artist": el.track.artist_name,
                            "title": el.track.track_name,
                            "url": el.track.track_share_url,
                            "coincidence": utils.coincidence(query, data.message.body.lyrics.lyrics_body)
                        });
                });

            }))
        })
        .then(function (results) {
            if (results && results.length){
                winston.debug(KEY, 'results', {
                    results: results
                });
                return Promise.resolve(results);
            }
            return Promise.resolve([]);
        })
        .then(function (results) {
            var res = _.filter(results, function (el) {
                return el && el.coincidence > 1/query.split(' ').length;
            });
            return Promise.resolve(_.sortBy(res, 'coincidence').reverse());
        })
        .catch(function (err) {
            winston.error(KEY, 'Error', {err: err});
            return Promise.resolve([]);
        });
};
