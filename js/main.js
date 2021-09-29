//TODO: DELETE THIS LATER
//https://docs.google.com/document/d/1pun3D1-f3DItVYz8WTnXCwvA_DcIVL3yaqT0lGGoMjE/edit

/*
--------------------------TODO List-------------------------

1. enemy firing and animations, finish these you dolt, or this won't really be a game


*/
function main(s) {
    let bg;// Background div
    let env = {
        worldWidth: 2000,
        worldHeight: 1600,
        worldOffset: new Vector(),
        paused: false,
        tooltipPause: false,
        gameOver: false,
        score: 0,
        startTime: Date.now(),
    };

    //UNITS ARE ALL IN PIXELS, PIXELS/SECOND ETC.
    let playerStats = new PlayerStats(
        env, //Environment variable
        new Vector(), //Position
        new Vector(), //Velocity
        0, //Acceleration (not currently used)
        100, //Drag
        300, //Max speed
        100); //Max health
    let player1;
    let mousePressed = false;
    let keys = [];
    let keycodes = { "p": 80 };

    let deltaTime = 1 / 60;
    let currentTime = Date.now();
    let pastTime = currentTime - deltaTime;

    let playerBullets = new BulletCollection(env, s);
    let enemyBullets = new BulletCollection(env, s);

    let enemies = new EnemyCollection(env, s, enemyBullets);
    let enemyStats = {
        regSpawnTime: 2,
        regSpawnTimer: 1,
    }

    let hexBackground = {
        pos: [],
        apothem: 20,
        radius: 0,
    };



    s.setup = function () {
        // Environment setup
        env.h = window.innerHeight;
        env.w = Math.min(env.h * 1.5, window.innerWidth);
        env.scale = env.h / 750;
        env.worldWidth *= env.scale;
        env.worldHeight *= env.scale;

        let canvas = s.createCanvas(env.w, env.h);
        bg = document.getElementById("bg");
        canvas.parent(bg);


        s.background(0);
        s.fill(0);
        s.frameRate(60);
        s.textFont("Ubuntu");

        playerStats.env = env;
        player1 = new Player(playerStats);
        playerBullets.setTarget(enemies);
        enemyBullets.setTarget(player1);


        //HEXAGON BACKGROUND SETUP
        let borderSize = 5;
        hexBackground.radius = hexBackground.apothem / Math.cos(Math.PI / 6);//PI / 6 because of 6 sides lol, cant believe you dont remember stupid
        // the + 5 is an arbitrary number for the border 
        for (let y = (env.h - env.worldHeight) / env.scale / 2; y < (env.worldHeight + env.h) / env.scale / 2; y += 2 * hexBackground.apothem + borderSize) {
            //the env.w + [20] is an arbitrary number
            for (let x = (env.w - env.worldWidth) / env.scale / 2; x < (env.worldWidth + env.w) / env.scale / 2; x += 3 * hexBackground.radius + borderSize * 2) {
                if (Math.random() > 0.5) continue;
                hexBackground.pos.push(new Vector(x * env.scale, y * env.scale));
                hexBackground.pos.push(new Vector((x + hexBackground.radius * 1.5 + borderSize) * env.scale, (y + hexBackground.apothem + borderSize / 2) * env.scale));
            }
        }

    }
    s.draw = function () {
        /**********************************************  BACKGROUND EVENTS  *************************************/
        updateDeltaTime(); //DO NOT REMOVE
        if (!env.gameOver) {
            s.fill(0, 0, 0, 100);
            s.noStroke();
            s.rectMode(s.CORNER);
            s.rect(0, 0, env.w, env.h);

            s.noFill();
            s.stroke(50);
            s.strokeWeight(1);
            for (let i = 0; i < hexBackground.pos.length; i++) {
                hexagon(s, hexBackground.pos[i].x + env.worldOffset.x, hexBackground.pos[i].y + env.worldOffset.y, hexBackground.apothem * env.scale, 5 * env.scale);
            }
        }
        else {
            s.noFill();
            s.strokeWeight(1);
            for (let i = 0; i < hexBackground.pos.length; i++) {
                let diagonalScreenLen = (new Vector(env.w, env.h)).magnitude();
                let fill = Math.map(Math.constrain(hexBackground.pos[i].magnitude(), diagonalScreenLen * 0.4, diagonalScreenLen * 0.6),
                    diagonalScreenLen * 0.4, diagonalScreenLen * 0.6, 0.4, 0.8) * 255;
                s.stroke(fill, fill, fill);
                hexagon(s, hexBackground.pos[i].x + env.worldOffset.x, hexBackground.pos[i].y + env.worldOffset.y, hexBackground.apothem * env.scale, 5 * env.scale);
            }
        }

        /************************************************  Game EVENTS  ******************************************/
        if (!env.gameOver) {
            playerBullets.render(deltaTime);
            enemyBullets.render(deltaTime);

            spawnEnemies();
        }
        enemies.setDeltaTime(deltaTime);
        enemies.aim(player1.pos);
        enemies.render();

        //Place after other objects, to display player on top
        player1.setDeltaTime(deltaTime);
        if (!env.gameOver) {
            player1.updatePos();
        }
        player1.display(s, s.color(255));

        /************************************************  OVERLAYED UI  ****************************************/
        if (!env.gameOver) {
            s.textAlign(s.RIGHT, s.BOTTOM);
            s.textSize(20 * env.scale);
            s.fill(255);
            s.noStroke();
            s.text("Press [P] to " + (env.paused ? "resume" : "pause"), env.w - 5, env.h - 5);

            s.textAlign(s.CENTER, s.CENTER);
            s.textSize(30 * env.scale);
            s.text("Score: " + Math.floor(env.score), env.w / 2, env.h - 40 * env.scale);

            if (env.paused) pauseScreen();
        }

        /*********************************************  Keyboard/Mouse Input  **************************************/
        if (!env.gameOver) {
            if (mousePressed) {
                let mouseDir = new Vector(s.mouseX - player1.pos.x - env.w / 2 - env.worldOffset.x, s.mouseY - player1.pos.y - env.h / 2 - env.worldOffset.y);
                mouseDir.normalize();
                player1.shoot(playerBullets, mouseDir.get());
            }
        }

        //GAME OVER
        else {
            s.rectMode(s.CORNER);
            s.fill(255, 255, 255, 50);
            s.rect(0, 0, env.w, env.h);

            s.textAlign(s.CENTER, s.CENTER);
            s.textSize(50 * env.scale);
            s.noStroke();
            s.fill(0);
            s.text("Game Over", env.w / 2, env.h / 2);
            s.textSize(30 * env.scale);
            s.text("Score: " + Math.floor(env.score), env.w / 2, env.h / 2 + 40 * env.scale)

        }
    }

    s.mousePressed = function () { mousePressed = true; }
    s.mouseReleased = function () { mousePressed = false; }

    s.keyPressed = function () {
        keys[s.keyCode] = true;
        if (keys[keycodes["p"]]) env.paused = !env.paused;
    }
    s.keyReleased = function () { keys[s.keyCode] = false; }


    function spawnEnemies() {
        if (env.paused) return;
        if (enemyStats.regSpawnTimer <= 0) {
            let spawnPos = new Vector((Math.random() * env.worldWidth + env.w / 2 - env.worldWidth / 2) * 0.9, (Math.random() * env.worldHeight + env.h / 2 - env.worldHeight / 2) * 0.9);
            enemies.add(new Enemy(env, spawnPos, 5, 2));
            enemyStats.regSpawnTimer = enemyStats.regSpawnTime;
        }
        else {
            enemyStats.regSpawnTimer -= deltaTime;
        }
    }

    //In units per second
    function updateDeltaTime() {
        currentTime = Date.now();
        deltaTime = (currentTime - pastTime) / 1000;
        pastTime = currentTime;
    }

    function pauseScreen() {
        s.rectMode(s.CORNER);
        s.fill(255, 255, 255, 40);
        s.noStroke();
        s.rect(0, 0, env.w, env.h);

        s.textSize(50);
        s.textAlign(s.CENTER, s.CENTER);
        s.fill(0);
        s.noStroke();
        s.text("Paused", env.w / 2, env.h / 2);
    }
};

let myP5 = new p5(main);