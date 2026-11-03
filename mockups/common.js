/* Shared helpers for the art-direction mockup sheet. Each style file registers:
   window.STYLES.push({ id:'A', name:'…', blurb:'…', draw(ctx, MK){ … } })
   draw() paints ONE full sheet onto a 1000x700 logical canvas (already scaled for DPR, backdrop already painted). */
window.STYLES = window.STYLES || [];
window.MK = (function () {
  const MK = { W: 1000, H: 700, cell: 48, TAU: Math.PI * 2 };
  MK.hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  MK.rng = (seed) => { let s = ((seed * 2654435761) >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
  MK.rr = (g, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  MK.lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((s) => gr.addColorStop(s[0], s[1])); return gr; };
  MK.blade = (g, bx, by, hgt, lean, w, c0, c1, c2) => {
    g.fillStyle = MK.lin(g, bx, by, bx + lean, by - hgt, [[0, c0], [0.6, c1], [1, c2]]);
    g.beginPath(); g.moveTo(bx - w, by); g.quadraticCurveTo(bx + lean * 0.2, by - hgt * 0.6, bx + lean, by - hgt);
    g.quadraticCurveTo(bx + lean * 0.5 + w * 0.4, by - hgt * 0.5, bx + w, by); g.closePath(); g.fill();
  };
  /* mown-lawn backdrop with stripes + a strip of tall grass at the bottom (same look as the game's grass) */
  MK.backdrop = (g) => {
    const { W, H } = MK;
    for (let y = 0; y < H; y += 48) { g.fillStyle = MK.lin(g, 0, y, 0, y + 48, (y / 48) % 2 ? [[0, '#93e263'], [1, '#86d758']] : [[0, '#7acc52'], [1, '#6ec148']]); g.fillRect(0, y, W, 48); }
    const r = MK.rng(5); g.lineCap = 'round'; g.lineWidth = 1;
    for (let i = 0; i < 2600; i++) { const x = r() * W, y = r() * H; g.strokeStyle = r() > 0.5 ? 'rgba(210,255,160,.3)' : 'rgba(30,110,35,.14)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3 + r() * 5, y + (r() - 0.5) * 2); g.stroke(); }
    // tall grass band along bottom
    g.fillStyle = '#296d31'; g.fillRect(0, H - 40, W, 40);
    const arr = []; for (let i = 0; i < 420; i++) arr.push({ x: r() * W, y: H - 40 + r() * 46, h: 18 + r() * 22, l: (r() - 0.5) * 12, w: 2 + r() * 1.6, t: r() });
    arr.sort((a, b) => a.y - b.y); arr.forEach((b) => MK.blade(g, b.x, b.y, b.h, b.l, b.w, '#226329', '#3f9a45', b.t > 0.5 ? '#82d66b' : '#5bbb5a'));
    // labels sit on a light strip; slot guides are NOT drawn (styles own the layout)
  };
  /* Slot anchors (x,y = GROUND point where the object touches the lawn). Styles must draw each item at its slot,
     scaled as described, so all three styles can be compared item-for-item. */
  MK.slots = {
    kidIdle:   { x: 90,  y: 170, note: 'kid standing, facing the camera (south)' },
    kidScythe: { x: 230, y: 170, note: 'kid facing east, scythe mid-swing with a swoosh arc' },
    kidPush:   { x: 400, y: 190, note: 'kid facing north pushing the GAS mower (mower in front of kid)' },
    reel:      { x: 560, y: 175, note: 'reel (push) mower alone, facing east' },
    ride:      { x: 800, y: 185, note: 'riding mower with kid seated, facing east' },
    treeSmall: { x: 90,  y: 400, note: 'small tree (canopy ~3 cells wide), shadow on the lawn' },
    treeBig:   { x: 270, y: 410, note: 'big old oak (canopy ~5 cells wide)' },
    rock:      { x: 420, y: 395, note: 'rock partly hidden by grass (~1 cell)' },
    flowers:   { x: 560, y: 395, note: 'four flower patches side by side: daisy, tulip/poppy, aster, sunflower (~1 cell each, 60px apart)' },
    gnome:     { x: 790, y: 395, note: 'garden gnome (~0.9 cell tall) next to a ball, frisbee and a stick (toys, 55px apart to the right)' },
    fence:     { x: 40,  y: 590, note: 'picket fence, 4 panels long running right from x=40 (panel = 1 cell wide)' },
    hedge:     { x: 300, y: 590, note: 'hedge row, 4 cells long running right from x=300' },
    house:     { x: 570, y: 590, note: 'house roof edge + wall + window + path stones, 3 cells wide running right from x=570' },
    pond:      { x: 830, y: 590, note: 'pond with sandy shore, ~3 cells wide centred on x=830 (water ripples)' },
    truck:     { x: 930, y: 270, note: 'little yellow pickup truck, top-down' },
  };
  return MK;
})();
