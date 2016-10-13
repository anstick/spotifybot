var _                       =   require('underscore');
var builder                 =   require('botbuilder');
var winston                 =   require('winston');
var Dict                    =   require('../dictionary');
var SpeechRecognizer        =   require('../controllers/speech/google-cloud-speech');

var SearchSongController1   =   require('../controllers/search/genius');
var SearchSongController2   =   require('../controllers/search/google');
var SearchSongController3   =   require('../controllers/search/musixmatch');

function endDialog(session, message, err) {
    var params = {};
    if (err){
        params.err = err;
    }

    winston.log('debug', 'MAIN_DIALOG: FINISH DIALOG', params);

    if (message){
        session.send(message);
    }

    session.endDialog(Dict.getRandomValue("start"));
}

module.exports = [
    function (session, args, next) {
        var msg = session.message;

        session.dialogData.soundText = null;
        if (session.message.attachments && session.message.attachments.length) {
            var sounds = session.message.attachments.filter(function (element) {
                return ['audio/ogg', 'video/mp4'].indexOf(element.contentType) !== -1;
            });

            if (sounds && sounds.length) {
                winston.log('debug', 'MAIN_DIALOG: Send sound ' + sounds[0].contentUrl);

                session.send(Dict.getRandomValue('incoming_sound'));

                SpeechRecognizer.recognize(sounds[0].contentUrl)
                    .then(function (text) {
                        if (!text){
                            throw new Error('Empty text from recogniser');
                        }
                        winston.log('debug', 'MAIN_DIALOG: Sound text: ' + text);
                        session.dialogData.soundText = text;
                        next();
                    })
                    .catch(function (err) {
                        endDialog(session, Dict.getRandomValue('sound_recognition_failed'), err);
                    });
                return;
            }
        }

        next();
    },
    function (session, ___, next) {

        var text = session.dialogData.soundText || session.message.text;

        if (!session.dialogData.soundText){
            winston.log('debug', 'MAIN_DIALOG: Use text from message: '+  text);
        }

        if (!text || text.split(" ").length < 3){
            session.send(Dict.getRandomValue('invalid_text'));
            endDialog(session, null, new Error('Can\'t parse text:' + text));
            return;
        }

        if (!session.dialogData.soundText){
            session.send(Dict.getRandomValue('waiting'));
        }

        session.dialogData.userText = text;
        next();
    },

    function (session, ___, next) {
        winston.log('info', "MAIN_DIALOG: Searching for: " + session.dialogData.userText);

        Promise.all([
            SearchSongController1,
            SearchSongController2,
            SearchSongController3
        ].map(function (controller) {
            return controller.search(session.dialogData.userText, 1)
        }))
        .then(function (songs) {
            winston.log('debug', "MAIN_DIALOG: SearchSongController results", {
                results: songs
            });

            var array = _.flatten(songs);

            if (array && array.length){
                array = _.uniq(array, false, function (el) {
                    console.log(el);
                    return el.artist.toLowerCase().replace(" ", '')+el.title.toLowerCase().replace(" ", "");
                });
                session.beginDialog('/songchoice', {
                    songs: array
                });
            }else{
                next();
            }
        });

    },
    function (session, results) {

        if (results && results.resumed === builder.ResumeReason.completed ){
            winston.log('debug', 'MAIN_DIALOG: Search success');
            session.send(Dict.getRandomValue('positive_result'));
        }else{
            winston.log('debug', "MAIN_DIALOG: Search failed. " + results.message, {
                err: results.error
            });

            session.send(Dict.getRandomValue('negative_result'));
        }

        endDialog(session);
    }
];