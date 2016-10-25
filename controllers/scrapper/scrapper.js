var winston     =   require('winston');
var rp          =   require('request-promise');
var _           =   require('underscore');
const KEY = "SCRAPPER_PROXY";

exports.scrape = function (urls, originalQuery) {
    winston.debug(KEY, 'init', {urls: urls});

    return Promise.all(_.flatten(urls).map(function (item) {
        winston.debug(KEY, 'start', {url: item});
        return rp({
            uri: process.env.SCRAPPER_URL,
            qs:{
                url: item,
                query: originalQuery
            },
            json: true
        })
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
    }));
};