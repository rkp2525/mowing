// Standalone browser acceptance test for the real input handlers and guide setting.
(function(){
 const output=document.createElement('pre');output.style.cssText='position:fixed;inset:100px 25px auto;z-index:99;padding:20px;background:#f2ecd8;color:#294832;white-space:pre-wrap;font:16px/1.5 monospace;border-radius:12px';document.body.append(output);
 const results=[];const check=(ok,name)=>{if(!ok)throw Error(name);results.push('PASS '+name);output.textContent=results.join('\n');};
 const frames=n=>{for(let i=0;i<n;i++)MOW.Sim.step(window.__G.s,window.__readInput(1/60),1/60);};
 const key=(type,code,repeat=false)=>window.dispatchEvent(new KeyboardEvent(type,{code,repeat,bubbles:true}));
 try{
  const s=window.__G.s,N=MOW.GRASS_SUBDIV**2,cv=document.querySelector('#game');
  s.type=new Uint8Array(s.type.length).fill(MOW.T.GRASS);s.grass.fill(1);s.subGrass.fill(1);s.subRemaining.fill(N);s.remaining=s.total=s.grass.length;s.ents=[];s.p.x=15.5;s.p.y=15.5;s.p.heading=0;s.p.aimHeading=0;
  const remaining=s.remaining,x=s.p.x;
  key('keydown','KeyD');frames(40);key('keyup','KeyD');frames(2);
  check(s.p.x>x&&s.remaining===remaining&&!s.sw,'walking moves without auto-swing');
  const stopX=s.p.x,stopY=s.p.y;frames(12);check(s.p.x===stopX&&s.p.y===stopY,'release stops without drift');
  const heading=s.p.heading;
  cv.dispatchEvent(new PointerEvent('pointermove',{pointerType:'mouse',clientX:1100,clientY:210,bubbles:true}));frames(3);
  check(s.p.heading===heading,'ordinary cursor motion does not turn the body');
  key('keydown','KeyA');frames(18);key('keyup','KeyA');frames(2);
  check(Math.abs(Math.abs(s.p.heading)-Math.PI)<1e-8,'body faces left when walking left');
  key('keydown','KeyW');frames(18);key('keyup','KeyW');frames(2);check(Math.abs(s.p.heading+Math.PI/2)<1e-8,'body faces up when walking up');
  key('keydown','Space');frames(30);const first=s.remaining;
  for(let i=0;i<4;i++){key('keydown','Space',true);frames(12);}
  check(first<remaining&&s.remaining===first&&!s.sw,'Space swings once; holding and key-repeat never repeat');key('keyup','Space');
  // Synthetic pointer events have no native OS pointer to capture. Stub capture
  // only on this isolated test canvas; real-game capture is left untouched.
  const capture=cv.setPointerCapture;cv.setPointerCapture=()=>{};
  const before=s.p.x;
  cv.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'mouse',pointerId:1,button:0,buttons:1,clientX:10,clientY:400,bubbles:true}));
  const steering=window.__readInput(1/60);frames(20);
  check(s.p.x<before&&Math.abs(Math.atan2(Math.sin(s.p.heading-Math.atan2(steering.my,steering.mx)),Math.cos(s.p.heading-Math.atan2(steering.my,steering.mx))))<.3,'trackpad click-and-hold steers, faces and walks');
  const noCut=s.remaining;frames(12);check(s.remaining===noCut,'holding a trackpad click does not cut');
  cv.dispatchEvent(new PointerEvent('pointerup',{pointerType:'mouse',pointerId:1,button:0,buttons:0,bubbles:true}));frames(1);const X=s.p.x,Y=s.p.y;frames(12);check(s.p.x===X&&s.p.y===Y,'releasing the trackpad stops walking');cv.setPointerCapture=capture;
  check(s.save.scytheGuide===false&&s.save.aimAssist===true,'guide defaults off; smart aim defaults on');
  const ctx=document.createElement('canvas').getContext('2d');let strokes=0;const stroke=ctx.stroke.bind(ctx);ctx.stroke=()=>{strokes++;stroke()};
  s.stall=0;MOW.Render.drawFootprint(ctx,s);check(strokes===0,'hidden scythe guide does not render');
  document.querySelector('#hud-pause').click();const guide=document.querySelector('#s-guide');guide.click();
  MOW.Render.drawFootprint(ctx,s);check(s.save.scytheGuide===true&&strokes>0,'player can enable the guide from Pause');
  output.dataset.result='PASS';output.textContent+='\n\nBROWSER CONTROL CHECK PASSED';
 }catch(e){output.dataset.result='FAIL';output.textContent+='\nFAIL '+e.stack;}
})();
