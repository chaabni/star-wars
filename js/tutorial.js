Game.Tutorial = function() {
	this._turnsTotal = 0;
	this._turnsLocal = 0;
	this._kills = 0;
	this._phase = this.constructor.PHASE_GAME*0;
}

Game.Tutorial.PHASE_INTRO			= 0;
Game.Tutorial.PHASE_MICKEY			= 1;
Game.Tutorial.PHASE_ROBOT			= 2;
Game.Tutorial.PHASE_CLONE			= 3;
Game.Tutorial.PHASE_GAME			= 4;
Game.Tutorial.PHASE_OUTRO			= 99;
Game.Tutorial.PHASE_GAMEOVER		= 100;

Game.Tutorial.prototype.getSpeed = function() {
	return 100;
}

Game.Tutorial.prototype.getScore = function() {
	return this._kills;
}

Game.Tutorial.prototype.addKill = function(being) {
	if (being == Game.player) {
		this._phase = this.constructor.PHASE_GAMEOVER;
	} else if (this._phase != this.constructor.PHASE_GAMEOVER) {
		this._kills++;
		if (this._kills == Game.Rules.TARGET_KILLS) {
			this._phase = this.constructor.PHASE_OUTRO;
		} else if (this._phase != this.constructor.PHASE_GAME) {
			this._phase++; /* switch to next phase */
			this._turnsLocal = 0;
		}
	}
}

Game.Tutorial.prototype.act = function() {
	this._turnsTotal++;
	this._turnsLocal++;

	switch (this._phase) {
		case this.constructor.PHASE_INTRO:
			this._turnsLocal = 0;
			this._showIntroBubbles();
		break;

		case this.constructor.PHASE_MICKEY:
			if (this._turnsLocal == 5) { this._showMickey(); }
		break;

		case this.constructor.PHASE_ROBOT:
			if (this._turnsLocal == 2) { this._showRobot(); }
		break;

		case this.constructor.PHASE_CLONE:
			if (this._turnsLocal == 2) { this._showClone(); }
		break;

		case this.constructor.PHASE_GAME: /* FIXME adjust to variable (sinusoidal?) spawn chance */
			if (ROT.RNG.getUniform() > Game.Rules.SPAWN_CHANCE) { this._spawn(); }
		break;

		case this.constructor.PHASE_OUTRO:
			this._showOutroBubble();
		break;

		case this.constructor.PHASE_GAMEOVER:
			this._showGameoverBubble();
		break;
	}
}

/**
 * Create a sequence of bubbles, with a common anchor
 */
Game.Tutorial.prototype._showBubbles = function(texts, anchorCallbacks, doneCallback) {
	var bubble = new Game.Bubble(texts.shift());
	anchorCallbacks.shift()(bubble);
	var promise = bubble.show();

	while (texts.length) {
		var text = texts.shift();
		var ac = anchorCallbacks.shift();
		promise = promise.then(function(text, ac) { 
			var newBubble = new Game.Bubble(text);
			ac(newBubble);
			return newBubble.show();
		}.bind(this, text, ac));
	}

	promise.then(doneCallback);
}

Game.Tutorial.prototype._showIntroBubbles = function() {
	Game.engine.lock();
	var name = Game.player.getType();
	name = name.charAt(0).toUpperCase() + name.substring(1);

	var texts = [
		"This is you, a mighty " + name + ". Move around using arrow keys or numpad.",
		"This is your %c{" + Game.COLOR_HEALTH + "}health%c{} & %c{" + Game.COLOR_MANA + "}force%c{} meter. Both health and force slowly regenerate.",
		"This is your score bar. " + Game.Rules.TARGET_KILLS + " kills are necessary to finish your training.",
		"Move around by using arrow keys or numpad. Try it now!",
	];

	var lastCol = Game.display.getOptions().width-1;

	var anchorCallbacks = [
		function(bubble) { bubble.anchorToBeing(Game.player); },
		function(bubble) { bubble.anchorToColumn(0); },
		function(bubble) { bubble.anchorToColumn(lastCol); },
		function(bubble) { bubble.anchorToBeing(Game.player); }
	]

	var doneCallback = function() {
		this._phase++;
		this._turnsLocal = 0;
		Game.engine.unlock();
	}

	this._showBubbles(texts, anchorCallbacks, doneCallback.bind(this));
}

Game.Tutorial.prototype._showMickey = function() {
	Game.engine.lock();

	var mickey = new Game.Mickey();
	Game.spawnBeing(mickey);

	var texts = [
		"This is a Mickey Mouse. These adorable fluffy animals have only one goal - to get close to you.",
		"This might be a suitable time to experiment with your %c{#fff}lightsaber%c{}: hit 's' to swing it around."
	];

	var anchorCallbacks = [
		function(bubble) { bubble.anchorToBeing(mickey); },
		function(bubble) { bubble.anchorToBeing(mickey); }
	]

	var doneCallback = function() {
		Game.player.adjustPowers({lightsaber:true});
		Game.engine.unlock();
	}

	this._showBubbles(texts, anchorCallbacks, doneCallback.bind(this));
}

Game.Tutorial.prototype._showRobot = function() {
	Game.engine.lock();

	var robot = new Game.Robot();
	Game.spawnBeing(robot);

	var texts = [
		"This is a Battle Droid. Watch out - they try to get close and shoot their laser blasters!",
		"You can use %c{#fff}force push%c{} and %c{#fff}force pull%c{} to manipulate enemies"
	];

	var anchorCallbacks = [
		function(bubble) { bubble.anchorToBeing(robot); },
		function(bubble) { bubble.anchorToBeing(robot); }
	]

	var doneCallback = function() {
		Game.player.adjustPowers({push:true, pull:true});
		Game.engine.unlock();
	}

	this._showBubbles(texts, anchorCallbacks, doneCallback.bind(this));
}

Game.Tutorial.prototype._showClone = function() {
	Game.engine.lock();

	var clone = new Game.Clone();
	Game.spawnBeing(clone);

	var texts = [
		"This is a Clone Trooper. Much smarter than droids, clones try to outsmart you by staying in a safe distance.",
		"Unleash the power of a mighty %c{#fff}force fork%c{} to show your enemies that no distance is safe enough!"
	];

	var anchorCallbacks = [
		function(bubble) { bubble.anchorToBeing(clone); },
		function(bubble) { bubble.anchorToBeing(clone); }
	]

	var doneCallback = function() {
		Game.player.adjustPowers({fork:true});
		Game.engine.unlock();
	}

	this._showBubbles(texts, anchorCallbacks, doneCallback.bind(this));
}

Game.Tutorial.prototype._showOutroBubble = function() {
	Game.engine.lock();

	var bubble = new Game.Bubble("Congratulations! You have finished your training and mastered the way of the Force!\n\nElapsed turns: %c{#fff}" + (this._turnsTotal-1), true);
	bubble.anchorToBeing(Game.player).show();
}

Game.Tutorial.prototype._showGameoverBubble = function() {
	Game.engine.lock();

	var bubble = new Game.Bubble("You are dead.\n\nGame over!", true);
	bubble.anchorToBeing(Game.player).show();
}

/**
 * Spawn a random enemy
 */
Game.Tutorial.prototype._spawn = function() {
	var def = {};
	def["Mickey"] = 4;
	def["Robot"] = 3;
	def["Clone"] = 2;

	var name = this._pickRandom(def);
	var being = new Game[name]();
	Game.spawnBeing(being);
}

Game.Tutorial.prototype._pickRandom = function(data) {
	var avail = [];
	var total = 0;
	
	for (var id in data) {
		total += data[id];
	}
	var random = Math.floor(ROT.RNG.getUniform()*total);
	
	var part = 0;
	for (var id in data) {
		part += data[id];
		if (random < part) { return id; }
	}
}
