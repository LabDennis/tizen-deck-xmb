(function(){'use strict';
var enabled=true,pending=false,pendingKeep='',waiting=[],queued=[],launching=false,returnTimer=null,lastError='',notify=function(){};
try{enabled=localStorage.getItem('autoCloseApps')!=='false';}catch(e){}
function finish(error,result){pending=false;lastError=error||'';var callbacks=waiting;waiting=[];callbacks.forEach(function(cb){cb(error,result);});if(!pending&&queued.length){var next=queued.shift();cleanup(next.keep,function(e,r){next.callbacks.forEach(function(cb){cb(e,r);});});}}
function cleanup(keep,done){
 keep=keep||'';
 if(!enabled){done(null,{disabled:true});return;}
 if(pending){
  if(keep===pendingKeep){waiting.push(done);return;}
  // A return-to-Home cleanup cannot substitute for preparing a specific app.
  var existing=queued.filter(function(q){return q.keep===keep;})[0];
  if(existing)existing.callbacks.push(done);else queued.push({keep:keep,callbacks:[done]});return;
 }
 var config=window.DECK_DEVICE;
 if(!config){lastError='TV-Dienst nicht eingerichtet';done(lastError);return;}
 pending=true;pendingKeep=keep;waiting.push(done);var xhr=new XMLHttpRequest(),settled=false;
 function end(error,result){if(settled)return;settled=true;finish(error,result);}
 try{
  xhr.open('POST',config.url+'/apps/cleanup',true);xhr.timeout=10000;
  xhr.setRequestHeader('X-Deck-Control',config.token);xhr.setRequestHeader('Content-Type','application/json');
  xhr.onload=function(){try{var r=JSON.parse(xhr.responseText);if(xhr.status!==200){end(r.error||'Aufräumen abgelehnt');return;}end(r.failed&&r.failed.length?'Einige Apps konnten nicht geschlossen werden':r.interrupted?'App-Wechsel hat das Aufräumen unterbrochen':null,r);}catch(e){end('Ungültige Antwort vom TV-Dienst');}};
  xhr.onerror=xhr.ontimeout=function(){end('TV-Dienst nicht erreichbar');};
  xhr.send(JSON.stringify({keep:keep||''}));
 }catch(e){end('TV-Dienst nicht erreichbar');}
}
function prepare(keep,done){
 if(launching)return false;
 launching=true;if(returnTimer!==null)clearTimeout(returnTimer);returnTimer=null;
 cleanup(keep,function(error){
  if(error)notify('Ohne App-Aufräumen: '+error);
  done(function(){launching=false;});
 });return true;
}
function launch(item,ok,error){
 return prepare(item.id,function(release){
  try{if(window.DeckGuard)DeckGuard.leave();tizen.application.launch(item.id,function(){release();ok();},function(e){if(window.DeckGuard)DeckGuard.resume();release();error(e);});}
  catch(e){if(window.DeckGuard)DeckGuard.resume();release();error(e);}
 });
}
function visible(){
 if(returnTimer!==null)clearTimeout(returnTimer);returnTimer=null;
 if(document.hidden||launching||!enabled||!window.tizen)return;
 returnTimer=setTimeout(function(){returnTimer=null;if(!document.hidden&&!launching)cleanup('',function(error){if(error)lastError=error;});},650);
}
window.DeckApps={launch:launch,prepare:prepare,enabled:function(){return enabled;},error:function(){return lastError;},
 init:function(fn){notify=fn;visible();},setEnabled:function(value){enabled=!!value;try{localStorage.setItem('autoCloseApps',String(enabled));}catch(e){}if(!enabled&&returnTimer!==null){clearTimeout(returnTimer);returnTimer=null;}},
 clean:function(done){cleanup('',done);}};
document.addEventListener('visibilitychange',visible);
})();
