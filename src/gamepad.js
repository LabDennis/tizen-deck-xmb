(function(root){'use strict';
function Navigator(){this.states={};}
Navigator.prototype.reset=function(){this.states={};};
Navigator.prototype.read=function(pads,now,profile){
 var next={},events=[];
 for(var i=0;i<pads.length;i++){
  var p=pads[i];if(!p||p.connected===false)continue;
  var id=String(p.index),old=this.states[id]||{key:0,next:0};
  function down(n){var b=p.buttons[n];return typeof b==='number'?b>.5:!!(b&&(b.pressed||b.value>.5));}
  var legacy=profile==='ps3-legacy',standard=p.mapping==='standard'||profile==='standard'||legacy;
  if(!standard){next[id]={key:0,next:0};continue;}
  var key=0,x=p.axes[0]||0,y=p.axes[1]||0;
  if(down(legacy?14:0))key=13;
  else if(down(legacy?13:1))key=10009;
  else if(down(legacy?7:14))key=37;
  else if(down(legacy?5:15))key=39;
  else if(down(legacy?4:12))key=38;
  else if(down(legacy?6:13))key=40;
  else if(Math.max(Math.abs(x),Math.abs(y))>.55)key=Math.abs(x)>Math.abs(y)?(x<0?37:39):(y<0?38:40);
  var repeat=key>=37&&key<=40;
  if(key&&(key!==old.key||(repeat&&now>=old.next))){events.push(key);next[id]={key:key,next:now+(key===old.key?125:400)};}
  else next[id]={key:key,next:key?old.next:0};
 }
 this.states=next;return events;
};
if(typeof module!=='undefined'&&module.exports)module.exports=Navigator;else root.DeckGamepad=Navigator;
})(this);
