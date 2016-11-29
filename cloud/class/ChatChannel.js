'use strict';
const _           = require('lodash');
const ParseObject = Parse.Object.extend('ChatChannel');
const ChatMessage = Parse.Object.extend('ChatMessage');
const User        = require('./User');
const MasterKey   = {useMasterKey: true};

module.exports = {
    get           : get,
    getChatChannel: getChatChannel,
    createChannel : createChannel,
};


function get(channel) {
    return new Parse.Query(ParseObject).get(channel);
}

function createChannel(req, res) {
    const user  = req.user;
    const users = req.params.users;
    console.log('user', user);
    console.log('users', users);

    if (!user) {
        return res.error('Not Authorized');
    }

    new ParseObject()
        .save()
        .then(_channel => {
            // Users
            let relation = _channel.relation('users');
            // Add my user
            relation.add(user);
            // Add Other Users
            users.map(user => relation.add(user.obj));
            return _channel.save(res.success, res.error);
        })
        .then(res.success)
        .catch(res.error);


}


function getChatChannel(req, res) {
    console.log('get channel');
    const user = req.user;

    console.log('user', user);

    new Parse.Query(ParseObject)
        .containedIn('users', [user])
        .find(MasterKey)
        .then(_data => {

            let _result = [];

            if (!_data || _data.length < 1) {
                res.success(_result);
            }

            let cb = _.after(_data.length, () => {
                res.success(_result);
            });

            _.each(_data, _channel => {
                let obj = {
                    id       : _channel.id,
                    createdAt: _channel.createdAt,
                    updatedAt: _channel.updatedAt,
                    profiles : [],
                    users    : [],
                    message  : null,
                    obj      : _channel
                };
                console.log('obj', obj);

                _channel.relation('users').query().find(MasterKey).then(_users => {
                    obj.users = _.filter(_users, _user => user.id != _user.id);

                    let promises = _.map(obj.users, user => new Parse.Query('UserData').equalTo('user', user)
                                                                                       .first(MasterKey));

                    new Parse.Promise.when(promises).then(profiles => {
                        obj.profiles = profiles;


                        new Parse.Query(ChatMessage)
                            .descending('createdAt')
                            .equalTo('channel', _channel)
                            .include('user')
                            .first(MasterKey)
                            .then(message => {
                                if (message) {
                                    obj.message = message;
                                }
                                console.log('obj -- final', obj);
                                _result.push(obj);
                                cb();
                            }, error => {
                                console.log('not message', error);
                                _result.push(obj);
                                cb();
                            });

                    }, res.error);

                }, res.error);

            });

        }, res.error);
}