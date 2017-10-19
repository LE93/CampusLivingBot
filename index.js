// Path for configs
var paths;
try {
    paths = require('./local-pathsConfig.json');
}
catch (ex){
    paths = require('./pathsConfig.json');
}


const svcConfig = require(paths.svcConfig);
const Store = require('./Store');
const svcHandler = require('./LivingScienceServiceHandler');
const telegramBot = require('./CampusLivingBot');

setInterval(
    function () {
        Store.getNumberOfRooms(function (error, nStoredRooms) {
            if (error) {
                console.error(error);
                telegramBot.sendErrorMessage(error);
            }
            else {
                svcHandler.fetchAvailableRoomData(function (error, data) {
                    if (error) {
                        console.error(error);
                        telegramBot.sendErrorMessage(error);
                    }
                    else {
                        const nOnlineRooms = svcHandler.countRoomsAvailable(data);
                        if (nOnlineRooms != -1 && nOnlineRooms != nStoredRooms){
                            if (nOnlineRooms > nStoredRooms){
                                telegramBot.contactTelegramUsers(nOnlineRooms-nStoredRooms);
                            }
                            Store.setNumberOfRooms(nOnlineRooms, function (err) {
                                if (err) {
                                    console.error(err);
                                    telegramBot.sendErrorMessage(err);
                                }
                            });
                        }
                    }
                });
            }
        });
    },
    svcConfig.pollInterval*60000
);