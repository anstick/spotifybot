var builder         = require('botbuilder');
var requireTree     = require('require-tree');
var providers       = requireTree('./providers');
var dialogs         = requireTree('./dialogs');
var middlewares     = requireTree('./middlewares');
var winston         = require('winston');

winston.level = process.env.LOG_LEVEL || 'error';
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    timestamp:true,
    handleExceptions: true,
    humanReadableUnhandledException: true
});

var provider;
switch(process.env.PROVIDER){
    case 'microsoft':
        provider = new providers.microsoft();
        break;
    default:
        provider = new providers.console();
}

var bot = new builder.UniversalBot(provider.connector,{
    localizerSettings : { botLocalePath: './locale'}
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

