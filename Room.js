function Room(room, size, level, price) {
    this.room = room;
    this.size = size;
    this.level = level;
    this.price = price;
}

Room.prototype.toString = function () {
  return "Zimmer " + this.room + ", Grösse: " + this.size + ", Etage: " + this.level + ", Preis: CHF " + this.price + "."
};

module.exports = Room;