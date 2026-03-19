// simulation.js
// Objective 4: Agent entity with pixel-art sprites and idle/walk animation

const TILE_SIZE = 16;
const WORLD_W   = 200;
const WORLD_H   = 100;
const WATER_ROW = 60;

const TILE = Object.freeze({
  SKY: 0, GRASS: 1, DIRT: 2, STONE: 3, DEEP_STONE: 4, WATER: 5,
  TREE_TRUNK: 6, TREE_LEAVES: 7, ORE_IRON: 8, ORE_COAL: 9,
});

// Per-tile: [base, top-highlight, bottom-shadow]  (null = custom draw)
const STYLE = [
  ['#4a7aab', '#6090c0', '#2a5080'],  // SKY
  ['#3e7830', '#5aaf42', '#28501e'],  // GRASS
  ['#7a5228', '#9a7040', '#502e10'],  // DIRT
  ['#727272', '#8a8a8a', '#525252'],  // STONE
  ['#3e3e3e', '#505050', '#282828'],  // DEEP_STONE
  null,                               // WATER (animated)
  ['#6b3d10', '#8f5828', '#3a1e06'],  // TREE_TRUNK
  ['#2a7018', '#40a028', '#164010'],  // TREE_LEAVES
  null,                               // ORE_IRON (custom)
  null,                               // ORE_COAL (custom)
];

const IRON_DOTS = [[0.20,0.25],[0.62,0.18],[0.72,0.58],[0.28,0.65],[0.48,0.40]];
const COAL_DOTS = [[0.18,0.30],[0.58,0.22],[0.70,0.62],[0.32,0.68],[0.44,0.42]];

// ── Material properties (from obj 3) ──────────────────────────────────────────
export const MATERIAL = Object.freeze({
  WOOD:  { id:0, name:'Wood',       color:'#8b5a2b', strength:30,  weight:5,  durability:40,  buildTime:2.0, harvestTime:3.0,  carryLimit:20, towerScore:1.0, requiresTool:false, source:TILE.TREE_TRUNK, recipe:null },
  STONE: { id:1, name:'Stone',      color:'#808080', strength:55,  weight:14, durability:80,  buildTime:4.0, harvestTime:6.0,  carryLimit:12, towerScore:1.8, requiresTool:true,  source:TILE.STONE,     recipe:null },
  CLAY:  { id:2, name:'Clay Brick', color:'#b5734a', strength:38,  weight:9,  durability:60,  buildTime:3.0, harvestTime:8.0,  carryLimit:16, towerScore:1.4, requiresTool:false, source:null,           recipe:{ dirt:2, water:1, processTime:5.0 } },
  IRON:  { id:3, name:'Iron',       color:'#c0a878', strength:100, weight:18, durability:200, buildTime:6.0, harvestTime:12.0, carryLimit:8,  towerScore:3.0, requiresTool:true,  source:TILE.ORE_IRON,  recipe:{ oreIron:3, coal:1, processTime:10.0 } },
  COAL:  { id:4, name:'Coal',       color:'#3a3a4a', strength:10,  weight:4,  durability:20,  buildTime:0,   harvestTime:4.0,  carryLimit:24, towerScore:0,   requiresTool:true,  source:TILE.ORE_COAL,  recipe:null },
});
export const MATERIALS_BY_SCORE = Object.values(MATERIAL).filter(m => m.towerScore > 0).sort((a,b) => b.towerScore - a.towerScore);

// ── Agent colour palettes ──────────────────────────────────────────────────────
const AGENT_COLORS = [
  { shirt:'#c83820', pants:'#2a3858', skin:'#f0c088', hair:'#281408', shoe:'#181008' },
  { shirt:'#2248c0', pants:'#3a2818', skin:'#f0c088', hair:'#180e04', shoe:'#100808' },
  { shirt:'#229840', pants:'#28283c', skin:'#d09860', hair:'#100e04', shoe:'#140808' },
  { shirt:'#c09018', pants:'#1a2a48', skin:'#f0c088', hair:'#381608', shoe:'#100808' },
  { shirt:'#9028b0', pants:'#302010', skin:'#e8b880', hair:'#080808', shoe:'#0c0808' },
  { shirt:'#18a0a8', pants:'#2e2416', skin:'#d8a870', hair:'#180804', shoe:'#100808' },
];

// ── Agent class ────────────────────────────────────────────────────────────────
class Agent {
  constructor(id, worldX, worldY) {
    this.id          = id;
    this.x           = worldX;
    this.y           = worldY;   // world-px Y of the surface tile top (= feet Y)
    this.vx          = 0;
    this.facingRight = true;
    this.state       = 'idle';
    this.stateTimer  = Math.random() * 2;   // stagger first state change
    this.animTime    = Math.random() * 20;  // stagger walk-cycle phase
    this.colors      = AGENT_COLORS[id % AGENT_COLORS.length];
  }

  update(dt, surfaceYPx) {
    this.animTime   += dt;
    this.stateTimer -= dt;

    // ── State machine ──────────────────────────────────────────
    if (this.stateTimer <= 0) {
      if (this.state === 'idle') {
        this.state  = 'walk';
        this.stateTimer = 2 + Math.random() * 5;
        const speed = 12 + Math.random() * 20;
        this.vx     = (Math.random() > 0.5 ? 1 : -1) * speed;
        this.facingRight = this.vx > 0;
      } else {
        this.state  = 'idle';
        this.stateTimer = 1 + Math.random() * 3;
        this.vx     = 0;
      }
    }

    // ── Movement + surface tracking ───────────────────────────
    if (this.state === 'walk') {
      const nextX  = this.x + this.vx * dt;
      const curCol = Math.max(1, Math.min(WORLD_W - 2, Math.floor(this.x   / TILE_SIZE)));
      const nxtCol = Math.max(1, Math.min(WORLD_W - 2, Math.floor(nextX    / TILE_SIZE)));

      const curSurf = surfaceYPx[curCol];
      const nxtSurf = surfaceYPx[nxtCol];

      // Avoid cliffs taller than 2 tiles
      if (Math.abs(nxtSurf - curSurf) > TILE_SIZE * 2 || nxtCol <= 1 || nxtCol >= WORLD_W - 2) {
        this.vx          *= -1;
        this.facingRight  = this.vx > 0;
        this.stateTimer   = 0.4;
      } else {
        this.x = Math.max(TILE_SIZE, Math.min((WORLD_W - 2) * TILE_SIZE, nextX));
        this.y = surfaceYPx[Math.floor(this.x / TILE_SIZE)];
      }
    }
  }
}

// ── Draw agent sprite ──────────────────────────────────────────────────────────
// Sprite is ~10 world-px wide × 22 world-px tall, origin at feet-centre.
// All local coords: lx from centre, ly from feet (negative = upward).
function drawAgent(ctx, agent, cam) {
  const z  = cam.zoom;
  const sx = Math.round(agent.x * z - cam.x);
  const sy = Math.round(agent.y * z - cam.y);
  const c  = agent.colors;

  const walking = agent.state === 'walk';
  const ph      = agent.animTime * 6;  // walk phase (rad)

  // Vertical body bob
  const bob = walking
    ? Math.abs(Math.sin(ph * 2)) * -1        // bob on every half-step
    : Math.sin(agent.animTime * 1.5) * -0.4; // gentle breathing when idle

  // Leg lift: one leg rises as the other is down
  const leg1Up = walking ? Math.max(0,  Math.sin(ph))           * 3 : 0;
  const leg2Up = walking ? Math.max(0,  Math.sin(ph + Math.PI)) * 3 : 0;

  // Arm swing (opposite to legs)
  const arm1dy = walking ? Math.sin(ph + Math.PI) * 2 : 0;
  const arm2dy = walking ? Math.sin(ph)            * 2 : 0;

  // Helper: fill a rect in sprite-local coords
  const r = (lx, ly, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(
      Math.round(sx + lx * z),
      Math.round(sy + (ly + bob) * z),
      Math.max(1, Math.round(w * z)),
      Math.max(1, Math.round(h * z))
    );
  };

  // Ground shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(sx, sy, Math.round(6 * z), Math.round(2 * z), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Back leg (drawn first so front leg overlaps) ───────────
  r(-1,  -9 + leg2Up,  3,  9 - leg2Up,  c.pants);
  r(-1,  -1, 3, 1, c.shoe);   // back shoe

  // ── Torso ─────────────────────────────────────────────────
  r(-4, -15, 8, 6, c.shirt);

  // ── Arms ──────────────────────────────────────────────────
  r(-6, -14 + arm1dy, 2, 5, c.skin);   // left arm
  r( 4, -14 + arm2dy, 2, 5, c.skin);   // right arm

  // ── Front leg ─────────────────────────────────────────────
  r(-4,  -9 + leg1Up,  3,  9 - leg1Up,  c.pants);
  r(-4,  -1, 3, 1, c.shoe);   // front shoe

  // ── Head ──────────────────────────────────────────────────
  r(-3, -22, 6, 7, c.skin);
  r(-3, -22, 6, 2, c.hair);   // hair on top

  // ── Eyes (face direction) ─────────────────────────────────
  if (agent.facingRight) {
    r( 1, -19, 1, 1, '#080808');
    r( 3, -19, 1, 1, '#080808');
  } else {
    r(-4, -19, 1, 1, '#080808');
    r(-2, -19, 1, 1, '#080808');
  }

  // ── Name tag above head (only when zoomed in) ─────────────
  if (z >= 1.8) {
    ctx.save();
    ctx.font      = `bold ${Math.max(8, ~~(6.5 * z))}px monospace`;
    ctx.fillStyle = c.shirt;
    ctx.textAlign = 'center';
    ctx.fillText(`A${agent.id + 1}`, sx, sy - ~~(25 * z) - 2);
    ctx.restore();
  }
}

export function initSimulation(canvasId, sectionId) {
  const canvas  = document.getElementById(canvasId);
  const section = document.getElementById(sectionId);
  if (!canvas || !section) return;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const cam = { x: 0, y: 0, zoom: 2, minZoom: 0.5, maxZoom: 6 };

  // ── World generation ──────────────────────────────────────────────
  const tiles      = new Uint8Array(WORLD_W * WORLD_H);
  const surfaceYPx = new Uint16Array(WORLD_W);  // world-px Y of first solid tile per column
  let avgSurfaceRow = 60;

  (function generate() {
    // Heightmap
    const surface = new Float32Array(WORLD_W);
    let sum = 0;
    for (let x = 0; x < WORLD_W; x++) {
      const p = x / WORLD_W;
      const h =
        0.40 * Math.sin(p * Math.PI *  3.1 + 0.70) +
        0.22 * Math.sin(p * Math.PI *  7.3 + 1.40) +
        0.14 * Math.sin(p * Math.PI * 14.7 + 0.30) +
        0.07 * Math.sin(p * Math.PI * 27.1 + 2.00) +
        0.04 * Math.sin(p * Math.PI * 51.9 + 0.90);
      surface[x] = 52 + ((h + 0.87) / 1.74) * 16;
      sum += surface[x];
    }
    avgSurfaceRow = sum / WORLD_W;

    // Base terrain
    for (let row = 0; row < WORLD_H; row++) {
      for (let col = 0; col < WORLD_W; col++) {
        const s = surface[col];
        let tile;
        if      (row < s)       tile = row >= WATER_ROW ? TILE.WATER      : TILE.SKY;
        else if (row < s + 1)   tile = s   >= WATER_ROW ? TILE.DIRT       : TILE.GRASS;
        else if (row < s + 5)   tile = TILE.DIRT;
        else if (row < s + 25)  tile = TILE.STONE;
        else                    tile = TILE.DEEP_STONE;
        tiles[row * WORLD_W + col] = tile;
      }
    }

    // LCG for deterministic generation
    let rng = 0xdeadbeef;
    const rand = () => { rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0; return rng / 0x100000000; };

    // Trees
    let nextTreeCol = 0;
    for (let col = 2; col < WORLD_W - 2; col++) {
      if (col < nextTreeCol) continue;
      const surfRow = Math.floor(surface[col]);
      if (tiles[surfRow * WORLD_W + col] !== TILE.GRASS) continue;
      if (rand() > 0.45) continue;
      const trunkH  = 3 + Math.floor(rand() * 3);
      const canopyW = 1 + Math.floor(rand() * 2);
      const canopyH = 1 + Math.floor(rand() * 2);
      const trunkTop = surfRow - trunkH;
      for (let r = surfRow - 1; r >= trunkTop; r--)
        if (r >= 0) tiles[r * WORLD_W + col] = TILE.TREE_TRUNK;
      for (let dr = -canopyH - 1; dr <= 1; dr++) {
        for (let dc = -canopyW - 1; dc <= canopyW + 1; dc++) {
          const r = trunkTop - 1 + dr, c = col + dc;
          if (r < 0 || r >= WORLD_H || c < 0 || c >= WORLD_W) continue;
          if ((dr/(canopyH+0.5))**2 + (dc/(canopyW+0.5))**2 > 1.0) continue;
          if (tiles[r * WORLD_W + c] === TILE.SKY) tiles[r * WORLD_W + c] = TILE.TREE_LEAVES;
        }
      }
      nextTreeCol = col + 3 + Math.floor(rand() * 4);
    }

    // Ore veins
    const stoneTop = new Uint8Array(WORLD_W);
    for (let col = 0; col < WORLD_W; col++)
      for (let row = 0; row < WORLD_H; row++)
        if (tiles[row * WORLD_W + col] === TILE.STONE) { stoneTop[col] = row; break; }

    const placeVein = (oreType, count, minD, maxD, size) => {
      for (let i = 0; i < count; i++) {
        let r = stoneTop[~~(rand() * WORLD_W)] + minD + ~~(rand() * (maxD - minD));
        let c = 1 + ~~(rand() * (WORLD_W - 2));
        for (let j = 0; j < size; j++) {
          if (r >= 0 && r < WORLD_H && c >= 0 && c < WORLD_W && tiles[r * WORLD_W + c] === TILE.STONE)
            tiles[r * WORLD_W + c] = oreType;
          const d = ~~(rand() * 4);
          if (d===0) r--; else if (d===1) r++; else if (d===2) c--; else c++;
        }
      }
    };
    placeVein(TILE.ORE_COAL, 45, 1,  8, 5);
    placeVein(TILE.ORE_IRON, 30, 6, 18, 7);

    // Build surfaceYPx: first solid (non-sky/water/tree) tile per column
    for (let col = 0; col < WORLD_W; col++) {
      let found = false;
      for (let row = 0; row < WORLD_H; row++) {
        const t = tiles[row * WORLD_W + col];
        if (t === TILE.GRASS || t === TILE.DIRT || t === TILE.STONE || t === TILE.DEEP_STONE) {
          surfaceYPx[col] = row * TILE_SIZE;
          found = true;
          break;
        }
      }
      if (!found) surfaceYPx[col] = (WORLD_H - 1) * TILE_SIZE;
    }
  })();

  // ── Spawn agents ──────────────────────────────────────────────────
  const agents = [];
  for (let i = 0; i < 6; i++) {
    const col    = Math.floor(15 + (i / 6) * (WORLD_W - 30));
    const worldX = col * TILE_SIZE + TILE_SIZE / 2;
    const worldY = surfaceYPx[col];
    agents.push(new Agent(i, worldX, worldY));
  }

  // ── Rendering ─────────────────────────────────────────────────────
  let simTime = 0;

  function drawStdTile(px, py, pw, ph, idx) {
    const s = STYLE[idx], ht = Math.max(1, ~~(ph / 5));
    ctx.fillStyle = s[0]; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = s[1]; ctx.fillRect(px, py, pw, ht);
    ctx.fillStyle = s[2]; ctx.fillRect(px, py + ph - ht, pw, ht);
  }

  function drawOreTile(px, py, pw, ph, dots, dotCol) {
    drawStdTile(px, py, pw, ph, TILE.STONE);
    const ds = Math.max(2, ~~(pw / 5));
    ctx.fillStyle = dotCol;
    for (const [fx, fy] of dots) ctx.fillRect(px + ~~(fx*pw), py + ~~(fy*ph), ds, ds);
  }

  function render(dt) {
    simTime += dt;
    const W  = canvas.width;
    const H  = canvas.height;
    const ts = TILE_SIZE * cam.zoom;

    ctx.fillStyle = '#060c14';
    ctx.fillRect(0, 0, W, H);

    const c0 = Math.max(0,         Math.floor(cam.x / ts));
    const r0 = Math.max(0,         Math.floor(cam.y / ts));
    const c1 = Math.min(WORLD_W-1, Math.ceil((cam.x + W) / ts));
    const r1 = Math.min(WORLD_H-1, Math.ceil((cam.y + H) / ts));

    // ── Tiles ────────────────────────────────────────────────
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const tile = tiles[row * WORLD_W + col];
        const px   = Math.round(col * ts - cam.x);
        const py   = Math.round(row * ts - cam.y);
        const pw   = Math.ceil(ts) + 1;
        const ph   = Math.ceil(ts) + 1;

        if (tile === TILE.WATER) {
          const s = 0.85 + 0.15 * Math.sin(simTime * 1.6 + col * 0.38 + row * 0.52);
          ctx.fillStyle = `rgb(${~~(30*s)},${~~(96*s)},${~~(187*s)})`;
          ctx.fillRect(px, py, pw, ph);
          ctx.fillStyle = `rgba(120,200,255,${0.22*s})`;
          ctx.fillRect(px, py, pw, Math.max(1, ~~(ph * 0.22)));
        } else if (tile === TILE.ORE_IRON) {
          drawOreTile(px, py, pw, ph, IRON_DOTS, '#c8782a');
        } else if (tile === TILE.ORE_COAL) {
          drawOreTile(px, py, pw, ph, COAL_DOTS, '#282838');
        } else {
          drawStdTile(px, py, pw, ph, tile);
        }

        if (ts >= 14) {
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px + 0.5, py + 0.5, pw - 2, ph - 2);
        }
      }
    }

    // ── Agents ───────────────────────────────────────────────
    for (const agent of agents) drawAgent(ctx, agent, cam);

    // ── HUD ──────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(6,12,20,0.82)';
    ctx.fillRect(0, 0, W, 34);
    ctx.fillStyle = '#c98a63';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('AI LIFE SIMULATION', 12, 14);
    ctx.fillStyle = '#4a6878';
    ctx.font = '10px monospace';
    ctx.fillText(
      `obj 4 — agent sprites  ·  drag/arrows to pan  ·  scroll to zoom  ·  zoom ${cam.zoom.toFixed(1)}×`,
      12, 28
    );

    drawMaterialPanel(W);
  }

  function drawMaterialPanel(W) {
    const mats  = Object.values(MATERIAL);
    const heads = ['MATERIAL', 'STR', 'WT', 'DUR', 'BUILD', 'CARRY', 'SCORE'];
    const PW = 318, ROW = 14, PAD = 8;
    const PH = (mats.length + 2) * ROW + PAD * 2;
    const px = W - PW - 10;
    const py = 42;
    const cx = [px+PAD, px+114, px+138, px+166, px+202, px+240, px+278];

    ctx.fillStyle = 'rgba(6,12,20,0.88)';
    ctx.fillRect(px, py, PW, PH);
    ctx.strokeStyle = '#2a4050'; ctx.lineWidth = 1;
    ctx.strokeRect(px+0.5, py+0.5, PW-1, PH-1);

    ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#c98a63';
    for (let i = 0; i < heads.length; i++) ctx.fillText(heads[i], cx[i], py+PAD+ROW-2);
    ctx.fillStyle = '#2a4050';
    ctx.fillRect(px+PAD, py+PAD+ROW+1, PW-PAD*2, 1);

    ctx.font = '9px monospace';
    for (let m = 0; m < mats.length; m++) {
      const mat = mats[m];
      const ry  = py + PAD + (m + 2) * ROW - 2;
      ctx.fillStyle = mat.color;
      ctx.fillRect(cx[0], ry-8, 8, 8);
      ctx.fillStyle = '#9ab0bc';
      ctx.fillText(mat.name, cx[0]+11, ry);
      const row = [mat.strength, mat.weight, mat.durability,
        mat.buildTime>0 ? mat.buildTime+'s' : '—', mat.carryLimit,
        mat.towerScore>0 ? mat.towerScore+'×' : '—'];
      for (let i = 0; i < row.length; i++) {
        ctx.fillStyle = i===5 && mat.towerScore>0 ? '#c8a060' : '#7a9aaa';
        ctx.fillText(String(row[i]), cx[i+1], ry);
      }
    }
  }

  // ── Input ──────────────────────────────────────────────────────────
  let drag = null;
  const keys = new Set();

  canvas.addEventListener('mousedown', e => {
    drag = { mx: e.clientX, my: e.clientY, cx: cam.x, cy: cam.y };
    canvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!drag) return;
    cam.x = drag.cx - (e.clientX - drag.mx);
    cam.y = drag.cy - (e.clientY - drag.my);
    clampCam();
  });
  window.addEventListener('mouseup', () => { drag = null; canvas.style.cursor = 'grab'; });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const prev = cam.zoom;
    cam.zoom = Math.min(cam.maxZoom, Math.max(cam.minZoom, cam.zoom * (e.deltaY < 0 ? 1.15 : 1/1.15)));
    cam.x = mx - (mx - cam.x) * cam.zoom / prev;
    cam.y = my - (my - cam.y) * cam.zoom / prev;
    clampCam();
  }, { passive: false });

  window.addEventListener('keydown', e => keys.add(e.key));
  window.addEventListener('keyup',   e => keys.delete(e.key));

  function handleKeys(dt) {
    const spd = 280 * dt;
    if (keys.has('ArrowLeft')  || keys.has('a')) cam.x -= spd;
    if (keys.has('ArrowRight') || keys.has('d')) cam.x += spd;
    if (keys.has('ArrowUp')    || keys.has('w')) cam.y -= spd;
    if (keys.has('ArrowDown')  || keys.has('s')) cam.y += spd;
    clampCam();
  }

  function clampCam() {
    const ts = TILE_SIZE * cam.zoom;
    cam.x = Math.max(0, Math.min(Math.max(0, WORLD_W * ts - canvas.width),  cam.x));
    cam.y = Math.max(0, Math.min(Math.max(0, WORLD_H * ts - canvas.height), cam.y));
  }

  // ── Resize ────────────────────────────────────────────────────────
  function resize() {
    canvas.width  = section.clientWidth;
    canvas.height = section.clientHeight;
    clampCam();
  }
  new ResizeObserver(resize).observe(section);
  resize();

  const ts0 = TILE_SIZE * cam.zoom;
  cam.x = (WORLD_W * ts0 - canvas.width)  / 2;
  cam.y = Math.max(0, avgSurfaceRow * ts0 - canvas.height * 0.55);
  clampCam();
  canvas.style.cursor = 'grab';

  // ── Main loop ──────────────────────────────────────────────────────
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    handleKeys(dt);
    for (const agent of agents) agent.update(dt, surfaceYPx);
    render(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
