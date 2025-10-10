function Game(difficulty = "easy") {
    this._map = [];
    this.rows = 24;
    this.cols = 40;

    this.rooms = [];
    this.corridors = [];

    this.player = null;
    this.enemies = [];
    this.items = [];
    this.inventory = [];

    this.difficulty = difficulty;
    this.playerHealth = 100;
    this.playerAttack = 10;
    this.enemyHealth = 30;
    this.enemyAttack = 15;
}

// Utils
// ====================================================

Game.prototype.randomBetween = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

Game.prototype.printMap = function () {
    var out = "";

    for (var row = 0; row < this.rows; row++) {
        for (var col = 0; col < this.cols; col++) {
            out += this._map[row][col].type === "wall" ? "█" : "#";
        }
        out += "\n";
    }

    return out;
};

// Business logic
// ====================================================

Game.prototype.changeEnemyStatsAccordingToDifficulty = function () {
    if (this.difficulty === "easy")
    {
        this.enemyHealth = 30;
        this.enemyAttack = 15;
    }
    else if (this.difficulty === "medium")
    {
        this.enemyHealth = 45;
        this.enemyAttack = 20;
    }
    else if (this.difficulty === "hard")
    {
        this.enemyHealth = 60;
        this.enemyAttack = 30;
    }
    else
    {
      throw new Error("Invalid difficulty level");
    }
};

Game.prototype.generateMap = function () {
    for (var r = 0; r < this.rows; r++) {
        this._map[r] = [];

        for (var c = 0; c < this.cols; c++) {
       	    this._map[r][c] = { type: "wall" };
        }
    }
}

Game.prototype.generateRooms = function () {
    var roomsCount = this.randomBetween(3, 6);

    while (this.rooms.length < roomsCount) {
        var roomWidth  = this.randomBetween(4, 7),
            roomHeight = this.randomBetween(4, 7);

        var x = Math.floor(Math.random() * (this.cols - roomWidth)),
            y = Math.floor(Math.random() * (this.rows - roomHeight));

        var room = {
            w: roomWidth,
            h: roomHeight,
            x: { from: x, to: x + roomWidth - 1 },
            y: { from: y, to: y + roomHeight - 1 },
            center: { x: Math.floor(roomWidth / 2), y: Math.floor(roomHeight / 2) }
        };

        var isRoomValid = true;
        for (var y = room.y.from; y <= room.y.to; y++) {
            for (var x = room.x.from; x <= room.x.to; x++) {
                if (this._map[y][x].type === "floor")
                {
                    isRoomValid = false;
                };
            }
        }

        if (isRoomValid) {
            for (let y = room.y.from; y <= room.y.to; y++) {
                for (let x = room.x.from; x <= room.x.to; x++) {
                    this._map[y][x].type = "floor";
                }
            }
            this.rooms.push(room);
        }
    }
}

var game = new Game();

game.generateMap();
game.generateRooms();

console.log(game.printMap());
