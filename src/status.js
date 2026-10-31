(function(){'use strict';
var target=document.getElementById('device-status'),generation=0,timer=null,lastText='';
var cached={ip:'—',cpu:'—',ram:'—'},seen={ip:0,cpu:0,ram:0},pending={};
var quietUntil=0,lastActivity=Date.now(),lastNetwork=0;
function activity(){var now=Date.now();quietUntil=now+750;lastActivity=now;}
window.DeckStatus={activity:activity};
['keydown','mousedown','wheel'].forEach(function(name){document.addEventListener(name,activity);});
function suspended(){return document.hidden||(window.DeckFlappy&&DeckFlappy.active());}
function draw(){var text='IP '+cached.ip+' · CPU '+cached.cpu+' · RAM '+cached.ram;if(text!==lastText){target.textContent=text;lastText=text;}}
function refresh(){
 if(suspended())return;
 if(!window.tizen||!tizen.systeminfo){target.textContent='Vorschau · Monitorwerte nur am TV';return;}
 var seq=++generation,info=tizen.systeminfo,now=Date.now();
 ['cpu','ram'].forEach(function(k){if(now-seen[k]>90000)cached[k]='—';});
 function value(k,v){cached[k]=v;seen[k]=Date.now();}
 function query(name,done){
  // Native calls cannot be cancelled: never accumulate requests if one stalls.
  if(pending[name])return;
  var token={};pending[name]=token;
  function finish(){if(pending[name]===token)delete pending[name];}
  try{info.getPropertyValue(name,function(v){finish();if(seq===generation){done(v);draw();}},finish);}
  catch(e){finish();}
 }
 try{var total=info.getTotalMemory(),free=info.getAvailableMemory();if(total>0&&free>=0&&free<=total)value('ram',Math.round((total-free)/total*100)+' %');}catch(e){}
 draw();
 query('CPU',function(v){if(typeof v.load==='number'&&isFinite(v.load)&&v.load>=0&&v.load<=1)value('cpu',Math.round(v.load*100)+' %');});
 // The address rarely changes; visibility resumes still request a fresh one.
 if(!lastNetwork||now-lastNetwork>=60000){lastNetwork=now;
  query('NETWORK',function(v){var type=v.networkType;if(type==='WIFI'||type==='ETHERNET')query(type+'_NETWORK',function(n){if(n.ipAddress&&n.ipAddress!=='0.0.0.0')value('ip',n.ipAddress);});else if(type==='NONE')value('ip','offline');});
 }
}
function tick(){
 timer=null;if(suspended())return;
 var now=Date.now();
 // Do not invoke synchronous memory APIs while repeated navigation is active.
 if(now<quietUntil){timer=setTimeout(tick,quietUntil-now);return;}
 refresh();timer=setTimeout(tick,now-lastActivity>=30000?30000:10000);
}
function visibility(){generation++;if(timer!==null){clearTimeout(timer);timer=null;}lastNetwork=0;if(!suspended())tick();}
document.addEventListener('visibilitychange',visibility);document.addEventListener('deck:activity',visibility);tick();
})();
