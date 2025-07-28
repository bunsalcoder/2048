function GameManager(size, InputManager, Actuator, StorageManager) {
  this.size           = size; // Size of the grid
  this.inputManager   = new InputManager;
  this.storageManager = new StorageManager;
  this.actuator       = new Actuator;

  this.startTiles     = 2;
  this.moveCount      = 0;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  this.inputManager.on("stats", this.stats.bind(this));
  this.inputManager.on("settings", this.settings.bind(this));
  this.inputManager.on("leaderboard", this.leaderboard.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.storageManager.clearGameState();
  // Also clear from API
  if (window.ApiService) {
    window.ApiService.clearGameProgress();
  }
  this.actuator.continueGame(); // Clear the game won/lost message
  this.setup();
  
  // Force actuate to update UI immediately after setup
  this.waitingForAPI = false;
  this.actuate();
  
  // After setup, save the new game state to API
  if (window.ApiService) {
    window.ApiService.saveGameProgress(this.serialize());
  }
};

// Keep playing after winning (allows going over 2048)
GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continueGame(); // Clear the game won/lost message
};

// Return true if the game is lost, or has won and the user hasn't kept playing
GameManager.prototype.isGameTerminated = function () {
  return this.over || (this.won && !this.keepPlaying);
};

// Set up the game
GameManager.prototype.setup = function () {
  var previousState = this.storageManager.getGameState();

  // Reload the game from a previous game if present
  if (previousState) {
    this.grid        = new Grid(previousState.grid.size,
                                previousState.grid.cells); // Reload grid
    this.score       = previousState.score;
    this.over        = previousState.over;
    this.won         = previousState.won;
    this.keepPlaying = previousState.keepPlaying;
    this.moveCount   = previousState.moveCount || 0;
  } else {
    this.grid        = new Grid(this.size);
    this.score       = 0;
    this.over        = false;
    this.won         = false;
    this.keepPlaying = false;
    this.moveCount   = 0;

    // Add the initial tiles
    this.addStartTiles();
  }

  // Don't actuate immediately - wait for API response
  this.waitingForAPI = true;
};

GameManager.prototype.restoreFromAPI = function (apiResponse) {
  // Extract gameState and bestScore from API response
  console.log('=============[GameManager] Restoring from API:', apiResponse);
  var gameState = apiResponse ? apiResponse.gameState : null;
  var bestScore = apiResponse ? apiResponse.bestScore : null;
  
  if (gameState && gameState.grid) {
    // Create grid with the cells from API
    this.grid        = new Grid(gameState.grid.size,
                                gameState.grid.cells);
    this.score       = gameState.score || 0;
    this.over        = gameState.over || false;
    this.won         = gameState.won || false;
    this.keepPlaying = gameState.keepPlaying || false;
    this.moveCount   = gameState.moveCount || 0;

    // Store API best score for UI updates
    if (bestScore !== undefined) {
      this.apiBestScore = bestScore;
      localStorage.setItem('bestScore', bestScore);
    }

    // Update the actuator to refresh the UI
    this.actuate();
  } else {
    // No API data or null response - create new game
    this.grid        = new Grid(this.size);
    this.score       = 0;
    this.over        = false;
    this.won         = false;
    this.keepPlaying = false;
    this.moveCount   = 0;

    // Add the initial tiles
    this.addStartTiles();
    
    // Update the actuator to refresh the UI
    this.actuate();
  }
  
  // Mark that we're no longer waiting for API
  this.waitingForAPI = false;
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(), value);

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  // Update best score first if current score is higher
  if (this.score > this.storageManager.getBestScore()) {
    this.storageManager.setBestScore(this.score);
    this.apiBestScore = this.score;
  }
  
  // Use API best score if available, otherwise use localStorage
  var bestScore = this.apiBestScore !== undefined ? this.apiBestScore : this.storageManager.getBestScore();

  // Save the game state (don't clear when game is over - only clear on restart)
  if (!this.over) {
    this.storageManager.setGameState(this.serialize());
    // Also save to API
    if (window.ApiService) {
      window.ApiService.saveGameProgress(this.serialize());
    }
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  bestScore,
    terminated: this.isGameTerminated(),
    moveCount:  this.moveCount
  });

};

// Represent the current game as an object
GameManager.prototype.serialize = function () {
  return {
    grid:        this.grid.serialize(),
    score:       this.score,
    over:        this.over,
    won:         this.won,
    keepPlaying: this.keepPlaying,
    moveCount:   this.moveCount
  };
};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2: down, 3: left
  var self = this;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    this.moveCount++;
    this.addRandomTile();

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();
  }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // Up
    1: { x: 1,  y: 0 },  // Right
    2: { x: 0,  y: 1 },  // Down
    3: { x: -1, y: 0 }   // Left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};

// Handle undo button
GameManager.prototype.undo = function () {
  // For now, just restart the game
  // In a full implementation, this would restore the previous game state
  this.restart();
};

// Handle stats button
GameManager.prototype.stats = function () {
  console.log("Stats clicked");
  var statsModal = document.getElementById('statsModal');
  var currentScoreEl = document.getElementById('currentScore');
  var bestScoreEl = document.getElementById('bestScore');
  var totalMovesEl = document.getElementById('totalMoves');
  
  // Update stats values
  currentScoreEl.textContent = this.score;
  bestScoreEl.textContent = this.apiBestScore !== undefined ? this.apiBestScore : this.storageManager.getBestScore();
  totalMovesEl.textContent = this.moveCount;
  
  // Show modal
  statsModal.classList.add('show');
  
  // Close when clicking outside
  statsModal.addEventListener('click', function(e) {
    if (e.target === statsModal) {
      statsModal.classList.remove('show');
    }
  });
};

// Handle settings button
GameManager.prototype.settings = function () {
  console.log("Settings clicked");
  var settingsModal = document.getElementById('settingsModal');
  
  // Show modal
  settingsModal.classList.add('show');
  
  // Close when clicking outside
  settingsModal.addEventListener('click', function(e) {
    if (e.target === settingsModal) {
      settingsModal.classList.remove('show');
    }
  });
};

// Handle leaderboard button
GameManager.prototype.leaderboard = function () {
  console.log("Leaderboard clicked");
  var leaderboardModal = document.getElementById('leaderboardModal');
  
  // Show modal
  leaderboardModal.classList.add('show');
  
  // Close when clicking outside
  leaderboardModal.addEventListener('click', function(e) {
    if (e.target === leaderboardModal) {
      leaderboardModal.classList.remove('show');
    }
  });
};
