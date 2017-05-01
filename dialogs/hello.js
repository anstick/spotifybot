var builder =   require('botbuilder');
var Dict    =   require('../locale/dictionary');

module.exports = function (session, args, next) {
    // Send a greeting and show help.
    var card = new builder.HeroCard(session)
        .title("Lyrics2Spotify Bot")
        .text("Turns lyrics into Spotify sessions")
        .images([
            builder.CardImage.create(session, "https://www.dropbox.com/s/my4d3qh5fe4blp0/logo.jpg?raw=1")
        ]);
    var msg = new builder.Message(session).attachments([card]);
    session.send(msg);
    session.send("Hi there!");
    session.send("How often do you struggle to recall the song knowing only a few words from the chorus?");
    session.send("I'm here to help you with this stuff. Just tell me some lyrics and I bet I'll guess what song it is.");
    session.endDialog();
};
