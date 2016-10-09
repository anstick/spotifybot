var GoogleSearch    =   require('google-search');
var Promise         =   require('promise');
var Song            =   require('../models/song');

var googleSearch = new GoogleSearch({
    key: process.env.GOOGLE_API_KEY,
    cx: process.env.GOOGLE_CUSTOM_SEARCH_CX
});

exports.search = function (query) {
    return new Promise(function (done, fail) {
        googleSearch.build({
            q: query.split(' ').join('+'),
            num: 10
        }, function(err, response) {
            if (err) fail(err);
            else {
                if (response.error){
                    fail(response.error)
                }else{
                    if (response.items && response.items.length){
                        done(response.items.map(function (item) {
                            return item.link;
                        }));
                    }
                    else{
                        done([]);
                    }

                }
            }
        });
    });

};