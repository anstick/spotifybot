var fs          =   require('fs');
var request     =   require('request');
var uuid        =   require('node-uuid');
var ffmpeg      =   require('fluent-ffmpeg');
var temp        =   require('temp').track();
var Promise     =   require('promise');

var clientSecret = process.env.MICROSOFT_SPEECH_API_KEY;    // API key from Azure marketplace

function parseFile(filename) {
    return new Promise(function (done, fail) {
        ffmpeg.ffprobe(filename, function (err) {
            if (err){
                fail(err);
                return
            }

            var output = temp.path({suffix: '.wav'});

            ffmpeg()
                .on('error', function (err) {
                    fail(err);
                })
                .on('end', function () {
                    done(output);
                })
                .input(filename)
                .output(output)
                .audioChannels(2)
                .audioCodec('pcm_s16le')
                .toFormat('wav')
                .run();
            });
    });
}

function getAccessToken(clientSecret) {
    return new Promise(function (done, fail) {
        request.post({
            url: 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken',
            headers:{
                'Ocp-Apim-Subscription-Key': clientSecret
            }
        }, function(err, resp, body) {
            if(err) return fail(err);
            if(body) {
                done(body);
            } else {
                fail(null);
            }
        });
    });

}

function speechToText(filename, accessToken) {
    return new Promise(function (done, fail) {
        fs.readFile(filename, function(err, waveData) {
            if(err) return fail(err);
            request.post({
                url: 'https://speech.platform.bing.com/recognize/query',
                qs: {
                    'scenarios': 'ulm',
                    'appid': 'D4D52672-91D7-4C74-8AD8-42B1D98141A5',
                    'locale': 'en-US',
                    'device.os': 'wp7',
                    'version': '3.0',
                    'format': 'json',
                    'requestid': uuid.v4(), // can be anything
                    'instanceid': '1d4b6030-9099-11e0-91e4-0800200c9a66' // can be anything
                },
                body: waveData,
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'audio/wav; samplerate=16000',
                    'Content-Length' : waveData.length
                }
            }, function(err, resp, body) {
                if(err) return fail(err);
                try {
                    var json = JSON.parse(body);
                    done(json.results);
                } catch(e) {
                    fail(e);
                }
            });
        });
    });

}

module.exports.recognize = function (url) {
    return new Promise(function (done, fail) {
            var writeStream = temp.createWriteStream();
            request.get(url)
                .pipe(writeStream)
                .on('error', function(err) {
                    fail(err);
                })
                .on('close', function() {
                    done(writeStream.path);
                });

        })
        .then(parseFile)
        .then(function (filename) {
            return getAccessToken(clientSecret)
                .then(function (accessToken) {
                    return speechToText(filename, accessToken);
                })
        })
        .then(function (results) {
            if (results && results.length){
                return Promise.resolve(results[0].lexical);
            }
            else{
                return Promise.resolve(null);
            }
        })
};