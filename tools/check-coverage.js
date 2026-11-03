#!/usr/bin/env node
// Reachability audit through actual safe swings. Repositions the test operator
// around each patch; this checks contracts/geometry, not bot pathfinding.
const assert=require('node:assert/strict'),M=require('./load.js');
const levels=process.argv.includes('--all')?M.LEVELS.map((_,i)=>i):[0,1];
for(const l of levels){
 const s=M.Sim.create(l,{upgrades:{}},'scythe'),N=M.GRASS_SUBDIV;
 function swing(x,y){
  if(M.Sim.collides(s,x,y,s.ts.r))return;
  s.p.x=x;s.p.y=y;s.p.speed=0;s.aimPlan=null;s.aimTimer=0;s.stamina=s.ts.staminaMax;s.tired=false;
  M.Sim.step(s,{mx:0,my:0,act:true},1/30);
  for(let n=0;n<14;n++)M.Sim.step(s,{mx:0,my:0,act:false},1/30);
 }
 for(let pass=0;pass<3&&s.remaining;pass++){
  const pending=[];for(let i=0;i<s.grass.length;i++)if(s.grass[i])pending.push(i);
  for(const i of pending){
   const x=i%s.W+.5,y=Math.floor(i/s.W)+.5;
   for(const [dx,dy]of pass===0?[[0,0]]:[[0,0],[.2,0],[-.2,0],[0,.2],[0,-.2]]){
    if(!s.grass[i])break;for(let n=0;n<3&&s.grass[i];n++)swing(x+dx,y+dy);
   }
  }
 }
 console.log(`Level ${l+1}: ${(M.Sim.coverage(s)*100).toFixed(4)}%, ${s.remaining} remaining, ${s.flowersLost} flowers lost, ${s.rockHits} rock hits`);
 if(s.remaining){const left=[];for(let i=0;i<s.grass.length;i++)if(s.grass[i])left.push({x:i%s.W-M.MARGIN,y:Math.floor(i/s.W)-M.MARGIN,samples:s.subRemaining[i]});console.log('Remaining patches:',JSON.stringify(left.slice(0,12)));}
 assert.equal(s.remaining,0,'All required grass must be safely cuttable');assert.equal(M.Sim.coverage(s),1);assert.equal(s.flowersLost,0);assert.equal(s.rockHits,0);
}
