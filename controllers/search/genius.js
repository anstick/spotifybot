var Genius                      =   require("node-genius");
var geniusClient                =   new Genius(process.env.GENIUS_ACCESS_TOKEN);
var FallbackSearchController    =   require('./google-cs');
var Promise                     =   require('promise');
var winston                     =   require('winston');
var Scrapper                    =   require('../scrapper/scrapper');
var _                           =   require('underscore');

const KEY = "GENIUS_CONTROLLER";

exports.search = function (query, count) {
    var count = count || 5;
    winston.debug(KEY, 'start', {query: query, count: count});
    return new Promise(function (done) {
        // Search Genius.
        try{
            geniusClient.search(query, function (error, results) {
                if (error){
                    done(Promise.resolve([]));
                }
                else{
                    try {
                        var json = JSON.parse(results);
                        if (json.meta.status !== 200){
                            throw new Error('status ' + json.meta.status);
                        }
                        if (json.response.hits && json.response.hits.length) {
                            done(Promise.all(json.response.hits
                                .filter(function (hit) {
                                    return hit.type === 'song';
                                })
                                .slice(0, count)
                                .map(function (hit) {
                                    winston.debug(KEY, 'results', {
                                        results: hit
                                    });
                                    return Promise.resolve(hit.result.url);
                                })));
                        }
                        else {
                            throw new Error('no results');
                        }
                    }
                    catch (error){
                        winston.error(KEY, "Api error", {
                            err: error
                        });
                        done(Promise.resolve([]));
                    }
                }
            });
        }
        catch (error){
            winston.error(KEY, "unhandled error", {err: error});
            done(Promise.resolve([]));
        }

    })
    .then(function (links) {
        return Scrapper.scrape(links, query);
    })
    .then(function (results) {
        var res = _.filter(results, function (el) {
            return el && el.coincidence >= 0.25;
        });
        return Promise.resolve(_.sortBy(res, 'coincidence').reverse());
    })
    .catch(function (err) {
        winston.error(KEY, "unhandled error2", {err: err});
        done(Promise.resolve([]));
    });
};