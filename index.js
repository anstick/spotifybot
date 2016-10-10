/*jslint node: true */
"use strict";

const builder = require('botbuilder');
const requireTree = require('require-tree');
const providers = requireTree('./providers');
const dialogs = requireTree('./dialogs');
const winston = require('winston');

winston.level = process.env.LOG_LEVEL || 'error';

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
