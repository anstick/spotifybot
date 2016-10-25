var builder                     = require('botbuilder');
var RetrieveSongInfoController  = require('../controllers/songinfo/spotify');
var winston                     = require('winston');
var _                           =   require('underscore');
var Dict                        =   require('../locale/dictionary');

function endDialogWithError(session, err, msg) {
    winston.log('debug', 'SONG_CHOICE_DIALOG: endDialogWithError', {
        msg: msg || null,
        err: err
    });

    var result = {
        resumed: err?builder.ResumeReason.notCompleted:builder.ResumeReason.canceled,
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
                switch (args.response.index){
                    case 0:
                        winston.log('debug', 'SONG_CHOICE_DIALOG: Song was right', {
                            song: session.dialogData.foundSong
                        });

                        setTimeout(function () {
                            session.endDialog();
                        }, 0);
                        break;
                    case 1:
                        winston.log('debug', 'SONG_CHOICE_DIALOG: Song wasn\'t right. Restart dialog', {
                            song: session.dialogData.foundSong
                        });

                        session.replaceDialog("/songchoice", {
                            songs:session.dialogData.songs,
                            foundSong: session.dialogData.foundSong
                        });
                        break;
                    default:
                        endDialogWithError(session);
                        break;
                }
            }
            else{
                winston.log('debug', 'SONG_CHOICE_DIALOG: User interruprt Choice');
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

                if (session.message.address.channelId === 'facebook'){
                    session.send(new builder.Message(session).sourceEvent({
                        facebook: {
                            "notification_type": "PUSH",
                            "attachment": {
                                type: "template",
                                payload: {
                                    template_type: "generic",
                                    elements: [{
                                        title: song.title,
                                        item_url: song.url,
                                        image_url: song.cover,
                                        subtitle: song.artist,
                                        buttons: [
                                            {
                                                type: "web_url",
                                                url: song.preview_url,
                                                title: "Preview",
                                                webview_height_ratio: 'compact'
                                            },
                                            {
                                                type: "web_url",
                                                url: songInfo.url,
                                                title: "View lyrics",
                                                webview_height_ratio: 'tall'
                                            },
                                            {
                                                type: "web_url",
                                                url: song.url,
                                                title: "Listen on Spotify"
                                            }
                                        ]
                                    }]
                                }
                            }
                        }
                    }));
                }
                else{
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
                                    builder.CardAction.playAudio(session, song.preview_url, 'Preview'),
                                    builder.CardAction.openUrl(session, songInfo.url, 'View lyrics'),
                                    builder.CardAction.openUrl(session, song.url, 'Listen on Spotify')
                                ])
                        ]));
                }

                session.send(new builder.Message(session)
                    .sourceEvent({
                        facebook: {
                            "notification_type" : "NO_PUSH",
                            "attachment":{
                                "type":"audio",
                                "payload":{
                                    "url": song.preview_url
                                }
                            }
                        },
                        telegram:{
                            method: "sendAudio",
                            parameters:{
                                audio:{
                                    "url": song.preview_url,
                                    "mediaType": "audio/mpeg"
                                },
                                title: song.title + " by " + song.artist
                            }
                        }
                    })
                );

                session.dialogData.foundSong = song;

                setTimeout(function () {
                    builder.Prompts.choice(session, Dict.getRandomValue("am_i_right"),['yep', 'nope', 'start over'], {
                        maxRetries: 0
                    });
                }, 200);

            })
            .catch(function (err) {
                winston.log('error', 'SONG_CHOICE_DIALOG: Spotify Error', {
                    err: err
                });

                session.replaceDialog("/songchoice", {
                    songs: session.dialogData.songs
                });
            });

    }
);