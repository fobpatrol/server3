'use strict';
const _           = require('lodash');
const ParseObject = Parse.Object.extend('ChatMessage');
const ChatChannel = require('./ChatChannel');
const UserData    = Parse.Object.extend('UserData');
const MasterKey   = {useMasterKey: true};

module.exports = {
    getMessages: getMessages,
};


function getMessages(req, res) {
    const user      = req.user;
    const channelId = req.params.channel;
    console.log('user', user);

    if (!user) {
        return res.error('Not Authorized');
    }

    if (!channelId) {
        return res.error('Not Channel');
    }

    ChatChannel
        .get(channelId)
        .then(find)
        .then(parseMessages)
        .then(res.success)
        .catch(res.error);
}

function find(channel) {
    return new Parse.Query(ParseObject).equalTo('channel', channel).include(['user,channel,image,image.profile']).find(MasterKey);
}

// Transform Methods
function parseMessages(messages) {
    let _messages = [];
    messages.map(message => {
        let obj = {
            _id     : message.id,
            message : message.get('message'),
            channel : message.get('channel').id,
            image   : message.get('image'),
            audio   : message.get('audio'),
            file    : message.get('file'),
            user    : parseUser(message.get('user')),
            createdAt: message.createdAt
        };
        _messages.push(obj);
    })
    return _messages
}

function parseUser(user) {
    return {
        id      : user.id,
        name    : user.attributes.name,
        username: user.attributes.username,
        photo   : user.attributes['photo']
    }

}
