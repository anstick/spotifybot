var Promise         =   require('promise');
var google          =   require('google');
var googleFallback  =   require('./google-cs');
var winston         =   require('winston');
var _               =   require('underscore');

var Scrapper        =   require('../scrapper/azlyrics');
var utils           =   require('../../utils/search');

google.resultsPerPage = 25;
var domain = 'azlyrics.com';

exports.search = function (query, count) {
    count = count || 5;

    winston.log('debug', 'GOOGLE_SEARCH_CONTROLLER start', {
        query: query,
        count: count
    });

    return Promise.all(utils.splitByWords(query, 5).map(function (query, index) {
        return new Promise(function (done) {
            _.delay(function () {
                try {
                    winston.log('debug', 'GOOGLE_SEARCH_CONTROLLER search partial query', {
                        query: query
                    });
                    google(query + (domain? (" site:"+domain):""), function (err, res){
                        if (err) {
                            done(googleFallback.search(query, count));
                            return;
                        }
                        var links = [];
                        for (var i = 0; i < Math.min(res.links.length, count); i++) {
                            var link = res.links[i].link;
                            var c = utils.coincidence(query, res.links[i].description);
                            links.push({
                                url : link,
                                coincidence: c
                            });
                        }
                        winston.log('debug', 'GOOGLE_SEARCH_CONTROLLER results', {
                            results: links
                        });
                        done(Promise.resolve(links));
                    });
                }
                catch (e){
                    winston.log('debug', 'GOOGLE_SEARCH_CONTROLLER search failed', {
                        e: e
                    });
                    done(Promise.resolve([]));
                }
            }, 200*index);
        });
    }))
    .then(function (links) {
        return Promise.all(_.flatten(links).map(function (item) {
            return Scrapper.scrape(item.url)
                .then(function (scrapeResult) {
                    if (scrapeResult){
                        scrapeResult.coincidence = item.coincidence;
                    }
                    return Promise.resolve(scrapeResult);
                });
        }))
    })
    .then(function (results) {
        var r =  _.uniq(_.sortBy(results, 'coincidence').reverse(), true, function (el) {
            return el.url;
        });
        return Promise.resolve(r);
    });

};