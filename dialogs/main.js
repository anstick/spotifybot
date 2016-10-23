var _                       =   require('underscore');
var builder                 =   require('botbuilder');
var winston                 =   require('winston');
var Dict                    =   require('../locale/dictionary');
var SpeechRecognizer        =   require('../controllers/speech/google-cloud-speech');

var SearchSongController1   =   require('../controllers/search/genius');
var SearchSongController2   =   require('../controllers/search/google');
var SearchSongController3   =   require('../controllers/search/musixmatch');

function endDialog(session, message, err) {
    _.defer(function () {
        if (err){
            winston.log('error', 'MAIN_DIALOG: FINISH DIALOG with Error',{
                err: err,
                stack: err.stack && err.stack.split('\n')
            });
        }
        else{
            winston.log('debug', 'MAIN_DIALOG: FINISH DIALOG');
        }

        if (message){
            session.send(message);
        }

        session.endDialog(Dict.getRandomValue("start"));
    });
}

module.exports = [
    function (session, args, next) {
        winston.log('debug','Main started', {
            args:args
        });

        var msg = session.message;

        if (session.dialogData.soundText){
            next();
            return;
        }

        session.dialogData.soundText = null;
        if (session.message.attachments && session.message.attachments.length) {
            var sounds = session.message.attachments.filter(function (element) {
                return ['audio/ogg', 'video/mp4'].indexOf(element.contentType) !== -1;
            });

            if (sounds && sounds.length) {
                winston.log('debug', 'MAIN_DIALOG: Send sound ' + sounds[0].contentUrl);

                session.send(Dict.getRandomValue('incoming_sound'));
                session.send(Dict.getRandomValue('parsing_sound'));

                SpeechRecognizer.recognize(sounds[0].contentUrl)
                    .then(function (text) {
                        if (!text){
                            throw new Error('Empty text from recogniser');
                        }
                        winston.log('debug', 'MAIN_DIALOG: Sound text: ' + text);

                        session.send(Dict.getRandomValue('sound_parsed') + text);

                        _.defer(function () {
                            session.dialogData.soundText = text;
                            next();
                        });
                    })
                    .catch(function (err) {
                        endDialog(session, Dict.getRandomValue('sound_recognition_failed'), err);
                    });
                return;
            }else{
                next();
            }
        }
        else{
            next();
        }
    },
    function (session, results, next) {
      if (session.dialogData.soundText){
          winston.log('debug', 'MAIN_DIALOG: Use text from sound: '+  session.dialogData.soundText);
          session.dialogData.userText = session.dialogData.soundText;
      }else {
          session.dialogData.userText = session.message.text;
      }
      next();
    },
    function (session, results, next) {
        if (!session.dialogData.userText ){
            endDialog(session, Dict.getRandomValue('invalid_text'), new Error('Can\'t parse text:' + session.dialogData.userText));
            return;
        }
        if (session.dialogData.userText.split(" ").length < 3){
            endDialog(session, Dict.getRandomValue('text_too_short'));
            return;
        }

        session.send(Dict.getRandomValue('waiting'));
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
                array = _.uniq(_.sortBy(array, 'coincidence').reverse(), true , function (el) {
                    return el.artist.toLowerCase().replace(" ", '')+el.title.toLowerCase().replace(" ", "");
                });
                _.defer(function () {
                    session.beginDialog('/songchoice', {
                        songs: array
                    });
                });

            }else{
                _.defer(function () {
                    next();
                });

            }
        }).catch(function (err) {
            endDialog(session, Dict.getRandomValue('error'), err);
        });

    },
    function (session, results) {

        if (results && results.childId === '*:/songchoice'){
            switch  (results.resumed){
                case builder.ResumeReason.completed:
                    winston.log('debug', 'MAIN_DIALOG: Search success');
                    session.send(Dict.getRandomValue('positive_result'));
                    break;
                case builder.ResumeReason.canceled:
                    winston.log('debug', "MAIN_DIALOG: cancelled. ");
                    break;
                default:
                    winston.log('debug', "MAIN_DIALOG: Search failed. " + results.message, {
                        err: results.error
                    });
                    session.send(Dict.getRandomValue('negative_result'));
                    break;
            }
        }
        endDialog(session);
    }
];