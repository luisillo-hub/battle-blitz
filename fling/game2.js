
PlayState = {};
let game;
let gameOptions = {
    gravity: 1,             // game gravity
    terrainObjects: 20,     // amount of terrain objects
    heroSize: 30,           // hero size
    constraintSpeed: 2,     // constraint shrinkage speed
    minBoxSize: 50,         // minimum box size
    maxBoxSize: 200,        // maximum box size
    hookSpeed: 20,          // speed use to fire the hook
    ropeTolerance: 6        // rope tolerance. Used to avoid body trespassing
}
const WALL = 0;
const BALL = 1;
const HOOK = 2;
const COIN = 3;
PlayState.init = function () {
    this.game.renderer.renderSession.roundPixels = true;

    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP,
        down: Phaser.KeyCode.DOWN
    });
};

PlayState.preload = function () {
    this.game.load.image('heroSprite', 'images/monkey-static.png');
        this.game.load.image('platformSprite', 'images/bush.png');
        this.game.load.image('hookSprite', 'images/monkey-hook.png');
        this.game.load.image('background', 'images/jungle.png');
        this.game.load.image('coin', 'images/banana-sprite.png');
};

PlayState.create = function () {
    // I want physics world to be updated 30 times per second
    this.game.world.update30Hz();
   
    // adding world bounds. Basically four walls
    this.game.world.setBounds(10, 10, game.config.width- 20, game.config.height - 20);
   
    this.background = this.game.add.image(game.config.width/2, game.config.height/2, 'background');

    // placing some random static boxes labeled as WALL
    for (let i = 0; i < gameOptions.terrainObjects; i++) {
        let posX = Phaser.Math.Between(0, game.config.width);
        let posY = Phaser.Math.Between(0, game.config.height-300);
        let width = Phaser.Math.Between(gameOptions.minBoxSize, gameOptions.maxBoxSize);
        let height = Phaser.Math.Between(gameOptions.minBoxSize, gameOptions.maxBoxSize);
        let platform = this.game.add.image(posX, posY, 'platformSprite');
        platform.setStatic(true); // Hacer la plataforma estática
        platform.setScale(width / platform.width, height / platform.height); // Escalar la plataforma
        platform.label = WALL;
    }
    for (let i = 0; i < gameOptions.terrainObjects; i++) {
        let posX = Phaser.Math.Between(0, game.config.width);
        let posY = Phaser.Math.Between(0, game.config.height/2);
       
        let coin = this.game.add.image(posX, posY, 'coin');
        coin.setStatic(true); // Hacer la plataforma estática
        coin.label = 'COIN'; // Etiqueta para la detección de colisiones
    }

    // adding a bouncing ball labeled as BALL
    this.hero = this.game.add.circle(game.config.width / 2, game.config.height / 2, gameOptions.heroSize / 2, {
        restitution: 0.5
    });
    this.hero.label = BALL;

    // Create the sprite for the hero
    this.heroSprite = this.game.add.image(this.hero.position.x, this.hero.position.y, 'heroSprite');
    
    // the hook
    this.hook = null;

    // event listeners
    this.game.input.on("pointerdown", this.fireHook, this);

    // no ropes at the beginning
    this.rope = null;

    // collision listener
    this.game.world.on("collisionstart", function (e, b1, b2) {

        // when the hook collides with something, let's make it static and create the joint
        if ((b1.label == HOOK || b2.label == HOOK) && !this.rope) {

            // make the hook static
            Phaser.Physics.Matter.Matter.Body.setStatic(this.hook, true);

            // calculate the distance between the ball and the hook
            let distance = Phaser.Math.Distance.Between(this.hero.position.x, this.hero.position.y, this.hook.position.x, this.hook.position.y);

            // is the distance fairly greater than hero size?
            if (distance > gameOptions.heroSize * 2) {

                // add the constraint
                this.rope = this.matter.add.constraint(this.hero, this.hook, distance, 0.1);
                
            }
        }

    }, this)
     // Crear un objeto Graphics para la cuerda
     this.ropeGraphics = this.add.graphics();
     this.score = 0; // Inicializar el puntaje
     this.scoreText = this.add.text(36, 36, 'Score: 0', { fontSize: '32px', fill: '#fff' });
  
};

PlayState.update = function () {
    if (this.heroSprite && this.hero) {
        this.heroSprite.x = this.hero.position.x;
        this.heroSprite.y = this.hero.position.y;
        this.heroSprite.rotation = this.hero.angle; // Si deseas que el sprite gire con el cuerpo
        if(this.hero.velocity.x <= 0){
            this.heroSprite.flipX = true;
    }else{
        this.heroSprite.flipX = false;
    }

}
    if (this.hookSprite && this.hook) {
       
        if(this.hook.velocity.x < 0){
            this.hookSprite.x = this.hook.position.x-30;
        }else if(this.hook.velocity.x > 0){
            this.hookSprite.x = this.hook.position.x+30;
        }
        if(this.hook.velocity.y > 0){
            this.hookSprite.flipY = true;
            this.hookSprite.y = this.hook.position.y;
        }else if(this.hook.velocity.y < 0){
            this.hookSprite.y = this.hook.position.y;
        }
    }

    // is there a constraint? Shrink it
    if (this.rope) {
        this.rope.length -= gameOptions.constraintSpeed;
        let hookPosition = this.hook.position;
        let heroPosition = this.hero.position;
        let distance = Phaser.Math.Distance.Between(hookPosition.x, hookPosition.y, heroPosition.x, heroPosition.y);
        if (distance - this.rope.length > gameOptions.ropeTolerance) {
            this.rope.length = distance;
        }
        this.rope.length = Math.max(this.rope.length, gameOptions.heroSize * 2);
    }
 // Dibujar la cuerda
 if (this.rope) {
    this.ropeGraphics.clear(); // Limpiar el gráfico anterior
    this.ropeGraphics.lineStyle(10, 0x3b6e3b); // Establecer el grosor y el color (rojo en este caso)
    this.ropeGraphics.beginPath();
    this.ropeGraphics.moveTo(this.hero.position.x, this.hero.position.y);
    this.ropeGraphics.lineTo(this.hook.position.x, this.hook.position.y);
    this.ropeGraphics.strokePath();
}
  
};

PlayState.collectCoin(coin) = function () {
    coin.destroy(); // Destruir la moneda
    this.score += 10; // Aumentar el puntaje
    this.scoreText.setText('Score: ' + this.score); // Actualizar el texto del puntaje
};

PlayState.fireHook(e) = function () {

    // do we have a constraint?
    if (this.hook) {

        // destroy current constraint
        this.releaseHook();
    }

    // don't we have a constraint?
    else {
        // calculate the angle between the pointer and the ball
        let angle = Phaser.Math.Angle.Between(this.hero.position.x, this.hero.position.y, e.position.x, e.position.y);

        this.hook = this.matter.add.rectangle(this.hero.position.x + (gameOptions.heroSize * 2) * Math.cos(angle), this.hero.position.y + (gameOptions.heroSize * 2) * Math.sin(angle), 10, 10);
        this.hook.label = HOOK;
        this.hookSprite = this.add.image(this.hook.position.x, this.hook.position.y, 'hookSprite');
        // give the hook the proper velocity
        Phaser.Physics.Matter.Matter.Body.setVelocity(this.hook, {
            x: gameOptions.hookSpeed * Math.cos(angle),
            y: gameOptions.hookSpeed * Math.sin(angle)
        });
    }
};

PlayState.releaseHook() = function () {

    // is there a constraint? Remove it
    if (this.rope) {
        this.matter.world.removeConstraint(this.rope);
        this.rope = null;
    }

    // is there a hook? Remove it
    if (this.hook) {
        this.matter.world.remove(this.hook);
        this.hook = null;
        this.hookSprite.destroy();
    }
};

PlayState._loadLevel = function (data) {
    // create all the groups/layers that we need
    this.platforms = this.game.add.group();
    this.fireballs = this.game.add.group();
    this.fireballs.enableBody = true; // Habilita la física para el grupo
    this.fireballs.physicsBodyType = Phaser.Physics.ARCADE;

    // spawn all platforms
    data.platforms.forEach(this._spawnPlatform, this);
    // spawn hero and enemies
    this._spawnCharacters({ hero: data.hero, spiders: data.spiders });

    // enable gravity
    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;
};

// =============================================================================
// entry point
// =============================================================================

window.onload = function () {
    let game = new Phaser.Game(1400, 700, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    game.state.start('play');
};
