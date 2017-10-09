// Init document store
var nStore = require('nstore');
const idsStoreKey = "chatIds";
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

    saveId: function (id, eventHandler) {
        this.getIds(function (err, chatIds) {
            if (err) {
                eventHandler(err);
            }
            else {
                if (chatIds.indexOf(id) != -1){
                    eventHandler(1);
                }
                else {
                    chatIds.push(id);
                    mainStore.save(idsStoreKey, chatIds, function (err) {
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

    getIds: function (eventHandler) {
        mainStore.get(idsStoreKey, function (err, chatIds) {
            if (err){
                eventHandler(err);
            }
            else {
                eventHandler(null, chatIds);
            }
        });
    },

    removeId: function (id, eventHandler) {
        this.getIds(function (err, chatIds) {
            if (err) {
                console.log("1");
                eventHandler(err);
            }
            else {
                const index = chatIds.indexOf(id);
                if (index == -1){
                    eventHandler(1);
                }
                else {
                    chatIds.splice(index);
                    mainStore.save(idsStoreKey, chatIds, function (err) {
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