var Genius                      =   require("node-genius");
var geniusClient                =   new Genius(process.env.GENIUS_ACCESS_TOKEN);
var FallbackSearchController    =   require('./../search-song');
var Promise                     =   require('promise');
var winston                     =   require('winston');

exports.search = function (query, count) {
    var count = count || 5;
    return new Promise(function (done, fail) {
        // Search Genius.
        geniusClient.search(query, function (error, results) {
            if (error){
                fail(error);
            }
            else{
                try {
                    var json = JSON.parse(results);
                    if (json.meta.status !== 200){
                        throw new Error('status ' + json.meta.status);
                    }
                    if (json.response.hits && json.response.hits.length) {
                        done(json.response.hits.filter(function (hit) {
                                    return hit.type === 'song';
                                })
                                .slice(0, count)
                                .map(function (hit) {
                                    return {
                                        artist: hit.result.primary_artist.name,
                                        title: hit.result.title
                                    };
                                })
                        );
                    }
                    else {
                        throw new Error('no results');
                    }
                }
                catch (error){
                    winston.log('debug', "GENIUS_SEARCH_CONTROLLER: Error", {
                        err: error
                    });
                    done(FallbackSearchController.search(query,count))
                }
            }
        });
    })
};