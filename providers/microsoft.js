var restify = require('restify');
var builder = require('botbuilder');


function MicrosoftProvider() {
    //=========================================================
    // Bot Setup
    //=========================================================

    var port = process.env.port || process.env.PORT || 3978;
    // Setup Restify Server
    var server = restify.createServer();
    server.listen(port, function () {
        console.log('%s listening to %s', server.name, server.url);
    });

    this.server = server;

    // Create chat bot
    this.connector = new builder.ChatConnector({
        appId: process.env.MICROSOFT_APP_ID,
        appPassword: process.env.MICROSOFT_APP_PASSWORD
    });
}

MicrosoftProvider.prototype.onConnect = function () {
    this.server.post('/api/messages', this.connector.listen());
};

module.exports = MicrosoftProvider;