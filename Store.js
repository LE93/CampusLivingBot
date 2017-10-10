// Init document store
var nStore = require('nstore');
const idsStoreKey = "users";
const nRoomsStoreKey = "nRooms";

// Create a store
var mainStore = nStore.new('MainStore.db', function () {
    mainStore.get(idsStoreKey, function (err){
        if (err){
            mainStore.save(idsStoreKey, [], function (err) {
                if (err) { console.error(err); }
                mainStore.get(nRoomsStoreKey, function (err){
                    if (err){
                        mainStore.save(nRoomsStoreKey, 0, function (err) {
                            if (err) { console.error(err); }
                        });
                    }
                });
            });
        }
    });
});

module.exports = {

    saveUser: function (firstName, lastName, id, eventHandler) {
        this.getUsers(function (err, users) {
            if (err) {
                eventHandler(err);
            }
            else {
                if (users.indexOf(users.find(u => u.chatId==id)) != -1){
                    eventHandler(1);
                }
                else {
                    const newPerson = {firstName:firstName, lastName:lastName, chatId:id};
                    users.push(newPerson);
                    mainStore.save(idsStoreKey, users, function (err) {
                        if (err) {
                            eventHandler(err);
                        }
                        else {
                            eventHandler(null);
                        }
                    });
                }
            }
        });
    },

    getUsers: function (eventHandler) {
        mainStore.get(idsStoreKey, function (err, users) {
            if (err){
                eventHandler(err);
            }
            else {
                eventHandler(null, users);
            }
        });
    },

    removeUser: function (id, eventHandler) {
        this.getUsers(function (err, users) {
            if (err) {
                eventHandler(err);
            }
            else {
                const index = users.indexOf(users.find(u => u.chatId==id));
                if (index == -1){
                    eventHandler(1);
                }
                else {
                    users.splice(index);
                    mainStore.save(idsStoreKey, users, function (err) {
                        if (err) {
                            eventHandler(err);
                        }
                        else {
                            eventHandler(null);
                        }
                    });
                }
            }
        });
    },

    setNumberOfRooms: function (nRooms, eventHandler) {
        mainStore.save(nRoomsStoreKey, nRooms, function (err) {
           if (err) {
               eventHandler(err);
           }
           else {
               eventHandler(null);
           }
        });
    },

    getNumberOfRooms: function (eventHandler) {
        mainStore.get(nRoomsStoreKey, function (err, nRooms) {
            if (err) {
                eventHandler(err);
            }
            else {
                eventHandler(null, nRooms);
            }
        });
    }
    
};