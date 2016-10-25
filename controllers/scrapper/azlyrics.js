var request     =   require('request');
var cheerio     =   require('cheerio');
var Promise     =   require('promise');
var winston     =   require('winston');
var utils       =   require('../../utils/search');
var rp          =   require('request-promise');

const KEY = "SCRAPPER";

exports.scrape = function (url, originalQuery) {
    winston.debug(KEY, 'start', {url: url});

    var options = {
        uri: url,
        transform: function (body) {
            return cheerio.load(body);
        },
        agent:false
    };
    return rp(options)
        .then(function ($) {
            winston.debug(KEY, "3");
            var artist = $('.lyricsh h2');
            var title = $('.lyricsh').next().next();
            var txt = title.next().next().next();
            winston.debug(KEY, "4");
            var result = {
                artist: artist.text().replace(" LYRICS", ""),
                title: title.text().replace(/^"(.*)"$/, '$1'),
                coincidence: utils.coincidence(originalQuery, txt.text()),
                url: url
            };
            winston.debug(KEY, "5");
            winston.debug(KEY, 'success', {result: result});
            return Promise.resolve(result);
        })
        .catch(function (err) {
            winston.error(KEY, 'error', {
                err: err,
                stack: err.stack && err.stack.split('\n')
            });
            return Promise.resolve(null);
        });
};