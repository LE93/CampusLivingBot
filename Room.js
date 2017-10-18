function Room(room, size, level, rent) {
    this.room = room;
    this.size = size;
    this.level = level;
    this.rent = rent;
}

Room.prototype.toString = function () {
  return "Zimmer " + this.room + ", Grösse: " + this.size + ", Etage: " + this.level + ", Miete: CHF " + this.rent + "."
};

module.exports = Room;