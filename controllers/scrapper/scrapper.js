var winston     =   require('winston');
var rp          =   require('request-promise');
var _           =   require('underscore');
const KEY       =   "SCRAPPER_PROXY";

var requireTree =   require('require-tree');
var scrappers   =   requireTree('./sites');
var url         =   require('url');

exports.scrape = function (urls, originalQuery) {
    winston.debug(KEY, 'init', {urls: urls});

    // return Promise.all(_.flatten(urls).map(function (item) {
    //     winston.debug(KEY, 'start', {url: item});
    //     return rp({
    //         uri: process.env.SCRAPPER_URL,
    //         qs:{
    //             url: item,
    //             query: originalQuery
    //         },
    //         json: true,
    //         timeout: 5000
    //     })
    //     .then(function (result) {
    //         winston.debug(KEY, 'success', result);
    //         return Promise.resolve(result);
    //     })
    //     .catch(function (err) {
    //         winston.error(KEY, 'error', {
    //             err: err.message,
    //             stack: err.stack && err.stack.split('\n')
    //         });
    //         return Promise.resolve(null);
    //     });
    // }));

    return Promise.all(_.flatten(urls).map(function (uri) {
        winston.debug(KEY, 'start', {url: uri});

        var parse = url.parse(uri);
        var scrapper;
        switch(parse.hostname){
            case 'azlyrics.com':
            case'www.azlyrics.com':
                scrapper = scrappers.azlyrics;
                break;
            case 'www.genius.com':
            case 'genius.com':
                scrapper = scrappers.genius;
                break;
            default:
                throw new Error('Domain ' + parse.hostname + " isn't suppoted")
        }
        return scrapper.scrape(uri, originalQuery);
    }))
    .then(function (result) {
        winston.debug(KEY, 'success', result);
        return Promise.resolve(result);
    })
    .catch(function (err) {
        winston.error(KEY, 'error', {
            err: err.message,
            stack: err.stack && err.stack.split('\n')
        });
        return Promise.resolve(null);
    });
};