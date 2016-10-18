var builder         = require('botbuilder');
var requireTree     = require('require-tree');
var providers       = requireTree('./providers');
var dialogs         = requireTree('./dialogs');
var middlewares     = requireTree('./middlewares');
var winston         = require('winston');
var path            = require('path');
var localizer       = require('./localizer');

winston.level = process.env.LOG_LEVEL || 'error';
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp':true});

var provider;
switch(process.env.PROVIDER){
    case 'microsoft':
        provider = new providers.microsoft();
        break;
    default:
        provider = new providers.console();
}

var bot = new builder.UniversalBot(provider.connector,{
    localizer: new localizer.DefaultLocalizer ({
        botLocalePath: path.resolve(__dirname, "locale")
    })
});
provider.onConnect(bot);


//=========================================================
// Bots Dialogs
//=========================================================
bot.use(middlewares.hardreset);
bot.use(builder.Middleware.firstRun({ version: 1.0, dialogId: '*:/hello' }));

bot.dialog('/hello', dialogs.hello);
bot.dialog('/', dialogs.main);
bot.dialog('/songchoice', dialogs.songchoice);

