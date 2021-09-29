
/**
 * This is where all bullets should be kept and modified.
 * @param {object} env Must contain the env variable from main.js
 * @param {object} p5Canvas Must receive the p5 canvas in order to render the object
 * @param {string} targetName Determines what unit gets damaged. Options: "player", "enemy". CURRENTLY NOT USED
 */
function BulletCollection(env, p5Canvas) {
    this.collection = [];
    this.env = env;
    this.shootTimer = 0;
    this.p5 = p5Canvas;
    this.targetList = [];
}

/**
 * Instantiates a bullet
 * @param {Bullet} bullet
 */
BulletCollection.prototype.add = function (bullet) {
    this.collection.push(bullet);
}

BulletCollection.prototype.setShootTimer = function (bulletType = "standard") {
    switch (bulletType) {
        case "standard":
            this.shootTimer = 0.25;
    }
}

/**
 * Displays bullets and updates bullet positions
 * @param {number} dt Delta time variable
 */
BulletCollection.prototype.render = function (dt = 1 / 60) {
    for (let i = this.collection.length - 1; i >= 0; i--) {
        this.collection[i].setDeltaTime(dt);
        this.collection[i].updatePos();

        if (this.collection[i].pos.x < this.env.w / 2 - this.env.worldWidth / 2 || this.collection[i].pos.x > this.env.w / 2 + this.env.worldWidth / 2 ||
            this.collection[i].pos.y < this.env.h / 2 - this.env.worldHeight / 2 || this.collection[i].pos.y > this.env.h / 2 + this.env.worldHeight / 2) {
            delete this.collection[i];
            this.collection.splice(i, 1);
            continue;

        }

        //console.log(this.targetList)
        let hitTarget = false;
        for (let j = this.targetList.length - 1; j >= 0; j--) {
            if (this.targetList[j].spawning) continue;
            if (!this.targetList[j].shootable) continue;

            let targetPos = this.targetList[j].pos.get();
            if (this.targetList[j].name == "player") targetPos.add(this.env.w / 2, this.env.h / 2);

            let distance = this.collection[i].pos.get().add(-targetPos.x, -targetPos.y).magnitude();

            if (distance < 12 * this.env.scale) {
                this.targetList[j].takeDamage(this.collection[i].damage);
                this.collection.splice(i, 1);
                hitTarget = true;
                break;
            }
        }
        if (hitTarget) continue;

        this.collection[i].display(this.p5, this.p5.color(255));
    }

    if (this.shootTimer > 0) this.shootTimer -= dt;
    else this.shootTimer = 0;
}

BulletCollection.prototype.setTarget = function (target) {
    if (target.collection != undefined) {
        this.targetList = target.collection;
    }
    else {
        this.targetList = [target];
    }
}

/**
 * Literally just a bullet.
 * @param {object} env - Must contain the env variable from main.js
 * @param {Vector} pos - Position represented by Vector()
 * @param {Vector} dir - Direction vector for bullet travel. This will be normalized automatically.
 * @param {string} bulletType - Bullet Types: standard
 * @param {number} recoilForce - Amount of recoil this projectile has
 */

function Bullet(env = {}, pos = new Vector(), dir = new Vector(1, 0), bulletType = "standard") {
    this.dt = 0.1; //Delta Time
    this.env = env;
    this.pos = pos;
    this.vel = new Vector();
    this.dir = dir.normalized();
    this.recoil = 50; //Change based on bullet type
    this.damage = 10;
    this.bt = bulletType;

    switch (this.bt) {
        case "standard":
            this.vel = this.dir.get();
            this.recoil = 50;
            this.damage = 50;
            this.vel.scale(250); break;
        case "enemy standard":
            this.vel = this.dir.get();
            this.recoil = 20;
            this.damage = 10;
            this.vel.scale(400); break;
        default:
            this.vel = this.dir.get();
            this.recoil = 50;
            this.damage = 10;
            this.vel.scale(250); break;
    }
}
Bullet.prototype.setDeltaTime = function (dt) { this.dt = dt };

Bullet.prototype.updatePos = function () {
    if (this.env.paused) return;
    this.vel.round(0.01);
    this.pos.x += this.vel.x * this.dt * this.env.scale;
    this.pos.y += this.vel.y * this.dt * this.env.scale;
}

/**
 * Displays the player
 * @param {object} p5Canvas Must receive the p5 canvas in order to render the object
 * @param {number} color Represented by the P5.js color() object
 */
Bullet.prototype.display = function (p5Canvas, color) {
    if (this.bt == "enemy standard") {
        let width = 20 * this.env.scale;
        let height = 4 * this.env.scale;
        let rotation = Math.atan2(this.dir.y, this.dir.x);
        let iterations = 5;

        p5Canvas.noStroke();
        p5Canvas.rectMode(p5Canvas.CENTER);

        p5Canvas.push();
        p5Canvas.translate(this.pos.x + this.env.worldOffset.x, this.pos.y + this.env.worldOffset.y);
        p5Canvas.rotate(rotation);

        //green
        for (let i = iterations / 4; i <= iterations; i++) {
            let scale = i / iterations;
            let alpha = 50 - scale * 50;
            p5Canvas.fill(p5Canvas.color(0, 255, 0, alpha));
            p5Canvas.rect((1 - i * 1.2 - 14) * this.env.scale, 4 * this.env.scale, width * scale * this.env.scale, height * (1 - scale * 0.5) * this.env.scale, 2 * this.env.scale);
        }

        //red
        for (let i = iterations / 4; i <= iterations; i++) {
            let scale = i / iterations;
            let alpha = 60 - scale * 60;
            p5Canvas.fill(p5Canvas.color(255, 0, 0, alpha));
            p5Canvas.rect((1 - i * 1.2 - 8) * this.env.scale, -1 * this.env.scale, width * scale * this.env.scale, height * (1 - scale * 0.5) * this.env.scale, 2 * this.env.scale);
        }

        //white
        for (let i = iterations / 4; i <= iterations; i++) {
            let scale = i / iterations;
            let alpha = 255 - scale * 255;
            p5Canvas.fill(p5Canvas.color(255, 255, 255, alpha));
            p5Canvas.rect((1 - i * 1.2, 0) * this.env.scale, 0, width * scale * this.env.scale, height * (1 - scale * 0.5) * this.env.scale, 2 * this.env.scale);
        }
        p5Canvas.pop();
    }
    else {
        let width = 20 * this.env.scale;
        let height = 4 * this.env.scale;
        let rotation = Math.atan2(this.dir.y, this.dir.x);
        let iterations = 5;

        p5Canvas.noStroke();
        p5Canvas.rectMode(p5Canvas.CENTER);

        p5Canvas.push();
        p5Canvas.translate(this.pos.x + this.env.worldOffset.x, this.pos.y + this.env.worldOffset.y);
        p5Canvas.rotate(rotation);

        for (let i = iterations / 4; i <= iterations; i++) {
            let scale = i / iterations;
            let alpha = 255 - scale * 255;
            p5Canvas.fill(p5Canvas.color(p5Canvas.red(color), p5Canvas.green(color), p5Canvas.blue(color), alpha));
            p5Canvas.rect((1 - i * 1.2) * this.env.scale, 0, width * scale * this.env.scale, height * (1 - scale * 0.5) * this.env.scale, 2 * this.env.scale);
        }
        p5Canvas.pop();
    }

}