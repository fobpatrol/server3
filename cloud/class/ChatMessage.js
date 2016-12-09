'use strict';
const _           = require('lodash');
const ParseObject = Parse.Object.extend('ChatMessage');
const UserData    = Parse.Object.extend('UserData');
const ChatChannel = require('./ChatChannel');
const MasterKey   = {useMasterKey: true};

module.exports = {
    getMessages: getMessages,
    afterSave  : afterSave
};


function afterSave(req, res) {
    const channel  = req.object.get('channel');
    const user     = req.user;

    // Trim our message to 140 characters.
    const message = req.object.get('message').substring(0, 140);

    channel.relation('users').query().find(MasterKey).then(users => {
        _.filter(users, _user => user.id != _user.id).map(sendMessage);

    });

    function sendMessage(toUser) {

        console.log(message, toUser.get('username'));

        Parse.Push.send({
            channels: [toUser.get('username')],
            data    : {
                title  : user.get('name'),
                alert  : message,
                badge  : 'Increment',
                event  : 'chat',
                uri    : 'https://photogram.codevibe.io/chat/' + channel.id,
                channel: channel.id,
            }
        }, {
            useMasterKey: true
        }).then(() => {
            console.log('push sent. args received: ' + JSON.stringify(arguments) + '\n');
            res.success({
                status: 'push sent',
                ts    : Date.now()
            });
        }).catch((error) => {
            console.log('push failed. ' + JSON.stringify(error) + '\n');
            res.error(error);
        });
    }

}


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
    return new Parse.Query(ParseObject).equalTo('channel', channel).include(['user,channel,image,image.profile'])
                                       .find(MasterKey);
}

// Transform Methods
function parseMessages(messages) {
    let _messages = [];
    messages.map(message => {
        let obj = {
            _id      : message.id,
            message  : message.get('message'),
            channel  : message.get('channel').id,
            image    : message.get('image'),
            audio    : message.get('audio'),
            file     : message.get('file'),
            user     : parseUser(message.get('user')),
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
