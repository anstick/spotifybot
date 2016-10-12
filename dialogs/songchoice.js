var builder                     = require('botbuilder');
var RetrieveSongInfoController  = require('../controllers/songinfo/spotify');
var winston                     = require('winston');
var _                           =   require('underscore');
var Dict                        =   require('../dictionary');

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
                    winston.log('debug', 'SONG_CHOICE_DIALOG: Song was right', {
                        song: session.dialogData.foundSong
                    });

                    setTimeout(function () {
                        session.endDialog();
                    }, 0);
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
            }
            return;
        }

        winston.log('debug', 'SONG_CHOICE_DIALOG: Started with', args);

        if(!(_.isArray(args.songs) && !_.isEmpty(args.songs))){
            endDialogWithError(session, new Error('No songs to show'));
            return;
        }

        session.dialogData.songs = args.songs.slice(1);
        if (args.foundSong){
            session.send(Dict.getRandomValue("next_result_waiting"));
            session.sendTyping();
        }

        var songInfo = args.songs[0];
        RetrieveSongInfoController.search(songInfo.artist, songInfo.title)
            .then(function (song) {
                winston.log('debug', 'SONG_CHOICE_DIALOG: RetrieveSongInfoController result', {
                    result: song
                });

                if (!song) {
                    winston.log('debug', 'SONG_CHOICE_DIALOG: Restart dialog', {
                        songs: session.dialogData.songs
                    });

                    session.replaceDialog("/songchoice", {
                        songs: session.dialogData.songs
                    });
                    return;
                }

                session.send('It is "%s" by %s', song.title, song.artist);

                session.send(new builder.Message(session)
                    .attachments([
                        new builder.HeroCard(session)
                            .title(song.title)
                            .subtitle(song.artist)
                            .images([
                                builder.CardImage.create(session, song.cover)
                            ])
                            .tap(builder.CardAction.openUrl(session, song.url, 'Listen on Spotify'))
                            .buttons([
                                builder.CardAction.openUrl(session, songInfo.url, 'View lyrics'),
                                builder.CardAction.openUrl(session, song.url, 'Listen on Spotify')
                            ])
                    ])
                );

                session.send(new builder.Message(session)
                    .attachments([{
                        contentType: "audio/mpeg",
                        contentUrl: song.preview_url
                    }])
                );

                session.dialogData.foundSong = song;

                setTimeout(function () {
                    builder.Prompts.confirm(session, Dict.getRandomValue("am_i_right"), {
                        maxRetries: 0
                    });
                }, 200);

            })
            .catch(function (err) {
                winston.log('debug', 'SONG_CHOICE_DIALOG: Spotify Error', {
                    err: err
                });

                session.replaceDialog("/songchoice", {
                    songs: session.dialogData.songs
                });
            });

    }
);