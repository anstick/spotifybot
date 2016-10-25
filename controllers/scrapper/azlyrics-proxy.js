var winston     =   require('winston');
var rp          =   require('request-promise');

const KEY = "SCRAPPER_PROXY";

exports.scrape = function (url, originalQuery) {
    winston.debug(KEY, 'start', {url: url});

    var options = {
        uri: process.env.AZLYRICS_PROXY_URL,
        qs:{
            url: url,
            query: originalQuery
        }
    };
    return rp(options)
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