var builder = require('botbuilder');
var Scrapper = require('../controllers/scrapper');
var SpotifyAPI = require('../controllers/spotify-search');


function generatePreviewMessage(session, song) {
    return new builder.Message(session)
        .text(song.artist + ' - ' + song.title)
        .attachments([{
            contentType: "audio/mpeg",
            contentUrl: song.preview_url
        }]);
}

function generateCardMessage(session, songs) {
    var attachments = songs.map(
        function (song, index, arr) {
            var card = new builder.HeroCard(session)
                .title(song.title)
                .subtitle(song.artist)
                .images([
                    builder.CardImage.create(session, song.cover)
                ]);

            if (arr.length>1){
                card.buttons([
                    builder.CardAction.playAudio(session, song.preview_url, 'Preview'),
                    builder.CardAction.openUrl(session, song.url, 'Listen on Spotify')
                ])
            }else{
                card.buttons([
                    builder.CardAction.openUrl(session, song.url, 'Listen on Spotify')
                ])
            }
            return card;
        });

    return new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(attachments);
}

function endDialogWithSuccess(session, msg) {
    session.endDialogWithResult({
        resumed: builder.ResumeReason.completed,
        response: msg || true
    });
}

function endDialogWithError(session, err, msg) {
    var result = {
        resumed: builder.ResumeReason.notCompleted,
        error: err
    };

    if (msg){
        result.message = msg;
    }

    session.endDialogWithResult(result);
}

module.exports = new builder.SimpleDialog(
    function (session, args) {
        if (args.childId === 'BotBuilder:Prompts'){
            if (args.response){
                if (session.dialogData.foundSong){
                    session.send(generateCardMessage(session, [session.dialogData.foundSong]));
                }
                setTimeout(function () {
                    endDialogWithSuccess(session, 'Super!!!');
                }, 0);

            }
            else{
                session.replaceDialog("/songchoice", {
                    urls:session.dialogData.urls,
                    foundSong: session.dialogData.foundSong
                });
            }
        }
        else {
            if (args.urls && args.urls.length){
                if (args.foundSong){
                    session.dialogData.foundSong = args.foundSong;
                    session.dialogData.urls = args.urls.slice(3);

                    session.send('Hmm. Let me thing a little bit more!');
                    
                    Promise.all(args.urls.slice(0,2).map(
                        function (url) {
                            return Scrapper.scrape(url)
                                .then(function (songInfo) {
                                    return SpotifyAPI
                                        .search(songInfo.artist, songInfo.title);
                                })
                                .catch(function (err) {
                                    return Promise.resolve(null);
                                })
                        }))
                        .then(function (songs) {
                            session.send(generateCardMessage(session,
                                songs.filter(function (song) {
                                    return song;
                                })));
                            endDialogWithSuccess(session, 'That\'s all i found');
                        })
                        .catch(function (err) {
                           endDialogWithError(session, err);
                        });
                }
                else{
                    session.dialogData.urls = args.urls.slice(1);

                    Scrapper.scrape(args.urls[0])
                        .then(function (songInfo) {
                            if (songInfo) {
                                return SpotifyAPI
                                    .search(songInfo.artist, songInfo.title)
                                    .then(function (song) {
                                        if (song){
                                            session.dialogData.foundSong = song;
                                            session.send(generatePreviewMessage(session, session.dialogData.foundSong));

                                            builder.Prompts.confirm(session, "Am I right??");
                                        }
                                        else{
                                            session.replaceDialog("/songchoice", {
                                                urls:session.dialogData.urls
                                            });
                                        }
                                    });
                            }
                            else {
                                endDialogWithError(session, new Error('Page can\'t be parsed'));
                            }
                        })
                        .catch(function (err) {
                            endDialogWithError(session,
                                err,
                                "Parsing error or no song in Spotify");
                        });
                }

            } else{
                endDialogWithError(session, new Error('No urls to show'));
            }
        }
    }
);