var request         =   require('superagent');
var speech          =   require('google-speech-api');
var Promise         =   require('promise');


var opts = {
    filetype: 'mp4',
    key: process.env.GOOGLE_API_KEY
};

module.exports.recognize = function (url) {
    return new Promise(function (done, fail) {
        try{
            request
                .get(url)
                .pipe(speech(opts, function (err, results) {
                    if (err){
                        fail(err);
                    }
                    else {
                        try {
                            console.log(results[0].result[0].alternative);
                            done(results[0].result[0].alternative[0].transcript);
                        }
                        catch (e){
                            fail(e);
                        }
                    }

                }));
        }
        catch (e){
            fail(e);
        }

    });
};

