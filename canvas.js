var hSpeed = 2;
var zSpeed = 5;
var pz = 0.7;
var ph = 0.3;
var chaseError = 0.7;

var humanPop = 1000;
var r = 5;
var sightR = 100;
var fightR = 5;
var margin = 5;


///////////// INTERNAL /////////////
var canvas = document.querySelector('canvas');
var c = canvas.getContext('2d');
var progressZ = document.querySelector('.progressZ');
var progressH = document.querySelector('.progressH');
var resetBtn = document.querySelector('.resetBtn');
var resetImg = document.querySelector('.resetImg');

var mouse = {x: undefined, y: undefined, state: 'up'}
window.addEventListener('mousemove', function(event) {mouse.x = event.x; mouse.y = event.y})
window.addEventListener('resize', init)
window.addEventListener('mouseup', function() {
  if (humanArray.length > 0) {
    zombie(mouse.x, mouse.y)
  } else {
    init();
  }
})

// find Euclidean distance squared between points a, b
function dist2(a,b) {return (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y)}

// general point displaying class function for human and zombie
function Point(x, y, speed, prob, type, enemyArray, color) {
  this.x = x;
  this.y = y;
  this.dx = 0;
  this.dy = 0;
  this.speed = speed;
  this.closestEnemy = undefined;
  this.closestIndex = undefined;
  this.closestDistance = undefined;
  this.probability = prob;
  this.isDead = false;
  this.type = type;
  this.enemyArray = enemyArray;

  this.draw = function() {
    c.beginPath();
    c.arc(this.x, this.y, r, 0, Math.PI*2, false);
    c.fillStyle = color;
    c.fill();
  }

  this.update = function() {
    if (humanArray.length>0 && zombieArray.length>0) {
      this.closestEnemy = getClosestEnemy(this, this.enemyArray);
      if (this.closestDistance>sightR) randomWalk(this);
      if (this.closestDistance<=sightR) chase(this);
      if (this.closestDistance<=fightR || (this.isDead)) fight(this, this.type);
    } else {
      randomWalk(this);
    }
    this.x += this.dx;
    this.y += this.dy;
    wall(this);
    this.draw();
  }
}

function human(x, y) {humanArray.push(new Point(x, y, hSpeed, ph, 'human', zombieArray, '#35f'))}
function zombie(x, y) {zombieArray.push(new Point(x, y, zSpeed, pz, 'zombie', humanArray, '#f33'))}

function wall(that) {
  if (that.x-r<0) that.x=r;
  if (that.x+r>innerWidth) that.x = innerWidth-r;
  if (that.y-r<margin) that.y=r+margin;
  if (that.y+r>innerHeight) that.y = innerHeight-r;
}

function getClosestEnemy(that, enemyArray) {
  var r = enemyArray[0];
  var index = 0;
  var d2 = dist2(that, r);
  for (var i=0; i<enemyArray.length; i++) {
    if (dist2(that, enemyArray[i]) < d2) {
      r = enemyArray[i];
      index = i;
      d2 = dist2(that, r);
    }
  }
  that.closestIndex = index;
  that.closestDistance = Math.sqrt(d2);
  return r;
}

function randomWalk(that) {
  var theta = Math.random() * Math.PI * 2;
  that.dx = that.speed * Math.cos(theta);
  that.dy = that.speed * Math.sin(theta);
}

function chase(that) {
  var r = that.closestDistance;
  var target = that.closestEnemy;
  if (r>that.speed) {
    that.dx = (1-Math.random()*chaseError)*that.speed * (target.x-that.x) / r;
    that.dy = (1-Math.random()*chaseError)*that.speed * (target.y-that.y) / r;
  } else {
    that.dx = 0;
    that.dy = 0;
  }
  if (that.type == 'human') { that.dx = -that.dx; that.dy = -that.dy; } // humans run away
}

function fight(that, type) {if (Math.random()<that.probability) that.closestEnemy.isDead = true}

function applyKill(self, i, type) {
  if (self.isDead) {
    if (type == 'human') {
      zombie(self.x, self.y);
      humanArray.splice(i,1);
    } else {
      zombieArray.splice(i,1);
    }
  }
}

var humanArray = [];
var zombieArray = [];
function init() {
  canvas.width = window.innerWidth*window.devicePixelRatio;
  canvas.height = window.innerHeight*window.devicePixelRatio;
  canvas.style.width = canvas.width/window.devicePixelRatio+'px';
  canvas.style.height = canvas.height/window.devicePixelRatio+'px';
  c.scale(window.devicePixelRatio,window.devicePixelRatio);

  humanArray = [];
  zombieArray = [];

  for (var i=0; i<humanPop; i++) {
    var x = Math.random()*(innerWidth-2*r)+r;
    var y = Math.random()*(innerHeight-2*r)+r;
    human(x, y);
  }

  resetBtn.style.background = 'rgba(0,0,0,0)';
  resetImg.style.opacity = 0;
}

function animate() {
  requestAnimationFrame(animate);
  c.clearRect(0, 0, innerWidth, innerHeight);

  for (var i=0; i<humanArray.length; i++) humanArray[i].update()
  for (var i=0; i<zombieArray.length; i++) zombieArray[i].update()

  for (var i=0; i<zombieArray.length; i++) applyKill(zombieArray[i], i, 'zombie')
  for (var i=0; i<humanArray.length; i++) applyKill(humanArray[i], i, 'human')

  progressH.style.left = (zombieArray.length/(zombieArray.length+humanArray.length)*100) + 'vw';

  if (humanArray.length==0) {
    resetBtn.style.background = 'rgba(0,0,0,0.5)';
    resetImg.style.opacity = 0.5;
  }
}

init();
animate();
