// Path for configs
const paths = require('./pathsConfig.json');
// Load service-configurations.
const svcConfig = require(paths.svcConfig);

const request = require('request');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const Room = require('./Room');

module.exports = {

    fetchAvailableRoomData: function (eventHandler) {

        // Set request header
        var headers = {
            'Content-Type':'text/html; charset=UTF-8'
        };

        // Configure the request
        var options = {
            url: svcConfig.endpointURL,
            method: 'POST',
            headers: headers,
            form: {'cimmotool_objekt': '', 'cimmotool_etage':'', 'cimmotool_status':svcConfig.roomStatus}
        };

        // Start the request
        request(options, function (error, response, body) {
            if (!error) {
                eventHandler(null, body)
            }
            else {
                eventHandler(error);
            }
        })
    },

    countRoomsAvailable: function (data) {
        const { window } = new JSDOM(data);
        var $ = require('jquery')(window);
        return $("div.row[class*='status']").length;
    },

    getRooms: function (data) {
        var rooms = [];
        const { window } = new JSDOM(data);
        var $ = require('jquery')(window);
        $.each($("div.row[class*='status']"), function(index, room){
            var houseNr = $($(room).find('span')[0]).text();
            var whgNr = $($(room).find('span')[2]).text();
            var roomNr = $($(room).find('span')[4]).text();
            rooms.push(new Room(houseNr.replace("Haus Nr. :",""), whgNr.replace("Whg. Nr.:",""), roomNr.replace("Zim.-Nr.:","")));
        });
        return rooms;
    }

};