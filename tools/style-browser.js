/* Browser acceptance test: settings -> asset loading -> save -> reload -> both renderers. */
(async function () {
  const key='lawnkid.v1', report=document.createElement('pre');
  report.style.cssText='position:fixed;z-index:999;inset:80px 30px auto;padding:20px;background:#eee8d3;color:#274b35;font:16px/1.5 monospace;white-space:pre-wrap;border-radius:10px';
  document.body.append(report);const messages=[];
  const check=(value,label)=>{if(!value)throw new Error(label);messages.push('PASS '+label);report.textContent=messages.join('\n');};
  const wait=async fn=>{for(let i=0;i<300;i++){if(fn())return;await new Promise(r=>setTimeout(r,20));}throw new Error('Timed out waiting for artwork');};
  const restore=()=>{
    const old=JSON.parse(sessionStorage.getItem('lawnkid.style-test-original'));
    if(old===null)localStorage.removeItem(key);else localStorage.setItem(key,old);
    sessionStorage.removeItem('lawnkid.style-test-phase');sessionStorage.removeItem('lawnkid.style-test-original');
  };
  try{
    await wait(()=>MOW.ArtStyles.ready(MOW.ArtStyles.requested));
    const saved=()=>JSON.parse(localStorage.getItem(key));
    if(sessionStorage.getItem('lawnkid.style-test-phase')==='reload'){
      check(MOW.ArtStyles.active==='realism','chosen art style survives reload');
      check(saved().money===137 && saved().stars.join(',')==='3,2' && saved().upgrades.boots===1,'money, stars and upgrades survive style changes');
      document.querySelector('#b-set').click();
      check(document.querySelector('input[value="realism"]').checked,'settings displays saved style');
      check(document.querySelector('#s-guide').checked&&saved().scytheGuide===true,'optional guide preference survives reload');
      const cv=document.createElement('canvas');cv.width=800;cv.height=500;let count=0;
      for(const style of ['pixel','realism']){
        await MOW.ArtStyles.setStyle(style);
        for(let l=0;l<10;l++)for(const tool of MOW.TOOL_ORDER){
          const s=MOW.Sim.create(l,{upgrades:{}},tool);MOW.Render.bake(s);
          const before=JSON.stringify({p:s.p,grass:[...s.grass],type:[...s.type],ents:s.ents});
          const u=Math.min(cv.width/(s.W*MOW.CELL),cv.height/(s.H*MOW.CELL));
          MOW.Render.draw(cv.getContext('2d'),s,{x:0,y:0},cv.width,cv.height,u,1,{});
          if(before!==JSON.stringify({p:s.p,grass:[...s.grass],type:[...s.type],ents:s.ents}))throw new Error('Renderer changed gameplay state');
          count++;
        }
      }
      await MOW.ArtStyles.setStyle('realism');
      check(count===80,'80 lawn/tool/style combinations render without changing simulation state');
      report.textContent+='\n\nDUAL ART STYLE CHECK PASSED';document.body.dataset.result='PASS';restore();
    }else{
      document.querySelector('#b-set').click();
      check(!document.querySelector('#s-guide').checked,'scythe guide defaults off for existing saves');
      document.querySelector('#s-guide').click();
      const pick=id=>document.querySelector('input[name="art-style"][value="'+id+'"]').click();
      pick('realism');await wait(()=>saved().artStyle==='realism');check(MOW.ArtStyles.active==='realism','settings loads and applies realism');
      pick('pixel');await wait(()=>saved().artStyle==='pixel');check(MOW.ArtStyles.active==='pixel','settings switches back to fine pixel');
      pick('realism');pick('pixel');await wait(()=>MOW.ArtStyles.active==='pixel'&&saved().artStyle==='pixel');
      check(saved().money===137 && saved().stars.join(',')==='3,2','rapid switches preserve progress');
      pick('realism');await wait(()=>saved().artStyle==='realism');
      sessionStorage.setItem('lawnkid.style-test-phase','reload');location.reload();
    }
  }catch(e){report.textContent+='\nFAIL '+e.stack;document.body.dataset.result='FAIL';restore();}
})();
