var builder =   require('botbuilder');
var Dict    =   require('../dictionary');

module.exports = function (session, args, next) {
    // Send a greeting and show help.
    var card = new builder.HeroCard(session)
        .title("Lyrics2Spotify Bot")
        .text("Turns lyrics into Spotify sessions.")
        .images([
            builder.CardImage.create(session, "http://docs.botframework.com/images/demo_bot_image.png")
        ]);
    var msg = new builder.Message(session).attachments([card]);
    session.send(msg);
    session.send("Hi... TEXT");

    session.endDialog(Dict.getValues('start')[0]);
};