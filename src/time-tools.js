(function(){'use strict';
var model=new DeckTimeModel(Date.now,function(){return performance.now();});
var ui=null,view='',viewTimer=null,alarmTimer=null,output=null,clockDate=null,clockTime=null,watchButton=null,lapButton=null,lapList=null,startButton=null,minutesInput=null,presets=[];
var dialog=document.getElementById('dialog'),actions=document.getElementById('dialog-actions');
var titles={menu:'Uhr & Timer',clock:'Uhr',watch:'Stoppuhr',countdown:'Countdown'};
function current(){return dialog.open&&document.getElementById('dialog-title').textContent===titles[view];}
function text(el,value){if(el.textContent!==value)el.textContent=value;}
function save(){try{localStorage.setItem('deck.countdown',model.save());}catch(e){}}
function stopView(){if(viewTimer!==null)clearTimeout(viewTimer);viewTimer=null;}
function clearAlarm(){if(alarmTimer!==null)clearTimeout(alarmTimer);alarmTimer=null;}
function notify(){
 save();ui.notice('Countdown abgelaufen');ui.ping();
 if(current())document.getElementById('dialog-text').textContent='Countdown abgelaufen. Das Signal richtet sich nach deinen Menütönen.';
}
function scheduleAlarm(){
 clearAlarm();if(!ui||document.hidden)return;
 if(model.check())notify();
 if(model.countdown.phase==='running')alarmTimer=setTimeout(function(){alarmTimer=null;scheduleAlarm();if(current())paint();},Math.max(1,Math.ceil(model.left())));
}
function begin(next,description){
 stopView();dialog.classList.remove('time-fullscreen');view=next;
 ui.modal(titles[next],description);output=null;clockDate=null;clockTime=null;
}
function button(label,fn){var b=document.createElement('button');b.textContent=label;b.onclick=fn;actions.appendChild(b);return b;}
function readout(label){output=document.createElement('output');output.className='time-readout';output.setAttribute('aria-label',label);output.setAttribute('aria-live','off');actions.appendChild(output);}
function focusFirst(){var b=actions.querySelector('button');if(b)b.focus();}
function redrawLaps(){
 lapList.textContent='';model.laps.forEach(function(value,index){var li=document.createElement('li');li.textContent=(index===0?'Zuletzt: ':'')+DeckTimeModel.format(value,true);lapList.appendChild(li);});
}
function paint(){
 stopView();if(document.hidden||!current())return;
 var delay=0;
 if(view==='clock'){var now=DeckClock.read(new Date());text(clockDate,now.date);text(clockTime,now.time);delay=Math.max(1,60000-Date.now()%60000);}
 if(view==='watch'){
  text(output,DeckTimeModel.format(model.elapsed(),true));text(watchButton,model.started===null?'Starten / Fortsetzen':'Pause');
  lapButton.disabled=model.started===null;delay=model.started===null?0:100;
 }
 if(view==='countdown'){
  var c=model.countdown;var remaining=c.phase==='idle'?c.duration:model.left();
  text(output,c.phase==='finished'?'Abgelaufen':DeckTimeModel.format(Math.ceil(remaining/1000)*1000,false));
  text(startButton,c.phase==='running'?'Pause':c.phase==='paused'?'Fortsetzen':'Starten');
  minutesInput.disabled=c.phase==='running'||c.phase==='paused';presets.forEach(function(b){b.disabled=minutesInput.disabled;});
  delay=c.phase==='running'?1000:0;
 }
 if(delay)viewTimer=setTimeout(paint,delay);
}
function menu(){
 begin('menu','Uhr, Stoppuhr und Countdown direkt auf diesem Monitor.');
 button('Große Uhr',function(){
  begin('clock','Zurück beendet die Uhransicht.');dialog.classList.add('time-fullscreen');readout('Uhrzeit und Datum');
  clockDate=document.createElement('span');clockDate.className='time-date';output.appendChild(clockDate);
  clockTime=document.createElement('strong');clockTime.className='time-digits';output.appendChild(clockTime);paint();
 });
 button('Stoppuhr',watch);
 button(model.countdown.phase==='running'?'Countdown läuft · '+DeckTimeModel.format(model.left(),false):'Countdown',countdown);
 focusFirst();
}
function watch(){
 begin('watch','Läuft beim Verlassen dieses Menüs weiter. Beim Schließen von Deck wird die Stoppuhr zurückgesetzt. Bis zu fünf Zwischenzeiten.');
 readout('Stoppuhr');
 watchButton=button('Starten / Fortsetzen',function(){model.toggleWatch();paint();});
 lapButton=button('Zwischenzeit merken',function(){model.lap();redrawLaps();});
 button('Zurücksetzen',function(){model.resetWatch();redrawLaps();paint();});
 lapList=document.createElement('ol');lapList.className='time-laps';actions.appendChild(lapList);redrawLaps();
 button('Zur Übersicht',menu);paint();focusFirst();
}
function countdown(){
 begin('countdown','Erinnert, solange Deck läuft. Bei Rückkehr aus einer anderen App wird eine abgelaufene Zeit nachgemeldet. Weckt den Monitor nicht aus Standby. Signal über Menütöne.');
 readout('Verbleibende Zeit');
 var label=document.createElement('label');label.textContent='Dauer in Minuten (1–1440)';
 minutesInput=document.createElement('input');minutesInput.type='number';minutesInput.min='1';minutesInput.max='1440';minutesInput.step='1';minutesInput.value=String(model.countdown.duration/60000);minutesInput.setAttribute('aria-label','Dauer in Minuten');label.appendChild(minutesInput);actions.appendChild(label);
 startButton=button('Starten',function(){
  var phase=model.countdown.phase;
  if(phase==='running'){if(model.check())notify();else model.pause();}
  else if(phase==='paused')model.resume();
  else{var n=Number(minutesInput.value);if(!Number.isInteger(n)||n<1||n>1440){document.getElementById('dialog-text').textContent='Bitte 1 bis 1440 ganze Minuten eingeben.';minutesInput.focus();return;}model.start(n*60);}
  save();scheduleAlarm();paint();
 });
 presets=[5,15,30].map(function(n){return button(n+' Minuten',function(){minutesInput.value=String(n);});});
 button('Countdown abbrechen',function(){model.cancel();save();scheduleAlarm();paint();});
 button('Zur Übersicht',menu);scheduleAlarm();paint();startButton.focus();
}
function visibility(){
 stopView();clearAlarm();
 if(!document.hidden){scheduleAlarm();if(current())paint();}
}
dialog.addEventListener('close',function(){
 // close is queued by the browser; a newer dialog may already be open.
 if(dialog.open)return;
 stopView();dialog.classList.remove('time-fullscreen');view='';
});
document.addEventListener('visibilitychange',visibility);
window.addEventListener('pagehide',function(){stopView();clearAlarm();});
window.DeckTimeTools={
 init:function(options){ui=options;try{model.restore(localStorage.getItem('deck.countdown'));}catch(e){}scheduleAlarm();},
 open:menu
};
})();
