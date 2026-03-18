// simulation.js
// Objective 1: Tile-based 2D world renderer with camera/viewport

const TILE_SIZE = 16;
const WORLD_W   = 200;
const WORLD_H   = 100;
const WATER_ROW = 60;  // sky tiles at/below this row flood with water

const TILE = Object.freeze({
  SKY: 0, GRASS: 1, DIRT: 2, STONE: 3, DEEP_STONE: 4, WATER: 5,
});

// Per-tile: [base, top-highlight, bottom-shadow]
const STYLE = [
  ['#4a7aab', '#6090c0', '#2a5080'],  // SKY
  ['#3e7830', '#5aaf42', '#28501e'],  // GRASS
  ['#7a5228', '#9a7040', '#502e10'],  // DIRT
  ['#727272', '#8a8a8a', '#525252'],  // STONE
  ['#3e3e3e', '#505050', '#282828'],  // DEEP_STONE
  ['#1e60bb', '#3880d8', '#0e3880'],  // WATER (animated)
];

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

  (function generate() {
    const surface = new Float32Array(WORLD_W);
    for (let x = 0; x < WORLD_W; x++) {
      const p = x / WORLD_W;
      // Sum of sines — amplitude ≈ ±0.87
      const h =
        0.40 * Math.sin(p * Math.PI *  3.1 + 0.70) +
        0.22 * Math.sin(p * Math.PI *  7.3 + 1.40) +
        0.14 * Math.sin(p * Math.PI * 14.7 + 0.30) +
        0.07 * Math.sin(p * Math.PI * 27.1 + 2.00) +
        0.04 * Math.sin(p * Math.PI * 51.9 + 0.90);
      // Map [-0.87, +0.87] → rows 52–68
      surface[x] = 52 + ((h + 0.87) / 1.74) * 16;
    }

    for (let row = 0; row < WORLD_H; row++) {
      for (let col = 0; col < WORLD_W; col++) {
        const s = surface[col];
        let tile;
        if      (row < s)       tile = row >= WATER_ROW ? TILE.WATER : TILE.SKY;
        else if (row < s + 1)   tile = s   >= WATER_ROW ? TILE.DIRT  : TILE.GRASS;
        else if (row < s + 5)   tile = TILE.DIRT;
        else if (row < s + 25)  tile = TILE.STONE;
        else                    tile = TILE.DEEP_STONE;
        tiles[row * WORLD_W + col] = tile;
      }
    }
  })();

  // ── Rendering ─────────────────────────────────────────────────────
  let simTime = 0;

  function render(dt) {
    simTime += dt;
    const W  = canvas.width;
    const H  = canvas.height;
    const ts = TILE_SIZE * cam.zoom;

    // Out-of-world background
    ctx.fillStyle = '#060c14';
    ctx.fillRect(0, 0, W, H);

    // Visible tile range
    const c0 = Math.max(0,         Math.floor(cam.x / ts));
    const r0 = Math.max(0,         Math.floor(cam.y / ts));
    const c1 = Math.min(WORLD_W-1, Math.ceil((cam.x + W) / ts));
    const r1 = Math.min(WORLD_H-1, Math.ceil((cam.y + H) / ts));

    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const tile = tiles[row * WORLD_W + col];
        const px = Math.round(col * ts - cam.x);
        const py = Math.round(row * ts - cam.y);
        const pw = Math.ceil(ts) + 1;
        const ph = Math.ceil(ts) + 1;

        if (tile === TILE.WATER) {
          const s = 0.85 + 0.15 * Math.sin(simTime * 1.6 + col * 0.38 + row * 0.52);
          ctx.fillStyle = `rgb(${~~(30*s)},${~~(96*s)},${~~(187*s)})`;
          ctx.fillRect(px, py, pw, ph);
          // Wave highlight on top edge
          ctx.fillStyle = `rgba(120,200,255,${0.22 * s})`;
          ctx.fillRect(px, py, pw, Math.max(1, ~~(ph * 0.22)));
        } else {
          const ht = Math.max(1, ~~(ph / 5));
          ctx.fillStyle = STYLE[tile][0]; ctx.fillRect(px, py, pw, ph);
          ctx.fillStyle = STYLE[tile][1]; ctx.fillRect(px, py, pw, ht);
          ctx.fillStyle = STYLE[tile][2]; ctx.fillRect(px, py + ph - ht, pw, ht);
        }

        // Grid lines when zoomed in enough
        if (ts >= 14) {
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px + 0.5, py + 0.5, pw - 2, ph - 2);
        }
      }
    }

    // HUD
    ctx.fillStyle = 'rgba(6,12,20,0.82)';
    ctx.fillRect(0, 0, W, 34);
    ctx.fillStyle = '#c98a63';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('AI LIFE SIMULATION', 12, 14);
    ctx.fillStyle = '#4a6878';
    ctx.font = '10px monospace';
    ctx.fillText(
      `obj 1 — world renderer  ·  drag to pan  ·  scroll to zoom  ·  arrow keys  ·  zoom ${cam.zoom.toFixed(1)}×`,
      12, 28
    );
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
    // Zoom toward the mouse pointer
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

  // Start view centered on the terrain surface
  const ts0 = TILE_SIZE * cam.zoom;
  cam.x = (WORLD_W * ts0 - canvas.width) / 2;
  cam.y = Math.max(0, 52 * ts0 - canvas.height * 0.55);
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
