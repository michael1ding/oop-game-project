// This section contains some game constants
var GAME_WIDTH = 600;
var GAME_HEIGHT = 600;

var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 156;
var MAX_ENEMIES = 6;

var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 54;
var SPEED_SCALE = 1;

// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 39;

// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';

// Preload game images
var images = {};
['enemy.png', 'stars.png', 'player.png'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
    console.log("here");
});

// Credits: https://gist.github.com/chriskoch/366054
function drawString(ctx, text, posX, posY, textColor, rotation, font, fontSize) {
	var lines = text.split("\n");
	if (!rotation) rotation = 0;
	if (!font) font = "'serif'";
	if (!fontSize) fontSize = 16;
	if (!textColor) textColor = '#FFFFFF';
	ctx.save();
	ctx.font = fontSize + "px " + font;
	ctx.fillStyle = textColor;
	ctx.translate(posX, posY);
	ctx.rotate(rotation * Math.PI / 180);
	for (i = 0; i < lines.length; i++) {
 		ctx.fillText(lines[i],0, i*fontSize);
	}
	ctx.restore();
}

class Entity {
    render(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}


class Enemy extends Entity {
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images['enemy.png'];

        // Each enemy should have a different speed
        this.speed = (Math.random() / 2 + 0.25) * SPEED_SCALE;
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }

}

class Player extends Entity {
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = images['player.png'];
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        }
        else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        }
    }

}

class Bullet extends Entity{
    constructor(xPos) {
        super();
        this.x = xPos
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = images['player.png'];

        this.speed = 0.5;
    }

    update(timeDiff) {
        this.y = this.y - timeDiff * this.speed;
    }

}


/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();

        // Setup enemies, making sure there are always three
        this.setupEnemies();
        this.bullets =[];

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) {
            this.enemies = [];
        }

        while (this.enemies.filter(e => !!e).length < MAX_ENEMIES) {
            this.addEnemy();
        }
    }

    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy() {
        var enemySpots = GAME_WIDTH / ENEMY_WIDTH;

        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        while (this.enemies[enemySpot]) { //remove !enemySpot ||
            console.log("here");
            enemySpot = Math.floor(Math.random() * enemySpots);
        }
        this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH);
    }

    addBullet() {
        this.bullets.push(new Bullet(this.player.x));
    }

    // This method kicks off the game
    start() {
        this.score = 0;
        this.high_score = 0;
        this.lastFrame = Date.now();

        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            }
            else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            } else if (e.keyCode === 13) {
                this.player = new Player();
                this.enemies = [];
                this.score = 0;
                this.lastFrame = Date.now();
                this.bullets = [];
                this.gameLoop();
            } else if (e.keyCode === 32) {
                this.addBullet();
            }

        });
                
        this.gameLoop();
    }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill
    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;
        SPEED_SCALE = Math.pow(2, 0.08 * timeDiff); 

        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));
        this.bullets.forEach(bullet => bullet.update(timeDiff)); // draw the bullets

        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0); // draw the star bg
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player
        
        this.bullets.forEach(bullet => bullet.render(this.ctx)); // draw the bullets
        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
            }
        });

        var i;
        var j;
        for (i = 0; i < this.enemies.length; i++) {
            for (j = 0; j < this.bullets.length; j++) {
                if (this.bullets[j] && this.enemies[i]){
                    if (this.bullets[j].x == this.enemies[i].x){
                        if (this.bullets[j].y <= this.enemies[i].y+ENEMY_HEIGHT && this.bullets[j].y+PLAYER_HEIGHT >= this.enemies[i].y){
                            delete this.enemies[i];
                            delete this.bullets[j];
                            this.score += 1;
                        }
                    }
                }
            }
        }
        this.setupEnemies();

        // Check if player is dead
        if (this.isPlayerDead()) {
            // If they are dead, then it's game over!
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            drawString(this.ctx, "GAME OVER", 230, 250, 0, 'bold Impact white', 30);
            drawString(this.ctx, "Cats Purged: " + this.score, 210, 300, 0, 'bold Impact white', 30);
            drawString(this.ctx, "Record Cats: " + this.high_score, 210, 350, 0, 'bold Impact white', 30);
            drawString(this.ctx, "Press Enter to Restart", 160, 400, 0, 'bold Impact white', 30);
            this.score > this.high_score ? this.high_score = this.score : this.high_score = this.high_score;
        }
        else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            drawString(this.ctx, "Cats Purged: " + this.score, 5, 30, 0, 'bold Impact white', 30);
            drawString(this.ctx, "Record Cats: " + this.high_score, 5, 70, 0, 'bold Impact white', 30);

            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    isPlayerDead() {
        // TODO: fix this function!: Fixed!
        var hit = false;
        this.enemies.forEach((enemy) => {
            if (enemy.y + ENEMY_HEIGHT - 5 >= this.player.y && enemy.y + 10 < this.player.y + PLAYER_HEIGHT) {
                if (enemy.x == this.player.x) {
                    hit = true;
                }
            }
        });

        return hit;
    }
}





// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();