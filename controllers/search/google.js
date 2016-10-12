var Promise =   require('promise');
var google  =   require('google');
var winston =   require('winston');

var Scrapper        =   require('../scrapper/azlyrics');
google.resultsPerPage = 25;
var domain = 'azlyrics.com';

exports.search = function (query, count) {
    count = count || 5;
    query = query + (domain? (" site:"+domain):"");
    winston.log('debug', 'GOOGLE_SEARCH_CONTROLLER start', {
        query: query,
        count: count
    });
    return new Promise(function (done, fail) {
        try {
            google(query, function (err, res){
                if (err) {
                    fail(err);
                    return;
                }
                var links = [];
                for (var i = 0; i < Math.min(res.links.length, count); i++) {
                    var link = res.links[i];
                    links.push(link.href);
                }
                winston.log('debug', 'GOOGLE_SEARCH_CONTROLLER results', {
                    results: links
                });
                done(Promise.all(links.map(function (item) {
                    return Scrapper.scrape(item);
                })));
            })
        }
        catch (e){
            fail(e);
        }

    })
};