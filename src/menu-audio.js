/* A menu owns at most one synth voice, one context and a lazy fallback pool. */
(function(){'use strict';
window.DeckMenuAudio=function(){
 var enabled=true,context=null,voice=null,resuming=false,idleTimer=null,lastClick=0;
 var players=[],playerIndex=0,custom=false,clickURI='audio/click.wav';
 var intro=new Audio('audio/intro.wav');intro.volume=.5;
 try{enabled=localStorage.getItem('menuSound')!=='false';}catch(e){}
 function ignore(promise){if(promise&&promise.catch)promise.catch(function(){});}
 function play(audio){try{ignore(audio.play());}catch(e){}}
 function pool(){
  if(!players.length)for(var i=0;i<4;i++){
   var audio=new Audio(clickURI);audio.preload='auto';audio.volume=.55;
   audio.onerror=function(){custom=false;};players.push(audio);
  }
  return players;
 }
 function release(v,stop){
  if(!v||v.released)return;
  v.released=true;v.osc.onended=null;
  if(stop)try{v.osc.stop();}catch(e){}
  v.osc.disconnect();v.gain.disconnect();
  if(voice===v)voice=null;
 }
 function closeContext(){
  if(idleTimer!==null)clearTimeout(idleTimer);idleTimer=null;
  release(voice,true);
  var old=context;context=null;resuming=false;
  if(old&&old.close)try{ignore(old.close());}catch(e){}
 }
 function cleanup(){closeContext();intro.pause();players.forEach(function(a){a.pause();});}
 function keepAlive(){
  if(idleTimer!==null)clearTimeout(idleTimer);
  idleTimer=setTimeout(closeContext,30000);
 }
 function playFile(){
  var all=pool(),audio=all[playerIndex++%all.length];
  try{audio.currentTime=0;}catch(e){}play(audio);
 }
 function click(){
  if(!enabled||document.hidden)return;
  var now=Date.now();if(now-lastClick<55)return;lastClick=now;
  if(custom){playFile();return;}
  try{
   var Context=window.AudioContext||window.webkitAudioContext;
   if(!Context){playFile();return;}
   if(!context)context=new Context();
   keepAlive();
   if(context.state!=='running'){
    if(context.state==='suspended'&&!resuming){
     resuming=true;var expected=context,pending=context.resume();
     if(pending&&pending.then)pending.then(function(){
      if(context!==expected)return;
      resuming=false;lastClick=0;
      if(enabled&&!document.hidden)click();
     },function(){if(context===expected)resuming=false;});
     else resuming=false;
    }
    return;
   }
   release(voice,true);
   var t=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
   var current={osc:osc,gain:gain,released:false};voice=current;
   osc.type='sine';osc.frequency.setValueAtTime(1500,t);
   osc.frequency.exponentialRampToValueAtTime(700,t+.045);
   gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(.22,t+.003);
   gain.gain.exponentialRampToValueAtTime(.001,t+.055);
   osc.connect(gain);gain.connect(context.destination);
   osc.onended=function(){release(current,false);};osc.start(t);osc.stop(t+.06);
  }catch(e){closeContext();playFile();}
 }
 function set(kind,uri){
  if(kind==='intro'){intro.src=uri;return;}
  custom=true;clickURI=uri;closeContext();
  pool().forEach(function(a){a.pause();a.src=uri;});
 }
 function reset(kind){
  if(kind==='intro'){intro.src='audio/intro.wav';return;}
  custom=false;clickURI='audio/click.wav';
  players.forEach(function(a){a.pause();a.src=clickURI;});
 }
 function toggle(){
  enabled=!enabled;
  try{localStorage.setItem('menuSound',String(enabled));}catch(e){}
  if(!enabled)cleanup();
 }
 DeckSounds.restore('click',function(uri){if(uri)set('click',uri);});
 DeckSounds.restore('intro',function(uri){if(uri)set('intro',uri);if(enabled&&!document.hidden)play(intro);});
 document.addEventListener('visibilitychange',function(){if(document.hidden)cleanup();});
 window.addEventListener('pagehide',cleanup);
 return {click:click,enabled:function(){return enabled;},toggle:toggle,set:set,reset:reset};
};
})();
