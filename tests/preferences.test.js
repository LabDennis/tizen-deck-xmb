const assert=require('node:assert/strict'),P=require('../src/preferences');
function storage(){const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),data};}
const s=storage();s.setItem('menuSound','false');s.setItem('favorites','["kIciSQlYEM.plex"]');s.setItem('password','secret');s.setItem('deck.countdown','running');
const raw=P.encode(s);assert(!raw.includes('secret'));assert(!raw.includes('countdown'));const values=P.parse(raw),target=storage();P.apply(target,values);assert.equal(target.getItem('menuSound'),'false');assert.equal(target.getItem('favorites'),'["kIciSQlYEM.plex"]');
for(const bad of ['{', 'x'.repeat(65537),JSON.stringify({format:'other',version:1,values:{}}),JSON.stringify({format:'tizen-deck-preferences',version:2,values})])assert.throws(()=>P.parse(bad));
for(const value of [{password:'secret'},{performanceProfile:'fast'},{still:'no'},{favorites:'["duplicate","duplicate"]'},{inputNames:'{"__proto__":"bad"}'},{inputNames:'{"HDMI:1":17}'}])assert.throws(()=>P.apply(target,value));
const before=Array.from(target.data);let n=0;const set=target.setItem;target.setItem=(k,v)=>{if(++n===2)throw Error('quota');set(k,v);};assert.throws(()=>P.apply(target,{menuSound:'true',still:'true'}),/wiederhergestellt/);assert.deepEqual(Array.from(target.data).sort(),before.sort());
console.log('Preferences: validated allowlist, credential exclusion, roundtrip and transactional rollback passed');
