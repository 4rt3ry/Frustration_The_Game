
/**
 * Manages and renders all enemies kept in the EnemyCollection()
 * @param {object} env 
 * @param {object} p5Canvas 
 */
function EnemyCollection(env = {}, p5Canvas = {}, bulletCollection) {
    this.env = env;
    this.p5 = p5Canvas;
    this.bullets = bulletCollection;

    this.target = new Vector();
    this.collection = []; // List of enemies (in order for references to any collections to be simple)
    this.spawnTimer = 0;
}

/**
 * Add a new enemy into the collection𑁋 Obviously, you dolt.
 * @param {Enemy} enemy an instance of Enemy() to be added
 */
EnemyCollection.prototype.add = function (enemy = new Enemy()) { this.collection.push(enemy); }

EnemyCollection.prototype.aim = function (target = new Vector()) { this.target = target; }

/**
 * Draws and manages all enemies in the collection.
 * For accurate movement and smooth animations, make sure to call setDeltaTime(dt)
 */
EnemyCollection.prototype.render = function () {
    for (let i = this.collection.length - 1; i >= 0; i--) {
        this.collection[i].setDeltaTime(this.dt);

        // this.collection[i].move(new Vector(Math.random() - 0.5, Math.random() - 0.5));
        if (!this.env.gameOver) {
            this.collection[i].updatePos();
            this.collection[i].aim(this.target);
            this.collection[i].shoot(this.bullets);
        }

        this.collection[i].display(this.p5);

        if (this.collection[i].health <= 0) {
            this.collection.splice(i, 1);
            this.env.score += 10 + (Date.now() - this.env.startTime) / 10000;
            console.log("Enemy has died")
        }
    }
}

/**
 * Set the delta time to make animations and movement more smooth and accurate.
 * @param {number} dt Delta Time, or inverse frame rate
 */
EnemyCollection.prototype.setDeltaTime = function (dt = 1 / 60) { this.dt = dt; }

/**
 * Obviously used to represent an enemy
 * @param {object} env Must contain the env variable from main.js
 * @param {Vector} pos Spawning position (in terms of world origin).
 * @param {number} spawnTime How long it takes to spawn.
 * @param {number} shootDelay How long it takes to shoot (used for animation)
 */
function Enemy(env = {}, pos = new Vector(), spawnTime = 5, shootDelay = 2, maxHealth = 100) {
    this.dt = 1 / 60; //Delta Time
    this.env = env;
    this.pos = pos; //CHANGE IN THE FUTURE TO BE RELATIVE TO WORLD ORIGIN (TOP LEFT OF MAP)

    this.vel = new Vector();
    this.dir = new Vector();
    this.lastShootDir = new Vector();
    this.maxSpeed = 250;
    this.drag = 100;
    this.targetPosition = new Vector();

    this.health = maxHealth;
    this.shootable = true;
    this.name = "enemy";

    this.maxSpawnTime = spawnTime;
    this.spawnTimer = spawnTime;//Current spawn time (used for animation)
    this.spawning = true;

    this.shootTimer = 0;
    this.shootDelay = shootDelay;

    this.moveTimer = 0;
    this.moveTime = 1;
}

/**
 * Must be called before other methods.
 * @param {number} dt Delta Time
 */
Enemy.prototype.setDeltaTime = function (dt) { this.dt = dt };

Enemy.prototype.instantForce = function (x, y) {

    this.accel = 100;//Change this later based on bullet projectiles

    this.vel.x += x * this.accel * this.dt;
    this.vel.y += y * this.accel * this.dt;
}

Enemy.prototype.updatePos = function () {

    if (this.env.paused) return;
    if (this.spawning) return;
    this.vel.round(0.01);

    let velMag = this.vel.magnitude();
    if (velMag > this.maxSpeed) {
        this.vel.normalize();
        this.vel.scale(this.maxSpeed);
    }

    this.pos.x += this.vel.x * this.dt * this.env.scale;
    this.pos.y += this.vel.y * this.dt * this.env.scale;

    //Constraining the enemy's position to the world map
    if (this.pos.x + this.env.worldWidth / 2 - this.env.w / 2 < 10 * this.env.scale) {
        this.pos.x = 10 * this.env.scale + this.env.w / 2 - this.env.worldWidth / 2;
    }
    else if (this.pos.x + this.env.worldWidth / 2 - this.env.w / 2 > this.env.worldWidth - 10 * this.env.scale) {
        this.pos.x = this.env.worldWidth / 2 + this.env.w / 2 - 10 * this.env.scale;
    }
    if (this.pos.y + this.env.worldHeight / 2 - this.env.h / 2 < 10 * this.env.scale) {
        this.pos.y = 10 * this.env.scale + this.env.h / 2 - this.env.worldHeight / 2;
    }
    else if (this.pos.y + this.env.worldHeight / 2 - this.env.h / 2 > this.env.worldHeight - 10 * this.env.scale) {
        this.pos.y = this.env.worldHeight / 2 - 10 * this.env.scale + this.env.h / 2;
    }

    let dragVector = {
        x: this.lastShootDir.x * this.drag * this.dt,
        y: this.lastShootDir.y * this.drag * this.dt
    }
    if (Math.abs(dragVector.x) > Math.abs(this.vel.x)) this.vel.x = 0;
    else this.vel.x -= dragVector.x;
    if (Math.abs(dragVector.y) > Math.abs(this.vel.y)) this.vel.y = 0;
    else this.vel.y -= dragVector.y;
}

/**
 * Moves in the specified direction every set amount of time
 * @param {Vector} dir Movement direction
 */
Enemy.prototype.move = function (dir = new Vector()) {
    if (this.spawning) { return; }
    if (this.moveTimer <= 0) {
        this.dir.normalize();
        this.instantForce(dir.x * this.maxSpeed / 20, dir.y * this.maxSpeed / 20);
        this.moveTimer = this.moveTime;
    }
    else {
        this.moveTimer -= this.dt;
    }
}

Enemy.prototype.display = function (p5Canvas) {
    if (this.spawning) {
        this.spawn(p5Canvas);
        return;
    }

    let baseSize = 0 * this.env.scale;
    let maxSize = 20 * this.env.scale;
    let incriment = 3 * this.env.scale;
    let displayX = this.pos.x + this.env.worldOffset.x;
    let displayY = this.pos.y + this.env.worldOffset.y;


    p5Canvas.noStroke();
    p5Canvas.fill(50, 0, 0);
    p5Canvas.ellipse(displayX, displayY, maxSize, maxSize);

    p5Canvas.strokeWeight(Math.max(1, this.env.scale));
    p5Canvas.stroke(255);
    p5Canvas.noFill();
    p5Canvas.ellipse(displayX, displayY, maxSize, maxSize);
    p5Canvas.strokeWeight(incriment)
    for (let i = baseSize; i < maxSize - incriment; i += incriment) {
        let alpha = Math.pow((i - baseSize) / (maxSize - baseSize), 3) * 255;
        p5Canvas.stroke(200, 0, 0, alpha);
        p5Canvas.ellipse(displayX, displayY, i, i);
    }
}

Enemy.prototype.spawn = function (p5Canvas) {
    if (this.spawnTimer <= 0) {
        this.spawning = false;
    }
    let displayX = this.pos.x + this.env.worldOffset.x;
    let displayY = this.pos.y + this.env.worldOffset.y;

    p5Canvas.strokeWeight(Math.max(1, this.env.scale));
    p5Canvas.noFill();
    p5Canvas.stroke(150, 0, 0);

    p5Canvas.arc(displayX, displayY, 30 * this.env.scale, 30 * this.env.scale, -Math.PI / 2, this.spawnTimer / this.maxSpawnTime * Math.PI * 2 - Math.PI / 2);

    hexagon(p5Canvas, displayX, displayY, 10 * this.env.scale, 3 * this.env.scale);

    p5Canvas.rectMode(p5Canvas.CENTER);
    p5Canvas.rect(displayX, displayY - 3 * this.env.scale, 4 * this.env.scale, 8 * this.env.scale, 1 * this.env.scale);
    p5Canvas.ellipse(displayX + this.env.scale / 2, displayY + 5 * this.env.scale, 4 * this.env.scale, 4 * this.env.scale)
    if (!this.env.paused) {
        this.spawnTimer -= this.dt;
    }
}

/**
 * Aims this enemy at a specified direction.
 * @param {Vector} aimDir direction vector relative to enemy
 */
Enemy.prototype.aim = function (target) {
    this.targetPosition = target.get();
    this.dir = target.get().add(this.env.w / 2 - this.pos.x, this.env.h / 2 - this.pos.y).normalized();
}

Enemy.prototype.shoot = function (bullets, bulletType = "enemy standard") {
    if (this.spawning) return;
    if (this.env.paused) return;
    if (this.shootTimer <= 0) {
        //If enemy is outside of player view, don't shoot
        let relativePosition = new Vector(this.env.w / 2 - this.pos.x - this.env.worldOffset.x, this.env.h / 2 - this.pos.y - this.env.worldOffset.y);
        if (Math.abs(relativePosition.x) > this.env.w / 2 || Math.abs(relativePosition.y) > this.env.h / 2) return;

        let bulletPos = this.pos.get(); //Location at which bullet spawns

        let bullet = new Bullet(this.env, bulletPos, this.dir, bulletType);
        bullets.add(bullet);
        this.shootTimer = this.shootDelay;
        this.lastShootDir = this.dir.get().scale(-1);
        this.instantForce(-this.dir.x * bullet.recoil, -this.dir.y * bullet.recoil)
    }
    else {
        this.shootTimer -= this.dt;
    }
}

/**
 * Applies damage to this enemy, you idiot!
 * @param {number} damage Amount of damage to take
 */
Enemy.prototype.takeDamage = function (damage = 1) {
    this.health -= damage;
}


/**
 * CURRENTLY NOT USED
 * @param {object} p5Canvas 
 */
Enemy.prototype.shootAnimation = function (p5Canvas) {
    if (this.shootTimer < 0) return;
    p5Canvas.strokeWeight(Math.max(1, this.env.scale));
    p5Canvas.stroke(50, 0, 0);
    p5Canvas.noFill();

    let time = this.shootTimer / this.shootDelay;
    let trailIterations = 5;
    for (let i = 0; i < trailIterations; i++) {
        p5Canvas.push();
        p5Canvas.translate(this.pos.x, this.pos.y);
        p5Canvas.pop();
    }
    this.shootTimer -= this.dt;
}