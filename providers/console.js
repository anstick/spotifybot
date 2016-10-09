var builder = require('botbuilder');


function ConsoleProvider() {
    this.connector = new builder.ConsoleConnector();
}

ConsoleProvider.prototype.onConnect = function () {
    this.connector.listen();
};

module.exports = ConsoleProvider;