module.exports = {
    botbuilder: function (session, next) {
        if (session.message.text === '/hardreset') {
            console.log('restart');
            session.perUserInConversationData = {};
            session.userData = {};
            session.conversationData = {};
            session.privateConversationData = {};

            session.endConversation('All\'s clear! Go ahead. Send "Hi"');
        }
        else{
            next();
        }

    }
};