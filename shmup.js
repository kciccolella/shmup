var body = document.body;

var canvas = document.createElement('canvas');
canvas.id = 'canvas';
canvas.width = 192;
canvas.height = 160;

body.append(canvas);

var ctx = canvas.getContext('2d');

// ------------------------------------------------------------------

var sprites = [];
var keys = {
  left: {
    pressed: false
  },
  right: {
    pressed: false
  },
  space: {
    pressed: false
  },
};

var points = 0;
var startTime = Date.now();
var lives = 3;
var player;

class Sprite {
  constructor({name, position, velocity, width = 8, height = 8}) {
    this.name = name;
    this.position = position;
    this.velocity = velocity;
    this.width = width;
    this.height = height;
  }

// width = 8;
// height = 8;
lastKey;
weaponL = false;
overheated = false;
alive = 0;
collision = false;
}

generateStreak(14, 143);
generateStreak(38, 151);
generateStreak(71, 69);
generateStreak(109, 81);
generateStreak(153, 34);

generatePlayer();
generateEnemy();
generateAsteroid();

function draw() {
  // Background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars();
  planet(168, 20, true);
  planet(30, 100, false);
}

function update() {
  draw();
  // console.log('update');

  // Find player sprite
  player = sprites.find(function(sprite) {
    return sprite.name === 'player';
  });

  if (!player && lives > 0) {
    generatePlayer();
    lives--;
  }

  // Sprite actions
  for (var i = 0; i < sprites.length;i++) {
    var sprite = sprites[i];
    if (sprite.name === 'streak') {
      ctx.fillStyle = 'white';
      streakSkin(sprite);
      sprite.position.y += sprite.velocity.y;
    } else if (sprite.name === 'player') {
      ctx.fillStyle = 'blue';
      playerSkin(sprite);
      sprite.position.x += sprite.velocity.x;
      playerMovement(sprite);
      engage();
    } else if (sprite.name === 'bullet') {
      ctx.fillStyle = 'yellow';
      bulletSkin(sprite);
      sprite.position.y += sprite.velocity.y;
    } else if (sprite.name === 'asteroid') {
      ctx.fillStyle = 'brown';
      asteroidSkin(sprite);
      sprite.position.y += sprite.velocity.y;
    } else if (sprite.name === 'enemy') {
      ctx.fillStyle = 'green';
      enemySkin(sprite);
      sprite.position.y += sprite.velocity.y;
      fire(sprite);
    } else if (sprite.name === 'fire') {
      ctx.fillStyle = 'red';
      fireSkin(sprite);
      sprite.position.y += sprite.velocity.y;
    }
  }

  revolvingStreaks();
  collisionDetection();
  collisionExplosion();
  garbageCollection();
  hud();
}

function loop() {
  setInterval(update, 1000/30);
}

// ------------------------------------------------------------------

function rng(num) {
  return Math.ceil(Math.random() * num);
}

function generatePlayer() {
  sprites.push(new Sprite({
    name: 'player',
    position: {
      x: canvas.width / 2 + 4,
      y: canvas.height - 28
    },
    velocity: {
      x: 0,
      y: 0
    }
  }));
}

function generateBullet() {
  sprites.push(new Sprite({
    name: 'bullet',
    position: {
      x: player.position.x + (player.weaponL ? 4 : 3),
      y: player.position.y + 1
    },
    velocity: {
      x: 0,
      y: -4
    },
    width: 1,
    height: 1
  }));
}

function generateAsteroid() {
  sprites.push(new Sprite({
    name: 'asteroid',
    position: {
      x: rng(184),
      y: 0
    },
    velocity: {
      x: 0,
      y: rng(2)
    }
  }));
}

function generateEnemy() {
  sprites.push(new Sprite({
    name: 'enemy',
    position: {
      x: rng(184),
      y: 0
    },
    velocity: {
      x: 0,
      y: rng(1)
    }
  }));
}

function generateStreak(x, y) {
  sprites.push(new Sprite({
    name: 'streak',
    position: {
      x: x,
      y: y
    },
    velocity: {
      x: 0,
      y: 0.7
    },
    width: 1,
    height: 1
  }));
}

function garbageCollection() {
  for (var i = 0; i < sprites.length; i++) {
    if (sprites[i].name === 'player') {
      if (sprites[i].collision) {
        // console.log('player collected');
        delete sprites[i];
      }
    } else if (sprites[i].name === 'bullet') {
      sprites[i].alive++;
      if (sprites[i].collision || sprites[i].position.y + 8 <= 0) {
        // console.log('bullet collected');
        delete sprites[i];
      }
    } else if (sprites[i].name === 'asteroid') {
      if (sprites[i].collision || sprites[i].position.y + 8 >= canvas.height) {
        // console.log('asteroid collected');
        delete sprites[i];
      }
    } else if (sprites[i].name === 'enemy') {
      if (sprites[i].collision || sprites[i].position.y + 8 >= canvas.height) {
        // console.log('enemy collected');
        delete sprites[i];
      }
    }
  }

  sprites = sprites.filter(function(el) {
    return el !== undefined;
  });
}

function collisionDetection() {
  for (var i = 0; i < sprites.length; i++) {
    if (sprites[i].name === 'streak') {
      continue;
    }

    for (var j = i + 1; j < sprites.length; j++) {
      if (sprites[j].name === 'streak') {
        continue;
      }

      var spriteA = sprites[i];
      var spriteB = sprites[j];

      if (spriteA.position.x + spriteA.width >= spriteB.position.x &&
          spriteA.position.x <= spriteB.position.x + spriteB.width &&
          spriteA.position.y + spriteA.width >= spriteB.position.y &&
          spriteA.position.y <= spriteB.position.y + spriteB.width) {
        console.log(spriteA.name, 'and', spriteB.name, 'have collided');
        spriteA.collision = true;
        spriteB.collision = true;
      }
    }
  }
}

function collisionExplosion() {
  for (var i = 0; i < sprites.length; i++) {
    var sprite = sprites[i];
    if ((sprite.name !== 'bullet' || sprite.name !== 'fire') && sprite.collision) {
      pointAllocation(sprite);
      explosionSkin(sprite);
    }
  }
}

function playerMovement(sprite) {
  player.velocity.x = 0;
  if (keys.left.pressed &&
      sprite.lastKey === 'left' &&
      sprite.position.x + -1 >= 0) {
    sprite.velocity.x = -2;
  } else if (keys.right.pressed &&
            sprite.lastKey === 'right' &&
            sprite.position.x + sprite.width + 2 <= canvas.width) {
    sprite.velocity.x = 2;
  }
}

function engage() {
  // Player Bullet
  if (player && keys.space.pressed && !player.overheated) {
    generateBullet();
    player.overheated = true;
    setTimeout(function() {
      if (player) {
        player.overheated = false;
      }
    }, 500);
    player.weaponL = !player.weaponL;
  }
}

function revolvingStreaks() {
  for (var i = 0; i < sprites.length; i++) {
    if (sprites[i].name === 'streak') {
      if (sprites[i].position.y + 8 >= canvas.height) {
        sprites[i].position.y = 8;
      }
    }
  }
}

// ------------------------------------------------------------------

function playerSkin(sprite) {
  // ctx.fillStyle = 'white';
  ctx.fillRect(sprite.position.x + 3, sprite.position.y + 0, 2, 8);
  ctx.fillRect(sprite.position.x + 2, sprite.position.y + 0, 4, 4);
  ctx.fillRect(sprite.position.x + 1, sprite.position.y + 1, 6, 2);
  ctx.fillRect(sprite.position.x + 0, sprite.position.y + 4, 1, 4);
  ctx.fillRect(sprite.position.x + 7, sprite.position.y + 4, 1, 4);
  ctx.fillRect(sprite.position.x + 0, sprite.position.y + 5, 8, 2);
}

function bulletSkin(sprite) {
  // ctx.fillStyle = 'white';
  var length = sprite.alive;
  if (length < 2) {
    ctx.fillRect(sprite.position.x, sprite.position.y, 1, length);
  } else {
    ctx.fillRect(sprite.position.x, sprite.position.y, 1, 6);
  }
}

function enemySkin(sprite) {
  // ctx.fillStyle = 'white';
  ctx.fillRect(sprite.position.x + 0, sprite.position.y + 0, 1, 2);
  ctx.fillRect(sprite.position.x + 3, sprite.position.y + 0, 2, 7);
  ctx.fillRect(sprite.position.x + 7, sprite.position.y + 0, 1, 2);
  ctx.fillRect(sprite.position.x + 2, sprite.position.y + 1, 4, 3);
  ctx.fillRect(sprite.position.x + 1, sprite.position.y + 2, 1, 1);
  ctx.fillRect(sprite.position.x + 6, sprite.position.y + 2, 1, 1);
  ctx.fillRect(sprite.position.x + 2, sprite.position.y + 6, 1, 2);
  ctx.fillRect(sprite.position.x + 5, sprite.position.y + 6, 1, 2);
}

function asteroidSkin(sprite) {
  // ctx.fillStyle = 'white';
  ctx.fillRect(sprite.position.x + 2, sprite.position.y + 0, 4, 8);
  ctx.fillRect(sprite.position.x + 1, sprite.position.y + 1, 6, 6);
  ctx.fillRect(sprite.position.x + 0, sprite.position.y + 2, 8, 4);

  ctx.fillStyle = 'black';
  ctx.fillRect(sprite.position.x + 2, sprite.position.y + 2, 1, 1);
  ctx.fillRect(sprite.position.x + 4, sprite.position.y + 4, 2, 2);
}

function explosionSkin(sprite) {
  ctx.fillStyle = 'orange';
  ctx.fillRect(sprite.position.x + 0, sprite.position.y + 0, 1, 1);
  ctx.fillRect(sprite.position.x + 7, sprite.position.y + 0, 1, 1);
  ctx.fillRect(sprite.position.x + 1, sprite.position.y + 1, 1, 1);
  ctx.fillRect(sprite.position.x + 4, sprite.position.y + 1, 1, 1);
  ctx.fillRect(sprite.position.x + 6, sprite.position.y + 1, 1, 1);
  ctx.fillRect(sprite.position.x + 1, sprite.position.y + 3, 1, 1);
  ctx.fillRect(sprite.position.x + 3, sprite.position.y + 3, 2, 2);
  ctx.fillRect(sprite.position.x + 6, sprite.position.y + 4, 1, 1);
  ctx.fillRect(sprite.position.x + 1, sprite.position.y + 6, 1, 1);
  ctx.fillRect(sprite.position.x + 3, sprite.position.y + 6, 1, 1);
  ctx.fillRect(sprite.position.x + 6, sprite.position.y + 6, 1, 1);
  ctx.fillRect(sprite.position.x + 0, sprite.position.y + 7, 1, 1);
  ctx.fillRect(sprite.position.x + 7, sprite.position.y + 7, 1, 1);
}

function streakSkin(sprite) {
  ctx.fillStyle = 'white';
  ctx.fillRect(sprite.position.x, sprite.position.y + sprite.velocity.y, 1, sprite.velocity.y);
}

function planet(x, y, ring) {
  ctx.fillStyle = 'brown';
  ctx.fillRect(x + 9, y + 0, 6, 16);
  ctx.fillRect(x + 7, y + 1, 10, 14);
  ctx.fillRect(x + 6, y + 2, 12, 12);
  ctx.fillRect(x + 5, y + 3, 14, 10);
  ctx.fillRect(x + 4, y + 5, 16, 6);

  if (ring) {
    ctx.fillStyle = 'grey';
    ctx.fillRect(x + 21, y + 2, 3, 4);
    ctx.fillRect(x + 20, y + 3, 4, 3);
    ctx.fillRect(x + 19, y + 3, 1, 2);
    ctx.fillRect(x + 19, y + 6, 4, 1);
    ctx.fillRect(x + 16, y + 7, 5, 1);
    ctx.fillRect(x + 13, y + 8, 6, 1);
    ctx.fillRect(x + 10, y + 9, 6, 1);
    ctx.fillRect(x + 7, y + 10, 6, 1);
    ctx.fillRect(x + 7, y + 11, 3, 1);
    ctx.fillRect(x + 0, y + 11, 7, 2);
    ctx.fillRect(x + 0, y + 11, 4, 3);
    ctx.fillRect(x + 1, y + 10, 4, 1);
    ctx.fillRect(x + 2, y + 9, 2, 1);
  }
}

function stars() {
  ctx.fillStyle = 'white';
  ctx.fillRect(175, 5, 1, 1);
  ctx.fillRect(67, 8, 1, 1);
  ctx.fillRect(31, 20, 1, 1);
  ctx.fillRect(113, 20, 1, 1);
  ctx.fillRect(59, 20, 1, 3);
  ctx.fillRect(58, 21, 3, 1);
  ctx.fillRect(181, 25, 1, 1);
  ctx.fillRect(16, 31, 1, 1);
  ctx.fillRect(73, 45, 1, 1);
  ctx.fillRect(104, 46, 1, 1);
  ctx.fillRect(156, 47, 1, 1);
  ctx.fillRect(39, 48, 1, 1);
  ctx.fillRect(130, 53, 1, 1);
  ctx.fillRect(172, 60, 1, 1);
  ctx.fillRect(100, 61, 1, 1);
  ctx.fillRect(111, 70, 1, 1);
  ctx.fillRect(154, 70, 1, 1);
  ctx.fillRect(91, 71, 1, 1);
  ctx.fillRect(99, 72, 1, 1);
  ctx.fillRect(152, 73, 1, 1);
  ctx.fillRect(157, 73, 1, 1);
  ctx.fillRect(44, 75, 1, 5);
  ctx.fillRect(155, 75, 1, 1);
  ctx.fillRect(43, 77, 3, 1);
  ctx.fillRect(22, 80, 1, 1);
  ctx.fillRect(75, 85, 1, 1);
  ctx.fillRect(110, 85, 1, 3);
  ctx.fillRect(109, 86, 3, 1);
  ctx.fillRect(178, 90, 1, 1);
  ctx.fillRect(136, 93, 1, 1);
  ctx.fillRect(59, 99, 1, 1);
  ctx.fillRect(103, 106, 1, 1);
  ctx.fillRect(18, 107, 1, 1);
  ctx.fillRect(179, 112, 1, 1);
  ctx.fillRect(40, 120, 1, 1);
  ctx.fillRect(18, 121, 1, 1);
  ctx.fillRect(128, 128, 1, 1);
  ctx.fillRect(60, 130, 1, 1);
  ctx.fillRect(150, 131, 1, 3);
  ctx.fillRect(149, 132, 3, 1);
  ctx.fillRect(107, 133, 1, 1);
  ctx.fillRect(18, 141, 1, 1);
  ctx.fillRect(175, 142, 1, 1);
  ctx.fillRect(87, 144, 1, 1);
  ctx.fillRect(12, 147, 1, 1);
  ctx.fillRect(147, 148, 1, 1);
  ctx.fillRect(17, 154, 1, 1);
}

// ------------------------------------------------------------------

window.addEventListener('keydown', function() {
  switch (event.key) {
    case 'ArrowLeft':
      keys.left.pressed = true;
      player.lastKey = 'left';
      break;
    case 'ArrowRight':
      keys.right.pressed = true;
      player.lastKey = 'right';
      break;
    case ' ':
      keys.space.pressed = true;
      break;
  }
});

window.addEventListener('keyup', function() {
  switch (event.key) {
    case 'ArrowLeft':
      keys.left.pressed = false;
      break;
    case 'ArrowRight':
      keys.right.pressed = false;
      break;
    case ' ':
      keys.space.pressed = false;
      break;
  }
});

// ------------------------------------------------------------------

function hud() {
  var elapsedTime = (Date.now() - startTime) / 1000;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, 16);
  ctx.fillRect(0, canvas.height - 16, canvas.width, 16);

  ctx.fillStyle = 'grey';
  ctx.fillFont = 'bold 8px Arial';
  ctx.fillText(`Points: ${points}`, 4, 12);
  ctx.fillText(`Time: ${elapsedTime}`, canvas.width - 68, 12);
  ctx.fillText("Lives: ", 4, canvas.height - 4);

  ctx.fillStyle = 'blue';

  if (lives) {
    switch (lives) {
      case 3:
        playerSkin({position: {x: 48, y: canvas.height - 12}});
      case 2:
        playerSkin({position: {x: 40, y: canvas.height - 12}});
      case 1:
        playerSkin({position: {x: 32, y: canvas.height - 12}});
        break;
    }
  }
}

function pointAllocation(sprite) {
  if (sprite.name === 'enemy') {
    points += 100;
  } else if (sprite.name === 'asteroid') {
    points += 50;
  }
}

function fire(sprite) {
  // Enemy Bullet
  if (sprite.position.x + sprite.width >= player.position.x &&
      sprite.position.x <= player.position.x + player.width) {
    console.log(sprite.name, 'has eyes on player');

    if (!sprite.overheated) {
      generateFire(sprite);
      sprite.overheated = true;
      setTimeout(function() {
        sprite.overheated = false;
      }, 1000);
      sprite.weaponL = !sprite.weaponL;
    }
  }
}

function generateFire(sprite) {
  sprites.push(new Sprite({
    name: 'fire',
    position: {
      x: sprite.position.x + (sprite.weaponL ? 4 : 3),
      y: sprite.position.y + 8 + 1
    },
    velocity: {
      x: 0,
      y: 2
    },
    width: 1,
    height: 1
  }));
}

function fireSkin(sprite) {
  // ctx.fillStyle = 'white';
  ctx.fillRect(sprite.position.x, sprite.position.y, 1, 2);
}

// ------------------------------------------------------------------

loop();
