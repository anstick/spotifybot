var Scrapper = require('../controllers/scrapper');
var GoogleSearch = require('../controllers/google-search');

var builder = require('botbuilder');

module.exports = [
    function (session, args, next) {
        //check if there is audio
        session.dialogData.userText = session.message.text;
        next();
    },
    function (session, _, next) {
        // Promise.resolve([
        //     // 'http://www.azlyrics.com/lyrics/whitneyhouston/iwillalwaysloveyou.html',
        //     // 'http://www.azlyrics.com/lyrics/dollyparton/iwillalwaysloveyou.html',
        //     // 'http://www.azlyrics.com/lyrics/leannrimes/iwillalwaysloveyou.html'
        // ])
        GoogleSearch
            .search(session.dialogData.userText)
            .then(function (urls) {
                if (urls && urls.length){
                    session.dialogData.possibleUrls = urls;
                    session.beginDialog('/songchoice', {
                        urls: session.dialogData.possibleUrls
                    });
                }else{
                    next();
                }
            })
            .catch(function (err) {
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