var TelegramBot = require('node-telegram-bot-api');
var logger = require('./libs/log.js');
var config = require('config');
var mongodb = require('mongojs');
var express = require('express');
var bodyParser = require('body-parser');
var requestify = require('requestify');

var app = express();
var bot = "";
var db = "";

logger.info('Application starts');

//
//LOAD Telegram Interface
//
var telegramToken = 0;
if (config.has('Telegram.TelegramToken')) {
    telegramToken = config.get('Telegram.TelegramToken');
    logger.info('Connecting with telegram bot with TOKEN: ' + telegramToken);
}
else {
    logger.error('Cannot read Telegram TOKEN from configuration file dafault.json');
}
if (process.env.BOT_TELEGRAM_TOKEN) {
    telegramToken = process.env.BOT_TELEGRAM_TOKEN;
    logger.info('Using ENV variable for BOT_TELEGRAM_TOKEN');  
}
// Setup polling way
bot = new TelegramBot(telegramToken, {polling: true});
if (bot)
    logger.info('TelegramBot Connected');
else
    logger.error('Cannot start TelegramBot');

//
//LOAD Database
//
var shortDBUrl = "";
if (config.has('DataBase.URL')) {
    // Connection URL. This is where your mongodb server is running.
    shortDBUrl = config.get('DataBase.URL');
}
else {
    logger.error('Cannot read DB address from configuration file dafault.json');    
}
if (process.env.BOT_DB_CONNECTION){
    shortDBUrl = process.env.BOT_DB_CONNECTION;
    logger.info('DB connection from ENV: ' + shortDBUrl);
}
db = mongodb(shortDBUrl);

//
//LOAD Webhook for listening IFTTT
//
var PortId = 0;
if (config.has('ListeningServer.PortId')) {
    //start listening: waiting for IFTTT
    PortId = config.get('ListeningServer.PortId');
}
else {
    logger.error('Cannot read port ID from configuration file dafault.json');    
}
if (process.env.OPENSHIFT_NODEJS_PORT){
    PortId = process.env.OPENSHIFT_NODEJS_PORT;
    logger.info('PortId to lisening IFTTT: ' + PortId);
}
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
logger.info("Ready to listen from IP: " + server_ip_address + ' on port: ' + PortId);

app.use( bodyParser.json() );       // to support JSON-encoded bodies - name=foo&color=red <-- URL encoding
app.use( bodyParser.urlencoded({     // to support URL-encoded bodies - {"name":"foo","color":"red"}  <-- JSON encoding
    extended: true
}));     

try {
    app.listen(Number(PortId), server_ip_address, function () {
        logger.info('Listening on port ' + PortId);
    });
}
catch(err) {
    logger.err('Error in running the LISTEN command. Err: ' + err);
}

var urlToPing = '';
//
//LOAD URL for pinging
//
if (config.has('Ping.URL')) {
    urlToPing = config.get('Ping.URL');    
}
else {
    logger.error('Cannot read port UrlToPing from configuration file dafault.json');    
}
if (process.env.BOT_URL_TO_PING){
    urlToPing = process.env.BOT_URL_TO_PING;
}
logger.info('Start sending Ping at URL ' + urlToPing);
setTimeout(SendPingToCreators, 1000); //1 second

function SendPingToCreators ()
{
    requestify.post(urlToPing)
    .then(function(response) {
        // Che me ne faccio?
        var body = response.getBody();
    })
    .catch(function(error) {
        logger.error(error);
    }); 
    logger.info("Alive");
    setTimeout(SendPingToCreators, 24 * 60 * 60 * 1000); //24 hours 
}

//
//Listen to Telegram Messages
//
bot.onText(/\/echo (.+)/, function (msg, match) {
    var fromId = msg.from.id;
    var resp = match[1];
    var username = "non definito";
    if (msg.from.username) username = msg.from.username.toString();

    logger.info('Telegram-onText: echo '+ msg.text + ', from: ' + username);
    bot.sendMessage(fromId, resp);
});

bot.onText(/\/chisono/, function (msg, match) {
    var fromId = msg.from.id;
    var username = "non definito";
    if (msg.from.username) username = msg.from.username.toString();    
    var firstName = msg.from.first_name;
    var lastName = msg.from.last_name; 
    
    logger.info('Telegram-onText: chisono - (' + fromId + ') ' + username);
    bot.sendMessage(fromId, 'Sei \'' + username + '\' (' + firstName + ' ' + lastName + ')');
});

bot.onText(/\/suggerisco (.+)/, function (msg, match) {
    var fromId = msg.from.id;
    var username = "non definito";
    if (msg.from.username) username = msg.from.username.toString();
    
    var mySuggestion = match[1];
    logger.info('Telegram-onText: suggerisco '+ mySuggestion + ', from: ' + username);
    
    bot.sendMessage(fromId, 'Grazie per aver suggerito: "' + mySuggestion + '"');
    
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
    var username = "";
    if (msg.from.username) username = msg.from.username.toString();
    
    bot.sendMessage(fromId, 'Benvenuto: ' + username);
    logger.info('Telegram-onMsg start - from: ' + username + ' Id: ' + fromId);

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
                    logger.error('Error in insert new user id ' + fromId + ' Err: ' + err);
                }
                else 
                    logger.info('Update complete. Inserted ' + username + ' Id:' + fromId);
            });
        }
    });
});

bot.onText(/\/ultimissime/, function (msg, match) {
    var fromId = msg.from.id;
    var keyboard = {keyboard: [['\/ultimanews', '\/ultimaufficiale'],['\/ultimameteo', '\/ultimasport'],['abbandona']],
                    resize_keyboard: true,
                    one_time_keyboard: true, 
                    selective: true};
    var sendMessageOptions = {reply_markup: keyboard};
    bot.sendMessage(fromId, 'Quale ultima notizia vuoi?', sendMessageOptions);
    logger.info('Sent custom keyboard \/ultimissime to user: ' + fromId);
});


bot.onText(/\/settings/, function (msg, match) {
    var fromId = msg.from.id;
    var attNews = 'attiva_news';
    var attUfficiale = 'attiva_ufficiale';
    var attMeteo = 'attiva_meteo';
    var attSport = 'attiva_sport';

    var usersCollection = db.collection('users');
    usersCollection.find({chatId: fromId}, function (err, users) {
        if (err || !users.length)
            logger.warn('User ' + fromId + ' not found in DB');
        else {
            var user = users[0];
            if (user.news && user.news == 'on')
                attNews = 'dis' + attNews;
            if (user.ufficiale && user.ufficiale == 'on')
                attUfficiale = 'dis' + attUfficiale;
            if (user.meteo && user.meteo == 'on')
                attMeteo = 'dis' + attMeteo;
            if (user.sport && user.sport == 'on')
                attSport = 'dis' + attSport;
        }
        var keyboard = {keyboard: [[attNews, attUfficiale],[attMeteo, attSport],['abbandona']],
                        resize_keyboard: true,
                        one_time_keyboard: true, 
                        selective: true};
        var sendMessageOptions = {reply_markup: keyboard};
        bot.sendMessage(fromId, 'Quale informazione vuoi abilitare in automatico?', sendMessageOptions);
        logger.info('Sent custom keyboard \/configurazione to user: ' + fromId);
    });
    
});


bot.onText(/attiva_/, function (msg, match) {
    if (msg.text.substr(0,3) == 'att') {
        var fromId = msg.from.id;
        var toggleType = msg.text.substr(7, msg.text.length-7);
        var sendMessageOptions = {hide_keyboard: true, selective: true};

        var usersCollection = db.collection('users');
        usersCollection.find({chatId: fromId}, function (err, users) {
            if (err || !users.length)
                logger.warn('User ' + fromId + ' not found in DB');
            else {
            var objType = {};
            objType[toggleType]='on';
            usersCollection.update({chatId: fromId}, {$set: objType}, {}, function (err, updated) {
                    if (err) {
                        logger.error('Error in update toggle ' + toggleType + ' for user: ' + fromId + ' Err: ' + err);
                    }
                    else {
                        logger.info('DB update complete. Update toggle ' + toggleType + ' to on. User: ' + fromId);
                        bot.sendMessage(fromId, 'OK. Inizierai a ricevere notizie di tipo: ' + toggleType, sendMessageOptions);
                    }
                });            
            }
        });
    }
});


bot.onText(/disattiva_/, function (msg, match) {
    var fromId = msg.from.id;
    var toggleType = msg.text.substr(10, msg.text.length-10);
    var sendMessageOptions = {hide_keyboard: true, selective: true};

    var usersCollection = db.collection('users');
    usersCollection.find({chatId: fromId}, function (err, users) {
        if (err || !users.length)
            logger.warn('User ' + fromId + ' not found in DB');
        else {
            var objType = {};
            objType[toggleType]='off';

           usersCollection.update({chatId: fromId}, {$set: objType}, {}, function (err, updated) {
                if (err) {
                    logger.error('Error in update toggle ' + toggleType + ' for user: ' + fromId + ' Err: ' + err);
                }
                else {
                    logger.info('DB update complete. Update toggle ' + toggleType + ' to on. User: ' + fromId);
                    bot.sendMessage(fromId, 'OK. Non riceverei più notizie di tipo: ' + toggleType, sendMessageOptions);
                }
            });            
        }
    });
    
});


bot.onText(/\/ultima/, function (msg, match) {
    var fromId = msg.from.id;
    var newsType = msg.text.substr(7, msg.text.length-7);
    var newsText = 'Spiacente, non ci sono news di tipo ' + newsType;
    var username = "non definito";
    if (msg.from.username) username = msg.from.username.toString();

    //cerchiamo nel DB in DB
    var myCollection = db.collection('LastNews');
    myCollection.find({newsType: newsType}, function (err, docs) {
        if (err || !docs.length) {
            logger.warn('LastNews - ' + newsType + ': not found in LastNews DB');
        }
        else
            newsText = docs[0].newsText;
        bot.sendMessage(fromId, 'Ecco l\'ultima: ' + newsText+ '\n');
        logger.info('Telegram-onMsg ultima ' + newsType + ' from: ' + username + ' testo: ' + newsText);
    });
});

// Any kind of message
bot.on('message', function (msg) {
    logger.info('Telegram-onMsg generic: '+ msg.text + ', from: ' + msg.from.id);
});

//
//IFTTT MESSAGES
//
app.all('*', function (req, res, next) {
    logger.info('Something is coming from internet. Body: ' + req.body.text);
    next();
})

app.post('/sendMessage', function (req, res) {
    logger.info('Data arrived: \'' + req.body.text + '\' of type: ' + req.body.type);
    res.send('OK Tx');
    
    //Add to DB
    var myCollection = db.collection('LastNews');
    myCollection.find({newsType: req.body.type}, function (err, docs) {
        if (err || !docs.length) {
            logger.warn('Last news of type: ' + req.body.type + ' not found in LastNews DB');
            myCollection.insert({newsType: req.body.type, 
                                newsText: req.body.text}, function (err, res) {
                if (err) {
                    logger.error('Error in insert last news ' + req.body.text + ' of type: ' + req.body.type + ' Err: ' + err);
                }
                else 
                    logger.info('DB update complete. Inserted ' + req.body.text + ' of type: ' + req.body.type);
            });
        }
        else {
           myCollection.update({newsType: req.body.type}, {$set: {newsText: req.body.text}}, {}, function (err, updated) {
                if (err) {
                    logger.error('Error in update last news ' + req.body.text + ' of type: ' + req.body.type + ' Err: ' + err);
                }
                else 
                    logger.info('DB update complete. Inserted ' + req.body.text + ' of type: ' + req.body.type);
            });            
        }
    });
    
    //Send to all users
    var usersCollection = db.collection('users');
    if (req.body.type == 'news')
    usersCollection.find({news: 'on'}, function (err, users) {
        if (err || !users.length)
            logger.warn('No users found in DB with ' + req.body.type + ' type on');
        else {
            users.forEach(function(user) {
                bot.sendMessage(user.chatId, req.body.text);  
                logger.info('Sent to: \'' + user.userName + '\' message of type: \'' + req.body.type + '\' text: ' + req.body.text + '\'');  
            }, this);
        }
    });
    if (req.body.type == 'sport')
    usersCollection.find({sport: 'on'}, function (err, users) {
        if (err || !users.length)
            logger.warn('No users found in DB with ' + req.body.type + ' type on');
        else {
            users.forEach(function(user) {
                bot.sendMessage(user.chatId, req.body.text);  
                logger.info('Sent to: \'' + user.userName + '\' message of type: \'' + req.body.type + '\' text: ' + req.body.text + '\'');  
            }, this);
        }
    });
    if (req.body.type == 'meteo')
    usersCollection.find({meteo: 'on'}, function (err, users) {
        if (err || !users.length)
            logger.warn('No users found in DB with ' + req.body.type + ' type on');
        else {
            users.forEach(function(user) {
                bot.sendMessage(user.chatId, req.body.text);  
                logger.info('Sent to: \'' + user.userName + '\' message of type: \'' + req.body.type + '\' text: ' + req.body.text + '\'');  
            }, this);
        }
    });
    if (req.body.type == 'ufficiale')
    usersCollection.find({ufficiale: 'on'}, function (err, users) {
        if (err || !users.length)
            logger.warn('No users found in DB with ' + req.body.type + ' type on');
        else {
            users.forEach(function(user) {
                bot.sendMessage(user.chatId, req.body.text);  
                logger.info('Sent to: \'' + user.userName + '\' message of type: \'' + req.body.type + '\' text: ' + req.body.text + '\'');  
            }, this);
        }
    });
    
});


//DB MESSAGES
db.on('error', function (err) {
    logger.error('database error', err)
})

db.on('connect', function () {
    logger.info('database connected')
})

db.on('close', function () {
    logger.info('database closed')
})




        