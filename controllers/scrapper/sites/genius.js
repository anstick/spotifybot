var utils       =   require('../../../utils/search');
var rp          =   require('request-promise');
var cheerio     =   require('cheerio');
var winston     =   require('winston');
var Promise     =   require('promise');

const KEY = 'GeniusScrapper';

module.exports.scrape = function (url, originalQuery) {
    var options = {
        uri: url,
        transform: function (body) {
            return cheerio.load(body);
        },
        agent: false
    };

    return rp(options)
        .then(function ($) {
            var artist = $('.song_header-primary_info-primary_artist');
            var title = $('.song_header-primary_info-title');
            var txt = $('.lyrics p').text();
            if (!txt){
                $('.lyrics a').each(function(  ) {
                    txt += $( this ).text();
                });
            }
            var result = {
                artist: artist.text(),
                title: title.text(),
                coincidence: utils.coincidence(originalQuery, txt),
                url: url
            };
            winston.debug(KEY, 'success', {result: result});
            return Promise.resolve(result);
        });
};