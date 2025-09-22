document.addEventListener("DOMContentLoaded", function () {
  var rows = 24, cols = 40

  function Game() {
    this._map = [];
    this.rooms = [];
    this.player = null;
    this.enemies = [];
    this.items = [];
    this.inventory = [];
    this.difficulty = "easy";
  }

  Game.prototype.setDifficulty = function (lvl) {
    this.difficulty = lvl;
  };

  // Метод для инициализации игровой карты
  Game.prototype.init = function () {
    for (var r = 0; r < rows; r++) {
      this._map[r] = [];

      for (var c = 0; c < cols; c++) {
        this._map[r][c] = { type: "wall" };
      }
    }

    this.setupControls();
  };

  Game.prototype.createRoom = function (x, y, width, height) {
    var rows = this._map.length,
        cols = this._map[0].length;

    for (var i = y; i < y + height; i++) {
      for (var j = x; j < x + width; j++) {
        if (i < 0 || i >= rows || j < 0 || j >= cols || this._map[i][j].type !== "wall") return false;
      }
    }

    for (var i = y; i < y + height; i++) {
      for (var j = x; j < x + width; j++) {
        this._map[i][j].type = "room";
      }
    }

    var centerX = Math.floor(x + width / 2),
        centerY = Math.floor(y + height / 2);

    this.rooms.push({ x, y, width, height, center: { x: centerX, y: centerY } });

    return true;
  };

  // Создание вертикального коридора через весь столбец
  Game.prototype.createVerticalCorridor = function (x) {
    for (var y = 0; y < this._map.length; y++) {
      if (this._map[y][x].type === "wall") this._map[y][x].type = "corridor";
    }
  };

  // Создание горизонтального коридора через весь ряд
  Game.prototype.createHorizontalCorridor = function (y) {
    for (var x = 0; x < this._map[0].length; x++) {
      if (this._map[y][x].type === "wall") this._map[y][x].type = "corridor";
    }
  };

  // Генерация всех коридоров после создания комнат
  Game.prototype.connectRoomsWithCorridors = function () {
    for (var r = 0; r < this.rooms.length; r++) {
      var cx = this.rooms[r].center.x;
      var cy = this.rooms[r].center.y;

      this.createVerticalCorridor(cx);
      this.createHorizontalCorridor(cy);
    }
  };

  // Размещение игрока в комнате
  Game.prototype.placePlayer = function () {
    if (this.rooms.length === 0) return;

    var start = this.rooms[0].center;

    this.player = { x: start.x, y: start.y, health: 100, attack: 10 };
    this._map[this.player.y][this.player.x].type = "player";
  };

  Game.prototype.placeEnemies = function (count) {
    var emptyCells = [];

    for (var y = 0; y < this._map.length; y++) {
      for (var x = 0; x < this._map[y].length; x++) {
        if (this._map[y][x].type === "room" || this._map[y][x].type === "corridor") emptyCells.push({ x, y });
      }
    }

    count = Math.min(count, emptyCells.length);
    for (var i = 0; i < count; i++) {
      var index = Math.floor(Math.random() * emptyCells.length);
      var pos = emptyCells.splice(index, 1)[0];
      var enemyStats = { health: 30, attack: 5 };

      switch (this.difficulty) {
        case "easy": enemyStats = { health: 30, attack: 5 }; break;
        case "medium": enemyStats = { health: 50, attack: 10 }; break;
        case "hard": enemyStats = { health: 70, attack: 15 }; break;
      }

      var enemy = { x: pos.x, y: pos.y, health: enemyStats.health, attack: enemyStats.attack };

      this.enemies.push(enemy);
      this._map[pos.y][pos.x].type = "enemy";
    }
  };

  Game.prototype.placeItems = function () {
    var emptyCells = [];

    for (var y = 0; y < this._map.length; y++) {
      for (var x = 0; x < this._map[y].length; x++) {
        if (this._map[y][x].type === "room" || this._map[y][x].type === "corridor") emptyCells.push({ x, y });
      }
    }

    for (var i = 0; i < 2; i++) {
      if (emptyCells.length === 0) break;

      var index = Math.floor(Math.random() * emptyCells.length);
      var pos = emptyCells.splice(index, 1)[0];

      this.items.push({ type: "sword", x: pos.x, y: pos.y });
      this._map[pos.y][pos.x].type = "sword";
    }

    for (var i = 0; i < 10; i++) {
      if (emptyCells.length === 0) break;

      var index = Math.floor(Math.random() * emptyCells.length);
      var pos = emptyCells.splice(index, 1)[0];

      this.items.push({ type: "potion", x: pos.x, y: pos.y });
      this._map[pos.y][pos.x].type = "potion";
    }
  };

  Game.prototype.setupControls = function () {
    var self = this;

    document.addEventListener("keydown", function (e) {
      var dx = 0, dy = 0;

      function handleSpacebar() {
        var audio = document.getElementById("player_attack_sound");

        if (audio) {
          console.log(audio, "player attack");
          audio.play();
        }

        self.playerAttack();
      }

      switch (e.key.toLowerCase()) {
        case "w": dy = -1; break;
        case "s": dy = 1; break;
        case "a": dx = -1; break;
        case "d": dx = 1; break;
        case " ": handleSpacebar(); break;
      }

      self.movePlayer(dx, dy);
      self.enemyTurn();
    });
  };

  Game.prototype.movePlayer = function (dx, dy) {
    var newX = this.player.x + dx,
        newY = this.player.y + dy;

    if (newY < 0 || newY >= this._map.length || newX < 0 || newX >= this._map[0].length) return;

    var targetCell = this._map[newY][newX];
    if (targetCell.type === "wall" || targetCell.type === "enemy") return;

    var pickedUp = false;
    if (targetCell.type === "potion") {
      this.player.health += 20;
      // Replace filter method with something from es5
      this.items = this.items.filter((i) => !(i.x === newX && i.y === newY));

      pickedUp = true;
    }

    if (targetCell.type === "sword") {
      this.player.attack += 5;
      // Replace filter method with something from es5
      this.items = this.items.filter((i) => !(i.x === newX && i.y === newY));
      this.inventory.push({ type: "sword" });

      pickedUp = true;
    }

    if (pickedUp) {
      var audio = document.getElementById("item_pickup_sound");
      console.log(audio, "item picked up");
      if (audio) audio.play();
    }

    this._map[this.player.y][this.player.x].type = "room";
    this.player.x = newX;
    this.player.y = newY;
    this._map[newY][newX].type = "player";
    // this.render();
  };

  Game.prototype.playerAttack = function () {
    var adj = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }];

    // Change this loop to a classic one
    for (var a of adj) {
      var x = this.player.x + a.x,
          y = this.player.y + a.y;

      if (x < 0 || y < 0 || y >= this._map.length || x >= this._map[0].length) continue;

      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i];
        if (e.x === x && e.y === y) {
          e.health -= this.player.attack;
          if (e.health <= 0) {
            this._map[e.y][e.x].type = "room";
            this.enemies.splice(i, 1);
            i--;
          }
        }
      }
    }

    this.render();
    this.enemyTurn();
  };

  Game.prototype.enemyTurn = function () {
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (Math.abs(e.x - this.player.x) + Math.abs(e.y - this.player.y) === 1) {
        this.player.health -= e.attack;

        var audio = document.getElementById("enemy_attack_sound");
        console.log(audio, "enemy attack");

        if (audio) audio.play();

        if (this.player.health <= 0) alert("Вы погибли!");

        continue;
      }

      var dirs  = [{ x: -1, y: 0 },{ x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }],
          dir   = dirs[Math.floor(Math.random() * dirs.length)];

      var newX = e.x + dir.x,
          newY = e.y + dir.y;

      if ( newY < 0 || newY >= this._map.length || newX < 0 || newX >= this._map[0].length) continue;

      var targetCell = this._map[newY][newX];
      if (targetCell.type === "room" || targetCell.type === "corridor") {
        this._map[e.y][e.x].type = "room";
        e.x = newX;
        e.y = newY;
        this._map[newY][newX].type = "enemy";
      }
    }
    this.render();
  };

  Game.prototype.render = function () {
    var field = document.querySelector(".field");
    field.innerHTML = "";

    var tileWidth  = field.clientWidth / cols,
        tileHeight = field.clientHeight / rows;

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var cell = this._map[y][x];
        var tile = document.createElement("div");

        tile.classList.add("tile");
        tile.style.width = tileWidth + "px";
        tile.style.height = tileHeight + "px";
        tile.style.top = y * tileHeight + "px";
        tile.style.left = x * tileWidth + "px";

        switch (cell.type) {
          case "wall": tile.classList.add("tileW"); break;
          case "player": tile.classList.add("tileP"); break;
          case "enemy": tile.classList.add("tileE"); break;
          case "sword": tile.classList.add("tileSW"); break;
          case "potion": tile.classList.add("tileHP"); break;
        }

        // Показываем здоровье врагов
        if (cell.type === "enemy") {
          var enemy = this.enemies.find((e) => e.x === x && e.y === y);
          if (enemy) {
            var enemyHealthBar = document.createElement("div");

            enemyHealthBar.classList.add("health");
            enemyHealthBar.style.backgroundColor = "red";
            enemyHealthBar.style.width = (enemy.health / 30) * 100 + "%";

            tile.appendChild(enemyHealthBar);
          }
        }

        // Показываем здоровье игрока
        if (cell.type === "player") {
          if (this.player) {
            var playerHealthBar = document.createElement("div");

            playerHealthBar.classList.add("health");
            playerHealthBar.style.backgroundColor = "lightgreen";
            playerHealthBar.style.width = this.player.health + "%";

            tile.appendChild(playerHealthBar);
          }
        }
        field.appendChild(tile);
      }
    }

    if (this.player) {
      document.getElementById("player_health").textContent = "Здоровье: " + this.player.health;
      document.getElementById("player_attack").textContent = "Атака: " + this.player.attack;
    }

    // --- обновляем инвентарь ---
    var invBox = document.querySelector(".inventory");
    invBox.innerHTML = "";

    for (var i = 0; i < this.inventory.length; i++) {
      var div = document.createElement("div");

      div.textContent = this.inventory[i].type;
      div.style.display = "inline-block";
      div.style.margin = "5px";

      invBox.appendChild(div);
    }
  };

  // Запуск и генерация всех элементов карты
  Game.prototype.startGame = function () {
    this.rooms = [];
    this.items = [];
    this.enemies = [];
    this.inventory = [];

    var rows     = 24,
        cols     = 40,
        maxRooms = 10;

    for (var i = 0; i < maxRooms; i++) {
      var w = 4 + Math.floor(Math.random() * 6),
          h = 4 + Math.floor(Math.random() * 6),
          x = Math.floor(Math.random() * (cols - w)),
          y = Math.floor(Math.random() * (rows - h));

      this.createRoom(x, y, w, h);
    }

    // Соединяем комнаты вертикальными и горизонтальными проходами
    this.connectRoomsWithCorridors();

    // Размещаем игрока, врагов и предметы
    this.placePlayer();
    this.placeEnemies(10);
    this.placeItems();

    // Делаем отрисовку карты
    this.render();
  };

  var game = new Game();
  game.init();

  var difficulty = prompt("Выберите сложность: easy, medium, hard", "easy");
  game.setDifficulty(difficulty);
  game.startGame();

  console.log(game);
});
