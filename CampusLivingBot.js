// Path for configs
var paths;
try {
    paths = require('./local-pathsConfig.json');
}
catch (ex){
    paths = require('./pathsConfig.json');
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

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true, interval: 10});

const link = "http://reservation.livingscience.ch/wohnen";

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.chat.first_name;
    Store.saveUser(firstName, msg.chat.last_name, chatId, function (err) {
        var message = "Welcome " + firstName + ".\n\nFrom now on I will inform you whenever new rooms are available. To see all the details click [here](" + link + ").\n\n*Commands:*\n";
        message += "/stop - To unsubscribe.\n";
        message += "/rooms - To see all available rooms.\n";
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
});

bot.onText(/\/rooms/, (msg) => {
    const chatId = msg.chat.id;
    svcHandler.fetchAvailableRoomData(function (err, data) {
        if (err) {
            console.error(err);
            this.sendErrorMessage(err);
        }
        else {
            var rooms = svcHandler.getRooms(data);
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
});

bot.onText(/\/help/, (msg) => {
    var message = "*Commands:*\n";
    message += "/stop - To unsubscribe.\n";
    message += "/start - To (re-)subscribe.\n";
    message += "/rooms - To see all available rooms.\n";
    message += "/help - To see all commands.\n\n";
    message += "To see all the room-details click [here](" + link + ").";
    bot.sendMessage(msg.chat.id, message, {parse_mode : "Markdown"});
});

bot.onText(/\/stop/, (msg) => {
    const chatId = msg.chat.id;
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
});

bot.onText(/\/show (.+)/, (msg,match) => {
    const chatId = msg.chat.id;
    const baseUrl = 'http://reservation.livingscience.ch/mm/';
    const roomId = match[1];

    svcHandler.getRoom(roomId, function (error, room) {
        if (error || !room){
            var response = "The specified room '" + roomId + "' doesn't exist.\nPlease try again or send /help to get instructions.";
            if (error){
                response = "Sorry, something went wrong. Please try again later.";
                this.sendErrorMessage(err);
            }
            bot.sendMessage(chatId, response);
        }
        else {
            console.log(room);
            const level = room.level;
            const linkDetail = baseUrl + roomId.split('.').join('-') + '.png';
            const linkBuilding = baseUrl + roomId.substring(0,2) + '-' + level.toLowerCase().replace('. ','') + '.png';

            bot.sendPhoto(chatId, linkBuilding);
            bot.sendPhoto(chatId, linkDetail);
        }
    });
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