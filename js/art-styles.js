/* Two visual presentations of the same simulation. No game state is mutated here.
   Fine Pixel keeps the established landscape. Realism uses its own complete renderer. */
(function () {
  'use strict';
  const M = window.MOW, C = M.CELL, TAU = Math.PI * 2;
  const base = new URL('../assets/art/', document.currentScript.src);
  const images = new Map(), pending = new Map(), cache = new Map();
  const packs = {
    pixel: ['pixel-character', 'pixel-truck', 'pixel-equipment'],
    realism: ['realism-character', 'realism-truck', 'realism-equipment', 'realism-grass', 'realism-cut', 'realism-materials', 'realism-nature']
  };
  let active = 'pixel', requested = 'pixel', ticket = 0, scale = 0;
  function load(id) {
    if (images.has(id)) return Promise.resolve(images.get(id));
    if (pending.has(id)) return pending.get(id);
    const job = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { images.set(id, img); resolve(img); };
      img.onerror = () => { pending.delete(id); reject(new Error('Could not load ' + id)); };
      img.src = new URL(id + '.png', base).href;
    });
    pending.set(id, job); return job;
  }
  async function setStyle(id) {
    id = id === 'realism' ? 'realism' : 'pixel';
    const token = ++ticket; requested = id;
    await Promise.all(packs[id].map(load));
    if (token !== ticket) return false;
    active = id; cache.clear(); return true;
  }
  function ready(id) { return packs[id].every(x => images.has(x)); }
  function rng(seed) { let n = ((seed + 1) * 2654435761) >>> 0; return () => { n ^= n << 13; n ^= n >>> 17; n ^= n << 5; return (n >>> 0) / 4294967296; }; }
  function ellipse(g,x,y,rx,ry,color) { g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fill(); }
  function line(g,x,y,X,Y,color,width) { g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.lineTo(X,Y);g.stroke(); }
  function rect(g,x,y,w,h,color) { g.fillStyle=color;g.fillRect(x,y,w,h); }
  function shadow(g,x,y,rx,ry,alpha) {
    g.save();g.translate(x,y);g.scale(rx,ry);
    const gr=g.createRadialGradient(0,0,0,0,0,1);gr.addColorStop(0,'rgba(23,35,23,'+alpha+')');gr.addColorStop(1,'rgba(23,35,23,0)');g.fillStyle=gr;g.fillRect(-1,-1,2,2);g.restore();
  }
  function frame(g,img,cols,rows,col,row,x,y,w,h,ax=.5,ay=.9) {
    const sw=img.naturalWidth/cols,sh=img.naturalHeight/rows;
    g.drawImage(img,col*sw,row*sh,sw,sh,x-w*ax,y-h*ay,w,h);
  }
  function facing(h) { return ((Math.round(h/(Math.PI/4))%8)+8)%8; }
  /* garden trimmers (hand shears): two crossed blades, red-orange ring handles, snipping open/closed */
  function drawTrimmers(g,s,t) {
    const p=s.p,sw=s.sw,plan=sw||s.aimPlan,aim=plan?(sw?sw.a0:plan.angle):(s.tool==='trimmer'?p.heading:(p.aimHeading??p.heading));
    const half=.3,u=sw?Math.min(1,sw.t/sw.dur):0,a=sw?aim-half+2*half*u:aim;
    const open=sw?.36*(1-u)*(1-u)+.02:.2;            // blades snap shut over the swing, rest slightly open
    const hand=[p.x*C+Math.cos(p.heading)*1.1,p.y*C-4.8];
    const px=3.4,L=8.2,unit=s.tool==='trimmer'?.55:1;
    g.save();g.translate(hand[0],hand[1]);g.rotate(a);g.scale(unit,unit);
    g.fillStyle='rgba(24,30,20,.16)';g.beginPath();g.ellipse(px+L*.45+.3,.7,L*.55,.9,0,0,TAU);g.fill();
    for(const side of [1,-1]){
      g.save();g.translate(px,0);g.rotate(side*open);
      // handle bar + ring, behind the pivot
      g.strokeStyle='#8f3a1c';g.lineWidth=.62;g.lineCap='round';g.beginPath();g.moveTo(0,0);g.lineTo(-px+.6,side*.15);g.stroke();
      g.strokeStyle='#e0612f';g.lineWidth=.42;g.beginPath();g.moveTo(0,0);g.lineTo(-px+.6,side*.15);g.stroke();
      g.strokeStyle='#8f3a1c';g.lineWidth=.62;g.beginPath();g.ellipse(-px-.35,side*.55,1.1,.75,0,0,TAU);g.stroke();
      g.strokeStyle='#e0612f';g.lineWidth=.38;g.beginPath();g.ellipse(-px-.35,side*.55,1.1,.75,0,0,TAU);g.stroke();
      // blade: slim leaf from the pivot to a fine tip, on the opposite side of the cross
      g.rotate(-side*open*2);
      g.beginPath();g.moveTo(-.5,-.5*side);g.quadraticCurveTo(L*.55,-.75*side,L,0);g.quadraticCurveTo(L*.5,.18*side,-.5,.4*side);g.closePath();
      g.fillStyle=side>0?'#e4eaef':'#bcc6cf';g.fill();g.strokeStyle='rgba(40,48,52,.5)';g.lineWidth=.09;g.stroke();
      g.restore();
    }
    g.fillStyle='#6c747d';g.beginPath();g.arc(px,0,.32,0,TAU);g.fill();   // pivot screw
    g.restore();
    if(sw&&u>.55){g.fillStyle='rgba(190,240,120,.85)';const tip=[hand[0]+Math.cos(a)*(px+L)*unit,hand[1]+Math.sin(a)*(px+L)*unit];for(let i=0;i<3;i++){g.beginPath();g.arc(tip[0]+(i-1)*.7,tip[1]+((u*20+i*1.7)%1.6),.26,0,TAU);g.fill();}}
  }
  function drawScythe(g,s,t) {
    if(s.sw?s.sw.snip:s.trim)return drawTrimmers(g,s,t);
    const p=s.p,sw=s.sw,sp=M.SCYTHE;
    const plan=sw||s.aimPlan,half=plan&&plan.halfArc!==undefined?plan.halfArc:sp.halfArc;
    const aim=plan?(sw?sw.a0:plan.angle):(p.aimHeading??p.heading);
    const a=sw?aim-half+2*half*Math.min(1,sw.t/(sw.dur||sp.duration)):aim+half;
    const x=p.x*C,y=p.y*C,R=(plan&&plan.reach||s.ts.width*.95)*C;
    const cx=Math.cos(a),cy=Math.sin(a),tx=-cy,ty=cx;
    const end=[x+cx*(R-.5),y+cy*(R-.5)];
    const hand=[x+Math.cos(p.heading)*1.1,y-4.8];
    line(g,hand[0]+.12,hand[1]+.18,end[0]+.12,end[1]+.18,'rgba(24,30,20,.18)',.58);
    line(g,hand[0],hand[1],end[0],end[1],'#806244',.48);
    line(g,hand[0]-.08,hand[1]-.08,end[0]-.08,end[1]-.08,'#c5a27b',.12);
    g.beginPath();g.moveTo(end[0]-cx*.8,end[1]-cy*.8);
    g.quadraticCurveTo(end[0]+tx*2.1,end[1]+ty*2.1,end[0]+tx*3.8-cx*1.9,end[1]+ty*3.8-cy*1.9);
    g.quadraticCurveTo(end[0]+tx*1.2-cx*.9,end[1]+ty*1.2-cy*.9,end[0]-cx*.8,end[1]-cy*.8);
    g.fillStyle='#b8c0b9';g.fill();
    line(g,end[0],end[1],end[0]+tx*2.1-cx*.5,end[1]+ty*2.1-cy*.5,'#e1e3ce',.14);
  }
  function drawPlayer(g,s,t) {
    if (!ready(active)) return true;
    const p=s.p,x=p.x*C,y=p.y*C,h=p.heading,dir=facing(h),tool=s.ts.id;
    g.save();g.imageSmoothingEnabled=active!=='pixel';
    shadow(g,x+.6,y+.7,2.8,1.0,.30);
    const image=images.get(active+'-character');
    const row=tool==='ride'?3:s.moving?1+(Math.floor(p.step*1.5)&1):0;
    const behind=s.sw?Math.sin(s.sw.a0)<0:Math.sin((s.aimPlan?s.aimPlan.angle:(p.aimHeading??h))+(s.aimPlan?s.aimPlan.halfArc:M.SCYTHE.halfArc))<0;
    if(tool==='scythe'&&behind)drawScythe(g,s,t);
    if(tool!=='scythe' && tool!=='fertilizer' && tool!=='trimmer'){
      const gear=images.get(active+'-equipment'),r=tool==='reel'?0:tool==='gas'?1:2;
      const reach=tool==='ride'?0:(s.ts.r+.35)*C;
      const deckRatio={pixel:{reel:.54296875,gas:.47265625,ride:.76},realism:{reel:.4921875,gas:.421875,ride:.76}};
      const size=s.ts.width*C/deckRatio[active][tool],cx=x+Math.cos(h)*reach,cy=y+Math.sin(h)*reach;
      const residual=s.precision?Math.atan2(Math.sin(h-dir*Math.PI/4),Math.cos(h-dir*Math.PI/4)):0;
      if(tool==='ride') { g.save();g.translate(cx,cy);g.rotate(residual);frame(g,gear,8,3,dir,r,0,0,size,size,.5,.61);g.restore(); }
      else {
        // Use the rendered chassis, then attach a real handle to the operator's
        // hands. It follows the exact heading instead of an atlas approximation.
        const sw=gear.naturalWidth/8,sh=gear.naturalHeight/3;
        g.save();g.translate(cx,cy);g.rotate(residual);g.drawImage(gear,dir*sw,(r+.53)*sh,sw,sh*.47,-size/2,-size*.235,size,size*.47);g.restore();
        const hx=Math.cos(h),hy=Math.sin(h),px=-hy,py=hx;
        const grip=[x+hx*1.1,y-5.8+hy*.5];
        for(const sign of [-1,1]){
          const ax=cx-hx*1.8+px*sign*1.4,ay=cy-hy*1.8+py*sign*1.4;
          const bx=grip[0]+px*sign*.8,by=grip[1]+py*sign*.8;
          line(g,ax,ay,bx,by,tool==='reel'?'#7b795a':'#676e66',.30);
          line(g,ax-.05,ay-.05,bx-.05,by-.05,'#b6b5a0',.09);
        }
        line(g,grip[0]-px*.9,grip[1]-py*.9,grip[0]+px*.9,grip[1]+py*.9,'#736249',.35);
      }
    }
    const bob=s.moving&&tool!=='ride'?Math.abs(Math.sin(p.step*2.2))*.22:0;
    const rider=tool==='ride';
    frame(g,image,8,4,dir,row,x-(rider?Math.cos(h)*3.2:0),y-bob-(rider?4+Math.sin(h)*1.8:0),14,14,.5,rider?.68:.90);
    if(tool==='scythe'&&!behind)drawScythe(g,s,t);
    if(tool==='trimmer')drawTrimmers(g,s,t);
    if(tool==='fertilizer'){ rect(g,x+1.4,y-4.8,2.8,3.7,'#d7c392'); line(g,x+1.6,y-4.5,x+4,y-4.5,'#ece0b4',.3); ellipse(g,x+2.8,y-2.8,.6,.85,'#73965b'); }
    if(s.stall>0){ellipse(g,x,y-13,.5,.5,'#f4cf66');line(g,x,y-16,x,y-14,'#f4cf66',.7);}
    if(s.tired){ellipse(g,x+2.2,y-10,.35,.65,'#9bc9cf');}
    g.restore();return true;
  }
  function drawTruck(g,s) {
    if(!ready(active))return true;
    const sp=s.lv.spawn;g.save();g.imageSmoothingEnabled=active!=='pixel';
    const image=images.get(active+'-truck'),w=34,h=w*image.naturalHeight/image.naturalWidth;
    shadow(g,sp.x*C+16,sp.y*C+1,14,4,.22);
    g.drawImage(image,sp.x*C+16-w/2,sp.y*C-3-h*.64,w,h);
    g.restore();return true;
  }
  function tile(kind,v,P) {
    const key=kind+':'+v+':'+P;
    if(cache.has(key))return cache.get(key);
    const cv=document.createElement('canvas');cv.width=P;cv.height=P;const g=cv.getContext('2d'),r=rng(v*47+kind*101);
    const mats=images.get('realism-materials');
    const material=(col,row)=>frame(g,mats,3,2,col,row,P/2,P/2,P,P,.5,.5);
    switch(kind){
      case 0:case 11:case 9:case 12:case 13:{
        const cut=kind===12||kind===13;
        const img=images.get(cut?'realism-cut':'realism-grass');
        const side=Math.min(img.naturalWidth,img.naturalHeight)/2;
        const x=(v%2)*side,y=(Math.floor(v/2)%2)*side;
        if (cut) {
          rect(g,0,0,P,P,kind===13?M.MOWN_COLORS.light:M.MOWN_COLORS.dark);
          g.globalAlpha = .12;
        }
        g.filter = cut ? 'saturate(.5) contrast(.7)' : 'saturate(.65) brightness(.94)';
        g.drawImage(img,cut?0:x,cut?0:y,side,side,0,0,P,P);
        g.globalAlpha = 1;
        g.filter = 'none';
        if(kind===0)rect(g,0,0,P,P,'rgba(19,42,26,.3)');


        break;
      }
      case 2:case 10:material(2,1);break;
      case 3:{
        material(0,0);
        rect(g,0,0,P,P,'rgba(209,197,164,'+(r()*.09)+')');
        break;
      }
      case 4:material(1,0);break;
      case 5:{
        material(2,0);
        rect(g,0,0,P,P*.10,'rgba(51,39,24,.28)');
        const door=(v&7)===3;
        rect(g,P*.24,P*(door?.18:.27),P*.52,P*(door?.82:.43),'#d8cdb4');
        rect(g,P*.29,P*(door?.22:.31),P*.42,P*(door?.78:.34),door?'#707d6b':'#7f9c9a');
        line(g,P*.5,P*.31,P*.5,P*.65,'#ddd6bb',P*.025);
        if(!door)line(g,P*.29,P*.48,P*.71,P*.48,'#ddd6bb',P*.025);
        else ellipse(g,P*.63,P*.61,P*.016,P*.016,'#bda16d');
        break;
      }
      case 6:case 7:material(0,1);break;
      case 8:material(1,1);break;
      default:rect(g,0,0,P,P,'#4f6341');
    }
    cache.set(key,cv);return cv;
  }
  function grass(v,P,thick,pattern) {
    const key='blades:'+v+':'+P+':'+thick+':'+pattern;if(cache.has(key))return cache.get(key);
    const top=Math.ceil(P*.40),pad=Math.ceil(P*.12),cv=document.createElement('canvas');
    cv.width=P+pad*2;cv.height=P+top;const g=cv.getContext('2d'),r=rng(v+811);
    const rows=pattern?Array.from({length:M.GRASS_SUBDIV},(_,i)=>parseInt(pattern.slice(i*2,i*2+2),16)):null;
    const stems=[];for(let i=0;i<(thick?90:64);i++)stems.push({x:pad+r()*P,y:top+r()*P,h:P*(.16+r()*(thick?.42:.28)),lean:(r()-.5)*P*.22});
    stems.sort((a,b)=>a.y-b.y);
    for(const b of stems){
      if(rows){const x=Math.floor((b.x-pad)/P*M.GRASS_SUBDIV),y=Math.floor((b.y-top)/P*M.GRASS_SUBDIV);if(!(rows[y]&(1<<x)))continue;}
      const w=P*(.006+r()*.010),gr=g.createLinearGradient(b.x,b.y,b.x+b.lean,b.y-b.h);
      gr.addColorStop(0,'#314b32');gr.addColorStop(.5,'#586e45');gr.addColorStop(1,r()>.7?'#9aaa7a':'#839568');
      g.fillStyle=gr;g.beginPath();g.moveTo(b.x-w,b.y);g.quadraticCurveTo(b.x+b.lean*.2,b.y-b.h*.55,b.x+b.lean,b.y-b.h);g.quadraticCurveTo(b.x+b.lean*.7,b.y-b.h*.4,b.x+w,b.y);g.fill();
    }
    cv._pad=pad;cv._top=top;cache.set(key,cv);if(cache.size>512)cache.delete(cache.keys().next().value);return cv;
  }
  function fence(g,f) {
    const len=f.length*C,x=f.x*C,y=f.y*C,vertical=f.vertical;
    const r=rng(f.x*51+f.y*17),n=Math.max(1,Math.ceil(len/16));
    shadow(g,x+(vertical?1:len/2),y+(vertical?len/2:1),vertical?1.2:len/2,vertical?len/2:1.5,.16);
    for(const lift of [2.6,1.1])line(g,x,y-lift,x+(vertical?0:len),y+(vertical?len:0)-lift,'#8d795b',.52);
    for(let i=0;i<=n;i++){
      const px=x+(vertical?0:len*i/n),py=y+(vertical?len*i/n:0);
      rect(g,px-.48,py-4.8,.96,4.9,'#8f7a5c');rect(g,px-.48,py-4.8,.38,4.9,'#baa284');
      line(g,px-.5,py-4.8,px+.5,py-4.8,'#d1b999',.25);
      if(!vertical&&i<n)for(let k=1;k<=4;k++){
        const bx=px+k*len/n/5;
        rect(g,bx-.23,py-3.6+r()*.15,.46,3.6,'#aa9271');line(g,bx-.23,py-3.5,bx-.23,py-.2,'#c4ad89',.09);
      }
    }
  }
  function nature(g,e,t,s) {
    const x=e.x*C,y=e.y*C,img=images.get('realism-nature');
    if(e.t==='tree'){
      const big=e.size===2,size=big?68:45;
      shadow(g,x+5,y+2,size*.4,size*.13,.27);
      g.save();if(s&&Math.hypot(s.p.x-e.x,s.p.y-e.y)<(big?5:3.3)&&s.p.y<e.y+1.3)g.globalAlpha*=.35;
      frame(g,img,4,2,big?1:0,0,x,y+2,size,size,.5,.91);g.restore();
    }else if(e.t==='flower'){
      for (const stem of e.stems || M.flowerStems(e)) {
        const X = stem.x * C, Y = stem.y * C;
        if (stem.clipped) { rect(g, X - .12, Y - .2, .24, .3, '#73925b'); continue; }
        const sway = Math.sin(t * 1.3 + X) * .05;
        frame(g,img,4,2,e.color%4,1,X+sway,Y+.28,13*M.FLOWER_SCALE,13*M.FLOWER_SCALE,.5,.91);
      }
    }else if(e.t==='rock')frame(g,img,4,2,2,0,x,y+1,13,13,.5,.91);
    else if(e.t==='gnome'){
      if(e.found)return;
      shadow(g,x,y,.9,.4,.3);ellipse(g,x,y-1.3,.65,1.2,'#7b877c');ellipse(g,x,y-2.5,.45,.6,'#c0b59b');
      g.fillStyle='#975443';g.beginPath();g.moveTo(x-.7,y-2.6);g.lineTo(x+.12,y-4.3);g.lineTo(x+.6,y-2.6);g.fill();
    }else if(e.t==='toy'&&!e.found){ellipse(g,x,y,1.15,.65,'#ba7250');ellipse(g,x-.2,y-.2,.7,.35,'#d4a17e');}
    else if(e.t==='sprinkler'){
      ellipse(g,x,y,.6,.4,'#7e8a83');line(g,x-1.2,y-.3,x+1.2,y-.3,'#b1b9b0',.3);
      if(e.on)for(let k=0;k<8;k++){const a=t*1.7+k*TAU/8;line(g,x+Math.cos(a),y+Math.sin(a),x+Math.cos(a)*C*2.2,y+Math.sin(a)*C*1.5,'rgba(202,222,210,.25)',.12);}
    }
  }
  function drawScene(g,s,cam,vw,vh,u,t,opts) {
    if(active!=='realism'||!ready('realism'))return false;
    const P=Math.max(10,Math.round(C*u));if(P!==scale){scale=P;cache.clear();}
    const ox=cam.x*u,oy=cam.y*u,k=C*u;
    g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=true;g.fillStyle='#344f35';g.fillRect(0,0,vw,vh);
    const x0=Math.max(0,Math.floor(cam.x/C)-1),y0=Math.max(0,Math.floor(cam.y/C)-2),x1=Math.min(s.W-1,Math.ceil((cam.x+vw/u)/C)+1),y1=Math.min(s.H-1,Math.ceil((cam.y+vh/u)/C)+2);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const i=y*s.W+x,kd=s.kind[i],v=s.vr[i];
      const dx=Math.round(x*k-ox),dy=Math.round(y*k-oy),w=Math.round((x+1)*k-ox)-dx+1,h=Math.round((y+1)*k-oy)-dy+1;
      const partial=kd===11&&s.grass[i]>0&&s.subRemaining[i]<M.GRASS_SUBDIV**2;
      if (kd===11 && (s.grass[i]===0 || partial)) {
        M.Render.drawMownTile(g,s,i,dx,dy,w,h,d=>tile(M.stripeLight(d)?13:12,0,P));
        if (partial) {
          const pattern=M.Sim.grassPattern(s,i),N=M.GRASS_SUBDIV;
          g.save();g.beginPath();for(let yy=0;yy<N;yy++){const bits=parseInt(pattern.slice(yy*2,yy*2+2),16);for(let xx=0;xx<N;xx++)if(bits&(1<<xx))g.rect(dx+xx*w/N,dy+yy*h/N,w/N+.3,h/N+.3);}g.clip();g.drawImage(tile(11,v&7,P),dx,dy,w,h);g.restore();
        }
      } else g.drawImage(tile(kd,v&7,P),dx,dy,w,h);
    }
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const i=y*s.W+x;if(s.kind[i]!==11||!s.grass[i])continue;
      const tuft=grass(s.vr[i]&7,P,s.grass[i]>1,M.Sim.grassPattern(s,i));g.drawImage(tuft,Math.round(x*k-ox)-tuft._pad,Math.round(y*k-oy)-tuft._top);
    }
    g.setTransform(u,0,0,u,-ox,-oy);
    M.Groundskeeping.draw(g,s);
    for(const f of s.fences||[])fence(g,f);
    if(opts.footprint!==false)M.Render.drawFootprint(g,s);
    drawTruck(g,s);
    const sorted=s.ents.filter(e=>e.alive).map(e=>({y:e.y*C,e}));sorted.push({y:s.p.y*C,e:null});sorted.sort((a,b)=>a.y-b.y);
    for(const item of sorted){if(item.e)nature(g,item.e,t,s);else drawPlayer(g,s,t);}
    if(s.eyes&&s.remaining/s.total<.2)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(s.grass[y*s.W+x])ellipse(g,x*C+C/2,y*C+C/2,1.1,1.1,'rgba(236,220,128,.4)');
    M.Render.drawFx(g);g.setTransform(1,0,0,1,0,0);
    return true;
  }
  M.ArtStyles={setStyle,drawPlayer,drawTruck,drawScene,ready,get active(){return active;},get requested(){return requested;},get assets(){return [...images.keys()];}};
})();
