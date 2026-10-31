(function(root){'use strict';
var W=1280,H=720,FLOOR=H,STEP=1/120;
function Game(random){this.random=random||Math.random;this.best=0;this.reset();}
Game.prototype.reset=function(){this.state='ready';this.beforePause='ready';this.y=330;this.vy=0;this.x=310;this.w=76;this.h=52;this.t=0;this.score=0;this.hit=null;this.obstacles=[];this.spawnIn=.9;this.acc=0;this.deathTime=0;};
Game.prototype.flap=function(){if(this.state==='paused')return false;if(this.state==='over'){this.reset();}if(this.state==='ready')this.state='running';if(this.state!=='running')return false;this.vy=-330;return true;};
Game.prototype.pause=function(){if(this.state==='paused')return;this.beforePause=this.state;this.state='paused';this.acc=0;};
Game.prototype.resume=function(){if(this.state!=='paused')return;this.state=this.beforePause;this.acc=0;};
Game.prototype.crash=function(kind){if(this.state!=='running')return;this.state='dying';this.hit=kind;this.deathTime=0;this.best=Math.max(this.best,this.score);this.vy=Math.max(this.vy,-90);};
Game.prototype.tick=function(dt){
 if(this.state==='ready'||this.state==='over'||this.state==='paused')return;
 this.t+=dt;this.vy=Math.min(this.vy+880*dt,700);this.y+=this.vy*dt;
 if(this.state==='dying'){this.deathTime+=dt;if(this.y+this.h/2>=FLOOR){this.y=FLOOR-this.h/2;this.vy=0;if(this.deathTime>.45)this.state='over';}return;}
 this.spawnIn-=dt;var speed=220+Math.min(this.score,30)*2;
 if(this.spawnIn<=0){var gap=232-Math.min(this.score,25)*1.2,cy=205+this.random()*275;this.obstacles.push({x:W+60,width:100,top:cy-gap/2,bottom:cy+gap/2,passed:false});this.spawnIn+=1.9;}
 var left=this.x-this.w/2+5,right=this.x+this.w/2-5,top=this.y-this.h/2+4,bottom=this.y+this.h/2-4;
 for(var i=0;i<this.obstacles.length;i++){var o=this.obstacles[i];o.x-=speed*dt;if(right>o.x+5&&left<o.x+o.width-5&&(top<o.top||bottom>o.bottom)){this.crash('remote');break;}if(!o.passed&&o.x+o.width<left){o.passed=true;this.score++;this.best=Math.max(this.best,this.score);}}
 this.obstacles=this.obstacles.filter(function(o){return o.x+o.width>-20;});
 if(top<=25){this.y=this.h/2+25;this.crash('ceiling');}if(bottom>=FLOOR){this.y=FLOOR-this.h/2;this.crash('floor');}
};
Game.prototype.step=function(dt){if(!isFinite(dt)||dt<=0)return;this.acc+=Math.min(dt,.1);while(this.acc>=STEP){this.tick(STEP);this.acc-=STEP;}};
Game.W=W;Game.H=H;Game.FLOOR=FLOOR;
if(typeof module!=='undefined'&&module.exports)module.exports=Game;else root.FlappyModel=Game;
})(this);
