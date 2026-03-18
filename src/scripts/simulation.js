// simulation.js
// Objective 2: World generation — trees and ore veins

const TILE_SIZE = 16;
const WORLD_W   = 200;
const WORLD_H   = 100;
const WATER_ROW = 60;  // sky tiles at/below this row flood with water

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

// Ore dot patterns: [fx, fy] fractions of tile size — same pattern per type (retro look)
const IRON_DOTS = [[0.20,0.25],[0.62,0.18],[0.72,0.58],[0.28,0.65],[0.48,0.40]];
const COAL_DOTS = [[0.18,0.30],[0.58,0.22],[0.70,0.62],[0.32,0.68],[0.44,0.42]];

export function initSimulation(canvasId, sectionId) {
  const canvas  = document.getElementById(canvasId);
  const section = document.getElementById(sectionId);
  if (!canvas || !section) return;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Camera: world-pixel offset of the top-left corner of the viewport
  const cam = { x: 0, y: 0, zoom: 2, minZoom: 0.5, maxZoom: 6 };

  // ── World generation ──────────────────────────────────────────────
  const tiles = new Uint8Array(WORLD_W * WORLD_H);

  // Exposed so camera can centre on the actual surface
  let avgSurfaceRow = 60;

  (function generate() {
    // ── Heightmap ─────────────────────────────────────────────────
    const surface = new Float32Array(WORLD_W);
    let surfaceSum = 0;
    for (let x = 0; x < WORLD_W; x++) {
      const p = x / WORLD_W;
      const h =
        0.40 * Math.sin(p * Math.PI *  3.1 + 0.70) +
        0.22 * Math.sin(p * Math.PI *  7.3 + 1.40) +
        0.14 * Math.sin(p * Math.PI * 14.7 + 0.30) +
        0.07 * Math.sin(p * Math.PI * 27.1 + 2.00) +
        0.04 * Math.sin(p * Math.PI * 51.9 + 0.90);
      surface[x] = 52 + ((h + 0.87) / 1.74) * 16; // rows 52–68
      surfaceSum += surface[x];
    }
    avgSurfaceRow = surfaceSum / WORLD_W;

    // ── Base terrain ──────────────────────────────────────────────
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

    // ── Trees ─────────────────────────────────────────────────────
    // Seed a simple LCG so the world is deterministic across reloads
    let rng = 0xdeadbeef;
    function rand() {
      rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
      return rng / 0x100000000;
    }

    let nextTreeCol = 0;
    for (let col = 2; col < WORLD_W - 2; col++) {
      if (col < nextTreeCol) continue;
      const surfRow = Math.floor(surface[col]);
      if (tiles[surfRow * WORLD_W + col] !== TILE.GRASS) continue;
      if (rand() > 0.45) continue; // 45 % chance where eligible

      const trunkH      = 3 + Math.floor(rand() * 3);      // 3–5
      const canopyW     = 1 + Math.floor(rand() * 2);       // 1–2 half-width
      const canopyH     = 1 + Math.floor(rand() * 2);       // 1–2 half-height
      const trunkTopRow = surfRow - trunkH;
      const canopyCR    = trunkTopRow - 1;                   // ellipse centre row
      const canopyCC    = col;

      // Trunk tiles (above the grass surface)
      for (let r = surfRow - 1; r >= trunkTopRow; r--) {
        if (r >= 0) tiles[r * WORLD_W + col] = TILE.TREE_TRUNK;
      }

      // Canopy: ellipse test
      for (let dr = -canopyH - 1; dr <= 1; dr++) {
        for (let dc = -canopyW - 1; dc <= canopyW + 1; dc++) {
          const r = canopyCR + dr;
          const c = canopyCC + dc;
          if (r < 0 || r >= WORLD_H || c < 0 || c >= WORLD_W) continue;
          const norm = (dr / (canopyH + 0.5)) ** 2 + (dc / (canopyW + 0.5)) ** 2;
          if (norm > 1.0) continue;
          const existing = tiles[r * WORLD_W + c];
          if (existing === TILE.SKY || existing === TILE.TREE_LEAVES) {
            tiles[r * WORLD_W + c] = TILE.TREE_LEAVES;
          }
        }
      }

      nextTreeCol = col + 3 + Math.floor(rand() * 4); // min spacing 3–6
    }

    // ── Ore veins ─────────────────────────────────────────────────
    // Find the topmost stone row per column
    const stoneTop = new Uint8Array(WORLD_W);
    for (let col = 0; col < WORLD_W; col++) {
      for (let row = 0; row < WORLD_H; row++) {
        if (tiles[row * WORLD_W + col] === TILE.STONE) { stoneTop[col] = row; break; }
      }
    }

    function placeVein(oreType, count, minDepthBelow, maxDepthBelow, clusterSize) {
      for (let i = 0; i < count; i++) {
        const col = 1 + Math.floor(rand() * (WORLD_W - 2));
        const depthOffset = minDepthBelow + Math.floor(rand() * (maxDepthBelow - minDepthBelow));
        const startRow = stoneTop[col] + depthOffset;

        // Random-walk blob
        let r = startRow, c = col;
        for (let j = 0; j < clusterSize; j++) {
          if (r >= 0 && r < WORLD_H && c >= 0 && c < WORLD_W) {
            if (tiles[r * WORLD_W + c] === TILE.STONE) {
              tiles[r * WORLD_W + c] = oreType;
            }
          }
          const dir = Math.floor(rand() * 4);
          if (dir === 0) r--;
          else if (dir === 1) r++;
          else if (dir === 2) c--;
          else c++;
        }
      }
    }

    placeVein(TILE.ORE_COAL, 45,  1,  8, 5);  // shallow, small clusters
    placeVein(TILE.ORE_IRON, 30,  6, 18, 7);  // deeper, slightly larger
  })();

  // ── Rendering ─────────────────────────────────────────────────────
  let simTime = 0;

  function drawStdTile(px, py, pw, ph, tileIdx) {
    const s  = STYLE[tileIdx];
    const ht = Math.max(1, ~~(ph / 5));
    ctx.fillStyle = s[0]; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = s[1]; ctx.fillRect(px, py,        pw, ht);
    ctx.fillStyle = s[2]; ctx.fillRect(px, py + ph - ht, pw, ht);
  }

  function drawOreTile(px, py, pw, ph, dots, dotColor) {
    // Stone base + ore specks
    drawStdTile(px, py, pw, ph, TILE.STONE);
    const ds = Math.max(2, ~~(pw / 5));
    ctx.fillStyle = dotColor;
    for (const [fx, fy] of dots) {
      ctx.fillRect(px + ~~(fx * pw), py + ~~(fy * ph), ds, ds);
    }
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
          ctx.fillStyle = `rgba(120,200,255,${0.22 * s})`;
          ctx.fillRect(px, py, pw, Math.max(1, ~~(ph * 0.22)));
        } else if (tile === TILE.ORE_IRON) {
          drawOreTile(px, py, pw, ph, IRON_DOTS, '#c8782a');
        } else if (tile === TILE.ORE_COAL) {
          drawOreTile(px, py, pw, ph, COAL_DOTS, '#282838');
        } else {
          drawStdTile(px, py, pw, ph, tile);
        }

        // Subtle grid when zoomed in
        if (ts >= 14) {
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px + 0.5, py + 0.5, pw - 2, ph - 2);
        }
      }
    }

    // ── HUD ──────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(6,12,20,0.82)';
    ctx.fillRect(0, 0, W, 34);
    ctx.fillStyle = '#c98a63';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('AI LIFE SIMULATION', 12, 14);
    ctx.fillStyle = '#4a6878';
    ctx.font = '10px monospace';
    ctx.fillText(
      `obj 2 — world gen: trees + ore  ·  drag/arrows to pan  ·  scroll to zoom  ·  zoom ${cam.zoom.toFixed(1)}×`,
      12, 28
    );

    // ── Legend ───────────────────────────────────────────────────
    const legend = [
      ['#3e7830', 'grass'], ['#6b3d10', 'wood (tree trunk)'], ['#2a7018', 'tree leaves'],
      ['#727272', 'stone'], ['#c8782a', 'iron ore'], ['#282838', 'coal ore'],
      ['#1e60bb', 'water'],
    ];
    const lx = W - 150;
    ctx.fillStyle = 'rgba(6,12,20,0.78)';
    ctx.fillRect(lx - 8, 42, 158, legend.length * 16 + 10);
    ctx.font = '9px monospace';
    for (let i = 0; i < legend.length; i++) {
      const ly = 54 + i * 16;
      ctx.fillStyle = legend[i][0];
      ctx.fillRect(lx, ly - 8, 10, 10);
      ctx.fillStyle = '#7a9aaa';
      ctx.fillText(legend[i][1], lx + 14, ly);
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
  window.addEventListener('mouseup', () => {
    drag = null;
    canvas.style.cursor = 'grab';
  });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const prev = cam.zoom;
    cam.zoom = Math.min(cam.maxZoom, Math.max(cam.minZoom,
      cam.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)
    ));
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

  // Centre view so the surface horizon sits at ~55 % down the viewport
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
    render(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
