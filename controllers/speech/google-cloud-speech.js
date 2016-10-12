var fs          =   require('fs');
var request     =   require('request');
var uuid        =   require('node-uuid');
var ffmpeg      =   require('fluent-ffmpeg');
var temp        =   require('temp').track();
var Promise     =   require('promise');
var speechCloud =   require('@google-cloud/speech');
var winston     =   require('winston');

const TAG = "GOOGLE_CLOUD_SPEECH: ";

var opts = {
    projectId: process.env.GCLOUD_PROJECT
};

if (process.env.GOOGLE_APPLICATION_CREDENTIALS_CONTENT){
    opts.credentials = JSON.parse(new Buffer(process.env.GOOGLE_APPLICATION_CREDENTIALS_CONTENT, 'base64'));
}
else{
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS){
        opts.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }
}

var speech = speechCloud(opts);

function parseFile(filename) {
    return new Promise(function (done, fail) {
        winston.log('debug', TAG + 'ffmpeg start');
        ffmpeg.ffprobe(filename, function (err) {
            if (err){
                winston.log('error', TAG + 'ffmpeg init failed', {err:err});
                fail(err);
                return;
            }
            var output = temp.path({suffix: '.flac'});

            ffmpeg()
                .on('error', function (err) {
                    winston.log('error', TAG + 'ffmpeg encoding failed', {err:err});
                    fail(err);
                })
                .on('end', function () {
                    winston.log('debug', TAG + 'ffmpeg complete');
                    done(output);
                })
                .input(filename)
                .output(output)
                .audioFrequency(16000)
                .audioChannels(1)
                .toFormat('flac')
                .run();
            });
    });
}

function speechToText(filename) {
    return new Promise(function (done, fail) {
        winston.log('debug', TAG + 'Google Cloud Speech start');
        speech.recognize(filename, {
                encoding: 'FLAC',
                sampleRate: 16000
            },
            function(err, results) {
                if (err) {
                    winston.log('error', 'Google Cloud Speech failed',{err: err});
                    fail(err);
                    return;
                }
                winston.log('debug', TAG + 'Google Cloud Speech complete');
                done(results);
            });
    });
}

exports.recognize = function (url) {
    return new Promise(function (done, fail) {
            var writeStream = temp.createWriteStream();
            winston.log('debug', TAG + 'Download start');
            request.get(url)
                .pipe(writeStream)
                .on('error', function(err) {
                    winston.log('error', TAG + 'Download error' ,{
                        err: err
                    });
                    fail(err);
                })
                .on('close', function() {
                    winston.log('debug', TAG + 'Download complete');
                    done(writeStream.path);
                });
        })
        .then(parseFile)
        .then(speechToText);
};