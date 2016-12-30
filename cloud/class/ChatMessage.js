'use strict';
const _           = require('lodash');
const ChatChannel = require('./ChatChannel');
const ParseObject = Parse.Object.extend('ChatMessage');
const User        = require('./User');
const UserData    = Parse.Object.extend('UserData');
const MasterKey   = {useMasterKey: true};

module.exports = {
    createMessage: createMessage,
    getMessages  : getMessages,
    afterSave    : afterSave
};

function createMessage(req, res) {
    const user   = req.user;
    const params = req.params;

    ChatChannel.get(params.channelId).then(channel => {
        let form = {
            message: params.message,
            user   : user,
            channel: channel
        };
        new ParseObject().save(form, MasterKey).then(res.success).catch(res.error)
    }).catch(res.error);
}

function get(objectId) {
    return new Parse.Query(ParseObject).get(objectId);
}

function afterSave(req, res) {
    const channel = req.object.get('channel');
    const user    = req.user;

    // Trim our message to 140 characters.
    const message = req.object.get('message').substring(0, 140);

    // Create message to push
    let dataMessage = {
        title          : user.get('name'),
        alert          : message,
        badge          : 'Increment',
        event          : 'chat',
        chat           : channel.id,
        icon           : 'icon.png',
        iconColor      : '#045F54',
        uri            : 'https://photogram.codevibe.io/chat/' + channel.id,
        AnotherActivity: true
    };

    // Get user sent
    let photo = user.get('photo');

    // Get photo user
    if (photo) {
        dataMessage.image = photo.url();
    }

    // Send messages
    channel.relation('users')
           .query()
           .find(MasterKey)
           .then(users => _.filter(users, _user => user.id != _user.id).map(sendMessage));


    function sendMessage(toUser) {

        let pushMessage = {
            channels: [toUser.get('username')],
            data    : dataMessage
        };

        console.log(pushMessage);
        console.log('dataMessage', dataMessage);

        Parse.Push.send(pushMessage, MasterKey).then(() => {
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
        name    : user.get('name'),
        username: user.get('username'),
        photo   : user.get('photo'),
    }

}
