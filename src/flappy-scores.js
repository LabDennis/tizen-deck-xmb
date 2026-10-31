(function(root){'use strict';
var KEY='flappySmasnug.scores.v1';
function valid(row){return row&&typeof row.score==='number'&&isFinite(row.score)&&row.score>=0&&Math.floor(row.score)===row.score&&typeof row.at==='number'&&isFinite(row.at)&&row.at>=0&&row.at<=8640000000000000;}
function sorted(rows){return rows.filter(valid).sort(function(a,b){return b.score-a.score||b.at-a.at;}).slice(0,10).map(function(r){return {score:r.score,at:r.at};});}
function Scores(storage){this.storage=storage;this.rows=[];this.saved=true;try{var rows=JSON.parse(storage.getItem(KEY)||'[]');if(Array.isArray(rows))this.rows=sorted(rows);}catch(e){this.saved=false;}}
Scores.prototype.add=function(score,at){if(!valid({score:score,at:at}))return;this.rows=sorted(this.rows.concat([{score:score,at:at}]));try{this.storage.setItem(KEY,JSON.stringify(this.rows));this.saved=true;}catch(e){this.saved=false;}};
Scores.prototype.entries=function(){return this.rows.map(function(r){return {score:r.score,at:r.at};});};
if(typeof module!=='undefined'&&module.exports)module.exports=Scores;else root.FlappyScores=Scores;
})(this);
