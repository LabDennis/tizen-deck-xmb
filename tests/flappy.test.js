const assert=require('node:assert/strict'),Game=require('../src/flappy-model');
let g=new Game(()=>.5);g.flap();assert.equal(g.state,'running');assert.ok(g.vy<0);g.pause();let y=g.y;g.step(1);assert.equal(g.y,y);g.resume();g.step(.02);assert.ok(g.y<y);
g=new Game(()=>.5);g.flap();for(let i=0;i<360;i++)g.step(1/60);assert.equal(g.state,'over');assert.equal(g.hit,'floor');assert.equal(g.y+g.h/2,Game.FLOOR);
g.flap();assert.equal(g.state,'running');assert.equal(g.hit,null);assert.equal(g.score,0);
g.obstacles=[{x:g.x,width:100,top:g.y+20,bottom:g.y+240,passed:false}];g.step(.02);assert.equal(g.hit,'remote');assert.equal(g.score,0);
g=new Game(()=>.5);g.flap();g.obstacles=[{x:200,width:50,top:80,bottom:600,passed:false}];g.step(.02);assert.equal(g.score,1);g.step(.02);assert.equal(g.score,1);g.crash('floor');g.reset();assert.equal(g.best,1);
function run(hz){let a=new Game(()=>.5);a.flap();for(let i=0;i<hz/2;i++)a.step(1/hz);return a;}
assert.ok(Math.abs(run(30).y-run(60).y)<.1,'physics must not depend on frame rate');
g=new Game(()=>.5);g.flap();g.step(30);assert.equal(g.state,'running','a stalled frame must not teleport player to floor');
console.log('Flappy: frame-rate independence, pause, collision, fall, scoring once, highscore and restart passed');
