//var express = require('express');
var TelegramBot = require('node-telegram-bot-api');
//var db = mongodb(shortUrl);
var logger = require('./libs/log.js');
var config = require('config');

var bot = "";

logger.info('Application starts');

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

// Matches /echo [whatever]
bot.onText(/\/echo (.+)/, function (msg, match) {
    var fromId = msg.from.id;
    var resp = match[1];
    logger.info('onText: echo '+ msg.text + ', from: ' + msg.from.username.toString());
    bot.sendMessage(fromId, resp);
});

bot.onText(/\/chisono/, function (msg, match) {
    var fromId = msg.from.id;
    var fromUser = msg.from.username.toString();
    logger.info('onText: WhoAmI - (' + fromId + ') ' + fromUser);
    bot.sendMessage(fromId, 'Sei: ' + fromUser);
});

bot.onText(/\/suggerisco (.+)/, function (msg, match) {
    var fromId = msg.from.id;
    var resp = match[1];
    logger.info('onText: suggest '+ msg.text + ', from: ' + msg.from.username.toString());
    bot.sendMessage(fromId, 'Grazie per suggerire: "' + match[1] + '"');
    
});

// Any kind of message
bot.on('message', function (msg) {
    var fromId = msg.from.id;
    logger.info('onMsg: '+ msg.text + ', from: ' + msg.from.username.toString());
});
/*

var idPierG = 33422195;
var idDiego = 26248661;
for (var i=1; i<4; i++) {
    bot.sendMessage(idPierG, 'Messaggio special #' + i + ' solo per PierG');
    bot.sendMessage(idDiego, 'Messaggio special #' + i + ' solo per Diego');
};

// Matches /echo [whatever]
bot.onText(/\/echo (.+)/, function (msg, match) {
    var fromId = msg.from.id;
    var resp = match[1];
    console.log('onText: echo '+ msg + ', from: ' + msg.from.username.toString());
    bot.sendMessage(fromId, resp);
});
// Matches /echo [whatever]
bot.onText(/\/DO (.+)/, function (msg, match) {
    var fromId = msg.from.id;
    var resp = match[1];
    console.log('onText: DO '+ msg + ', from: ' + msg.from.username.toString());
    bot.sendMessage(fromId, resp);
});

// What's a contact?
//bot.on('contact', function (msg, match) {
//    console.log('onText: ' + resp + ', fromId:' + fromId);
//});

// Any kind of message
bot.on('message', function (msg) {
    var fromId = msg.from.id;
    console.log('onMsg: '+ msg + ', from: ' + msg.from.username.toString());
    var chatId = msg.chat.id;
    // photo can be: a file path, a stream or a Telegram file_id
    //var photo = 'cats.png';
    //bot.sendPhoto(chatId, photo, {caption: 'Lovely kittens'});
    console.log('fromId: ' + chatId + ' ciao');
    bot.sendMessage(fromId, 'chatId: ' + chatId + ' ciao');
});

//lets require/import the mongodb native drivers.
var mongodb = require('mongojs');
var idPierG = 33422195;
var idDiego = 26248661;

// Connection URL. This is where your mongodb server is running.
var url = 'mongodb://user:cippalippa@ds045795.mongolab.com:45795/pierg_telegram_test';
var shortUrl = 'user:cippalippa@ds045795.mongolab.com:45795/pierg_telegram_test';



var myCollection = db.collection('users');

myCollection.find(function (err, docs) {
    // docs is an array of all the documents in mycollection
    console.log('found all');
    docs.forEach(function(element) {
        console.log('Id: ' + element.chatId + ' Name:' + element.userName);
    }, this);
});

myCollection.find({userName: 'PierG'}, function (err, docs) {
    if (err) {// || !docs.lenght) {
        console.log('PierG not found');
    }
    else {
        var element = docs[0];
        console.log('found PierG');
        console.log('Id: ' + element.chatId + ' Name:' + element.userName);        
        myCollection.update({userName: element.userName}, {$set: {newField: Number(idPierG)}}, {}, function (err, updated) {
            if (err) {
                console.log('Error in update: ' + err);
            }
            else 
                console.log('update complete');
        });
    };
});

db.on('error', function (err) {
    console.log('database error', err)
})

db.on('connect', function () {
    console.log('database connected')
})

db.on('close', function () {
    console.log('database closed')
})
*/