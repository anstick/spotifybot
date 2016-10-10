var SearchSongController = require('../controllers/search-song');
var SpeechRecognizer = require('../controllers/speech-recognizer');
var builder = require('botbuilder');
var winston = require('winston');


function endDialog(session, message, err) {
    var params = {};
    if (err){
        params.err = err;
    }


    winston.log('debug', 'MAIN_DIALOG: FINISH DIALOG', params);
    session.endDialog(message? message: "Tell me lyrics and I tell you what song it is.")
}

module.exports = [
    function (session, args, next) {
        var msg = session.message;
        session.send('Please bear with me for a moment...');
        session.sendTyping();
        if (session.message.attachments && session.message.attachments.length){
            console.log(session.message.attachments);
            var sounds = session.message.attachments.filter(function (element) {
                return ['audio/ogg','video/mp4'].indexOf(element.contentType) !== -1;
            });

            if (sounds && sounds.length){
                winston.log('debug', 'MAIN_DIALOG: Send sound '+  sounds[0].contentUrl);
                SpeechRecognizer.recognize(sounds[0].contentUrl)
                   .then(function (text) {
                        winston.log('debug', 'MAIN_DIALOG: Sound text: '+  text);
                        session.dialogData.userText = text;
                        next();
                    })
                    .catch(function (err) {
                       endDialog(session,'Wat? I can\'t hear you. Could you please repeat?', err);
                    });
            }
            else{
                next();
            }
        }
        else{
            next();
        }
    },
    function (session, text, next) {
        if (!session.dialogData.userText){
            winston.log('debug', 'MAIN_DIALOG: Use text from message: '+  session.message.text);
            session.dialogData.userText = session.message.text;
        }

        if (!session.dialogData.userText || session.dialogData.userText.split(" ").length < 3){
            session.send('It doesn\'t look like a text from the song');
            endDialog(session, null, new Error('Can\'t parse text:' + session.dialogData.userText));
            return;
        }
        next();
    },
    function (session, _, next) {
        winston.log('info', "MAIN_DIALOG: Searching for: " + session.dialogData.userText);

        SearchSongController
            .search(session.dialogData.userText)
            .then(function (songs) {
                winston.log('debug', "MAIN_DIALOG: SearchSongController results", {
                    results: songs
                });

                if (songs && songs.length){
                    session.beginDialog('/songchoice', {
                        songs: songs
                    });
                }else{
                    next();
                }
            })
            .catch(function (err) {
                endDialog(session, 'Sorry, I\'m too tired for today. Could you please come back tomorrow?', err);
            });
    },
    function (session, results) {
        if (results && results.response){
            if (typeof results.response == 'string'){
                session.send(results.response);
            }
        }else{
            winston.log('debug', "MAIN_DIALOG: Search failed");
            session.send("I have no idea what song can it be...");
        }
        endDialog(session);
    }
];