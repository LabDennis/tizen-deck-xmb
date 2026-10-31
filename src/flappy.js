(function(){'use strict';
var layer=null,canvas,ctx,game=null,raf=null,last=0,wasState='',savedBest=-1,onclose=null,noiseSeed=419,assets=null;
var ui={},sound=null,soundOn=function(){return true;},inputAt=0,scoreboard=false,scorebook=null,recorded=false;
function rng(){noiseSeed=(noiseSeed*1664525+1013904223)>>>0;return noiseSeed/4294967296;}
function rounded(c,x,y,w,h,r,fill){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();c.fillStyle=fill;c.fill();}
function sprite(w,h,draw){var el=document.createElement('canvas');el.width=w;el.height=h;draw(el.getContext('2d'));return el;}
function monitor(c,broken){
 rounded(c,5,5,230,148,12,'#080e16');rounded(c,13,13,214,128,5,broken?'#9cd5e6':'#75bccc');
 if(!broken){c.fillStyle='#468caa';c.beginPath();c.moveTo(13,118);c.bezierCurveTo(80,40,160,170,227,48);c.lineTo(227,141);c.lineTo(13,141);c.fill();c.fillStyle='#172939';c.fillRect(78,65,10,17);c.fillRect(150,65,10,17);c.strokeStyle='#172939';c.lineWidth=4;c.beginPath();c.arc(119,82,20,.15,Math.PI-.15);c.stroke();}
 else{
  c.save();c.beginPath();c.rect(13,13,214,128);c.clip();
  var colors=['#91dbed','#2584ad','#d0e1dc','#121e57','#4b7564','#a1be4c','#b265bc'];
  for(var i=0;i<135;i++){c.fillStyle=colors[Math.floor(rng()*colors.length)];c.fillRect(13+i*1.6,13,1+rng()*2,128);}
  c.fillStyle='#06101b';c.beginPath();c.moveTo(14,110);c.lineTo(66,52);c.lineTo(78,82);c.lineTo(116,99);c.lineTo(141,142);c.lineTo(13,142);c.fill();
  c.fillStyle='#05080c';for(var j=0;j<7;j++){c.beginPath();c.ellipse(100+rng()*115,95+rng()*40,7+rng()*18,3+rng()*9,rng(),0,Math.PI*2);c.fill();}
  c.strokeStyle='#eaf7ff';c.lineWidth=1.2;
  [[65,60,14,16],[65,60,99,18],[65,60,19,103],[65,60,125,110],[125,110,213,50],[125,110,218,137]].forEach(function(p){c.beginPath();c.moveTo(p[0],p[1]);c.lineTo((p[0]+p[2])/2+8,(p[1]+p[3])/2);c.lineTo(p[2],p[3]);c.stroke();});
  c.strokeStyle='#0b304b';for(var k=0;k<8;k++){c.beginPath();c.moveTo(13,110+k*4);c.lineTo(135,110+k*4);c.stroke();}c.restore();
 }
 c.fillStyle='#3d505f';c.fillRect(108,153,24,15);rounded(c,76,165,88,9,4,'#8397a4');c.fillStyle='#98becb';c.fillRect(111,146,18,2);
}
function prepare(){if(assets)return;assets={};
 assets.monitor=sprite(240,180,function(c){monitor(c,false);});assets.cracked=sprite(240,180,function(c){monitor(c,true);});
 assets.remote=sprite(100,600,function(c){
  rounded(c,4,0,92,598,35,'#a9b3b8');rounded(c,8,0,84,592,32,'#e0e5e3');
  c.strokeStyle='#8d999e';c.lineWidth=2;c.beginPath();c.arc(50,127,31,0,Math.PI*2);c.stroke();c.beginPath();c.arc(50,127,15,0,Math.PI*2);c.stroke();
  c.fillStyle='#728187';c.beginPath();c.arc(29,52,10,0,Math.PI*2);c.fill();c.fillStyle='#c17171';c.fillRect(28,41,2,10);
  c.fillStyle='#728187';c.beginPath();c.arc(71,52,8,0,Math.PI*2);c.fill();
  [25,50,75].forEach(function(x){c.beginPath();c.arc(x,196,9,0,Math.PI*2);c.fillStyle='#b8c2c4';c.fill();});
  rounded(c,21,229,58,11,5,'#9faeb2');rounded(c,21,254,58,11,5,'#9faeb2');
  for(var r=0;r<3;r++)for(var k=0;k<2;k++)rounded(c,22+k*31,300+r*40,25,22,9,'#c0cbce');
  c.fillStyle='#75868e';c.font='9px Arial';c.textAlign='center';c.fillText('SMASNUG',50,516);
 });
 assets.bg=sprite(960,540,function(c){c.fillStyle='#0b1822';c.fillRect(0,0,960,540);c.fillStyle='#102430';c.beginPath();c.moveTo(0,390);c.bezierCurveTo(230,180,540,460,960,210);c.lineTo(960,540);c.lineTo(0,540);c.fill();c.fillStyle='#153340';c.beginPath();c.moveTo(0,460);c.bezierCurveTo(400,340,650,500,960,360);c.lineTo(960,540);c.lineTo(0,540);c.fill();c.fillStyle='#afccd7';for(var i=0;i<55;i++){c.globalAlpha=.15+rng()*.25;c.fillRect(rng()*960,65+rng()*390,1,1);}c.globalAlpha=1;});
}
function tone(hit){if(!soundOn()||document.hidden)return;try{var C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!sound)sound=new C();if(sound.state==='suspended')sound.resume();var o=sound.createOscillator(),g=sound.createGain(),t=sound.currentTime;o.type=hit?'triangle':'sine';o.frequency.setValueAtTime(hit?120:430,t);o.frequency.exponentialRampToValueAtTime(hit?35:650,t+.08);g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(g);g.connect(sound.destination);o.start(t);o.stop(t+.13);o.onended=function(){o.disconnect();g.disconnect();};}catch(e){}}
function build(){if(layer)return;layer=document.createElement('section');layer.id='flappy';layer.setAttribute('aria-label','Flappy Smasnug');layer.innerHTML='<canvas width="960" height="540" aria-label="Ein Bildschirm fliegt durch Fernbedienungen"></canvas><div class="flappy-top"><h2>Flappy Smasnug</h2><div class="flappy-score">Punkte <strong id="flappy-score">0</strong><span>Rekord <b id="flappy-best">0</b></span></div></div><div class="flappy-message"><h3></h3><p></p><button id="flappy-action">Losfliegen</button></div><div class="flappy-bottom"><span>OK / A / Leertaste · Fliegen</span><div><button id="flappy-show-scores">Bestenliste</button><button id="flappy-exit">Zurück zum Menü</button></div></div><section class="flappy-scores" hidden aria-label="Bestenliste"><h3>Bestenliste</h3><p id="flappy-scores-note"></p><table><thead><tr><th>Platz</th><th>Punkte</th><th>Datum</th></tr></thead><tbody></tbody></table><button id="flappy-scores-close">Zurück</button></section>';
 document.body.appendChild(layer);canvas=layer.querySelector('canvas');ctx=canvas.getContext('2d',{alpha:false});ui.message=layer.querySelector('.flappy-message');ui.title=layer.querySelector('h3');ui.text=layer.querySelector('.flappy-message p');ui.action=layer.querySelector('#flappy-action');ui.score=layer.querySelector('#flappy-score');ui.best=layer.querySelector('#flappy-best');ui.bottom=layer.querySelector('.flappy-bottom');ui.scores=layer.querySelector('.flappy-scores');ui.scoresClose=layer.querySelector('#flappy-scores-close');ui.showScores=layer.querySelector('#flappy-show-scores');ui.showScores.onclick=showScores;ui.scoresClose.onclick=hideScores;
 ui.action.onclick=flap;layer.querySelector('#flappy-exit').onclick=close;canvas.addEventListener('pointerdown',function(e){e.preventDefault();flap();});
}
function renderScores(){
 var rows=scorebook.entries(),body=ui.scores.querySelector('tbody');body.textContent='';
 rows.forEach(function(row,i){var tr=document.createElement('tr'),date=new Date(row.at);[String(i+1),String(row.score),date.toLocaleDateString('de-DE')+' '+date.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})].forEach(function(value){var td=document.createElement('td');td.textContent=value;tr.appendChild(td);});body.appendChild(tr);});
 ui.scores.querySelector('table').hidden=!rows.length;
 layer.querySelector('#flappy-scores-note').textContent=!scorebook.saved?'Speichern nicht verfügbar. Diese Liste gilt nur für die laufende Sitzung.':rows.length?'Top 10 · auf diesem Monitor gespeichert':'Noch keine Runden gespeichert. Neue Ergebnisse erscheinen hier ab diesem Update.';
}
function showScores(){if(!game||(game.state!=='ready'&&game.state!=='over'))return;scoreboard=true;draw();}
function hideScores(){if(!game)return;scoreboard=false;draw();ui.showScores.focus();}
function reflect(){
 if(game.score!==Number(ui.score.textContent))ui.score.textContent=game.score;
 if(game.best!==savedBest){savedBest=game.best;ui.best.textContent=game.best;try{localStorage.setItem('flappySmasnug.best',String(game.best));}catch(e){}}
 if(game.state==='over'&&!recorded){recorded=true;scorebook.add(game.score,Date.now());}
 var state=scoreboard?'scores':game.state;
 if(wasState===state)return;wasState=state;layer.setAttribute('data-state',state);
 ui.message.hidden=scoreboard||(game.state!=='ready'&&game.state!=='over');ui.bottom.hidden=ui.message.hidden;ui.scores.hidden=!scoreboard;if(ui.message.hidden&&layer.contains(document.activeElement))document.activeElement.blur();
 if(scoreboard){renderScores();ui.scoresClose.focus();return;}
 if(game.state==='ready'){ui.title.textContent='Display bereit.';ui.text.textContent='Flieg durch die Fernbedienungen. Lass das Display heil.';ui.action.textContent='Losfliegen';}
 if(game.state==='over'){ui.title.textContent='Display im Eimer.';ui.text.textContent=game.score+' Punkte · Rekord '+game.best;ui.action.textContent='Noch ein Versuch';}
 if(!ui.message.hidden)ui.action.focus();
 if(game.state==='dying')tone(true);
}
function draw(){if(!game)return;ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(assets.bg,0,0);ctx.setTransform(.75,0,0,.75,0,0);
 (game.state==='ready'||game.state==='over'?[]:game.obstacles).forEach(function(o){ctx.save();ctx.translate(o.x+100,o.top);ctx.rotate(Math.PI);ctx.drawImage(assets.remote,0,0);ctx.restore();ctx.drawImage(assets.remote,o.x,o.bottom);});
 var dead=!!game.hit,tilt=dead?Math.min(1.4,game.deathTime*2):Math.max(-.23,Math.min(.55,game.vy/900));
 if(game.state!=='ready'&&game.state!=='over'){ctx.save();ctx.translate(game.x,game.y);ctx.rotate(tilt);ctx.drawImage(dead?assets.cracked:assets.monitor,-46,-31,92,69);ctx.restore();}
 if(!scoreboard&&game.state==='ready'){ctx.save();ctx.translate(925,290);ctx.rotate(-.1);ctx.drawImage(assets.monitor,-120,-90,240,180);ctx.restore();}
 if(!scoreboard&&game.state==='over'){ctx.save();ctx.translate(925,290);ctx.rotate(.09);ctx.drawImage(assets.cracked,-145,-109,290,218);ctx.restore();}
 reflect();
}
function schedule(){if(raf===null&&game&&!document.hidden&&game.state!=='paused'&&game.state!=='ready'&&game.state!=='over')raf=requestAnimationFrame(frame);}
function frame(now){raf=null;if(!game||document.hidden)return;var delta=last?(now-last)/1000:0;last=now;game.step(delta);draw();schedule();}
function halt(){if(raf!==null)cancelAnimationFrame(raf);raf=null;last=0;}
function flap(){if(!game||document.hidden||scoreboard)return;var now=Date.now();if(now-inputAt<90)return;inputAt=now;if(game.state==='ready'||game.state==='over')recorded=false;if(game.flap())tone(false);draw();schedule();}
function close(){if(!game)return;halt();game=null;if(layer.contains(document.activeElement))document.activeElement.blur();layer.hidden=true;document.body.classList.remove('game-open');document.dispatchEvent(new Event('deck:activity'));if(onclose)onclose();}
function open(options){if(game)return;build();prepare();onclose=options&&options.onclose;soundOn=options&&options.soundOn||function(){return true;};game=new FlappyModel();try{var best=Number(localStorage.getItem('flappySmasnug.best'));if(isFinite(best)&&best>=0)game.best=Math.floor(best);}catch(e){}scoreboard=false;recorded=false;if(!scorebook){var storage;try{storage=localStorage;}catch(e){}scorebook=new FlappyScores(storage);}wasState='';savedBest=-1;inputAt=0;layer.hidden=false;document.body.classList.add('game-open');document.dispatchEvent(new Event('deck:activity'));draw();ui.action.focus();}
function menuButtons(){return Array.prototype.filter.call(layer.querySelectorAll('button'),function(b){return !b.disabled&&b.offsetParent!==null;});}
function key(code,repeat){
 if(!game)return false;
 if(code===27||code===10009){if(scoreboard)hideScores();else close();return true;}
 if(code===80||code===179||code===19)return true;
 var menu=scoreboard||game.state==='ready'||game.state==='over';
 if(menu&&code>=37&&code<=40){
  var buttons=menuButtons(),at=buttons.indexOf(document.activeElement),direction=code===37||code===38?-1:1;
  if(buttons.length)buttons[at<0?0:Math.max(0,Math.min(buttons.length-1,at+direction))].focus();
  return true;
 }
 if(code===13||code===32){if(!repeat){var selected=document.activeElement;if(menuButtons().indexOf(selected)>=0)selected.click();else flap();}return true;}
 if(code===38){if(!repeat)flap();return true;}
 return code>=37&&code<=40;
}
document.addEventListener('visibilitychange',function(){
 if(!game)return;
 if(document.hidden){if(game.state!=='over'&&game.state!=='ready')game.pause();halt();draw();}
 else if(game.state==='paused'){game.resume();last=0;draw();schedule();}
});
window.DeckFlappy={open:open,close:close,key:key,active:function(){return !!game;},state:function(){return game?(scoreboard?'scores':game.state):'closed';}};
})();
