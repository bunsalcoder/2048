function KeyboardInputManager() {
  this.events = {};

  if (window.navigator.msPointerEnabled) {
    //Internet Explorer 10 style
    this.eventTouchstart    = "MSPointerDown";
    this.eventTouchmove     = "MSPointerMove";
    this.eventTouchend      = "MSPointerUp";
  } else {
    this.eventTouchstart    = "touchstart";
    this.eventTouchmove     = "touchmove";
    this.eventTouchend      = "touchend";
  }

  this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

KeyboardInputManager.prototype.listen = function () {
  var self = this;

  var map = {
    38: 0, // Up
    39: 1, // Right
    40: 2, // Down
    37: 3, // Left
    75: 0, // Vim up
    76: 1, // Vim right
    74: 2, // Vim down
    72: 3, // Vim left
    87: 0, // W
    68: 1, // D
    83: 2, // S
    65: 3  // A
  };

  // Respond to direction keys
  document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                    event.shiftKey;
    var mapped    = map[event.which];

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault();
        self.emit("move", mapped);
      }
    }

    // R key restarts the game
    if (!modifiers && event.which === 82) {
      self.restart.call(self, event);
    }
  });

  // Respond to button presses
  this.bindButtonPress(".retry-button", this.retry);
  this.bindButtonPress(".restart-button", this.restart);
  this.bindButtonPress(".keep-playing-button", this.keepPlaying);
  this.bindButtonPress(".shuffle-button", this.restart);
  this.bindButtonPress(".new-game-button", this.restart);
  this.bindButtonPress(".stats-button", this.stats);
  this.bindButtonPress(".settings-button", this.settings);
  this.bindButtonPress(".leaderboard-button", this.leaderboard);
  this.bindButtonPress(".play-again-button", this.retry);
  this.bindButtonPress(".menu-button", this.showTutorial);
  this.bindButtonPress("#tutorialCloseBtn", this.hideTutorial);
  this.bindButtonPress("#tutorialStartBtn", this.hideTutorial);
  this.bindButtonPress("#statsCloseBtn", this.hideStats);
  this.bindButtonPress("#statsOkBtn", this.hideStats);
  this.bindButtonPress("#settingsCloseBtn", this.hideSettings);
  this.bindButtonPress("#settingsOkBtn", this.hideSettings);
  this.bindButtonPress("#leaderboardCloseBtn", this.hideLeaderboard);
  this.bindButtonPress("#leaderboardOkBtn", this.hideLeaderboard);

  // Respond to swipe events
  var touchStartClientX, touchStartClientY;
  var gameContainer = document.getElementsByClassName("game-container")[0];

  gameContainer.addEventListener(this.eventTouchstart, function (event) {
    if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
        event.targetTouches.length > 1) {
      return; // Ignore if touching with more than 1 finger
    }

    if (window.navigator.msPointerEnabled) {
      touchStartClientX = event.pageX;
      touchStartClientY = event.pageY;
    } else {
      touchStartClientX = event.touches[0].clientX;
      touchStartClientY = event.touches[0].clientY;
    }

    event.preventDefault();
  });

  gameContainer.addEventListener(this.eventTouchmove, function (event) {
    event.preventDefault();
  });

  gameContainer.addEventListener(this.eventTouchend, function (event) {
    if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
        event.targetTouches.length > 0) {
      return; // Ignore if still touching with one or more fingers
    }

    var touchEndClientX, touchEndClientY;

    if (window.navigator.msPointerEnabled) {
      touchEndClientX = event.pageX;
      touchEndClientY = event.pageY;
    } else {
      touchEndClientX = event.changedTouches[0].clientX;
      touchEndClientY = event.changedTouches[0].clientY;
    }

    var dx = touchEndClientX - touchStartClientX;
    var absDx = Math.abs(dx);

    var dy = touchEndClientY - touchStartClientY;
    var absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 10) {
      // (right : left) : (down : up)
      self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    }
  });
};

KeyboardInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.showNewGameConfirmation();
};

KeyboardInputManager.prototype.retry = function (event) {
  event.preventDefault();
  this.emit("restart");
};

KeyboardInputManager.prototype.showNewGameConfirmation = function () {
  var dialog = document.getElementById('newGameDialog');
  var startBtn = document.getElementById('startNewGameBtn');
  var cancelBtn = document.getElementById('cancelNewGameBtn');
  
  // Show the dialog
  dialog.classList.add('show');
  
  // Handle start new game button
  var startHandler = function() {
    dialog.classList.remove('show');
    startBtn.removeEventListener('click', startHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
    this.emit("restart");
  }.bind(this);
  
  // Handle cancel button
  var cancelHandler = function() {
    dialog.classList.remove('show');
    startBtn.removeEventListener('click', startHandler);
    cancelBtn.removeEventListener('click', cancelHandler);
  };
  
  startBtn.addEventListener('click', startHandler);
  cancelBtn.addEventListener('click', cancelHandler);
  
  // Close dialog when clicking outside
  dialog.addEventListener('click', function(e) {
    if (e.target === dialog) {
      dialog.classList.remove('show');
      startBtn.removeEventListener('click', startHandler);
      cancelBtn.removeEventListener('click', cancelHandler);
    }
  });
};

KeyboardInputManager.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

KeyboardInputManager.prototype.undo = function (event) {
  event.preventDefault();
  this.emit("undo");
};

KeyboardInputManager.prototype.settings = function (event) {
  event.preventDefault();
  this.emit("settings");
};

KeyboardInputManager.prototype.leaderboard = function (event) {
  event.preventDefault();
  this.emit("leaderboard");
};

KeyboardInputManager.prototype.stats = function (event) {
  event.preventDefault();
  this.emit("stats");
};

KeyboardInputManager.prototype.showTutorial = function (event) {
  event.preventDefault();
  var tutorialModal = document.getElementById('tutorialModal');
  tutorialModal.classList.add('show');
  
  // Close tutorial when clicking outside
  tutorialModal.addEventListener('click', function(e) {
    if (e.target === tutorialModal) {
      tutorialModal.classList.remove('show');
    }
  });
};

KeyboardInputManager.prototype.hideTutorial = function (event) {
  event.preventDefault();
  var tutorialModal = document.getElementById('tutorialModal');
  tutorialModal.classList.remove('show');
};

KeyboardInputManager.prototype.hideStats = function (event) {
  event.preventDefault();
  var statsModal = document.getElementById('statsModal');
  statsModal.classList.remove('show');
};

KeyboardInputManager.prototype.hideSettings = function (event) {
  event.preventDefault();
  var settingsModal = document.getElementById('settingsModal');
  settingsModal.classList.remove('show');
};

KeyboardInputManager.prototype.hideLeaderboard = function (event) {
  event.preventDefault();
  var leaderboardModal = document.getElementById('leaderboardModal');
  leaderboardModal.classList.remove('show');
};

KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
  var button = document.querySelector(selector);
  if (button) {
    button.addEventListener("click", fn.bind(this));
    button.addEventListener(this.eventTouchend, fn.bind(this));
  }
};
