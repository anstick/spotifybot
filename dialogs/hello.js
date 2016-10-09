var builder = require('botbuilder');
module.exports = function (session, args, next) {
    // Send a greeting and show help.
    var card = new builder.HeroCard(session)
        .title("Microsoft Bot Framework")
        .text("Your bots - wherever your users are talking.")
        .images([
            builder.CardImage.create(session, "http://docs.botframework.com/images/demo_bot_image.png")
        ]);
    var msg = new builder.Message(session).attachments([card]);
    session.send(msg);
    session.send("Hi... I'm the Microsoft Bot Framework demo bot for Facebook.");

    session.endDialog("Tell me lyrics and I tell you what song it is.");
};