// =============================================================================
// sprites
// =============================================================================

//
// hero sprite
//
function Hero(game, x, y, sprite) {
    Phaser.Sprite.call(this, game, x, y, sprite);
    this.anchor.set(0.5, 0.5);

    // Propiedades de salud
    this.maxHealth = 200; // Salud máxima
    this.currentHealth = this.maxHealth; // Salud actual

    // Crear la barra de salud
    this.healthBar = this.game.add.graphics(0, 0);
    this.updateHealthBar(); // Inicializar la barra de salud

    // physic properties
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;

    this.animations.add('stop', [0]);
    this.animations.add('run', [1, 2], 8, true); // 8fps looped
    this.animations.add('attack', [6, 7], 8, true); // 8fps looped
    this.animations.add('shoot', [8, 9], 8); // 8fps looped
    this.animations.add('kick', [4, 5], 8);
    this.animations.add('crouch', [8]);
    this.animations.add('jump', [3]);
    this.animations.add('fall', [4]);
    this.animations.add('hurt', [10]); // 12fps no loop
    this.animations.add('death', [10,11],8); // 12fps no loop
    this.animations.play('stop');
    this.isShooting = false; // Inicialmente no está disparando
    this.isHurt = false;
    this.isCrouching = false;
    this.isAttack = false;
    this.isDead = false;
    this.isBlocking = false;
}

// inherit from Phaser.Sprite
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.move = function (direction) {
    const SPEED = 300;
    this.body.velocity.x = direction * SPEED;

    if (this.body.velocity.x < 0) {
        this.scale.x = -1;
    }
    else if (this.body.velocity.x > 0) {
        this.scale.x = 1;
    }
};

Hero.prototype.jump = function () {
    const JUMP_SPEED = 800;
    let canJump = this.body.touching.down;

    if (canJump) {
        this.body.velocity.y = -JUMP_SPEED;
    }

    return canJump;
};

Hero.prototype.updateHealthBar = function () {
    this.healthBar.clear(); // Limpiar la barra de salud

    // Calcular el ancho de la barra de salud
    const healthBarWidth = 50; // Ancho de la barra de salud
    const healthBarHeight = 10; // Altura de la barra de salud
    const healthPercentage = this.currentHealth / this.maxHealth;

    // Dibujar la barra de salud
    this.healthBar.beginFill(0xff0000); // Color rojo para la salud
    this.healthBar.drawRect(-healthBarWidth / 2, -this.height - 20, healthBarWidth, healthBarHeight); // Fondo de la barra
    this.healthBar.endFill();

    this.healthBar.beginFill(0x00ff00); // Color verde para la salud restante
    this.healthBar.drawRect(-healthBarWidth / 2, -this.height - 20, healthBarWidth * healthPercentage, healthBarHeight); // Barra de salud
    this.healthBar.endFill();
};

Hero.prototype.attack = function () {
    this.isAttack = true; // Marcar que se está disparando

    // Reiniciar el estado de disparo después de un tiempo
    this.game.time.events.add(Phaser.Timer.SECOND * 0.5, function () {
        this.isAttack = false; // Permitir disparar de nuevo
    }, this);
};

Hero.prototype.shoot = function () {
    this.isShooting = true; // Marcar que se está disparando
    if (this.scale.x > 0) {
        // Llama a la función _spawnFireball para crear la bola de fuego
        PlayState._spawnFireball(this.x + 150, this.y, this.scale.x); // Pasar la posición del héroe
    } else {
        PlayState._spawnFireball(this.x - 150, this.y, this.scale.x); // Pasar la posición del héroe
    }
    // Reiniciar el estado de disparo después de un tiempo
    this.game.time.events.add(Phaser.Timer.SECOND * 0.5, function () {
        this.isShooting = false; // Permitir disparar de nuevo
    }, this);
};

Hero.prototype.crouch = function () {
    this.isCrouching = true; // Marcar que se está disparando

    // Reiniciar el estado de disparo después de un tiempo
    this.game.time.events.add(Phaser.Timer.SECOND * 0.5, function () {
        this.isCrouching = false; // Permitir disparar de nuevo
    }, this);
};

Hero.prototype.hurt = function () {
    if (this.currentHealth == 0) {
        this.isDead = true;
    } else {
        this.currentHealth -= 1; // Reducir la salud actual
        this.currentHealth = Math.max(this.currentHealth, 0); // Asegurarse de que no sea menor que 0
        this.isHurt = true;
        this.animations.play('hurt').onComplete.addOnce(function () {
            this.isHurt = false;
        }, this);
    }
};

Hero.prototype.update = function () {
    // Actualizar la animación del sprite, si necesita cambiar
    let animationName = this._getAnimationName();
    if (this.animations.name !== animationName) {
        this.animations.play(animationName);
    }
    // Actualizar la posición de la barra de salud
    this.healthBar.x = this.x; // Alinear la barra de salud con el héroe
    this.healthBar.y = this.y + 150; // Ajustar la posición
    // Actualizar la barra de salud
    this.updateHealthBar();
};

Hero.prototype._getAnimationName = function () {
    let name = 'stop'; // default animation

    if (this.isHurt) {
        name = 'hurt';
    }else if(this.isDead){
        name = 'death';
    }
    // jumping
    else if (this.body.velocity.y < 0) {
        name = 'jump';
        if (this.isAttack) {
            name = 'kick';
        }
    }
    // falling
    else if (this.body.velocity.y >= 0 && !this.body.touching.down) {
        name = 'fall';
        if (this.isAttack) {
            name = 'kick';
        }
    }
    else if (this.body.velocity.x > 0 || this.body.velocity.x < 0 && this.body.touching.down) {
        name = 'run';
    }
    else if (this.isShooting) {
        name = 'shoot';
    }
    else if (this.isCrouching) {
        name = 'crouch';
    } else if (this.isAttack) {
        name = 'attack';
    }else if(this.isBlocking){
        name = 'crouch';
    }

    return name;
};

// =============================================================================
// game states
// =============================================================================

PlayState = {};

PlayState.init = function () {
    this.game.renderer.renderSession.roundPixels = true;

    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP,
        down: Phaser.KeyCode.DOWN,
        j: Phaser.KeyCode.J,
        k: Phaser.KeyCode.K,
        a: Phaser.KeyCode.A,
        d: Phaser.KeyCode.D,
        w: Phaser.KeyCode.W,
        s: Phaser.KeyCode.S,
        z: Phaser.KeyCode.Z,
        x: Phaser.KeyCode.X,
        c: Phaser.KeyCode.C,
        f: Phaser.KeyCode.F
    });

    this.keys.w.onDown.add(function () {
        let didJump = this.hero.jump();
        if (didJump) {
            this.sfx.jump.play();
        }
    }, this);
    this.keys.up.onDown.add(function () {
        let didJump = this.spiders.jump();
        if (didJump) {
            this.sfx.jump.play();
        }
    }, this);
    this.keys.z.onDown.add(function () {
        this.hero.attack();
        this.punch.play();
    }, this);
    this.keys.j.onDown.add(function () {
        this.spiders.attack();

    }, this);
    this.keys.k.onDown.add(function () {
        this.spiders.shoot();

    }, this);
    this.keys.x.onDown.add(function () {
        this.hero.shoot();
        this.slash.play();
    }, this);
    this.keys.c.onDown.add(function () {
        if (this.hero.scale.x == -1) {
            this.hero.move(-80);
        }
        else if (this.hero.scale.x == 1) {
            this.hero.move(80);
        }
        this.swing.play();
    }, this);
};

PlayState.preload = function () {
    this.game.load.json('level:1', 'data/level00.json');
    this.game.load.image('font:numbers', 'images/numbers.png');
    this.game.load.image('background', 'images/arenas.png');
    this.game.load.image('background2', 'images/background3.png');
    this.game.load.image('ground', 'images/ground2.png');
    this.game.load.image('grass:8x1', 'images/grass_8x1.png');
    this.game.load.image('grass:6x1', 'images/grass_6x1.png');
    this.game.load.image('grass:4x1', 'images/grass_4x1.png');
    this.game.load.image('grass:2x1', 'images/grass_2x1.png');
    this.game.load.image('grass:1x1', 'images/grass_1x1.png');
    this.game.load.image('hero', 'images/hero_stopped.png');
    this.game.load.image('fireball', 'images/projectile.png');
    this.game.load.image('shield', 'images/shield.png');
    this.game.load.image('controls', 'images/controls.png');
    this.game.load.image('attacks', 'images/attacks.png');
    this.game.load.spritesheet('hero1', 'images/Cyborg.png', 170, 216);
    this.game.load.spritesheet('hero3', 'images/robin.png', 150, 200);
    this.game.load.spritesheet('hero2', 'images/chicobestia.png', 220, 200);
    this.game.load.spritesheet('hero7', 'images/gizmo.png', 200, 160);
    this.game.load.spritesheet('hero4', 'images/starfire.png', 180, 198);
    this.game.load.spritesheet('hero6', 'images/mamuth.png', 200, 230);
    this.game.load.spritesheet('hero5', 'images/raven.png', 150, 200);
    this.game.load.spritesheet('hero8', 'images/plasmus.png', 370,340);
    this.game.load.spritesheet('hero9', 'images/jinx.png', 180,190);

    this.game.load.audio('sfx:jump', 'audio/jump.mp3');
    this.game.load.audio('sfx:stomp', 'audio/aghh.mp3');
    this.game.load.audio('bgm', 'audio/song1.mp3');
    this.game.load.audio('go', 'audio/letsgo.mp3');
    this.game.load.audio('swing', 'audio/swing.mp3');
    this.game.load.audio('slash', 'audio/slash.mp3');
    this.game.load.audio('punch', 'audio/punch.mp3');
};


PlayState.create = function () {
    // create sound entities
    this.sfx = {
        jump: this.game.add.audio('sfx:jump'),
        stomp: this.game.add.audio('sfx:stomp')
    };
    this.go = this.game.add.audio('go');
    this.bgm = this.game.add.audio('bgm');
    this.swing = this.game.add.audio('swing');
    this.slash = this.game.add.audio('slash');
    this.punch = this.game.add.audio('punch');
    this.go.play();
    this.bgm.loopFull();
    this.bgm.volume = 0.4;
    this.sfx.stomp.volume = 0.3;
    this.sfx.jump.volume = 0.9;
    this.slash.volume = 0.5;
    this.punch.volume = 4;
    this.game.add.image(0, 100, 'background');
    this.game.add.image(250, 400, 'controls');
    this.attacks = this.game.add.image(0, 630, 'attacks');
    this._loadLevel(this.game.cache.getJSON('level:1'));
    this.score = 0;
    textStyle = { font: "40px arial", fill: "#fff" };
    this.scoreText = this.game.add.text(5, 5, "Enemies: 0", textStyle);
    this.scoreText.fixedToCamera = true;
    this.attacks.fixedToCamera = true;
};

PlayState.update = function () {
    this._handleCollisions();
    this._handleInput();
    this._updateCamera();
    this._handleEnemies();

    if (this.hero.isDead) {
      this.game.time.events.add(Phaser.Timer.SECOND * 2, function () {
        alert("Game Over! Refresh to restart.");
        location.reload();
    }, this);
    }
    this.scoreText.text = `Enemies: ${this.score}`;
  
};

PlayState._updateCamera = function () {
    this.game.world.setBounds(0, 0, 11000, 775);
    this.game.world.camera.x = this.hero.x - this.game.world.width / 16;
};

PlayState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.hero, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.platforms);
    this.game.physics.arcade.overlap(this.hero, this.spiders, this._onHeroVsEnemy,
        null, this);
    this.game.physics.arcade.overlap(this.fireballs, this.spiders, this._onFireballVsEnemy,
        null, this);
    this.game.physics.arcade.overlap(this.fireballs, this.hero, this._onFireballVsEnemy,
        null, this);
};

PlayState._handleInput = function () {
    if (this.keys.s.isDown) { // move hero left
        this.hero.crouch();
    }
    if (this.keys.a.isDown) { // move hero left
        this.hero.move(-1);
    }
    else if (this.keys.d.isDown) { // move hero right
        this.hero.move(1);
    }else if (this.keys.f.isDown) { // move hero up
        this.hero.isBlocking = true;
        this._spawnShield(this.hero.x, this.hero.y);
    }else { // stop
        this.hero.move(0);
        this.hero.isBlocking = false;
    }
    //------------------------------------------------------------------
    if (this.keys.down.isDown) { // move spiders left
        this.spiders.crouch();
    }
    if (this.keys.left.isDown) { // move spiders left
        this.spiders.move(-1);
    }
    else if (this.keys.right.isDown) { // move spiders right
        this.spiders.move(1);
    }
    else { // stop
        this.spiders.move(0);
    }
};

PlayState._handleEnemies = function (data) {
    if (this.spiders.isDead == false) {
        const randomDirection = Math.floor(Math.random() * 4000); // 0, 1 o 2
        if (randomDirection <= 15) {
            this.spiders.shoot();
        }
        if ((this.hero.x - this.spiders.x) < 100 && (this.hero.x - this.spiders.x) > -100) {
            // Decidir el movimiento
            if (randomDirection <= 60 && randomDirection > 15) {
                this.spiders.attack();
            }
        } else if ((this.hero.x - this.spiders.x) > 100 && (this.hero.x - this.spiders.x) < 500) {
            this.spiders.move(.5);
        } else if ((this.hero.x - this.spiders.x) < 100 && (this.hero.x - this.spiders.x) > -500) {
            this.spiders.move(-.5);
        } else if ((this.hero.x - this.spiders.x) > 500) {
            this.spiders.move(20);
        } else if ((this.hero.x - this.spiders.x) < -500) {
            this.spiders.move(-20);
        }
        if ((this.hero.x - this.spiders.x) <= -5 && (this.hero.x - this.spiders.x) > -200 && this.hero.isAttack) {
            this.spiders.move(10);
        } if ((this.hero.x - this.spiders.x) >= 5 && (this.hero.x - this.spiders.x) < 200 && this.hero.isAttack) {
            this.spiders.move(-10);
        }
        if ((this.hero.x - this.spiders.x) < 100 && this.hero.isShooting) {
            this.spiders.jump();
        }
        if ((this.hero.x - this.spiders.x) > -100 && this.hero.isShooting) {
            this.spiders.jump();
        }
        if ((this.spiders.y - this.hero.y) > 100) {
            this.spiders.jump();
        }
    } else {
        this.score++;
        this.spiders.kill();
        this.hero.kill();
        this.hero.healthBar.kill();
        this.spiders.healthBar.kill();
        this._spawnCharacters({ hero: { x: this.hero.x, y: this.hero.y }, spiders: { x: this.spiders.x, y: this.spiders.y-200} });
    }
};

PlayState._loadLevel = function (data) {
    // create all the groups/layers that we need
    this.platforms = this.game.add.group();
    this.fireballs = this.game.add.group();
    this.fireballs.enableBody = true; // Habilita la física para el grupo
    this.fireballs.physicsBodyType = Phaser.Physics.ARCADE;
    this.shield = this.game.add.group();
    // spawn all platforms
    data.platforms.forEach(this._spawnPlatform, this);
    // spawn hero and enemies
    this._spawnCharacters({ hero: data.hero, spiders: data.spiders });

    // enable gravity
    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;
};

PlayState._spawnPlatform = function (platform) {
    let sprite = this.platforms.create(
        platform.x, platform.y, platform.image);

    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
};

PlayState._spawnCharacters = function (data) {
    // spawn hero
    const randomDirection = Math.floor(Math.random() * 50);
    const random = Math.floor(Math.random() * 40);
    if (randomDirection <= 10) {
        this.hero = new Hero(this.game, data.hero.x, data.hero.y, 'hero1');
    }else if (randomDirection > 10 && randomDirection <= 20) {
        this.hero = new Hero(this.game, data.hero.x, data.hero.y, 'hero2');
    }else if (randomDirection > 20 && randomDirection <= 30) {
        this.hero = new Hero(this.game, data.hero.x, data.hero.y, 'hero3');
    }else if (randomDirection > 30 && randomDirection <= 40) {
        this.hero = new Hero(this.game, data.hero.x, data.hero.y, 'hero4');
    }else if (randomDirection > 40 && randomDirection <= 50) {
        this.hero = new Hero(this.game, data.hero.x, data.hero.y, 'hero5');
    }
    if (random <= 10) {
        this.spiders = new Hero(this.game, data.spiders.x, data.spiders.y, 'hero6');
    }else if (random > 10 && random <= 20) {
        this.spiders = new Hero(this.game, data.spiders.x, data.spiders.y, 'hero7');
    }else if (random > 20 && random <= 30) {
        this.spiders = new Hero(this.game, data.spiders.x, data.spiders.y, 'hero9');
    }else{
        this.spiders = new Hero(this.game, data.spiders.x, data.spiders.y, 'hero8');
    }
    this.game.add.existing(this.hero);
    this.game.add.existing(this.spiders);
};

PlayState._spawnFireball = function (x, y, scale) {
    // Crear una nueva bola de fuego en la posición especificada
    let fireball = this.fireballs.create(x, y, 'fireball'); // Asegúrate de que 'fireball' esté cargado
    fireball.anchor.set(0.5, 0.5);

    // Habilitar la física para la bola de fuego
    this.game.physics.arcade.enable(fireball);
    //fireball.body.collideWorldBounds = true; // Permitir que la bola de fuego colisione con los límites del mundo
    fireball.body.allowGravity = false; // No queremos que la bola de fuego caiga
    // Hacer que la bola de fuego siga moviéndose en la dirección que ve el héroe
    if (scale < 0) {
        fireball.body.velocity.x = -600; // Velocidad en x hacia la izquierda
    } else {
        fireball.body.velocity.x = 600; // Velocidad en x hacia la derecha
    }
};
PlayState._spawnShield = function (x, y) {
    if(this.hero.scale.x==-1){
        let shield = this.shield.create(x-50, y, 'shield');
        shield.scale.x = -1;
        shield.anchor.set(0.5, 0.5);
        this.game.physics.arcade.enable(shield);
        shield.body.allowGravity=false;
        this.game.time.events.add(Phaser.Timer.SECOND * 0.1, function () {
            shield.kill();
        }, this);
    }else{
    let shield = this.shield.create(x+50, y, 'shield');
    shield.anchor.set(0.5, 0.5);
    this.game.physics.arcade.enable(shield);
    shield.body.allowGravity=false;
    this.game.time.events.add(Phaser.Timer.SECOND * 0.1, function () {
        shield.kill();
    }, this);}
};
PlayState._onHeroVsEnemy = function (hero, spiders) {
    if (hero.isAttack) {
        spiders.hurt();
        this.sfx.stomp.play();
    }
    else if (spiders.isAttack) {
        if (this.hero.isBlocking == false){
        hero.hurt();
        this.sfx.stomp.play();
    }else{
        this.swing.play();
    }
    }
};

PlayState._onFireballVsEnemy = function (spiders, fireballs) {
    if (this.hero.isBlocking==false){
    spiders.hurt();
    this.sfx.stomp.play();
    this.game.time.events.add(Phaser.Timer.SECOND * 0.5, function () {
        fireballs.kill();
    }, this);
}else{
    fireballs.kill();
    this.swing.play();
}
};

// =============================================================================
// entry point
// =============================================================================

window.onload = function () {
    let game = new Phaser.Game(1400, 700, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    game.state.start('play');
};
