// Path for configs
var paths;
try {
    paths = require('./local-pathsConfig.json');
}
catch (ex){
    paths = require('./pathsConfig.json');
}

// Load service-configurations.
const svcConfig = require(paths.svcConfig);

const request = require('request');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const Room = require('./Room');

function fetchRoomsData(eventHandler) {

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
};

module.exports = {

    fetchNumberOfRooms: function (eventHandler) {
        fetchRoomsData(function (error, data) {
            if (error){
                eventHandler(error);
            }
            else {
                const { window } = new JSDOM(data);
                var $ = require('jquery')(window);
                eventHandler(null, $("div.row[class*='status']").length);
            }
        });
    },

    fetchRooms: function (eventHandler) {
        fetchRoomsData(function (error, data) {
            if (error){
                eventHandler(error);
            }
            else {
                var rooms = [];
                const { window } = new JSDOM(data);
                var $ = require('jquery')(window);
                $.each($("div.row[class*='status']"), function(index, room){
                    var roomNr = $($(room).find('span')[2]).text();
                    var size = $($(room).find('span')[6]).text();
                    var level = $($(room).find('span')[8]).text();
                    var rent = $($(room).find('span')[10]).text();
                    var otherCosts = $($(room).find('span')[12]).text();
                    var totalRent = parseFloat(rent.replace("Bruttomiete:CHF ","")) + parseFloat(otherCosts.replace("NK:CHF ",""));
                    rooms.push(new Room(roomNr.replace("Whg. Nr.:",""), size.replace("Grösse:ca. ",""), level.replace("Etage:",""), totalRent));
                });
                eventHandler(null, rooms);
            }
        });
    },

    fetchRoom: function (id, eventHandler) {
        var self = this;
        fetchRoomsData(function (error, data) {
            if (error){
                eventHandler(error);
            }
            else {
                self.fetchRooms(function (error, rooms) {
                    if (error){
                        eventHandler(error);
                    }
                    else {
                        eventHandler(null, rooms.find(r => r.room == id));
                    }
                });
            }
        })
    }

};