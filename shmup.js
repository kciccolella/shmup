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

var player;
/*
var player = new Sprite({
  name: 'player',
  position: {
    x: 100,
    y: 100
  },
  velocity: {
    x: 0,
    y: 0
  },
});
*/
generatePlayer();
generateEnemy();
generateAsteroid();

function draw() {
  // Background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function update() {
  draw();
  // console.log('update');

  // Player
  // ctx.fillStyle = 'blue';
  player = sprites.find(function(sprite) {
    return sprite.name === 'player';
  });

  // Sprites
  for (var i = 0; i < sprites.length;i++) {
    var sprite = sprites[i];
    if (sprite.name === 'player') {
      ctx.fillStyle = 'blue';
      playerSkin(sprite);
      sprite.position.x += sprite.velocity.x;
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
    }
  }

  // Player Movement
  if (player) {
    player.velocity.x = 0;
    if (keys.left.pressed === true &&
        player.lastKey === 'left' &&
        player.position.x + -1 >= 0) {
      player.velocity.x = -2;
    } else if (keys.right.pressed === true &&
              player.lastKey === 'right' &&
              player.position.x + player.width + 2 <= canvas.width) {
      player.velocity.x = 2;
    }
  }

  // Player Bullet
  if (keys.space.pressed === true && !player.overheated) {
    generateBullet();
    player.overheated = true;
    setTimeout(function() {
      player.overheated = false;
    }, 500);
    player.weaponL = !player.weaponL;
  }

  collisionDetection();
  collisionExplosion();
  garbageCollection();
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
      x: 100,
      y: 100
    },
    velocity: {
      x: 0,
      y: 0
    },
  }));
}

function generateBullet() {
  sprites.push(new Sprite({
    name: 'bullet',
    position: {
      x: player.position.x + (player.weaponL ? +4 : +3),
      y: player.position.y - 2
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
      y: -8
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
      y: -8
    },
    velocity: {
      x: 0,
      y: 1
    }
  }));
}

function garbageCollection() {
  for (var i = 0; i < sprites.length; i++) {
    if (sprites[i].name === 'player') {
      if (sprites[i].collision) {
        console.log('player collected');
        delete sprites[i];
      }
    } else if (sprites[i].name === 'bullet') {
      sprites[i].alive++;
      if (sprites[i].collision || sprites[i].position.y + 0 <= 0) {
        console.log('bullet collected');
        delete sprites[i];
      }
    } else if (sprites[i].name === 'asteroid') {
      if (sprites[i].collision || sprites[i].position.y + 0 >= canvas.height) {
        console.log('asteroid collected');
        delete sprites[i];
      }
    } else if (sprites[i].name === 'enemy') {
      if (sprites[i].collision || sprites[i].position.y + 0 >= canvas.height) {
        console.log('enemy collected');
        delete sprites[i];
      }
    }
  }

  sprites = sprites.filter(function(el) {
    return el !== undefined;
  });
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
  if (length < 3) {
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

loop();

/*
Collision Detection

Have it set so it can check each element in the array against all other elements
Nested loop maybe? Time O(n^2)
Two loops and a map? Time O(n)
*/

function collisionDetection() {
  for (var i = 0; i < sprites.length; i++) {
    for (var j = i + 1; j < sprites.length; j++) {
      var spriteA = sprites[i];
      var spriteB = sprites[j];

      if (spriteA.position.x + spriteA.width >= spriteB.position.x &&
        spriteA.position.x <= spriteB.position.x + spriteB.width &&
        spriteA.position.y + spriteA.width >= spriteB.position.y &&
        spriteA.position.y <= spriteB.position.y + spriteB.width) {
        spriteA.collision = true;
        spriteB.collision = true;
      }
    }
  }
}

function collisionExplosion() {
  for (var i = 0; i < sprites.length; i++) {
    var sprite = sprites[i];
    if (sprite.name !== 'bullet' && sprite.collision) {
      explosionSkin(sprite);
    }
  }
}

