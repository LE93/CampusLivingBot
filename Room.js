function Room(houseNr, apartmentNr, roomNr) {
    this.houseNr = houseNr;
    this.apartmentNr = apartmentNr;
    this.roomNr = roomNr;
}

Room.prototype.toString = function () {
  return "Haus " + this.houseNr + ", Wohnung: " + this.apartmentNr + ", Zimmer: " + this.roomNr + "."
};

module.exports = Room;