const assert=require('node:assert/strict');
const Nav=require('../src/gamepad.js');
function pad(buttons=[],axes=[0,0],mapping='standard'){return {index:0,connected:true,mapping,axes,buttons:Array.from({length:17},(_,i)=>({pressed:buttons.includes(i),value:buttons.includes(i)?1:0}))};}
let n=new Nav();assert.deepEqual(n.read([pad([0])],0,'auto'),[13]);assert.deepEqual(n.read([pad([0])],1000,'auto'),[],'held confirm must not relaunch');n.read([pad()],1001,'auto');assert.deepEqual(n.read([pad([0])],1002,'auto'),[13]);
n=new Nav();assert.deepEqual(n.read([pad([], [.2,-.3])],0,'auto'),[],'stick deadzone');assert.deepEqual(n.read([pad([], [.8,0])],0,'auto'),[39]);assert.deepEqual(n.read([pad([], [.8,0])],200,'auto'),[]);assert.deepEqual(n.read([pad([], [.8,0])],400,'auto'),[39]);assert.deepEqual(n.read([pad([], [.8,0])],450,'auto'),[]);assert.deepEqual(n.read([pad([], [.8,0])],525,'auto'),[39]);
n=new Nav();assert.deepEqual(n.read([pad([14], [0,0],'')],0,'auto'),[],'unknown mapping must not guess');assert.deepEqual(n.read([pad([14], [0,0],'')],1,'ps3-legacy'),[13]);n.reset();assert.deepEqual(n.read([pad([13], [0,0],'')],2,'ps3-legacy'),[10009]);
n=new Nav();assert.deepEqual(n.read([null,pad([12])],0,'auto'),[38]);n.read([],1,'auto');assert.deepEqual(n.read([pad([12])],2,'auto'),[38],'reconnect resets hold');n.reset();assert.deepEqual(n.read([pad([1])],3,'auto'),[10009]);
console.log('Gamepad mapping, deadzone, repeat, action edges and reconnect tests passed');
