function PlayerStats(env = {}, pos = new Vector(), vel = new Vector(0, 0), accel = 0, drag = 0, maxSpeed = 0, maxHealth = 100) {

    if (typeof (env) != "object") { throw new Error("EnvironmentVariables must be typeof: object") }
    if (typeof (pos) != "object") { throw new Error("Position must be typeof: object") }
    if (typeof (vel) != "object") { throw new Error("Velocity must be typeof: object") }
    if (typeof (accel) != "number") { throw new Error("Acceleration must be typeof: number") }
    if (typeof (drag) != "number") { throw new Error("Drag must be typeof: number") }
    if (typeof (maxSpeed) != "number") { throw new Error("Velocity must be typeof: number") }
    if (typeof (maxHealth) != "number") { throw new Error("maxHealth must be typeof: number") }

    this.env = env;
    this.pos = pos;
    this.vel = vel;
    this.accel = accel; //may be strange representation, but this represents magnitude
    this.drag = drag;
    this.maxSpeed = maxSpeed;
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.shootable = true;
    this.name = "player";
}

/**
 * Creates a player - who could've guessed
 * @param {PlayerStats} playerStats Inherits properties, such as position etc. from an instance of PlayerStats
 */
function Player(playerStats = new PlayerStats()) {
    this.dt = 0.1; //Delta Time
    this.dir = new Vector();
    Object.assign(this, playerStats);
}
Player.prototype.setDeltaTime = function (dt) { this.dt = dt };


Player.prototype.instantForce = function (x, y) {
    // let magnitude = Math.sqrt(x * x + y * y);
    // let target_direction = { x: this.x / magnitude, y: this.y / magnitude };
    // let target_angle = Math.atan2(y, x);
    this.accel = 100;//Change this later based on bullet projectiles

    this.vel.x += x * this.accel * this.dt;
    this.vel.y += y * this.accel * this.dt;
}

Player.prototype.updatePos = function () {

    if(this.env.paused) return;
    this.vel.round(0.01);

    let velMag = this.vel.magnitude();
    if (velMag > this.maxSpeed) {
        this.vel.normalize();
        this.vel.scale(this.maxSpeed);
    }

    let normalizedVel = this.vel.normalized();
    this.dir.x = normalizedVel.x;
    this.dir.y = normalizedVel.y;

    this.pos.x += this.vel.x * this.dt * this.env.scale;
    this.pos.y += this.vel.y * this.dt * this.env.scale;
    

    //Constraining the player's position to the world map
    if (this.pos.x + this.env.worldOffset.x + this.env.w / 2 < 100 * this.env.scale) {
        this.pos.x = - this.env.worldOffset.x - this.env.w / 2 + 100 * this.env.scale;
    }
    else if (this.pos.x + this.env.worldOffset.x > this.env.w / 2 - 100 * this.env.scale) {
        this.pos.x = - this.env.worldOffset.x + this.env.w / 2 - 100 * this.env.scale;
    }
    if (this.pos.y + this.env.worldOffset.y + this.env.h / 2 < 100 * this.env.scale) {
        this.pos.y = - this.env.worldOffset.y - this.env.h / 2 + 100 * this.env.scale;
    }
    else if (this.pos.y + this.env.worldOffset.y > this.env.h / 2 - 100 * this.env.scale) {
        this.pos.y = - this.env.worldOffset.y + this.env.h / 2 - 100 * this.env.scale;
    }
    //When the player moves outside of the little box in the middle, move the map (as to keep the player relatively centered)

    if (this.pos.x + this.env.worldOffset.x < -50 * this.env.scale && Math.sign(this.vel.x) < 0 || this.pos.x + this.env.worldOffset.x > 50 * this.env.scale && Math.sign(this.vel.x) > 0) {
        if (this.env.worldOffset.x < (this.env.worldWidth - this.env.w) / 2 && Math.sign(this.vel.x) < 0 || 
        this.env.worldOffset.x > (this.env.w - this.env.worldWidth) / 2 && Math.sign(this.vel.x) > 0) {
            this.env.worldOffset.x -= this.vel.x * this.dt * this.env.scale;
        }
    }
    if (this.pos.y + this.env.worldOffset.y < -50 * this.env.scale && Math.sign(this.vel.y) < 0 || this.pos.y + this.env.worldOffset.y > 50 * this.env.scale && Math.sign(this.vel.y) > 0) {
        if (this.env.worldOffset.y < (this.env.worldHeight - this.env.h) / 2 && Math.sign(this.vel.y) < 0 || 
        this.env.worldOffset.y > (this.env.h - this.env.worldHeight) / 2 && Math.sign(this.vel.y) > 0) {
            this.env.worldOffset.y -= this.vel.y * this.dt * this.env.scale;
        }
    }

    //NOTE: IF THERE ARE LAGGY MOVEMENT FEATURES, MY MATH ILLITERACY BELOW MAY BE THE CAUSE
    let dragVector = {
        x: this.dir.x * this.drag * this.dt,
        y: this.dir.y * this.drag * this.dt
    }
    if (Math.abs(dragVector.x) > Math.abs(this.vel.x)) this.vel.x = 0;
    else this.vel.x -= dragVector.x;
    if (Math.abs(dragVector.y) > Math.abs(this.vel.y)) this.vel.y = 0;
    else this.vel.y -= dragVector.y;
}

/**
 * TODO: This should automatically apply a force based on the bullet type
 * @param {BulletCollection} bullets 
 * @param {Vector} dir - Direction of bullet travel. Automatically normalized
 * @param {string} bulletType - Types include: standard
 */
Player.prototype.shoot = function(bullets, dir = new Vector(), bulletType = "standard") {
    if (this.env.paused) return;
    if (bullets.shootTimer > 0) return;
    let bulletPos = this.pos.get(); //Location at which bullet spawns
    bulletPos.add(this.env.w / 2, this.env.h / 2);

    let bullet = new Bullet(this.env, bulletPos, dir, bulletType);
    bullets.add(bullet);
    bullets.setShootTimer(bulletType);

    this.instantForce(-dir.x * bullet.recoil, -dir.y * bullet.recoil);
}

/**
 * Makes the player take damage, you idiot!
 * @param {number} damage Amount of damage to take
 */
Player.prototype.takeDamage = function(damage = 1) {
    //health managed in this.prototype.display()
    this.health -= damage;
}

/**
 * Displays the player
 * @param {object} p5Canvas Must receive the p5 canvas in order to render the object
 * @param {number} color Represented by the P5.js color() object
 */
Player.prototype.display = function (p5Canvas, color) {
    if(this.health <= 0) {
        this.env.gameOver = true;
    }

    //Displays main body

    let baseSize = 0 * this.env.scale;
    let maxSize = 20 * this.env.scale;
    let incriment = 3 * this.env.scale;
    let displayX = this.pos.x + this.env.worldOffset.x + this.env.w / 2;
    let displayY = this.pos.y + this.env.worldOffset.y + this.env.h / 2;

    p5Canvas.noFill();
    p5Canvas.stroke(255);
    p5Canvas.strokeWeight(1);
    p5Canvas.ellipse(displayX, displayY, maxSize, maxSize);
    p5Canvas.strokeWeight(incriment);
    for (let i = baseSize; i < maxSize; i += incriment) {
        let alpha = Math.pow((i - baseSize) / (maxSize - baseSize), 3) * 255;
        p5Canvas.stroke(p5Canvas.color(p5Canvas.red(color), p5Canvas.green(color), p5Canvas.blue(color), alpha));
        p5Canvas.ellipse(displayX, displayY, i, i);
    }

    //Displays health bar
    let maxFillLength = 400 * this.env.scale;
    let fillLength = this.health / this.maxHealth * maxFillLength;
    p5Canvas.fill(255, 255, 255, 20);
    p5Canvas.stroke(255);
    p5Canvas.strokeWeight(this.env.scale);
    p5Canvas.rectMode(p5Canvas.CENTER);
    p5Canvas.rect(this.env.w / 2, this.env.h - 10 * this.env.scale, maxFillLength + 1, 11 * this.env.scale, 2);

    p5Canvas.fill(120, 0, 0);
    p5Canvas.noStroke();
    p5Canvas.rect(this.env.w / 2 - (maxFillLength - fillLength) / 2, this.env.h - 10 * this.env.scale, fillLength, 10 * this.env.scale, 2);
    

}