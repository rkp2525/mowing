#!/usr/bin/env node
const assert=require('node:assert/strict');
const M=require('./load.js'),dt=1/120,N=M.GRASS_SUBDIV,count=N*N;
let checks=0;
function lawn(tool='scythe'){
 const s=M.Sim.create(0,{upgrades:{}},tool);s.type=new Uint8Array(s.type.length).fill(M.T.GRASS);s.ents=[];
 s.grass.fill(1);s.subGrass.fill(1);s.subRemaining.fill(count);s.remaining=s.total=s.grass.length;
 s.p.x=15.5;s.p.y=15.5;s.p.heading=0;s.p.aimHeading=0;return s;
}
const input=(extra={})=>({mx:0,my:0,act:false,...extra});
function run(s,n,inp){let ev=[];for(let i=0;i<n;i++)ev.push(...M.Sim.step(s,typeof inp==='function'?inp(i):inp,dt));return ev;}
function test(name,fn){fn();checks++;console.log('PASS '+name);}
test('Walking and obsolete auto flag never swing or mow',()=>{
 const s=lawn(),before=s.remaining;const ev=run(s,120,input({mx:1,auto:true}));assert.equal(s.remaining,before);assert.equal(ev.filter(e=>e.e==='swing').length,0);
});
test('One fresh press makes one swing; holding never repeats',()=>{
 const s=lawn();assert.equal(run(s,180,input({act:true})).filter(e=>e.e==='swing').length,1);
 run(s,1,input());assert.equal(run(s,1,input({act:true})).filter(e=>e.e==='swing').length,1);
});
test('Body faces movement in every direction despite opposite manual aim',()=>{
 for(const a of [0,Math.PI/4,Math.PI/2,3*Math.PI/4,Math.PI,-3*Math.PI/4,-Math.PI/2,-Math.PI/4,.371]){
  const s=lawn();run(s,12,input({mx:Math.cos(a),my:Math.sin(a),aim:a+Math.PI}));assert.ok(Math.abs(Math.atan2(Math.sin(s.p.heading-a),Math.cos(s.p.heading-a)))<1e-9);
 }
});
test('Releasing movement stops immediately without drifting',()=>{
 const s=lawn();run(s,60,input({mx:1}));const x=s.p.x,y=s.p.y;run(s,30,input());assert.equal(s.p.x,x);assert.equal(s.p.y,y);
});
test('Manual aim remains continuous and cannot redirect an ongoing swing',()=>{
 const s=lawn();run(s,1,input({act:true,aim:2.777}));assert.ok(Math.abs(s.sw.a0-2.777)<1e-9);run(s,12,input({aim:-1}));assert.ok(Math.abs(s.sw.a0-2.777)<1e-9);
});
test('Manual cut damages only flowers inside the committed sweep',()=>{
 const s=lawn(),a=.371,R=s.ts.width*.95;
 const flower=(angle,d)=>({t:'flower',alive:true,x:s.p.x+Math.cos(angle)*d,y:s.p.y+Math.sin(angle)*d});
 const front=flower(a,R*.8),side=flower(a+1.1,R*.8),back=flower(a+Math.PI,R*.8),far=flower(a,R+.5);s.ents=[front,side,back,far];
 run(s,1,input({act:true,aim:a}));run(s,55,input({aim:a}));assert.equal(front.alive,false);assert.ok(side.alive&&back.alive&&far.alive);
});
test('Smart aim finds grass without cutting a neighboring flower or rock',()=>{
 const s=lawn();s.ents=[{t:'flower',x:s.p.x+1.1,y:s.p.y+.4,alive:true},{t:'rock',x:s.p.x+1.3,y:s.p.y-.5,alive:true,cd:0}];
 const before=s.remaining;run(s,1,input({act:true}));run(s,55,input());assert.ok(s.remaining<before);assert.equal(s.flowersLost,0);assert.equal(s.rockHits,0);
});
test('An assisted swing stops safely if walking brings a flower into reach',()=>{
 const s=lawn();run(s,1,input({act:true}));assert.ok(s.sw);s.ents=[{t:'flower',x:s.p.x+Math.cos(s.sw.a0),y:s.p.y+Math.sin(s.sw.a0),alive:true}];
 run(s,30,input({mx:1}));assert.equal(s.flowersLost,0);
});
test('Smart aim can trim a last small sample without choosing an empty sweep',()=>{
 const s=lawn();s.grass.fill(0);s.subGrass.fill(0);s.subRemaining.fill(0);s.remaining=s.total=1/count;
 const i=15*s.W+16,k=i*count+3*N+3;s.grass[i]=1;s.subGrass[k]=1;s.subRemaining[i]=1;s.p.heading=Math.PI;
 for(let tries=0;tries<6&&s.remaining;tries++){run(s,1,input({act:true}));run(s,60,input());}
 assert.equal(s.remaining,0);assert.equal(M.Sim.coverage(s),1);
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
 const s=M.Sim.create(1,{upgrades:{}},'scythe'),tree=s.ents.find(e=>e.t==='tree'),x=Math.floor(tree.x),y=Math.floor(tree.y),i=(y+1)*s.W+x;
 assert.equal(s.type[i],M.T.GRASS);assert.ok(s.grass[i]>0);assert.ok(!M.Sim.collides(s,tree.x,tree.y+1.1,s.ts.r));assert.ok(M.Sim.collides(s,tree.x,tree.y,s.ts.r));
 s.p.x=tree.x;s.p.y=tree.y+1.2;s.p.heading=-Math.PI/2;s.p.aimHeading=-Math.PI/2;
 const before=s.subRemaining[i];for(let n=0;n<4;n++){run(s,1,input({act:true}));run(s,60,input());}
 assert.ok(s.subRemaining[i]<before,'grass below trunk must actually cut');
});
test('All ten totals exclude protected beds and match the fine mowing samples',()=>{
 for(let l=0;l<10;l++){
  const s=M.Sim.create(l,{upgrades:{}},'scythe');let area=0;
  for(let i=0;i<s.grass.length;i++){area+=s.subRemaining[i]/count;if(s.protected[i]||s.type[i]===M.T.TREE)assert.equal(s.subRemaining[i],0);}
  assert.equal(area,s.total);assert.equal(s.remaining,s.total);
  for(const e of s.ents)if(e.t==='flower'||e.t==='rock')assert.equal(s.grass[Math.floor(e.y)*s.W+Math.floor(e.x)],0);
 }
});
console.log(checks+' control, safety, deck-width, tree and coverage checks passed.');
