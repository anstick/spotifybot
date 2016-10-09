var builder = require('botbuilder');
var requireTree = require('require-tree');
var providers = requireTree('./providers');
var dialogs = requireTree('./dialogs');


var provider;
switch(process.env.PROVIDER){
    case 'microsoft':
        provider = new providers.microsoft();
        break;
    default:
        provider = new providers.console();
}

var bot = new builder.UniversalBot(provider.connector);
provider.onConnect(bot);



//=========================================================
// Bots Dialogs
//=========================================================
bot.use(builder.Middleware.firstRun({ version: 1.0, dialogId: '*:/hello' }));
bot.dialog('/hello', dialogs.hello);
bot.dialog('/', dialogs.main);
bot.dialog('/songchoice', dialogs.songchoice);
