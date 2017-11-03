// Path for configs
var waitingForRoomList = [];
const request = require('request');
var paths;
try {
    paths = require('./pathsConfig.json');
}
catch (ex){
    paths = require('./default.pathsConfig.json');
}

const botConfig = require(paths.botConfig);

// Init Store
const Store = require('./Store');

// Init LivingScienceServiceHandler
const svcHandler = require('./LivingScienceServiceHandler');

// Init telegram bot
const TelegramBot = require('node-telegram-bot-api');

// replace the value below with the Telegram token you receive from @BotFather
const token = botConfig.token;

// Create a bot that uses either a webHook or 'polling' to fetch new updates depending on the botConfig.
var bot;
if (botConfig.webHook){
    const hookConfig = botConfig.webHook;
    bot = new TelegramBot(token, hookConfig.options);
    bot.setWebHook(hookConfig.baseUrl + token, {
        certificate: hookConfig.options.webHook.cert
    });
    const reqOpts = {
        url: "https://api.telegram.org/bot" + token + "/setWebhook?url=" + hookConfig.baseUrl + token,
        method: "POST"
    };
    request(reqOpts, function (error) {
        if (error){
            this.sendErrorMessage(error);
        }
    });
}
else {
    bot = new TelegramBot(token, {polling: true, interval: 10});
}

const link = "http://reservation.livingscience.ch/wohnen";

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if(waitingForRoomList.indexOf(chatId) == -1){
        const firstName = msg.chat.first_name;
        Store.saveUser(firstName, msg.chat.last_name, chatId, function (err) {
            var message = "Welcome " + firstName + ".\n\nFrom now on I will inform you whenever new rooms are available. To see all the details click [here](" + link + ").\n\n*Commands:*\n";
            message += "/stop - To unsubscribe.\n";
            message += "/rooms - To see all available rooms.\n";
            message += "/location - To receive images of a room's location.\n";
            message += "/help - To see all commands.";
            if (err && err!=1){
                console.error(err);
                this.sendErrorMessage(err);
            }
            else{
                if (err==1){
                    message = "You were already registered.\nType /help to see all commands."
                }
                bot.sendMessage(chatId, message, {parse_mode : "Markdown"});
            }
        });
    }
});

bot.onText(/\/rooms/, (msg) => {
    const chatId = msg.chat.id;
    if(waitingForRoomList.indexOf(chatId) == -1){
        svcHandler.fetchRooms(function (error, rooms) {
            if (error){
                console.error(err);
                this.sendErrorMessage(err);
            }
            else {
                const nRooms = rooms.length;
                var msg = "Sorry there are no rooms available.";
                if (nRooms > 0){
                    msg = (nRooms==1)? "Only this room is available:\n" : "These " + nRooms + " rooms are available:\n";
                    if (nRooms<11){
                        rooms.forEach(function (room) {
                            msg += room.toString() + "\n";
                        });
                    }
                    else {
                        for (var i = 0; i<10; i++){
                            msg += rooms[i] + "\n";
                        }
                        msg += "_[" + (nRooms - 10) + " more]_ ";
                    }
                    msg += (nRooms==1)? "_Check it " : "_Check them ";
                    msg += "out_ [here](" + link + ").";
                }
                bot.sendMessage(chatId, msg, {parse_mode : "Markdown"});
            }
        });
    }
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    if(waitingForRoomList.indexOf(chatId) == -1){
        var message = "*Commands:*\n";
        message += "/stop - To unsubscribe.\n";
        message += "/start - To (re-)subscribe.\n";
        message += "/rooms - To see all available rooms.\n";
        message += "/location - To get images of a room's location.\n";
        message += "/help - To see all commands.\n\n";
        message += "To see all the room-details click [here](" + link + ").";
        bot.sendMessage(msg.chat.id, message, {parse_mode : "Markdown"});
    }
});

bot.onText(/\/stop/, (msg) => {
    const chatId = msg.chat.id;
    if(waitingForRoomList.indexOf(chatId) == -1){
        const firstName = msg.chat.first_name;
        Store.removeUser(chatId,function (err) {
            var response = "Bye, bye " + firstName + ". You'll no longer receive any messages about new rooms.\n\nJust type /start to resubscribe.";
            if (err) {
                if (err==1){
                    response = "You are not registered.\nJust type /start to resubscribe."
                }
                else {
                    response = "Operation failed. Please try again later.";
                    this.sendErrorMessage(err);
                }
            }
            bot.sendMessage(chatId, response);
        });
    }
});

bot.onText(/\/location/, (msg) => {
    const chatId = msg.chat.id;
    if(waitingForRoomList.indexOf(chatId) == -1){
        svcHandler.fetchRooms(function (error, rooms) {
            if (error){
                console.error(error);
                bot.sendErrorMessage(error);
            }
            else if (rooms.length==0){
                bot.sendMessage(chatId, "Sorry there are no rooms available.");
            }
            else {
                var roomIds = rooms.slice(0,255).map(x => x.room);
                var buttons = [];
                while (roomIds.length > 0){
                    buttons.push(roomIds.splice(0,2));
                }
                var opts = {
                    reply_markup: JSON.stringify(
                        {
                            keyboard: buttons,
                            resize_keyboard: true
                        }
                    )};
                bot.sendMessage(chatId, "Choose a room:", opts).then(function () {
                    waitingForRoomList.push(chatId);
                })
            }
        });
    }
});

bot.on('message', (msg) => {
    var chatId = msg.chat.id;
    var index = waitingForRoomList.indexOf(chatId);
    if (index!=-1){
        const roomId = msg.text;
        svcHandler.fetchRoom(roomId, function (error, room) {
            if (error || !room){
                var response = "The specified room '" + roomId + "' doesn't exist.\nPlease try again or send /help to get instructions.";
                if (error){
                    response = "Sorry, something went wrong. Please try again later.";
                    this.sendErrorMessage(err);
                }
                bot.sendMessage(chatId, response, {reply_markup: {hide_keyboard:true}}).then(function () {
                    waitingForRoomList.splice(index,1);
                });
            }
            else {
                const baseUrl = 'http://reservation.livingscience.ch/mm/';
                const level = room.level;
                const linkDetail = baseUrl + roomId.split('.').join('-') + '.png';
                const linkBuilding = baseUrl + roomId.substring(0,2) + '-' + level.toLowerCase().replace('. ','') + '.png';

                bot.sendMessage(chatId, "Your room is here:", {reply_markup: {hide_keyboard:true}}).then(function () {
                    bot.sendPhoto(chatId, linkBuilding).then(function () {
                        bot.sendPhoto(chatId, linkDetail).then(function () {
                            waitingForRoomList.splice(index,1);
                        });
                    });
                });
            }
        });
    }
});

module.exports = {
    
    contactTelegramUsers: function (nNewRooms) {
        var msg = "There is a new room available.\n_Check it out_";
        if (nNewRooms > 1){
            msg = "There are " + nNewRooms + " new rooms available.\n_Check them out_";
        }
        msg += " [here](" + link + ").";
        Store.getUsers(function (err, users) {
            if (err) {
                console.error(err);
                this.sendErrorMessage(err);
            }
            else {
                users.forEach(function(user){
                    bot.sendMessage(user.chatId, msg, {parse_mode : "Markdown"}).catch((error) => {
                        if (error.code == 'ETELEGRAM'){
                            Store.removeUser(user.chatId, function (err) {
                                if (err) {
                                    console.error(err);
                                    this.sendErrorMessage(err);
                                }
                            });
                        }
                        else {
                            console.error(error);
                            this.sendErrorMessage(error);
                        }
                    });
                });
            }
        });
    },

    sendErrorMessage: function (err) {
        bot.sendMessage(bot.errorId, err.toString());
    }
    
};