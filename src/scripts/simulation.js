// simulation.js
// Objective 6: Agent needs — hunger, energy, sleep with decay, effects, and status bars

const TILE_SIZE = 16;
const WORLD_W   = 200;
const WORLD_H   = 100;
const WATER_ROW = 60;

const TILE = Object.freeze({
  SKY:0, GRASS:1, DIRT:2, STONE:3, DEEP_STONE:4, WATER:5,
  TREE_TRUNK:6, TREE_LEAVES:7, ORE_IRON:8, ORE_COAL:9,
});

const STYLE = [
  ['#4a7aab','#6090c0','#2a5080'],
  ['#3e7830','#5aaf42','#28501e'],
  ['#7a5228','#9a7040','#502e10'],
  ['#727272','#8a8a8a','#525252'],
  ['#3e3e3e','#505050','#282828'],
  null,
  ['#6b3d10','#8f5828','#3a1e06'],
  ['#2a7018','#40a028','#164010'],
  null, null,
];

const IRON_DOTS = [[0.20,0.25],[0.62,0.18],[0.72,0.58],[0.28,0.65],[0.48,0.40]];
const COAL_DOTS = [[0.18,0.30],[0.58,0.22],[0.70,0.62],[0.32,0.68],[0.44,0.42]];

// ── Materials (obj 3) ──────────────────────────────────────────────────────────
export const MATERIAL = Object.freeze({
  WOOD:  {id:0,name:'Wood',      color:'#8b5a2b',strength:30, weight:5, durability:40, buildTime:2.0,harvestTime:3.0, carryLimit:20,towerScore:1.0,requiresTool:false,source:TILE.TREE_TRUNK,recipe:null},
  STONE: {id:1,name:'Stone',     color:'#808080',strength:55, weight:14,durability:80, buildTime:4.0,harvestTime:6.0, carryLimit:12,towerScore:1.8,requiresTool:true, source:TILE.STONE,    recipe:null},
  CLAY:  {id:2,name:'Clay Brick',color:'#b5734a',strength:38, weight:9, durability:60, buildTime:3.0,harvestTime:8.0, carryLimit:16,towerScore:1.4,requiresTool:false,source:null,          recipe:{dirt:2,water:1,processTime:5.0}},
  IRON:  {id:3,name:'Iron',      color:'#c0a878',strength:100,weight:18,durability:200,buildTime:6.0,harvestTime:12.0,carryLimit:8, towerScore:3.0,requiresTool:true, source:TILE.ORE_IRON, recipe:{oreIron:3,coal:1,processTime:10.0}},
  COAL:  {id:4,name:'Coal',      color:'#3a3a4a',strength:10, weight:4, durability:20, buildTime:0,  harvestTime:4.0, carryLimit:24,towerScore:0,  requiresTool:true, source:TILE.ORE_COAL, recipe:null},
});
export const MATERIALS_BY_SCORE = Object.values(MATERIAL).filter(m=>m.towerScore>0).sort((a,b)=>b.towerScore-a.towerScore);

// ── Needs decay/recovery constants ────────────────────────────────────────────
const NEEDS = Object.freeze({
  //                          per-second rates
  HUNGER_DRAIN:       0.9,   // awake always
  ENERGY_DRAIN_WALK:  0.8,   // while walking
  ENERGY_DRAIN_IDLE:  0.22,  // while idle / resting
  ENERGY_RECOVER:     3.2,   // while sleeping
  SLEEP_DRAIN:        0.38,  // while awake
  SLEEP_RECOVER:      2.8,   // while sleeping
  // Thresholds
  SLEEP_TRIGGER:      15,    // enter sleep below this energy
  SLEEP_RELEASE:      80,    // wake when energy reaches this
  HUNGER_ENERGY_MULT: 2.0,   // energy drains this × faster when hunger < 25
});

// ── Agent colours ──────────────────────────────────────────────────────────────
const AGENT_COLORS = [
  {shirt:'#c83820',pants:'#2a3858',skin:'#f0c088',hair:'#281408',shoe:'#181008'},
  {shirt:'#2248c0',pants:'#3a2818',skin:'#f0c088',hair:'#180e04',shoe:'#100808'},
  {shirt:'#229840',pants:'#28283c',skin:'#d09860',hair:'#100e04',shoe:'#140808'},
  {shirt:'#c09018',pants:'#1a2a48',skin:'#f0c088',hair:'#381608',shoe:'#100808'},
  {shirt:'#9028b0',pants:'#302010',skin:'#e8b880',hair:'#080808',shoe:'#0c0808'},
  {shirt:'#18a0a8',pants:'#2e2416',skin:'#d8a870',hair:'#180804',shoe:'#100808'},
];

// ── A* (obj 5) ─────────────────────────────────────────────────────────────────
function aStar(startCol, goalCol, surfaceYPx) {
  if (startCol === goalCol) return [startCol];
  startCol = Math.max(0, Math.min(WORLD_W-1, startCol));
  goalCol  = Math.max(0, Math.min(WORLD_W-1, goalCol));
  const INF=1e9;
  const gScore=new Float32Array(WORLD_W).fill(INF);
  const fScore=new Float32Array(WORLD_W).fill(INF);
  const cameFrom=new Int16Array(WORLD_W).fill(-1);
  const inOpen=new Uint8Array(WORLD_W);
  gScore[startCol]=0; fScore[startCol]=Math.abs(goalCol-startCol); inOpen[startCol]=1;
  const open=[startCol];
  while (open.length>0) {
    let mi=0;
    for (let i=1;i<open.length;i++) if(fScore[open[i]]<fScore[open[mi]]) mi=i;
    const cur=open[mi]; open.splice(mi,1); inOpen[cur]=0;
    if (cur===goalCol) { const p=[]; for(let c=cur;c!==-1;c=cameFrom[c]) p.unshift(c); return p; }
    for (const nb of [cur-1,cur+1]) {
      if(nb<0||nb>=WORLD_W) continue;
      if(Math.abs(surfaceYPx[nb]-surfaceYPx[cur])>TILE_SIZE) continue;
      const tg=gScore[cur]+1;
      if(tg<gScore[nb]) {
        cameFrom[nb]=cur; gScore[nb]=tg; fScore[nb]=tg+Math.abs(goalCol-nb);
        if(!inOpen[nb]) { inOpen[nb]=1; open.push(nb); }
      }
    }
  }
  return null;
}

// ── Agent ──────────────────────────────────────────────────────────────────────
class Agent {
  constructor(id, worldX, worldY) {
    this.id          = id;
    this.x           = worldX;
    this.y           = worldY;
    this.vx          = 0;
    this.facingRight = true;
    this.state       = 'idle';   // 'idle' | 'walk' | 'sleep'
    this.stateTimer  = Math.random() * 2;
    this.animTime    = Math.random() * 20;
    this.colors      = AGENT_COLORS[id % AGENT_COLORS.length];
    this.baseSpeed   = 16 + Math.random() * 12;

    // Needs — staggered starting values so agents don't all sleep at once
    this.hunger = 55 + Math.random() * 40;
    this.energy = 55 + Math.random() * 40;
    this.sleep  = 50 + Math.random() * 45;

    // Pathfinding
    this.path    = [];
    this.pathIdx = 0;
    this.goalCol = -1;
  }

  // Effective speed — reduced when tired or starving
  get speed() {
    const energyFactor = 0.3 + 0.7 * (this.energy / 100);
    const hungerFactor = this.hunger < 20 ? 0.5 + 0.5 * (this.hunger / 20) : 1.0;
    return this.baseSpeed * energyFactor * hungerFactor;
  }

  // Maximum energy achievable — capped by sleep debt
  get maxEnergy() { return Math.max(30, this.sleep); }

  chooseGoal(surfaceYPx) {
    const curCol = Math.max(0, Math.min(WORLD_W-1, Math.floor(this.x / TILE_SIZE)));
    let targetCol;
    for (let a=0; a<8; a++) {
      targetCol = 5 + Math.floor(Math.random() * (WORLD_W - 10));
      if (Math.abs(targetCol - curCol) >= 20) break;
    }
    const path = aStar(curCol, targetCol, surfaceYPx);
    if (path && path.length > 1) {
      this.path=path; this.pathIdx=1; this.goalCol=targetCol; this.state='walk';
    } else {
      this.state='idle'; this.stateTimer=1+Math.random()*2; this.goalCol=-1;
    }
  }

  updateNeeds(dt) {
    const hungry = this.hunger < 25;
    const energyMult = hungry ? NEEDS.HUNGER_ENERGY_MULT : 1.0;

    // Hunger always drains
    this.hunger = Math.max(0, this.hunger - NEEDS.HUNGER_DRAIN * dt);

    if (this.state === 'sleep') {
      this.energy = Math.min(this.maxEnergy, this.energy + NEEDS.ENERGY_RECOVER * dt);
      this.sleep  = Math.min(100,            this.sleep  + NEEDS.SLEEP_RECOVER  * dt);
    } else {
      const drain = this.state === 'walk' ? NEEDS.ENERGY_DRAIN_WALK : NEEDS.ENERGY_DRAIN_IDLE;
      this.energy = Math.max(0, this.energy - drain * energyMult * dt);
      this.sleep  = Math.max(0, this.sleep  - NEEDS.SLEEP_DRAIN * dt);
    }
  }

  update(dt, surfaceYPx) {
    this.animTime += dt;
    this.updateNeeds(dt);

    // ── Sleep trigger / release ────────────────────────────────
    if (this.state !== 'sleep' && this.energy < NEEDS.SLEEP_TRIGGER) {
      this.state   = 'sleep';
      this.path    = [];
      this.goalCol = -1;
      this.vx      = 0;
      return;
    }
    if (this.state === 'sleep') {
      if (this.energy >= NEEDS.SLEEP_RELEASE) {
        this.state      = 'idle';
        this.stateTimer = 0.5 + Math.random();
      }
      return;
    }

    // ── Normal state machine ───────────────────────────────────
    if (this.state === 'idle') {
      this.vx = 0;
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) this.chooseGoal(surfaceYPx);

    } else { // walk
      if (this.pathIdx >= this.path.length) {
        this.path=[]; this.goalCol=-1; this.state='idle';
        this.stateTimer=1+Math.random()*3; this.vx=0;
        return;
      }
      const wpCol = this.path[this.pathIdx];
      const wpX   = wpCol * TILE_SIZE + TILE_SIZE / 2;
      const dx    = wpX - this.x;
      if (Math.abs(dx) < 1.5) {
        this.x=wpX; this.y=surfaceYPx[wpCol]; this.pathIdx++;
      } else {
        this.vx=Math.sign(dx)*this.speed; this.facingRight=dx>0;
        this.x+=this.vx*dt;
        const col=Math.max(0,Math.min(WORLD_W-1,Math.floor(this.x/TILE_SIZE)));
        this.y=surfaceYPx[col];
      }
    }
  }
}

// ── Sprite drawing ─────────────────────────────────────────────────────────────
function drawAgent(ctx, agent, cam) {
  const z  = cam.zoom;
  const sx = Math.round(agent.x * z - cam.x);
  const sy = Math.round(agent.y * z - cam.y);
  const c  = agent.colors;

  const r = (lx, ly, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(sx+lx*z), Math.round(sy+ly*z),
      Math.max(1,Math.round(w*z)), Math.max(1,Math.round(h*z)));
  };

  // Ground shadow
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(sx, sy, Math.round(6*z), Math.round(2*z), 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  if (agent.state === 'sleep') {
    // ── Sleeping pose — curled up horizontally ─────────────
    r(-8, -5,  14, 5, c.pants);   // body
    r(-8, -5,   6, 5, c.shirt);   // shirt part
    r( 5, -8,   6, 6, c.skin);    // head at right end
    r( 5, -8,   6, 2, c.hair);

    // Floating Zzz
    const zt = agent.animTime;
    const za = Math.max(0, Math.sin(zt * 0.9));
    if (z >= 1.4) {
      ctx.save();
      ctx.globalAlpha = za * 0.85;
      ctx.fillStyle   = '#aaccee';
      ctx.font        = `bold ${Math.max(7, ~~(7*z))}px monospace`;
      ctx.textAlign   = 'center';
      const offY = (zt * 14 % (16*z));
      ctx.fillText('z', sx + Math.round(9*z), sy - Math.round(10*z) - offY);
      ctx.globalAlpha = za * 0.55;
      ctx.fillText('Z', sx + Math.round(14*z), sy - Math.round(18*z) - offY);
      ctx.restore();
    }

  } else {
    // ── Walking / idle pose ────────────────────────────────
    const walking = agent.state === 'walk';
    const ph      = agent.animTime * 6;
    const bob     = walking ? Math.abs(Math.sin(ph*2))*-1 : Math.sin(agent.animTime*1.5)*-0.4;
    const leg1Up  = walking ? Math.max(0, Math.sin(ph))          *3 : 0;
    const leg2Up  = walking ? Math.max(0, Math.sin(ph+Math.PI))  *3 : 0;
    const arm1dy  = walking ? Math.sin(ph+Math.PI)*2 : 0;
    const arm2dy  = walking ? Math.sin(ph)*2          : 0;

    const rb = (lx, ly, w, h, col) => r(lx, ly+bob, w, h, col);

    ctx.save(); ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.restore();

    rb(-1, -9+leg2Up, 3, 9-leg2Up, c.pants); rb(-1,-1,3,1,c.shoe);
    rb(-4,-15,8,6,c.shirt);
    rb(-6,-14+arm1dy,2,5,c.skin); rb(4,-14+arm2dy,2,5,c.skin);
    rb(-4,-9+leg1Up,3,9-leg1Up,c.pants); rb(-4,-1,3,1,c.shoe);
    rb(-3,-22,6,7,c.skin); rb(-3,-22,6,2,c.hair);
    if (agent.facingRight) { rb(1,-19,1,1,'#080808'); rb(3,-19,1,1,'#080808'); }
    else                   { rb(-4,-19,1,1,'#080808'); rb(-2,-19,1,1,'#080808'); }

    if (z >= 1.8) {
      ctx.save();
      ctx.font=`bold ${Math.max(8,~~(6.5*z))}px monospace`;
      ctx.fillStyle=c.shirt; ctx.textAlign='center';
      ctx.fillText(`A${agent.id+1}`, sx, sy-~~(25*z)-2);
      ctx.restore();
    }
  }

  // ── Status bars (hunger, energy, sleep) ───────────────────
  if (z >= 1.4) {
    const bw = Math.round(18 * z);   // bar width
    const bh = Math.max(2, Math.round(2.5 * z));
    const bx = sx - Math.round(9 * z);
    const topY = sy - Math.round((agent.state==='sleep' ? 14 : 28) * z) - bh*3 - 4;

    const bars = [
      { val: agent.hunger,        max:100,          color:'#48c840', label:'H' },
      { val: agent.energy,        max: agent.maxEnergy, color:'#e8c030', label:'E' },
      { val: agent.sleep,         max:100,          color:'#4898e8', label:'S' },
    ];
    bars.forEach((b, i) => {
      const by  = topY + i * (bh + 1);
      const pct = Math.max(0, Math.min(1, b.val / b.max));
      const col = pct < 0.25 ? '#e83030' : pct < 0.5 ? '#e09020' : b.color;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx-1, by-1, bw+2, bh+2);
      ctx.fillStyle = '#1a2a30';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = col;
      ctx.fillRect(bx, by, Math.round(pct * bw), bh);
    });
  }
}

// ── A* path visualisation ─────────────────────────────────────────────────────
function drawPaths(ctx, agents, surfaceYPx, cam) {
  const z=cam.zoom;
  for (const agent of agents) {
    if (!agent.path.length || agent.pathIdx>=agent.path.length) continue;
    ctx.save();
    ctx.strokeStyle=agent.colors.shirt; ctx.globalAlpha=0.4;
    ctx.lineWidth=Math.max(1,z*0.8);
    ctx.setLineDash([Math.round(3*z),Math.round(4*z)]);
    ctx.beginPath();
    ctx.moveTo(Math.round(agent.x*z-cam.x), Math.round(agent.y*z-cam.y));
    for (let i=agent.pathIdx;i<agent.path.length;i++) {
      const col=agent.path[i];
      ctx.lineTo(Math.round((col*TILE_SIZE+TILE_SIZE/2)*z-cam.x), Math.round(surfaceYPx[col]*z-cam.y));
    }
    ctx.stroke(); ctx.setLineDash([]);
    if (agent.goalCol>=0) {
      const gx=Math.round((agent.goalCol*TILE_SIZE+TILE_SIZE/2)*z-cam.x);
      const gy=Math.round(surfaceYPx[agent.goalCol]*z-cam.y);
      const fh=Math.round(10*z);
      ctx.globalAlpha=0.85; ctx.lineWidth=Math.max(1,z*0.7);
      ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx,gy-fh); ctx.stroke();
      ctx.fillStyle=agent.colors.shirt; ctx.globalAlpha=0.9;
      ctx.beginPath();
      ctx.moveTo(gx,gy-fh); ctx.lineTo(gx+Math.round(6*z),gy-fh+Math.round(3*z)); ctx.lineTo(gx,gy-fh+Math.round(6*z));
      ctx.fill();
    }
    ctx.restore();
  }
}

// ── Agent needs panel ──────────────────────────────────────────────────────────
function drawNeedsPanel(ctx, agents, W, H) {
  const ROW=13, PAD=7, PW=260;
  const heads=['AGENT','STATE','HUNGER','ENERGY','SLEEP'];
  const PH=(agents.length+2)*ROW+PAD*2;
  const px=W-PW-10, py=H-PH-10;
  const cx=[px+PAD,px+62,px+108,px+162,px+212];

  ctx.fillStyle='rgba(6,12,20,0.88)'; ctx.fillRect(px,py,PW,PH);
  ctx.strokeStyle='#2a4050'; ctx.lineWidth=1; ctx.strokeRect(px+.5,py+.5,PW-1,PH-1);
  ctx.font='bold 9px monospace'; ctx.fillStyle='#c98a63';
  for(let i=0;i<heads.length;i++) ctx.fillText(heads[i],cx[i],py+PAD+ROW-2);
  ctx.fillStyle='#2a4050'; ctx.fillRect(px+PAD,py+PAD+ROW+1,PW-PAD*2,1);

  for (let i=0;i<agents.length;i++) {
    const a=agents[i], ry=py+PAD+(i+2)*ROW-2;
    const stateCol={idle:'#8aaa70',walk:'#70aacc',sleep:'#8888ee'}[a.state]||'#888';

    ctx.font='bold 9px monospace';
    ctx.fillStyle=a.colors.shirt; ctx.fillRect(cx[0],ry-8,7,7);
    ctx.fillStyle='#9ab0bc'; ctx.fillText(`A${a.id+1}`,cx[0]+9,ry);

    ctx.font='9px monospace';
    ctx.fillStyle=stateCol; ctx.fillText(a.state,cx[1],ry);

    // Inline mini-bars for each need
    const drawBar=(x,val,max,col)=>{
      const bw=44, bh=6, pct=Math.max(0,Math.min(1,val/max));
      const fc=pct<0.25?'#e83030':pct<0.5?'#e09020':col;
      ctx.fillStyle='#1a2a30'; ctx.fillRect(x,ry-8,bw,bh);
      ctx.fillStyle=fc;        ctx.fillRect(x,ry-8,Math.round(pct*bw),bh);
      ctx.fillStyle='#506070'; ctx.strokeStyle='#2a4050';
      ctx.lineWidth=0.5; ctx.strokeRect(x,ry-8,bw,bh);
      ctx.fillStyle='#9ab0bc'; ctx.font='8px monospace';
      ctx.fillText(~~val,x+bw+3,ry);
    };
    drawBar(cx[2],      a.hunger, 100,         '#48c840');
    drawBar(cx[3],      a.energy, a.maxEnergy, '#e8c030');
    drawBar(cx[4],      a.sleep,  100,         '#4898e8');
  }
}

// ── initSimulation ─────────────────────────────────────────────────────────────
export function initSimulation(canvasId, sectionId) {
  const canvas  = document.getElementById(canvasId);
  const section = document.getElementById(sectionId);
  if (!canvas || !section) return;

  const ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  const cam={x:0,y:0,zoom:2,minZoom:0.5,maxZoom:6};

  // ── World ─────────────────────────────────────────────────────────
  const tiles=new Uint8Array(WORLD_W*WORLD_H);
  const surfaceYPx=new Uint16Array(WORLD_W);
  let avgSurfaceRow=60;

  (function generate() {
    const surface=new Float32Array(WORLD_W); let sum=0;
    for(let x=0;x<WORLD_W;x++) {
      const p=x/WORLD_W;
      const h=0.40*Math.sin(p*Math.PI*3.1+0.70)+0.22*Math.sin(p*Math.PI*7.3+1.40)
             +0.14*Math.sin(p*Math.PI*14.7+0.30)+0.07*Math.sin(p*Math.PI*27.1+2.00)
             +0.04*Math.sin(p*Math.PI*51.9+0.90);
      surface[x]=52+((h+0.87)/1.74)*16; sum+=surface[x];
    }
    avgSurfaceRow=sum/WORLD_W;
    for(let row=0;row<WORLD_H;row++) for(let col=0;col<WORLD_W;col++) {
      const s=surface[col]; let t;
      if(row<s) t=row>=WATER_ROW?TILE.WATER:TILE.SKY;
      else if(row<s+1) t=s>=WATER_ROW?TILE.DIRT:TILE.GRASS;
      else if(row<s+5) t=TILE.DIRT;
      else if(row<s+25) t=TILE.STONE;
      else t=TILE.DEEP_STONE;
      tiles[row*WORLD_W+col]=t;
    }
    let rng=0xdeadbeef;
    const rand=()=>{ rng=(Math.imul(rng,1664525)+1013904223)>>>0; return rng/0x100000000; };
    let nt=0;
    for(let col=2;col<WORLD_W-2;col++) {
      if(col<nt) continue;
      const sr=Math.floor(surface[col]);
      if(tiles[sr*WORLD_W+col]!==TILE.GRASS||rand()>0.45) continue;
      const th=3+~~(rand()*3),cw=1+~~(rand()*2),ch=1+~~(rand()*2),tt=sr-th;
      for(let r=sr-1;r>=tt;r--) if(r>=0) tiles[r*WORLD_W+col]=TILE.TREE_TRUNK;
      for(let dr=-ch-1;dr<=1;dr++) for(let dc=-cw-1;dc<=cw+1;dc++) {
        const r=tt-1+dr,c=col+dc;
        if(r<0||r>=WORLD_H||c<0||c>=WORLD_W) continue;
        if((dr/(ch+0.5))**2+(dc/(cw+0.5))**2>1.0) continue;
        if(tiles[r*WORLD_W+c]===TILE.SKY) tiles[r*WORLD_W+c]=TILE.TREE_LEAVES;
      }
      nt=col+3+~~(rand()*4);
    }
    const stoneTop=new Uint8Array(WORLD_W);
    for(let col=0;col<WORLD_W;col++) for(let row=0;row<WORLD_H;row++)
      if(tiles[row*WORLD_W+col]===TILE.STONE){stoneTop[col]=row;break;}
    const pv=(ore,n,mn,mx,sz)=>{
      for(let i=0;i<n;i++){
        let r=stoneTop[~~(rand()*(WORLD_W-2))]+mn+~~(rand()*(mx-mn)),c=1+~~(rand()*(WORLD_W-2));
        for(let j=0;j<sz;j++){
          if(r>=0&&r<WORLD_H&&c>=0&&c<WORLD_W&&tiles[r*WORLD_W+c]===TILE.STONE) tiles[r*WORLD_W+c]=ore;
          const d=~~(rand()*4);if(d===0)r--;else if(d===1)r++;else if(d===2)c--;else c++;
        }
      }
    };
    pv(TILE.ORE_COAL,45,1,8,5); pv(TILE.ORE_IRON,30,6,18,7);
    for(let col=0;col<WORLD_W;col++){
      let found=false;
      for(let row=0;row<WORLD_H;row++){
        const t=tiles[row*WORLD_W+col];
        if(t===TILE.GRASS||t===TILE.DIRT||t===TILE.STONE||t===TILE.DEEP_STONE){
          surfaceYPx[col]=row*TILE_SIZE; found=true; break;
        }
      }
      if(!found) surfaceYPx[col]=(WORLD_H-1)*TILE_SIZE;
    }
  })();

  // ── Agents ────────────────────────────────────────────────────────
  const agents=[];
  for(let i=0;i<6;i++){
    const col=Math.floor(15+(i/6)*(WORLD_W-30));
    agents.push(new Agent(i,col*TILE_SIZE+TILE_SIZE/2,surfaceYPx[col]));
  }
  for(const a of agents) a.chooseGoal(surfaceYPx);

  // ── Tile helpers ──────────────────────────────────────────────────
  function drawStdTile(px,py,pw,ph,idx){
    const s=STYLE[idx],ht=Math.max(1,~~(ph/5));
    ctx.fillStyle=s[0];ctx.fillRect(px,py,pw,ph);
    ctx.fillStyle=s[1];ctx.fillRect(px,py,pw,ht);
    ctx.fillStyle=s[2];ctx.fillRect(px,py+ph-ht,pw,ht);
  }
  function drawOreTile(px,py,pw,ph,dots,dc){
    drawStdTile(px,py,pw,ph,TILE.STONE);
    const ds=Math.max(2,~~(pw/5)); ctx.fillStyle=dc;
    for(const[fx,fy]of dots) ctx.fillRect(px+~~(fx*pw),py+~~(fy*ph),ds,ds);
  }

  // ── Render ────────────────────────────────────────────────────────
  let simTime=0;
  function render(dt){
    simTime+=dt;
    const W=canvas.width,H=canvas.height,ts=TILE_SIZE*cam.zoom;
    ctx.fillStyle='#060c14'; ctx.fillRect(0,0,W,H);

    const c0=Math.max(0,Math.floor(cam.x/ts));
    const r0=Math.max(0,Math.floor(cam.y/ts));
    const c1=Math.min(WORLD_W-1,Math.ceil((cam.x+W)/ts));
    const r1=Math.min(WORLD_H-1,Math.ceil((cam.y+H)/ts));

    for(let row=r0;row<=r1;row++) for(let col=c0;col<=c1;col++){
      const tile=tiles[row*WORLD_W+col];
      const px=Math.round(col*ts-cam.x),py=Math.round(row*ts-cam.y);
      const pw=Math.ceil(ts)+1,ph=Math.ceil(ts)+1;
      if(tile===TILE.WATER){
        const s=0.85+0.15*Math.sin(simTime*1.6+col*0.38+row*0.52);
        ctx.fillStyle=`rgb(${~~(30*s)},${~~(96*s)},${~~(187*s)})`;ctx.fillRect(px,py,pw,ph);
        ctx.fillStyle=`rgba(120,200,255,${0.22*s})`;ctx.fillRect(px,py,pw,Math.max(1,~~(ph*0.22)));
      } else if(tile===TILE.ORE_IRON){drawOreTile(px,py,pw,ph,IRON_DOTS,'#c8782a');
      } else if(tile===TILE.ORE_COAL){drawOreTile(px,py,pw,ph,COAL_DOTS,'#282838');
      } else {drawStdTile(px,py,pw,ph,tile);}
      if(ts>=14){ctx.strokeStyle='rgba(0,0,0,0.1)';ctx.lineWidth=0.5;ctx.strokeRect(px+.5,py+.5,pw-2,ph-2);}
    }

    drawPaths(ctx,agents,surfaceYPx,cam);
    for(const a of agents) drawAgent(ctx,a,cam);
    drawNeedsPanel(ctx,agents,W,H);

    // HUD bar
    ctx.fillStyle='rgba(6,12,20,0.82)'; ctx.fillRect(0,0,W,34);
    ctx.fillStyle='#c98a63'; ctx.font='bold 12px monospace'; ctx.fillText('AI LIFE SIMULATION',12,14);
    ctx.fillStyle='#4a6878'; ctx.font='10px monospace';
    ctx.fillText(`obj 6 — needs: hunger/energy/sleep  ·  drag/arrows  ·  scroll zoom  ·  ${cam.zoom.toFixed(1)}×`,12,28);
  }

  // ── Input ──────────────────────────────────────────────────────────
  let drag=null; const keys=new Set();
  canvas.addEventListener('mousedown',e=>{drag={mx:e.clientX,my:e.clientY,cx:cam.x,cy:cam.y};canvas.style.cursor='grabbing';});
  window.addEventListener('mousemove',e=>{if(!drag)return;cam.x=drag.cx-(e.clientX-drag.mx);cam.y=drag.cy-(e.clientY-drag.my);clampCam();});
  window.addEventListener('mouseup',()=>{drag=null;canvas.style.cursor='grab';});
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    const rect=canvas.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top,prev=cam.zoom;
    cam.zoom=Math.min(cam.maxZoom,Math.max(cam.minZoom,cam.zoom*(e.deltaY<0?1.15:1/1.15)));
    cam.x=mx-(mx-cam.x)*cam.zoom/prev; cam.y=my-(my-cam.y)*cam.zoom/prev; clampCam();
  },{passive:false});
  window.addEventListener('keydown',e=>keys.add(e.key));
  window.addEventListener('keyup',e=>keys.delete(e.key));
  function handleKeys(dt){
    const spd=280*dt;
    if(keys.has('ArrowLeft')||keys.has('a'))cam.x-=spd;
    if(keys.has('ArrowRight')||keys.has('d'))cam.x+=spd;
    if(keys.has('ArrowUp')||keys.has('w'))cam.y-=spd;
    if(keys.has('ArrowDown')||keys.has('s'))cam.y+=spd;
    clampCam();
  }
  function clampCam(){
    const ts=TILE_SIZE*cam.zoom;
    cam.x=Math.max(0,Math.min(Math.max(0,WORLD_W*ts-canvas.width),cam.x));
    cam.y=Math.max(0,Math.min(Math.max(0,WORLD_H*ts-canvas.height),cam.y));
  }

  // ── Resize ────────────────────────────────────────────────────────
  function resize(){canvas.width=section.clientWidth;canvas.height=section.clientHeight;clampCam();}
  new ResizeObserver(resize).observe(section); resize();
  const ts0=TILE_SIZE*cam.zoom;
  cam.x=(WORLD_W*ts0-canvas.width)/2;
  cam.y=Math.max(0,avgSurfaceRow*ts0-canvas.height*0.55);
  clampCam(); canvas.style.cursor='grab';

  // ── Loop ──────────────────────────────────────────────────────────
  let last=performance.now();
  function loop(now){
    const dt=Math.min(0.05,(now-last)/1000); last=now;
    handleKeys(dt);
    for(const a of agents) a.update(dt,surfaceYPx);
    render(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
