var Genius                      =   require("node-genius");
var geniusClient                =   new Genius(process.env.GENIUS_ACCESS_TOKEN);
var FallbackSearchController    =   require('./google-cs');
var Promise                     =   require('promise');
var winston                     =   require('winston');

exports.search = function (query, count) {
    var count = count || 5;
    return new Promise(function (done) {
        // Search Genius.
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
                        done(Promise.all(json.response.hits.filter(function (hit) {
                                    return hit.type === 'song';
                                })
                                .slice(0, count)
                                .map(function (hit) {
                                    return Promise.resolve({
                                        artist: hit.result.primary_artist.name,
                                        title: hit.result.title,
                                        coincidence: 1,
                                        url: hit.result.url
                                    });
                                }))
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
                    done(Promise.resolve([]));
                }
            }
        });
    })
};