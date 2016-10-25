var Promise         =   require('promise');
var google          =   require('google');
var googleFallback  =   require('./google-cs');
var winston         =   require('winston');
var _               =   require('underscore');
var utils           =   require('../../utils/search');
var delay           =   require('delay');
var Scrapper        =   require('../scrapper/scrapper');

google.resultsPerPage = 25;
var domain = 'azlyrics.com';

const KEY = "GOOGLE_SEARCH_CONTROLLER";

const MAX_WORDS_IN_QUERY = 6;

function search(query, count) {
    count = 5;

    winston.debug(KEY,'start', {
        query: query,
        count: count
    });
    var originalQuery = query;
    return Promise.all(utils.splitByWords(originalQuery, MAX_WORDS_IN_QUERY).map(function (query, index) {
        return new Promise(function (done) {
            _.delay(function () {
                try {
                    winston.debug(KEY,'search partial query', {
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
                        winston.debug(KEY,'results for ' + query, {
                            results: links
                        });
                        done(Promise.resolve(links));
                    });
                }
                catch (e){
                    winston.error(KEY,'search failed', {
                        e: e
                    });
                    done(Promise.resolve([]));
                }
            }, 200*index);
        });
    }))
    .then(function (links) {
        var grouped =  _.groupBy(_.flatten(links), function (el) { return el.url;});
        var mapped =  _.map(
            grouped,
            function (elements, url) {
                return {
                    url: url,
                    coincidence: _.reduce(elements, function (memo, el) {
                        return memo +
                            (el.coincidence > 0.5 ? el.coincidence : 0);
                    }, 0)
                }
            }
        );
        var sorted = _.sortBy(mapped,  'coincidence').reverse();
        return Promise.resolve(sorted.slice(0,count).map(function (el) {
            return el.url;
        }));
    })
    .then(function (links) {
        return Scrapper.scrape(links, originalQuery);
    })
    .then(function (results) {
            var res = _.filter(results, function (el) {
            return el && el.coincidence >= 0.25;
        });
        return Promise.resolve(_.sortBy(res, 'coincidence').reverse());
    })
    .then(function (results) {
        //Google often sucks if first word in request is incorrect
        if (results && results.length === 0) {
            var split = originalQuery.split(' ');
            if (split.length > MAX_WORDS_IN_QUERY){
                return search(split.slice(1).join(" "), count);
            }
        }
        return Promise.resolve(results);
    })
    .catch(function (err) {
        winston.error(KEY,'error', {e: err});
        return Promise.resolve([]);
    });
}

exports.search = search;