var TelegramBot = require('node-telegram-bot-api');
var logger = require('./libs/log.js');
var config = require('config');
var mongodb = require('mongojs');
//var express = require('express');

var bot = "";
var db = "";
var transporter = "";

logger.info('Application starts');

//LOAD Telegram Interface
if (config.has('Telegram.TelegramToken')) {
    var token = config.get('Telegram.TelegramToken');
    logger.info('Connecting with telegram bot with TOKEN: ' + token);
    // Setup polling way
    bot = new TelegramBot(token, {polling: true});
    logger.info('Connected');
}
else {
    logger.error('Cannot read Telegram TOKEN from configuration file dafault.json');
}

//LOAD Database
if (config.has('DataBase.URL')) {
    // Connection URL. This is where your mongodb server is running.
    var shortUrl = config.get('DataBase.URL');
    db = mongodb(shortUrl);
}
else {
    logger.error('Cannot read DB address from configuration file dafault.json');    
}

//Listen to Telegram Messages
bot.onText(/\/echo (.+)/, function (msg, match) {
    var fromId = msg.from.id;
    var resp = match[1];
    logger.info('Telegram-onText: echo '+ msg.text + ', from: ' + msg.from.username.toString());
    bot.sendMessage(fromId, resp);
});

bot.onText(/\/chisono/, function (msg, match) {
    var fromId = msg.from.id;
    var fromUser = msg.from.username.toString();
    var firstName = msg.from.first_name;
    var lastName = msg.from.last_name; 
    logger.info('Telegram-onText: chisono - (' + fromId + ') ' + fromUser);
    bot.sendMessage(fromId, 'Sei ' + fromUser + ' (' + firstName + ' ' + lastName + ')');
});

bot.onText(/\/suggerisco (.+)/, function (msg, match) {
    var fromId = msg.from.id;
    var username = msg.from.username.toString();
    var mySuggestion = match[1];
    logger.info('Telegram-onText: suggerisco '+ mySuggestion + ', from: ' + username);
    
    bot.sendMessage(fromId, 'Grazie per suggerire: "' + mySuggestion + '"');
    
    //Suggestions will be saved in the DB for future review
    var myCollection = db.collection('suggestions');
    myCollection.insert({userName: username, 
                         chatid: fromId,
                         firstName: msg.from.first_name,
                         lastName: msg.from.last_name, 
                         suggestion: mySuggestion, 
                         timestamp: new Date().toString()}, function (err, res) {
        if (err) {
            logger.error('Error in insert new suggestion: ' + err);
        }
        else 
            logger.info('Inserted new suggestion. User: ' + username + ' Id: ' + fromId + ' Suggestion: ' + mySuggestion);
    });

});

bot.onText(/\/start/, function (msg, match) {
    var fromId = msg.from.id;
    var username = msg.from.username.toString();
    bot.sendMessage(fromId, 'Benvenuto: ' + msg.from.username.toString());
    logger.info('Telegram-onMsg start - from: ' + msg.from.username.toString());

    //salvare in DB
    var myCollection = db.collection('users');
    myCollection.find({chatId: fromId}, function (err, docs) {
        if (err || !docs.length) {
            logger.warn('Id: ' + fromId + ' not found in Users DB');
            myCollection.insert({userName: username, 
                                chatId: fromId,
                                firstName: msg.from.first_name,
                                lastName: msg.from.last_name, 
                                timestamp: new Date().toString()}, function (err, res) {
                if (err) {
                    logger.error('Error in insert new user ' + username + ' Err: ' + err);
                }
                else 
                    logger.info('Update complete. Inserted ' + username + ' Id:' + fromId);
            });
        }
/* not sure it's useful
        else {
            //Update name just in case he changed it
            var element = docs[0];
            logger.info('Found Id in DB: ' + fromId);
            logger.info('Id: ' + element.chatId + ' Name:' + element.userName);        
            myCollection.update({chatId: element.chatId}, {$set: {userName: element.userName}}, {}, function (err, updated) {
                if (err) {
                    logger.error('Error in update user: ' + err);
                }
                else 
                    logger.info('update complete');
            });
        };
*/
    });
});


bot.onText(/\/ultimanews/, function (msg, match) {
    var fromId = msg.from.id;
    var newsText = 'Spiacente, non ci sono news';

    //cerchiamo nel DB in DB
    var myCollection = db.collection('LastNews');
    myCollection.find({newsType: 'news'}, function (err, docs) {
        if (err || !docs.length) {
            logger.warn('LastNews - news: not found in Users DB');
        }
        else
            newsText = docs[0].newsText;
        bot.sendMessage(fromId, 'Ecco l\'ultima news: ' + newsText);
        logger.info('Telegram-onMsg ultimanews from: ' + msg.from.username.toString() + ' testo: ' + newsText);
    });
});

// Any kind of message
bot.on('message', function (msg) {
    logger.info('Telegram-onMsg generic: '+ msg.text + ', from: ' + msg.from.username.toString());
});


db.on('error', function (err) {
    logger.error('database error', err)
})

db.on('connect', function () {
    logger.info('database connected')
})

db.on('close', function () {
    logger.info('database closed')
})
