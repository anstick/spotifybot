var Promise         =   require('promise');
var GoogleSearch    =   require('../libs/google-search');
var Scrapper        =   require('../libs/scrapper');

var googleSearch = new GoogleSearch({
    key: process.env.GOOGLE_API_KEY,
    cx: process.env.GOOGLE_CUSTOM_SEARCH_CX
});

exports.search = function (query, count) {
    var count = count || 5;
    return new Promise(function (done, fail) {
        googleSearch.build({
            q: query.split(' ').join('+'),
            num: count
        }, function(err, response) {
            if (err) fail(err);
            else {
                if (response.error){
                    fail(response.error)
                }else{
                    if (response.items && response.items.length){
                        done(Promise.all(response.items.map(function (item) {
                            return Scrapper.scrape(item.link);
                        })));
                    }
                    else{
                        done([]);
                    }
                }
            }
        });
    });
};