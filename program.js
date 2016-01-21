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
    logger.info('Telegram-onText: chisono - (' + fromId + ') ' + fromUser);
    bot.sendMessage(fromId, 'Sei: ' + fromUser);
});

bot.onText(/\/suggerisco (.+)/, function (msg, match) {
    var fromId = msg.from.id;
    var username = msg.from.username.toString();
    var mySuggestion = match[1];
    logger.info('Telegram-onText: suggerisco '+ mySuggestion + ', from: ' + username);
    
    bot.sendMessage(fromId, 'Grazie per suggerire: "' + mySuggestion + '"');

    //METTI NEL DATABASE
    //salvare in DB
    //var datetime = new Date();
    
    var myCollection = db.collection('suggestions');
    myCollection.insert({userName: username, 
                         chatid: fromId,
                         firstName: msg.from.first_name,
                         lastName: msg.from.last_name, 
                         suggestion: mySuggestion, timestamp: new Date().toString()}, function (err, res) {
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

//CONTROLLARE L'ID E NON IL NOME
//SALVARE PIU' INFO su UTENTE
//SALVARE TIMESTAMP


    //salvare in DB
    var myCollection = db.collection('users');
    myCollection.find({userName: username}, function (err, docs) {
        if (err || !docs.length) {
            logger.warn(username + ' not found');
            myCollection.insert({userName: username, chatid: fromId}, function (err, res) {
                if (err) {
                    logger.error('Error in insert new user: ' + err);
                }
                else 
                    logger.info('Update complete. Inserted ' + username + ' Id:' + fromId);
            });
        }
        else {
            var element = docs[0];
            logger.info('found ' + username);
            logger.info('Id: ' + element.chatId + ' Name:' + element.userName);        
            myCollection.update({userName: element.userName}, {$set: {chatId: element.chatId}}, {}, function (err, updated) {
                if (err) {
                    logger.error('Error in update user: ' + err);
                }
                else 
                    logger.info('update complete');
            });
        };
    });
});


bot.onText(/\/ultimanews/, function (msg, match) {
    var fromId = msg.from.id;
    var newsText = 'Ultima news non trovata nel DataBase';
    bot.sendMessage(fromId, 'Ecco l\'ultima news: ' + newsText);
    logger.info('Telegram-onMsg ultimanews from: ' + msg.from.username.toString() + ' testo: ' + newsText);
    //salvare in DB
});

// Any kind of message
bot.on('message', function (msg) {
    var fromId = msg.from.id;
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

/*

var idPierG = 33422195;
var idDiego = 26248661;
for (var i=1; i<4; i++) {
    bot.sendMessage(idPierG, 'Messaggio special #' + i + ' solo per PierG');
    bot.sendMessage(idDiego, 'Messaggio special #' + i + ' solo per Diego');
};

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