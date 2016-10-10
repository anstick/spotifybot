var SearchSongController = require('../controllers/search-song');
var SpeechRecognizer = require('../controllers/speech-recognizer');
var builder = require('botbuilder');

module.exports = [
    function (session, args, next) {
        var msg = session.message;
        if (session.message.attachments && session.message.attachments.length){
            console.log(session.message.attachments);
            var sounds = session.message.attachments.filter(function (element) {
                return ['audio/ogg','video/mp4'].indexOf(element.contentType) !== -1;
            });
            if (sounds && sounds.length){
                console.log(sounds[0].contentUrl);
                SpeechRecognizer.recognize(sounds[0].contentUrl)
                   .then(function (text) {
                        session.dialogData.userText = text;
                        next();
                    })
                    .catch(function (err) {
                        session.endDialog('Wat? I can\'t hear you. Could you please repeat?');
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
            session.dialogData.userText = session.message.text;
        }
        if (!session.dialogData.userText){
            session.endDialog('No text. Sorry');
            return;
        }
        next();
    },
    function (session, _, next) {
        console.log("Searching for: " + session.dialogData.userText);
        session.send('Give me a second...');

        SearchSongController
            .search(session.dialogData.userText)
            .then(function (songs) {
                if (songs && songs.length){
                    session.beginDialog('/songchoice', {
                        songs: songs
                    });
                }else{
                    next();
                }
            })
            .catch(function (err) {
                console.log(err);
                session.send('Sorry, I\'m too tired for today. Could you please come back tomorrow?');
                session.endDialog();
            });
    },
    function (session, results) {
        if (results && results.response){
            if (typeof results.response == 'string'){
                session.send(results.response);
            }
        }else{
            session.send("I have no idea what song can it be...");
        }
        session.endDialog("Tell me lyrics and I tell you what song it is.");
    }
];