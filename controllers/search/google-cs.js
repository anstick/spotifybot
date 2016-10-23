var Promise     =   require('promise');
var Scrapper    =   require('../scrapper/azlyrics');
var winston     =   require('winston');
var https       =   require('https');
var _           =   require('underscore');
var url         =   require('url');
var utils       =   require('../../utils/search');

var GoogleSearch = function(options) {
    if (!options) options = {};
    options = _.defaults(options, {
        format: "json",
        headers: {
            "User-Agent": "GoogleSearch"
        },
        host: "www.googleapis.com",
        port: 443,
        path: "/customsearch/v1",
        alt: "json"
    });

    this.config = {
        key: options.key,
        format: options.format,
        headers: options.headers,
        host: options.host,
        port: options.port,
        path: options.path,
        cx: options.cx
    };
    return this;
};

GoogleSearch.prototype.build = function(options, callback) {
    this._doRequest(this._generateUrl(options), callback);
};

GoogleSearch.prototype._generateUrl = function(query) {
    query.key = this.config.key;
    query.cx = this.config.cx;
    var pathname = this.config.path;
    var urlFormatted = url.format({
        protocol: "https",
        hostname: this.config.host,
        pathname: pathname,
        query: query
    });
    return url.parse(urlFormatted);
};

GoogleSearch.prototype._doRequest = function(requestQuery, callback) {
    https.get(requestQuery, function(res) {
        var data = [];

        res.
        on('data', function(chunk) {
            data.push(chunk);
        }).
        on('end', function() {
            var dataBuffer = data.join('').trim();
            var result;
            try {
                result = JSON.parse(dataBuffer);
            } catch (e) {
                result = {
                    'status_code': 500,
                    'status_text': 'JSON parse failed'
                };
            }
            callback(null, result);
        }).
        on('error', function(e) {
            callback(e);
        });
    });
};

var googleSearch = new GoogleSearch({
    key: process.env.GOOGLE_API_KEY,
    cx: process.env.GOOGLE_CUSTOM_SEARCH_CX
});

exports.search = function (query, count) {
    var count = count || 5;
    winston.log('debug', 'GOOGLE_CS_SEARCH_CONTROLLER start', {
        query: query,
        count: count
    });
    return new Promise(function (done, fail) {
        try{
            googleSearch.build({
                q: query,
                num: count
            }, function(err, response) {
                if (err){
                    throw err;
                }
                else {
                    if (response.error){
                       throw new Error('Response error ' + response.error);
                    }else{
                        winston.log('debug', 'GOOGLE_SEARCH_CONTROLLER results', {
                            results: response.items
                        });
                        if (response.items && response.items.length){
                            done(Promise.resolve(response.items.map(function (item) {
                                return {
                                    url:item.link,
                                    coincidence: utils.coincidence(query, item.snippet)
                                }
                            })));
                        }
                        else{
                            done(Promise.resolve([]));
                        }
                    }
                }
            });
        }
        catch (e){
            winston.log('debug', 'GOOGLE_SEARCH_CONTROLLER error', {
                err: e
            });
            done(Promise.resolve([]));
        }

    });
};