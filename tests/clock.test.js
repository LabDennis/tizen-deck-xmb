const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
let constructors=0;const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/clock.js'),'utf8'),{window,Intl:{DateTimeFormat:function(...args){constructors++;return new Intl.DateTimeFormat(...args);}}});
for(let i=0;i<1000;i++){const d=new Date(2026,9,26,13,20,i%60),x=window.DeckClock.read(d);assert.equal(x.text,d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+'   '+d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}));assert.equal(x.minute,(20+(i%60)/60)*6);}
assert.equal(constructors,2,'formatters should be reused across every clock tick');console.log('Clock: unchanged local formatting and analog angles with two reusable formatters');
