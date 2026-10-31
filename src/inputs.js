(function(){'use strict';
var generation=0,aliases={};try{aliases=JSON.parse(localStorage.getItem('inputNames')||'{}');}catch(e){}if(!aliases||typeof aliases!=='object'||Array.isArray(aliases))aliases={};
function key(s){return s.type+':'+s.number;}
function label(s){return s.type+(s.type==='TV'?'':' '+s.number);}
function normalize(info,current){
 var entries=[],seen={};
 [true,false].forEach(function(connected){(info[connected?'connected':'disconnected']||[]).forEach(function(s){
  if(!s||typeof s.type!=='string'||typeof s.number!=='number'||!isFinite(s.number))return;
  var k=key(s);if(seen[k])return;seen[k]=true;
  entries.push({key:k,source:s,port:label(s),connected:connected,current:!!current&&key(current)===k,signal:current&&key(current)===k&&typeof current.signal==='boolean'?current.signal:null});
 });});return entries.sort(function(a,b){return a.port.localeCompare(b.port,undefined,{numeric:true});});
}
function open(ui){
 var dialog=document.getElementById('dialog'),actions=document.getElementById('dialog-actions'),text=document.getElementById('dialog-text');
 var active=++generation;
 ui.modal('Eingänge','Anschlüsse werden gelesen …');
 function valid(){return dialog.open&&active===generation&&document.getElementById('dialog-title').textContent==='Eingänge';}
 function button(name,fn){var b=document.createElement('button');b.textContent=name;b.onclick=fn;actions.appendChild(b);return b;}
 function error(e){if(valid())text.textContent='Eingang nicht verfügbar: '+(e.message||e.name||String(e));}
 if(!window.tizen||!tizen.systeminfo||!tizen.tvwindow){text.textContent='Die Eingänge sind nur direkt auf dem Monitor verfügbar.';return;}
 function select(entry){
  if(!valid())return;
  var accepted=DeckApps.prepare('org.tizen.tv-viewer',function(release){
   if(!valid()){release();return;}
   var finished=false,timer=setTimeout(function(){if(finished)return;finished=true;release();error('Zeitlimit beim Umschalten');},8000);
   function fail(e){if(window.DeckGuard)DeckGuard.resume();if(finished)return;finished=true;clearTimeout(timer);release();error(e);}
   try{tizen.tvwindow.setSource(entry.source,function(){
    if(finished)return;
    // Closing the dialog while switching must not launch an unexpected app later.
    if(!valid()){finished=true;clearTimeout(timer);release();return;}
    try{if(window.DeckGuard)DeckGuard.leave();tizen.application.launch('org.tizen.tv-viewer',function(){if(finished)return;finished=true;clearTimeout(timer);release();if(valid())dialog.close();},fail);}catch(e){fail(e);}
   },fail,'MAIN');}catch(e){fail(e);}
  });
  if(accepted)text.textContent=entry.port+' wird geöffnet …';
 }
 function rename(entries){
  actions.textContent='';text.textContent='Eigene Gerätenamen für die Anschlüsse. Diese Namen werden lokal gespeichert; sie sind keine automatische Geräteerkennung.';
  entries.forEach(function(entry){var input=document.createElement('input');input.type='text';input.maxLength=40;input.value=typeof aliases[entry.key]==='string'?aliases[entry.key]:'';input.placeholder=entry.port+' · z. B. Gaming-PC';input.setAttribute('aria-label',entry.port+' Gerätename');input.dataset.port=entry.key;actions.appendChild(input);});
  button('Namen speichern',function(){var next={};Array.prototype.forEach.call(actions.querySelectorAll('input'),function(input){var value=input.value.trim().slice(0,40);if(value)next[input.dataset.port]=value;});try{localStorage.setItem('inputNames',JSON.stringify(next));aliases=next;refresh();}catch(e){error('Namen konnten nicht gespeichert werden');}});
  if(actions.firstChild)actions.firstChild.focus();
 }
 function refresh(){
  var ticket=++generation;active=ticket;actions.textContent='';text.textContent='Anschlüsse werden gelesen …';var completed=false;
  var timer=setTimeout(function(){if(completed)return;completed=true;error('Keine Antwort vom Monitor');if(valid())button('Erneut prüfen',refresh).focus();},5000);
  try{tizen.systeminfo.getPropertyValue('VIDEOSOURCE',function(info){
   if(completed)return;completed=true;clearTimeout(timer);if(!valid())return;
   var current=null;try{current=tizen.tvwindow.getSource('MAIN');}catch(e){}
   var entries=normalize(info,current);
   text.textContent=entries.length?'Gemeldete Anschlüsse · OK wechselt zum Eingang. Verbunden bedeutet nicht zwingend ein aktives Bildsignal. Gerätenamen kannst du selbst vergeben.':'Der Monitor meldet keine verfügbaren Eingänge.';
   entries.forEach(function(entry){var name=typeof aliases[entry.key]==='string'?aliases[entry.key]:'';
    button((entry.current?'● ':'')+entry.port+(name?' · '+name:'')+' — '+(entry.connected?'verbunden':'nicht verbunden')+(entry.signal===true?' · Signal':entry.signal===false?' · kein Signal':''),function(){select(entry);});
   });
   if(entries.length)button('Gerätenamen bearbeiten',function(){rename(entries);});button('Aktualisieren',refresh);if(actions.firstChild)actions.firstChild.focus();
  },function(e){if(completed)return;completed=true;clearTimeout(timer);error(e);if(valid())button('Erneut prüfen',refresh).focus();});}
  catch(e){completed=true;clearTimeout(timer);error(e);}
 }
 refresh();
}
window.DeckInputs={open:open,normalize:normalize};
})();
