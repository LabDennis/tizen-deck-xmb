/* Timekeeping has no polling of its own; views ask for the current snapshot. */
(function(root){'use strict';
var MAX=86400000;
function TimeModel(wall,steady){
 this.wall=wall||Date.now;this.steady=steady||Date.now;
 this.accumulated=0;this.started=null;this.laps=[];
 this.countdown={phase:'idle',deadline:0,remaining:0,duration:300000};
}
TimeModel.prototype.elapsed=function(){return this.accumulated+(this.started===null?0:Math.max(0,this.steady()-this.started));};
TimeModel.prototype.toggleWatch=function(){if(this.started===null)this.started=this.steady();else{this.accumulated=this.elapsed();this.started=null;}};
TimeModel.prototype.resetWatch=function(){this.accumulated=0;this.started=null;this.laps=[];};
TimeModel.prototype.lap=function(){if(this.started!==null){this.laps.unshift(this.elapsed());this.laps=this.laps.slice(0,5);}};
TimeModel.prototype.left=function(){var c=this.countdown;return c.phase==='running'?Math.max(0,c.deadline-this.wall()):c.remaining;};
TimeModel.prototype.start=function(seconds){
 if(!Number.isInteger(seconds)||seconds<1||seconds>86400)throw new Error('Dauer muss zwischen 1 Sekunde und 24 Stunden liegen.');
 this.countdown={phase:'running',deadline:this.wall()+seconds*1000,remaining:seconds*1000,duration:seconds*1000};
};
TimeModel.prototype.pause=function(){var c=this.countdown;if(c.phase==='running'){if(this.check())return;c.remaining=this.left();c.deadline=0;c.phase='paused';}};
TimeModel.prototype.resume=function(){var c=this.countdown;if(c.phase==='paused'&&c.remaining>0){c.deadline=this.wall()+c.remaining;c.phase='running';}};
TimeModel.prototype.cancel=function(){var duration=this.countdown.duration;this.countdown={phase:'idle',deadline:0,remaining:0,duration:duration};};
TimeModel.prototype.check=function(){var c=this.countdown;if(c.phase==='running'&&this.left()===0){c.phase='finished';c.remaining=0;c.deadline=0;return true;}return false;};
TimeModel.prototype.save=function(){return JSON.stringify({version:1,countdown:this.countdown});};
TimeModel.prototype.restore=function(raw){
 try{
  if(typeof raw!=='string'||raw.length>1024)return false;
  var d=JSON.parse(raw),c=d.countdown;
  if(d.version!==1||!c||['idle','running','paused','finished'].indexOf(c.phase)<0)return false;
  if(!Number.isInteger(c.duration)||c.duration<1000||c.duration>MAX)return false;
  if(!Number.isInteger(c.remaining)||c.remaining<0||c.remaining>c.duration)return false;
  if(!Number.isInteger(c.deadline)||c.deadline<0)return false;
  if(c.phase==='running'&&(c.deadline<this.wall()-MAX||c.deadline>this.wall()+MAX))return false;
  if(c.phase==='paused'&&c.remaining===0)return false;
  this.countdown={phase:c.phase,deadline:c.phase==='running'?c.deadline:0,remaining:c.phase==='finished'||c.phase==='idle'?0:c.remaining,duration:c.duration};return true;
 }catch(e){return false;}
};
TimeModel.format=function(ms,tenths){
 ms=Math.max(0,ms);var s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s/60)%60;
 function pad(n){return n<10?'0'+n:String(n);}
 return (h?pad(h)+':':'')+pad(m)+':'+pad(s%60)+(tenths?'.'+Math.floor(ms%1000/100):'');
};
if(typeof module!=='undefined'&&module.exports)module.exports=TimeModel;else root.DeckTimeModel=TimeModel;
})(typeof window!=='undefined'?window:this);
