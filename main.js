let config = {
  type:Phaser.AUTO,
  width:288,
  height:512,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {y:600},
      debug:false,
    },
  },
  scene: {
    preload:preload,
    create: create,
    update: update,
  },
};
let isGameOver = false;
let score = 0;
let scoreText;
let isRefresh =false;
let hitPlayed= false;
let diePlayed = false;
let character;
let base;
let baseHeight;
let baseWidth;
let speed = -150;
let spawnTime = 1500;
let gameStart = false;
let game = new Phaser.Game(config);

function preload() {
  // No image preloading - using shapes instead
  this.load.audio("score","assets/SoundEffects/point.wav");
  this.load.audio("hit","assets/SoundEffects/hit.wav");
  this.load.audio("wing","assets/SoundEffects/wing.wav");
  this.load.audio("die","assets/SoundEffects/die.wav");
}

function create() {
  // Create background as a colored rectangle
  let background = this.add.rectangle(0, 0, game.config.width, game.config.height, 0x87CEEB);
  background.setOrigin(0, 0);
  
  // Create base as a colored rectangle
  baseHeight = 112; // Approximate height based on original sprite
  baseWidth = game.config.width;
  base = this.add.rectangle(game.config.width/2, game.config.height-baseHeight/2, baseWidth, baseHeight, 0x8B4513);
  this.physics.add.existing(base, true);
  base.setDepth(1);
  
  // Create start game message as a text
  let startGameText = this.add.text(game.config.width/2, game.config.height/3, "Tap to Start", {
    fontSize: "24px",
    fontFamily: "Fantasy",
    fill: "white",
    backgroundColor: "#000000",
    padding: { x: 10, y: 5 }
  });
  startGameText.setOrigin(0.5, 0.5);
  
  // Create character as a circle
  character = this.add.circle(game.config.width/4, game.config.height/2, 15, 0xFFFF00);
  this.physics.add.existing(character);
  character.setDepth(1);
  character.body.setCollideWorldBounds(true);
  character.body.allowGravity = false;
  gameStart = false;
  
  // No animations needed for shapes
  
  this.input.on("pointerdown", function(pointer) {
    if(gameStart) return;
    gameStart = true;
    startGameText.setVisible(false);
    character.body.allowGravity = true;
    this.upperPillars = this.physics.add.group();
    this.lowerPillars = this.physics.add.group();
    this.spawnPillarPair();
    this.physics.add.collider(character, this.upperPillars, hitPillar, null, this);
    this.physics.add.collider(character, this.lowerPillars, hitPillar, null, this);
    this.physics.add.collider(character, base, hitBase, null, this);

    scoreText = this.add.text(game.config.width/2, 30, "0", {
      fontSize: "32px",
      fontFamily: "Fantasy",
      fill: "white",
    });
    scoreText.setOrigin(0.5, 0.5);
    scoreText.setDepth(1);

    point = this.sound.add("score");
    hit = this.sound.add("hit");
    wing = this.sound.add("wing");
    die = this.sound.add("die");

    this.input.on("pointerdown", function(pointer) {
      if(!isRefresh && !isGameOver) {
        wing.play();
        character.body.setVelocityY(-230);
      }
      isRefresh = false;
    }, this);
  }, this);
}

function update() {
  if(!isGameOver) base.tilePositionX+=1;
  if(!gameStart) return;

  let scoreIncremented = false;
  [this.upperPillars,this.lowerPillars].forEach((group)=>{
    group.children.iterate((pillar)=>{
      if(!pillar) return;

      if(!pillar.hasPassed && pillar.x+pillar.width<character.x) {
        pillar.hasPassed = true;
        if(!scoreIncremented) {
           score++;
           scoreText.setText(score);
           point.play();
           scoreIncremented = true;
        }
      }
      if(pillar.x+pillar.width<0) {
        pillar.destroy();
      }
    });
  });
  scoreIncremented = false;
  if(this.pillarSpawnTime<this.time.now && !isGameOver) {
    this.spawnPillarPair();
  }
}

Phaser.Scene.prototype.spawnPillarPair = function() {
  baseHeight = 112; // Approximate height based on original sprite
  let pillarWidth = 52; // Approximate width based on original sprite
  let pillarHeight = 320; // Approximate height based on original sprite
  let Offset = (Math.random() * pillarHeight) / 2;
  let k = Math.floor(Math.random() * 3) - 1;
  Offset = Offset * k;
  let gapHeight = (1/3) * (game.config.height - baseHeight);
  let lowerY = 2 * gapHeight + pillarHeight / 2 + Offset;
  let upperY = gapHeight - pillarHeight / 2 + Offset;
  
  // Create upper pillar as rectangle
  let upperPillar = this.physics.add.existing(
    this.add.rectangle(game.config.width, upperY, pillarWidth, pillarHeight, 0x00FF00)
  );
  this.upperPillars.add(upperPillar);
  
  // Create lower pillar as rectangle
  let lowerPillar = this.physics.add.existing(
    this.add.rectangle(game.config.width, lowerY, pillarWidth, pillarHeight, 0x00FF00)
  );
  this.lowerPillars.add(lowerPillar);
  
  upperPillar.body.allowGravity = false;
  lowerPillar.body.allowGravity = false;

  upperPillar.body.setVelocityX(speed);
  lowerPillar.body.setVelocityX(speed);
  this.pillarSpawnTime = this.time.now + spawnTime;
}

function hitBase(character, base) {
  if(!hitPlayed) hit.play();
  hitPlayed = true;
  character.body.enable = false;
  character.body.setVelocityX(0);
  character.body.setVelocityY(0);
  character.body.allowGravity = false;
  [this.upperPillars, this.lowerPillars].forEach(group => 
    group.children.iterate(pillar => {
      if (pillar.body) pillar.body.velocity.x = 0;
    })
  );
  isGameOver = true;
  
  // Create game over text
  let gameOverText = this.add.text(game.config.width/2, game.config.height/4, "GAME OVER", {
    fontSize: "32px",
    fontFamily: "Fantasy",
    fill: "white",
    backgroundColor: "#FF0000",
    padding: { x: 10, y: 5 }
  });
  gameOverText.setOrigin(0.5, 0.5);
  
  // Create score display
  let scoreBackground = this.add.rectangle(game.config.width/2, game.config.height, 150, 80, 0x000000);
  scoreBackground.setOrigin(0.5, 0.5);
  
  finalScoreText = this.add.text(game.config.width/2, game.config.height, "Score: " + score, {
    fontSize: "24px",
    fontFamily: "Fantasy",
    fill: "white"
  });
  finalScoreText.setOrigin(0.5, 0.5);
  
  this.tweens.add({
    targets: [scoreBackground, finalScoreText],
    y: function(target) {
      return target === scoreBackground ? game.config.height/2.2 : game.config.height/2.1;
    },
    ease: "Power1",
    duration: 500,
    repeat: 0,
    yoyo: false,
  });
  
  scoreText.destroy();
  
  // Create retry button
  let retryButton = this.add.rectangle(game.config.width/2, game.config.height/1.5, 100, 40, 0x4CAF50);
  let retryText = this.add.text(game.config.width/2, game.config.height/1.5, "RETRY", {
    fontSize: "20px",
    fontFamily: "Fantasy",
    fill: "white"
  });
  retryText.setOrigin(0.5, 0.5);
  
  retryButton.setInteractive();
  retryButton.on("pointerdown", () => {
    isRefresh = true;
    isGameOver = false;
    hitPlayed = false;
    diePlayed = false;
    score = 0;
    this.scene.restart();
  });
}

function hitPillar(character, pillar) {
  if(!hitPlayed) {
    hit.play();
    hitPlayed = true;
    setTimeout(() => {
      if(!diePlayed) {
        die.play();
        diePlayed = true;
      }
    }, 500);
  }
  character.body.enable = false;
  character.setVelocityX(0);
  character.setVelocityY(0);
  character.body.allowGravity = false;
  [this.upperPillars, this.lowerPillars].forEach(group => 
    group.children.iterate(pillar => {
      if (pillar.body) pillar.body.velocity.x = 0;
    })
  );
  isGameOver = true;
  
  // Create game over text
  let gameOverText = this.add.text(game.config.width/2, game.config.height/4, "GAME OVER", {
    fontSize: "32px",
    fontFamily: "Fantasy",
    fill: "white",
    backgroundColor: "#FF0000",
    padding: { x: 10, y: 5 }
  });
  gameOverText.setOrigin(0.5, 0.5);
  
  // Create score display
  let scoreBackground = this.add.rectangle(game.config.width/2, game.config.height, 150, 80, 0x000000);
  scoreBackground.setOrigin(0.5, 0.5);
  
  finalScoreText = this.add.text(game.config.width/2, game.config.height, "Score: " + score, {
    fontSize: "24px",
    fontFamily: "Fantasy",
    fill: "white"
  });
  finalScoreText.setOrigin(0.5, 0.5);
  
  this.tweens.add({
    targets: [scoreBackground, finalScoreText],
    y: function(target) {
      return target === scoreBackground ? game.config.height/2.2 : game.config.height/2.1;
    },
    ease: "Power1",
    duration: 500,
    repeat: 0,
    yoyo: false,
  });
  
  scoreText.destroy();
  
  // Create retry button
  let retryButton = this.add.rectangle(game.config.width/2, game.config.height/1.5, 100, 40, 0x4CAF50);
  let retryText = this.add.text(game.config.width/2, game.config.height/1.5, "RETRY", {
    fontSize: "20px",
    fontFamily: "Fantasy",
    fill: "white"
  });
  retryText.setOrigin(0.5, 0.5);
  
  retryButton.setInteractive();
  retryButton.on("pointerdown", () => {
    isRefresh = true;
    isGameOver = false;
    hitPlayed = false;
    diePlayed = false;
    score = 0;
    this.scene.restart();
  });
}
