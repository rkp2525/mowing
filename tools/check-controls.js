#!/usr/bin/env node
const assert=require('node:assert/strict');
const M=require('./load.js'),dt=1/120,N=M.GRASS_SUBDIV,count=N*N;
let checks=0;
function lawn(tool='reel'){
 const s=M.Sim.create(0,{upgrades:{}},tool);s.type=new Uint8Array(s.type.length).fill(M.T.GRASS);s.ents=[];
 s.grass.fill(1);s.subGrass.fill(1);s.subRemaining.fill(count);s.remaining=s.total=s.grass.length;
 s.p.x=15.5;s.p.y=15.5;s.p.heading=0;s.p.aimHeading=0;return s;
}
const input=(extra={})=>({mx:0,my:0,act:false,...extra});
function run(s,n,inp){let ev=[];for(let i=0;i<n;i++)ev.push(...M.Sim.step(s,typeof inp==='function'?inp(i):inp,dt));return ev;}
function test(name,fn){fn();checks++;console.log('PASS '+name);}
test('Moving cuts with every mower; retired cut controls do not swing',()=>{
 for(const tool of M.TOOL_ORDER){
  const s=lawn(tool),before=s.remaining,ev=run(s,120,input({mx:1,act:true,snip:true,hold:true}));
  assert.ok(s.remaining<before);assert.ok(!s.sw);assert.ok(!ev.some(e=>e.e==='swing'||e.e==='snip'));
 }
});
test('Mowers face travel independently of obsolete manual aim',()=>{
 for(const a of [0,Math.PI/4,Math.PI/2,Math.PI,-Math.PI/2,.371]){
  const s=lawn();run(s,120,input({mx:Math.cos(a),my:Math.sin(a),aim:a+Math.PI}));
  assert.ok(Math.abs(Math.atan2(Math.sin(s.p.heading-a),Math.cos(s.p.heading-a)))<1e-9);
 }
});
test('Releasing movement brings the mower to rest',()=>{
 const s=lawn();run(s,60,input({mx:1}));run(s,30,input());
 const x=s.p.x,y=s.p.y;run(s,30,input());assert.equal(s.p.x,x);assert.equal(s.p.y,y);assert.equal(s.p.speed,0);
});
test('Every mower makes an immediate right-angle turn without drifting along the old direction',()=>{
 for(const tool of M.TOOL_ORDER)for(const step of [1/30,1/60,1/120]){
  const s=lawn(tool);s.p.heading=-Math.PI/2;
  for(let i=0;i<30;i++)M.Sim.step(s,input({my:-1}),step);
  const x=s.p.x,y=s.p.y;
  M.Sim.step(s,input({mx:1}),step);
  assert.ok(s.p.x>x,tool+' should move right immediately');
  assert.equal(s.p.y,y,tool+' should not keep moving vertically during a right turn');
  assert.equal(s.p.heading,0);
 }
});
test('Releasing a mower stops at the stripe endpoint immediately',()=>{
 for(const tool of M.TOOL_ORDER){
  const s=lawn(tool);run(s,120,input({mx:1}));const x=s.p.x,y=s.p.y;
  run(s,1,input());assert.equal(s.p.x,x);assert.equal(s.p.y,y);assert.equal(s.p.speed,0);
 }
});
test('Line assist straightens small deviations while allowing deliberate diagonals',()=>{
 for(const tool of M.TOOL_ORDER){
  const s=lawn(tool);run(s,60,input({mx:1,my:.08}));assert.equal(s.p.y,15.5);assert.equal(s.p.heading,0);
  const x=s.p.x,y=s.p.y;run(s,10,input({mx:1,my:1}));assert.ok(s.p.x>x&&s.p.y>y);assert.equal(s.p.heading,Math.PI/4);
 }
});
test('Smooth turning remains available when easy steering is disabled',()=>{
 const s=lawn();s.save.easySteering=false;s.p.heading=Math.PI/2;run(s,30,input({my:1}));const y=s.p.y;
 run(s,1,input({mx:1}));assert.ok(s.p.y>y);assert.ok(s.p.heading>0);
});
test('Push mower cuts only its physical width at sub-cell precision',()=>{
 for(const tool of ['reel','gas']){
  const s=lawn(tool);s.p.heading=0;run(s,60,input({mx:1}));const half=s.ts.width/2;
  let removed=0;
  for(let i=0;i<s.grass.length;i++)for(let k=0;k<count;k++)if(!s.subGrass[i*count+k]){
   const y=Math.floor(i/s.W)+(Math.floor(k/N)+.5)/N;
   assert.ok(Math.abs(y-15.5)<=half+1e-9,'cut sample lies beyond deck width');removed++;
  }
  assert.ok(removed>0);
 }
});
test('Trees block only the trunk and surrounding grass is mowable',()=>{
 const s=M.Sim.create(1,{upgrades:{}},'reel'),tree=s.ents.find(e=>e.t==='tree'),x=Math.floor(tree.x),y=Math.floor(tree.y),i=(y+1)*s.W+x;
 assert.equal(s.type[i],M.T.GRASS);assert.ok(s.grass[i]>0);assert.ok(!M.Sim.collides(s,tree.x,tree.y+1.1,s.ts.r));assert.ok(M.Sim.collides(s,tree.x,tree.y,s.ts.r));
 s.p.x=tree.x;s.p.y=tree.y+1.2;s.p.heading=-Math.PI/2;s.p.aimHeading=-Math.PI/2;
 const before=s.subRemaining[i];run(s,10,input({my:-.2}));
 assert.ok(s.subRemaining[i]<before,'grass below trunk must actually cut');
});
test('All ten totals exclude protected beds and match the fine mowing samples',()=>{
 for(let l=0;l<10;l++){
  const s=M.Sim.create(l,{upgrades:{}},'reel');let area=0;
  for(let i=0;i<s.grass.length;i++){area+=s.subRemaining[i]/count;if(s.protected[i]||s.type[i]===M.T.TREE)assert.equal(s.subRemaining[i],0);}
  assert.equal(area,s.total);assert.equal(s.remaining,s.total);
  for(const e of s.ents)if(e.t==='flower'||e.t==='rock')assert.equal(s.grass[Math.floor(e.y)*s.W+Math.floor(e.x)],0);
 }
});
console.log(checks+' control, safety, deck-width, tree and coverage checks passed.');
