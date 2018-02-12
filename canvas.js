var hSpeed = 2;
var zSpeed = 5;
var pz = 0.7;
var ph = 0.3;
var chaseError = 0.7;

var initialHumanPop = 1000;
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
 humanPop = 100;
}
var r = 5;
var sightR = 100;
var fightR = 5;

///////////// INTERNAL /////////////
function $(x) {return document.querySelector(x);}

var humanPop = initialHumanPop;
var canvas = $('canvas');
var c = canvas.getContext('2d');
var graph = $('#graph');


var humanPopArr = [initialHumanPop];
var zombiePopArr = [0];

var graphContainer = d3.select("#graph");
var margin = {top: 100, right: 100, bottom: 100, left: 100};
var width, height;
var isGraphOpen = false;
var wasGraphEverOpened = false;

var mouse = {x: innerWidth/2, y: innerHeight/2, state: 'up'}
window.addEventListener('mousemove', function(event) {mouse.x = event.x; mouse.y = event.y})
window.addEventListener('resize', init)
canvas.addEventListener('mouseup', function() {
  if (humanArray.length > 0) {
    zombie(mouse.x, mouse.y)
  } else {
    init();
  }
})

var graphToggleBtn = $('#graphToggleBtn');
graphToggleBtn.addEventListener('click', function() {
  if (isGraphOpen) {
    openCanvas();
  } else {
    openGraph();
    plotPop();
  }
})

// find Euclidean distance squared between points a, b
function dist2(a,b) {return (a.x-b.x)**2 + (a.y-b.y)**2}

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
  this.type = type;     // 'human' or 'zombie'
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
  if (that.y-r<0) that.y=r;
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
  humanPopArr = [initialHumanPop];
  zombiePopArr = [0];

  for (var i=0; i<initialHumanPop; i++) {
    var x = Math.random()*(innerWidth-2*r)+r;
    var y = Math.random()*(innerHeight-2*r)+r;
    human(x, y);
  }

  // Set the dimensions of the canvas / graph
  width = innerWidth - margin.left - margin.right;
  height = innerHeight - margin.top - margin.bottom;

  // resize svg graph containers
  graphContainer
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
}

function animate() {
  requestAnimationFrame(animate);
  c.clearRect(0, 0, innerWidth, innerHeight);

  for (var i=0; i<humanArray.length; i++) humanArray[i].update()
  for (var i=0; i<zombieArray.length; i++) zombieArray[i].update()

  for (var i=0; i<zombieArray.length; i++) applyKill(zombieArray[i], i, 'zombie')
  for (var i=0; i<humanArray.length; i++) applyKill(humanArray[i], i, 'human')

  humanPop = humanArray.length;
  zombiePop = zombieArray.length;
  if (humanPop > 0 && zombiePop > 0) {
    humanPopArr.push(humanArray.length);
    zombiePopArr.push(zombieArray.length);
  }

  if (isGraphOpen && humanPop > 0) {
    plotPop();
  }
}


init();
animate();


// plotting population arrays (humanPopArr and zombiePopArr)
function plotPop() {
  // clear graph
  d3.selectAll("#graph > *").remove();

  // shift graph according to margins
  var svg = graphContainer.append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

  // Set the ranges
  var x = d3.scaleLinear().range([0, width]);
  var y = d3.scaleLinear().range([height, 0]);

  // Define the line
  var valueline = d3.line()
    .x(function(d,i) { return x(i); })
    .y(function(d) { return y(d); });

  // Scale the range of the data
  x.domain([0, humanPopArr.length-1]);
  y.domain([0, humanPopArr[0]]);

  // plot humanPopArr
  svg.append("path")
      .data([humanPopArr])
      .attr("class", "line lineH")
      .attr("d", valueline);
  // plot zombiePopArr
  svg.append("path")
      .data([zombiePopArr])
      .attr("class", "line lineZ")
      .attr("d", valueline);

  // Add the X Axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
  // Add the Y Axis
  svg.append("g")
      .call(d3.axisLeft(y));
}

function openGraph() {
  canvas.style.opacity = 0.2;
  graph.style.opacity = 1;
  graph.style.transform = 'scale(1)';
  isGraphOpen = true;
  wasGraphEverOpened = true;
}

function openCanvas() {
  canvas.style.opacity = 1;
  graph.style.opacity = 0;
  graph.style.transform = 'scale(1.05)';
  isGraphOpen = false;
}
