var builder = require('botbuilder');
var RetrieveSongInfoController = require('../controllers/retrieve-song-info');
var winston = require('winston');

function generatePreviewMessage(session, song) {
    return new builder.Message(session)
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
                ])
                .tap(builder.CardAction.openUrl(session, song.url, 'Listen on Spotify')
            );

            if (arr.length>1){
                card.buttons([
                    builder.CardAction.playAudio(session, song.preview_url, 'Preview'),
                    builder.CardAction.openUrl(session, song.url, 'Listen on Spotify')
                ]);
            }else{
                card.buttons([
                    builder.CardAction.openUrl(session, song.url, 'Listen on Spotify')
                ]);
            }
            return card;
        });

    return new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(attachments);
}

function endDialogWithSuccess(session, msg) {
    winston.log('debug', 'SONG_CHOICE_DIALOG: endDialogWithSuccess', {
        msg: msg || true
    });
    session.endDialogWithResult({
        resumed: builder.ResumeReason.completed,
        response: msg || true
    });
}

function endDialogWithError(session, err, msg) {
    winston.log('debug', 'SONG_CHOICE_DIALOG: endDialogWithError', {
        msg: msg || null,
        err: err
    });

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
            if (args.resumed === builder.ResumeReason.completed){
                if (args.response){
                    if (session.dialogData.foundSong){
                        winston.log('debug', 'SONG_CHOICE_DIALOG: Song was right', {
                            song: session.dialogData.foundSong
                        });

                        setTimeout(function () {
                            endDialogWithSuccess(session, 'Super!!!');
                        }, 0);
                    }
                    else{
                        endDialogWithError(session, null, new Error('session.dialogData.foundSong cannot be null'));
                    }
                }
                else{
                    winston.log('debug', 'SONG_CHOICE_DIALOG: Song wasn\'t right. Restart dialog', {
                        song: session.dialogData.foundSong
                    });
                    session.replaceDialog("/songchoice", {
                        songs:session.dialogData.songs,
                        foundSong: session.dialogData.foundSong
                    });
                }
            }
            else{
                winston.log('debug', 'SONG_CHOICE_DIALOG: User interruprt Confirm');
                session.reset('/');
                return;
            }
        }
        else {
            winston.log('debug', 'SONG_CHOICE_DIALOG: Started with', args);
            if (args.songs && args.songs.length){
                if (args.foundSong){
                    winston.log('debug', 'SONG_CHOICE_DIALOG: Song wasn\'t right', {
                        song: args.foundSong
                    });
                    session.dialogData.foundSong = args.foundSong;
                    session.dialogData.songs = args.songs.slice(3);

                    session.send('Hmm. Let me think a little bit more!');
                    
                    Promise.all(args.songs.slice(0,2).map(
                        function (song) {
                            return RetrieveSongInfoController
                                .search(song.artist, song.title);
                        }))
                        .then(function (songs) {
                            winston.log('debug', 'SONG_CHOICE_DIALOG: RetrieveSongInfoController results after', {
                                songs: songs
                            });
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
                    session.dialogData.songs = args.songs.slice(1);

                    var songInfo = args.songs[0];
                    RetrieveSongInfoController
                        .search(songInfo.artist, songInfo.title)
                        .then(function (song) {
                            winston.log('debug', 'SONG_CHOICE_DIALOG: RetrieveSongInfoController result', {
                                result: song
                            });
                            if (song){
                                session.dialogData.foundSong = song;

                                session.send(generateCardMessage(session, [session.dialogData.foundSong]));
                                session.send(generatePreviewMessage(session, song));
                                session.sendTyping();
                                setTimeout(function () {
                                    builder.Prompts.confirm(session, "Am I right??", {
                                        maxRetries: 0
                                    });
                                }, 200);
                            }
                            else{
                                winston.log('debug', 'SONG_CHOICE_DIALOG: Restart dialog', {
                                    songs: session.dialogData.songs
                                });
                                session.replaceDialog("/songchoice", {
                                    songs: session.dialogData.songs
                                });
                            }
                        })
                        .catch(function (err) {
                            endDialogWithError(session, err, "No song in Spotify");
                        });
                }

            } else{
                endDialogWithError(session, new Error('No songs to show'));
            }
        }
    }
);