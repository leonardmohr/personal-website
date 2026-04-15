// simulation.js
// Objective 18: Reward function — tower height, shelter, food, energy rewards; starvation/collapse penalties

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

export const ACTION = Object.freeze({
  IDLE:0, HARVEST:1, MINE:2, DIG:3, CRAFT:4, SMELT:5,
  DEPOSIT:6, BUILD_HOUSE:7, EAT_BERRY:8, EAT_CROP:9, SLEEP:10,
  COUNT:11,
});
export const OBS_SIZE = 42;
const RESOURCE_SCAN_RADIUS = 40;
const TOWER_HEIGHT_MAX = 20;
const STATE_LIST = [
  'idle','walk','walk_to_sleep','sleep','harvest','mine','dig',
  'craft_pickaxe','smelt','deposit','build_house','eat_berry','eat_crop'
];

export const MATERIAL = Object.freeze({
  WOOD:    {id:0,name:'Wood',      color:'#8b5a2b',strength:30, weight:5, durability:40, buildTime:2.0,harvestTime:3.0, carryLimit:20,towerScore:1.0,requiresTool:false,source:TILE.TREE_TRUNK,recipe:null},
  STONE:   {id:1,name:'Stone',     color:'#808080',strength:55, weight:14,durability:80, buildTime:4.0,harvestTime:6.0, carryLimit:12,towerScore:1.8,requiresTool:true, source:TILE.STONE,    recipe:null},
  CLAY:    {id:2,name:'Clay Brick',color:'#b5734a',strength:38, weight:9, durability:60, buildTime:3.0,harvestTime:8.0, carryLimit:16,towerScore:1.4,requiresTool:false,source:null,          recipe:{dirt:2,water:1,processTime:5.0}},
  IRON:    {id:3,name:'Iron',      color:'#c0a878',strength:100,weight:18,durability:200,buildTime:6.0,harvestTime:12.0,carryLimit:8, towerScore:3.0,requiresTool:true, source:TILE.ORE_IRON, recipe:{oreIron:3,coal:1,processTime:10.0}},
  COAL:    {id:4,name:'Coal',      color:'#3a3a4a',strength:10, weight:4, durability:20, buildTime:0,  harvestTime:4.0, carryLimit:24,towerScore:0,  requiresTool:true, source:TILE.ORE_COAL, recipe:null},
  PICKAXE: {id:5,name:'Pickaxe',   color:'#a0a0a8',strength:0,  weight:3, durability:0,  buildTime:0,  harvestTime:0,   carryLimit:1, towerScore:0, requiresTool:false,source:null,           recipe:{wood:3}},
});
export const MATERIALS_BY_SCORE = Object.values(MATERIAL).filter(m=>m.towerScore>0).sort((a,b)=>b.towerScore-a.towerScore);

const NEEDS = Object.freeze({
  HUNGER_DRAIN:0.9, HUNGER_SEEK:40, HUNGER_FORCE:15, HUNGER_WORK_SLOW:15, HUNGER_STARVE_MULT:3.0,
  ENERGY_DRAIN_WALK:0.8, ENERGY_DRAIN_IDLE:0.22,
  ENERGY_RECOVER:3.2, ENERGY_RECOVER_HOUSE:6.0, SLEEP_DRAIN:0.38, SLEEP_RECOVER:2.8, SLEEP_RECOVER_HOUSE:4.5,
  SLEEP_TRIGGER:15, SLEEP_DROWSY:30, SLEEP_RELEASE:80, HUNGER_ENERGY_MULT:2.0,
});

const FOOD = Object.freeze({
  BERRY_HARVEST_TIME:1.5, BERRY_RESTORE:12, BERRY_AMT_MIN:3, BERRY_AMT_MAX:6, BERRY_RESPAWN_MIN:25, BERRY_RESPAWN_MAX:40,
  CROP_HARVEST_TIME:3.0,  CROP_RESTORE:20,  CROP_AMT_MIN:4,  CROP_AMT_MAX:8,  CROP_RESPAWN_MIN:40,  CROP_RESPAWN_MAX:60,
});

export const REWARD = Object.freeze({
  TOWER_DEPOSIT:2.0, HOUSE_DEPOSIT:1.5, TOWER_COLLAPSE:-4.0,
  HARVEST_COMPLETE:0.3, MINE_COMPLETE:0.4, SMELT_COMPLETE:0.6, CRAFT_COMPLETE:0.3, EAT_FOOD:0.5,
  ENERGY_COLLAPSE:-3.0,
  SURVIVAL_HEALTHY:0.1, SURVIVAL_OK:0.03, HUNGER_ZERO:-0.5, IDLE_PENALTY:-0.02,
});

const AGENT_COLORS = [
  {shirt:'#c83820',pants:'#2a3858',skin:'#f0c088',hair:'#281408',shoe:'#181008'},
  {shirt:'#2248c0',pants:'#3a2818',skin:'#f0c088',hair:'#180e04',shoe:'#100808'},
  {shirt:'#229840',pants:'#28283c',skin:'#d09860',hair:'#100e04',shoe:'#140808'},
  {shirt:'#c09018',pants:'#1a2a48',skin:'#f0c088',hair:'#381608',shoe:'#100808'},
  {shirt:'#9028b0',pants:'#302010',skin:'#e8b880',hair:'#080808',shoe:'#0c0808'},
  {shirt:'#18a0a8',pants:'#2e2416',skin:'#d8a870',hair:'#180804',shoe:'#100808'},
];

// ── A* ─────────────────────────────────────────────────────────────────────────
function aStar(startCol, goalCol, surfaceYPx) {
  if (startCol===goalCol) return [startCol];
  startCol=Math.max(0,Math.min(WORLD_W-1,startCol));
  goalCol =Math.max(0,Math.min(WORLD_W-1,goalCol));
  const INF=1e9;
  const gScore=new Float32Array(WORLD_W).fill(INF);
  const fScore=new Float32Array(WORLD_W).fill(INF);
  const cameFrom=new Int16Array(WORLD_W).fill(-1);
  const inOpen=new Uint8Array(WORLD_W);
  gScore[startCol]=0; fScore[startCol]=Math.abs(goalCol-startCol); inOpen[startCol]=1;
  const open=[startCol];
  while(open.length>0){
    let mi=0; for(let i=1;i<open.length;i++) if(fScore[open[i]]<fScore[open[mi]]) mi=i;
    const cur=open[mi]; open.splice(mi,1); inOpen[cur]=0;
    if(cur===goalCol){const p=[];for(let c=cur;c!==-1;c=cameFrom[c])p.unshift(c);return p;}
    for(const nb of[cur-1,cur+1]){
      if(nb<0||nb>=WORLD_W) continue;
      if(Math.abs(surfaceYPx[nb]-surfaceYPx[cur])>TILE_SIZE) continue;
      const tg=gScore[cur]+1;
      if(tg<gScore[nb]){
        cameFrom[nb]=cur;gScore[nb]=tg;fScore[nb]=tg+Math.abs(goalCol-nb);
        if(!inOpen[nb]){inOpen[nb]=1;open.push(nb);}
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
    this.state       = 'idle';   // idle | walk | walk_to_sleep | sleep | harvest | mine | dig | craft | smelt | deposit | build_house | eat_berry | eat_crop
    this.stateTimer  = Math.random() * 2;
    this.animTime    = Math.random() * 20;
    this.colors      = AGENT_COLORS[id % AGENT_COLORS.length];
    this.baseSpeed   = 16 + Math.random() * 12;

    // Needs
    this.hunger = 55 + Math.random() * 40;
    this.energy = 55 + Math.random() * 40;
    this.sleep  = 50 + Math.random() * 45;

    // Inventory
    this.inventory  = { wood: 0, stone: 0, coal: 0, ironOre: 0, dirt: 0, clay: 0, iron: 0 };
    this.hasPickaxe = false;

    // Pathfinding / task
    this.path        = [];
    this.pathIdx     = 0;
    this.goalCol     = -1;
    this.nextAction  = null;    // 'harvest' | 'mine' | 'dig' | 'craft' | 'smelt' | 'deposit' | 'build_house' | 'eat_berry' | 'eat_crop' | null
    this.targetTree  = null;
    this.targetOre   = null;
    this.targetPatch = null;
    this.targetBush  = null;
    this.targetCrop  = null;
    this.harvestTimer = 0;
    this.depositMat  = null;
    this.depositHouseMat = null;
    this.insideHouse = false;
    this.reward = 0;
    this.episodeReward = 0;
  }

  get speed() {
    return this.baseSpeed
      * (0.3 + 0.7 * (this.energy / 100))
      * (this.hunger < 20 ? 0.5 + 0.5 * (this.hunger / 20) : 1.0);
  }
  get maxEnergy() { return Math.max(30, this.sleep); }

  // ── Goal selection ─────────────────────────────────────────────
  chooseGoal(surfaceYPx, trees, oreNodes, mudPatches, waterEdgeCols, forge, buildSite, houseSite, berryBushes, cropPatches) {
    // Auto-craft pickaxe when idle and have enough wood
    if (!this.hasPickaxe && this.inventory.wood >= MATERIAL.PICKAXE.recipe.wood) {
      this.inventory.wood -= MATERIAL.PICKAXE.recipe.wood;
      this.hasPickaxe = true;
    }

    const canCarryClay = this.inventory.clay  < MATERIAL.CLAY.carryLimit;
    const canCraft     = canCarryClay && this.inventory.dirt >= 2 && waterEdgeCols.length > 0;
    const canDig       = canCarryClay && this.inventory.dirt < 6 && mudPatches.some(p=>p.state==='alive');
    const canHarvest   = this.inventory.wood  < MATERIAL.WOOD.carryLimit;
    const canMine      = this.hasPickaxe && (this.inventory.stone < MATERIAL.STONE.carryLimit
                           || this.inventory.coal < MATERIAL.COAL.carryLimit
                           || this.inventory.ironOre < MATERIAL.IRON.carryLimit);
    const canSmelt     = this.hasPickaxe && forge
                           && this.inventory.ironOre >= MATERIAL.IRON.recipe.oreIron
                           && this.inventory.coal    >= MATERIAL.IRON.recipe.coal
                           && this.inventory.iron    <  MATERIAL.IRON.carryLimit;
    const canDeposit   = buildSite && MATERIALS_BY_SCORE.some(m=>{
      const k=m===MATERIAL.IRON?'iron':m===MATERIAL.STONE?'stone':m===MATERIAL.CLAY?'clay':'wood';
      if(k==='wood'&&!this.hasPickaxe) return false;  // save wood for pickaxe first
      return this.inventory[k]>0;
    });
    const canBuildHouse = houseSite && !houseSite.isComplete && MATERIALS_BY_SCORE.some(m=>{
      const k=m===MATERIAL.IRON?'iron':m===MATERIAL.STONE?'stone':m===MATERIAL.CLAY?'clay':'wood';
      if(k==='wood'&&!this.hasPickaxe) return false;
      return this.inventory[k]>0;
    });

    // Food seeking — high priority when hungry
    const foodWeight = this.hunger < NEEDS.HUNGER_SEEK ? 35 : 0;
    const canEatBerry = foodWeight > 0 && berryBushes && berryBushes.some(b=>b.state==='alive');
    const canEatCrop  = foodWeight > 0 && cropPatches && cropPatches.some(c=>c.state==='alive');

    // Weighted random choice among available actions
    const opts = [];
    if (canEatBerry) opts.push({w:foodWeight, fn:()=>this._chooseEatBerryGoal(surfaceYPx, berryBushes)});
    if (canEatCrop)  opts.push({w:foodWeight, fn:()=>this._chooseEatCropGoal(surfaceYPx, cropPatches)});
    if (canDeposit) opts.push({w:40, fn:()=>this._chooseDepositGoal(surfaceYPx, buildSite)});
    if (canBuildHouse) opts.push({w:25, fn:()=>this._chooseHouseBuildGoal(surfaceYPx, houseSite)});
    if (canSmelt)   opts.push({w:30, fn:()=>this._chooseSmeltGoal(surfaceYPx, forge)});
    if (canCraft)   opts.push({w:20, fn:()=>this._chooseCraftGoal(surfaceYPx, waterEdgeCols)});
    if (canDig)     opts.push({w:12, fn:()=>this._chooseDigGoal(surfaceYPx, mudPatches)});
    if (canHarvest) opts.push({w:18, fn:()=>this._chooseHarvestGoal(surfaceYPx, trees)});
    if (canMine)    opts.push({w:18, fn:()=>this._chooseMineGoal(surfaceYPx, oreNodes)});
    opts.push({w:8, fn:()=>this._chooseWalkGoal(surfaceYPx)});

    const total = opts.reduce((s,o)=>s+o.w, 0);
    let r = Math.random() * total;
    for (const o of opts) { r -= o.w; if (r <= 0) { o.fn(); return; } }
    this._chooseWalkGoal(surfaceYPx);
  }

  _chooseWalkGoal(surfaceYPx) {
    const curCol = Math.max(0, Math.min(WORLD_W-1, Math.floor(this.x / TILE_SIZE)));
    let targetCol;
    for (let a=0; a<8; a++) {
      targetCol = 5 + Math.floor(Math.random() * (WORLD_W - 10));
      if (Math.abs(targetCol - curCol) >= 20) break;
    }
    const path = aStar(curCol, targetCol, surfaceYPx);
    if (path && path.length > 1) {
      this.path=path; this.pathIdx=1; this.goalCol=targetCol;
      this.nextAction=null; this.state='walk';
    } else {
      this.state='idle'; this.stateTimer=1+Math.random()*2; this.goalCol=-1;
    }
  }

  _chooseHarvestGoal(surfaceYPx, trees) {
    const curCol = Math.max(0, Math.min(WORLD_W-1, Math.floor(this.x / TILE_SIZE)));
    let best=null, bestDist=Infinity;
    for (const t of trees) {
      if (t.state !== 'alive') continue;
      const d = Math.abs(t.col - curCol);
      if (d < bestDist) { best=t; bestDist=d; }
    }
    if (!best) { this._chooseWalkGoal(surfaceYPx); return; }
    const path = aStar(curCol, best.col, surfaceYPx);
    if (path && path.length > 0) {
      this.path=path; this.pathIdx=Math.min(1,path.length-1);
      this.goalCol=best.col; this.targetTree=best;
      this.nextAction='harvest'; this.state='walk';
    } else {
      this._chooseWalkGoal(surfaceYPx);
    }
  }

  _chooseMineGoal(surfaceYPx, oreNodes) {
    const curCol = Math.max(0, Math.min(WORLD_W-1, Math.floor(this.x / TILE_SIZE)));
    let best=null, bestDist=Infinity;
    for (const n of oreNodes) {
      if (n.state !== 'alive') continue;
      const d = Math.abs(n.col - curCol);
      if (d < bestDist) { best=n; bestDist=d; }
    }
    if (!best) { this._chooseWalkGoal(surfaceYPx); return; }
    const path = aStar(curCol, best.col, surfaceYPx);
    if (path && path.length > 0) {
      this.path=path; this.pathIdx=Math.min(1,path.length-1);
      this.goalCol=best.col; this.targetOre=best;
      this.nextAction='mine'; this.state='walk';
    } else {
      this._chooseWalkGoal(surfaceYPx);
    }
  }

  _chooseDigGoal(surfaceYPx, mudPatches) {
    const curCol = Math.max(0, Math.min(WORLD_W-1, Math.floor(this.x / TILE_SIZE)));
    let best=null, bestDist=Infinity;
    for (const p of mudPatches) {
      if (p.state !== 'alive') continue;
      const d = Math.abs(p.col - curCol);
      if (d < bestDist) { best=p; bestDist=d; }
    }
    if (!best) { this._chooseWalkGoal(surfaceYPx); return; }
    const path = aStar(curCol, best.col, surfaceYPx);
    if (path && path.length > 0) {
      this.path=path; this.pathIdx=Math.min(1,path.length-1);
      this.goalCol=best.col; this.targetPatch=best;
      this.nextAction='dig'; this.state='walk';
    } else {
      this._chooseWalkGoal(surfaceYPx);
    }
  }

  _chooseCraftGoal(surfaceYPx, waterEdgeCols) {
    const curCol = Math.max(0, Math.min(WORLD_W-1, Math.floor(this.x / TILE_SIZE)));
    let best=waterEdgeCols[0], bestDist=Math.abs(waterEdgeCols[0]-curCol);
    for (const col of waterEdgeCols) {
      const d = Math.abs(col - curCol);
      if (d < bestDist) { best=col; bestDist=d; }
    }
    const path = aStar(curCol, best, surfaceYPx);
    if (path && path.length > 0) {
      this.path=path; this.pathIdx=Math.min(1,path.length-1);
      this.goalCol=best; this.nextAction='craft'; this.state='walk';
    } else {
      this._chooseWalkGoal(surfaceYPx);
    }
  }

  _chooseDepositGoal(surfaceYPx, buildSite) {
    const curCol=Math.max(0,Math.min(WORLD_W-1,Math.floor(this.x/TILE_SIZE)));
    const path=aStar(curCol,buildSite.col,surfaceYPx);
    if(path&&path.length>0){
      this.path=path;this.pathIdx=Math.min(1,path.length-1);
      this.goalCol=buildSite.col;this.nextAction='deposit';this.state='walk';
    }else{this._chooseWalkGoal(surfaceYPx);}
  }

  _chooseHouseBuildGoal(surfaceYPx, houseSite) {
    const curCol=Math.max(0,Math.min(WORLD_W-1,Math.floor(this.x/TILE_SIZE)));
    const path=aStar(curCol,houseSite.col,surfaceYPx);
    if(path&&path.length>0){
      this.path=path;this.pathIdx=Math.min(1,path.length-1);
      this.goalCol=houseSite.col;this.nextAction='build_house';this.state='walk';
    }else{this._chooseWalkGoal(surfaceYPx);}
  }

  _chooseEatBerryGoal(surfaceYPx, berryBushes) {
    const curCol=Math.max(0,Math.min(WORLD_W-1,Math.floor(this.x/TILE_SIZE)));
    let best=null,bestDist=Infinity;
    for(const b of berryBushes){if(b.state!=='alive')continue;const d=Math.abs(b.col-curCol);if(d<bestDist){best=b;bestDist=d;}}
    if(!best){this._chooseWalkGoal(surfaceYPx);return;}
    const path=aStar(curCol,best.col,surfaceYPx);
    if(path&&path.length>0){
      this.path=path;this.pathIdx=Math.min(1,path.length-1);
      this.goalCol=best.col;this.targetBush=best;this.nextAction='eat_berry';this.state='walk';
    }else{this._chooseWalkGoal(surfaceYPx);}
  }

  _chooseEatCropGoal(surfaceYPx, cropPatches) {
    const curCol=Math.max(0,Math.min(WORLD_W-1,Math.floor(this.x/TILE_SIZE)));
    let best=null,bestDist=Infinity;
    for(const c of cropPatches){if(c.state!=='alive')continue;const d=Math.abs(c.col-curCol);if(d<bestDist){best=c;bestDist=d;}}
    if(!best){this._chooseWalkGoal(surfaceYPx);return;}
    const path=aStar(curCol,best.col,surfaceYPx);
    if(path&&path.length>0){
      this.path=path;this.pathIdx=Math.min(1,path.length-1);
      this.goalCol=best.col;this.targetCrop=best;this.nextAction='eat_crop';this.state='walk';
    }else{this._chooseWalkGoal(surfaceYPx);}
  }

  _chooseSmeltGoal(surfaceYPx, forge) {
    const curCol = Math.max(0, Math.min(WORLD_W-1, Math.floor(this.x / TILE_SIZE)));
    const path = aStar(curCol, forge.col, surfaceYPx);
    if (path && path.length > 0) {
      this.path=path; this.pathIdx=Math.min(1,path.length-1);
      this.goalCol=forge.col; this.nextAction='smelt'; this.state='walk';
    } else {
      this._chooseWalkGoal(surfaceYPx);
    }
  }

  // ── Needs ──────────────────────────────────────────────────────
  updateNeeds(dt) {
    const mult = this.hunger === 0 ? NEEDS.HUNGER_STARVE_MULT : this.hunger < 25 ? NEEDS.HUNGER_ENERGY_MULT : 1.0;
    this.hunger = Math.max(0, this.hunger - NEEDS.HUNGER_DRAIN * dt);
    if (this.state === 'sleep') {
      const eRec = this.insideHouse ? NEEDS.ENERGY_RECOVER_HOUSE : NEEDS.ENERGY_RECOVER;
      const sRec = this.insideHouse ? NEEDS.SLEEP_RECOVER_HOUSE  : NEEDS.SLEEP_RECOVER;
      this.energy = Math.min(this.maxEnergy, this.energy + eRec * dt);
      this.sleep  = Math.min(100, this.sleep + sRec * dt);
    } else {
      const active = this.state==='walk'||this.state==='walk_to_sleep'||this.state==='harvest'||this.state==='mine'||this.state==='dig'||this.state==='smelt'||this.state==='deposit'||this.state==='build_house'||this.state==='eat_berry'||this.state==='eat_crop';
      this.energy = Math.max(0, this.energy - (active ? NEEDS.ENERGY_DRAIN_WALK : NEEDS.ENERGY_DRAIN_IDLE) * mult * dt);
      this.sleep  = Math.max(0, this.sleep - NEEDS.SLEEP_DRAIN * dt);
    }
  }

  // ── Observation & action space (RL) ─────────────────────────
  getObservation(surfaceYPx, trees, oreNodes, mudPatches, waterEdgeCols, forge, buildSite, houseSite, berryBushes, cropPatches, agents) {
    const obs = new Float32Array(OBS_SIZE);
    const curCol = Math.max(0, Math.min(WORLD_W - 1, Math.floor(this.x / TILE_SIZE)));

    // [0-2] Vitals
    obs[0] = this.hunger / 100;
    obs[1] = this.energy / 100;
    obs[2] = this.sleep  / 100;

    // [3-9] Inventory
    obs[3] = this.inventory.wood    / MATERIAL.WOOD.carryLimit;
    obs[4] = this.inventory.stone   / MATERIAL.STONE.carryLimit;
    obs[5] = this.inventory.coal    / MATERIAL.COAL.carryLimit;
    obs[6] = this.inventory.ironOre / MATERIAL.IRON.carryLimit;
    obs[7] = this.inventory.dirt    / 6;
    obs[8] = this.inventory.clay    / MATERIAL.CLAY.carryLimit;
    obs[9] = this.inventory.iron    / MATERIAL.IRON.carryLimit;

    // [10] Equipment
    obs[10] = this.hasPickaxe ? 1 : 0;

    // [11-20] Resource scanning: alive ratio + nearest distance per type
    const scanResources = (arr, aliveIdx, distIdx) => {
      let totalNearby = 0, aliveNearby = 0, nearestDist = WORLD_W;
      for (const r of arr) {
        const d = Math.abs(r.col - curCol);
        if (d <= RESOURCE_SCAN_RADIUS) { totalNearby++; if (r.state === 'alive') aliveNearby++; }
        if (r.state === 'alive' && d < nearestDist) nearestDist = d;
      }
      obs[aliveIdx] = totalNearby > 0 ? aliveNearby / totalNearby : 0;
      obs[distIdx]  = nearestDist < WORLD_W ? nearestDist / WORLD_W : 1;
    };
    scanResources(trees,       11, 16);
    scanResources(oreNodes,    12, 17);
    scanResources(mudPatches,  13, 18);
    scanResources(berryBushes, 14, 19);
    scanResources(cropPatches, 15, 20);

    // [21-23] Structure distances
    obs[21] = forge     ? Math.abs(forge.col     - curCol) / WORLD_W : 1;
    obs[22] = buildSite ? Math.abs(buildSite.col - curCol) / WORLD_W : 1;
    obs[23] = houseSite ? Math.abs(houseSite.col  - curCol) / WORLD_W : 1;

    // [24-36] State one-hot
    const stateIdx = STATE_LIST.indexOf(this.state);
    if (stateIdx >= 0) obs[24 + stateIdx] = 1;

    // [37-39] World progress
    obs[37] = buildSite ? Math.min(1, buildSite.levelCount / TOWER_HEIGHT_MAX) : 0;
    obs[38] = buildSite ? Math.min(1, buildSite.maxStress) : 0;
    obs[39] = houseSite ? houseSite.completionPct / 100 : 0;

    // [40] Tower score rank (0 = best, 1 = worst)
    if (buildSite && agents.length > 1) {
      const myScore = buildSite.agentScore(this.id);
      let betterCount = 0;
      for (const a of agents) { if (a.id !== this.id && buildSite.agentScore(a.id) > myScore) betterCount++; }
      obs[40] = betterCount / (agents.length - 1);
    }

    // [41] Inside house
    obs[41] = this.insideHouse ? 1 : 0;

    return obs;
  }

  getActionMask(trees, oreNodes, mudPatches, waterEdgeCols, forge, buildSite, houseSite, berryBushes, cropPatches) {
    const mask = new Uint8Array(ACTION.COUNT);
    mask[ACTION.IDLE] = 1;
    if (this.inventory.wood < MATERIAL.WOOD.carryLimit && trees.some(t => t.state === 'alive'))
      mask[ACTION.HARVEST] = 1;
    if (this.hasPickaxe
        && (this.inventory.stone < MATERIAL.STONE.carryLimit || this.inventory.coal < MATERIAL.COAL.carryLimit || this.inventory.ironOre < MATERIAL.IRON.carryLimit)
        && oreNodes.some(n => n.state === 'alive'))
      mask[ACTION.MINE] = 1;
    if (this.inventory.clay < MATERIAL.CLAY.carryLimit && this.inventory.dirt < 6 && mudPatches.some(p => p.state === 'alive'))
      mask[ACTION.DIG] = 1;
    if (this.inventory.clay < MATERIAL.CLAY.carryLimit && this.inventory.dirt >= 2 && waterEdgeCols.length > 0)
      mask[ACTION.CRAFT] = 1;
    if (this.hasPickaxe && forge
        && this.inventory.ironOre >= MATERIAL.IRON.recipe.oreIron
        && this.inventory.coal >= MATERIAL.IRON.recipe.coal
        && this.inventory.iron < MATERIAL.IRON.carryLimit)
      mask[ACTION.SMELT] = 1;
    if (buildSite) {
      for (const m of MATERIALS_BY_SCORE) {
        const k = m === MATERIAL.IRON ? 'iron' : m === MATERIAL.STONE ? 'stone' : m === MATERIAL.CLAY ? 'clay' : 'wood';
        if (k === 'wood' && !this.hasPickaxe) continue;
        if (this.inventory[k] > 0) { mask[ACTION.DEPOSIT] = 1; break; }
      }
    }
    if (houseSite && !houseSite.isComplete) {
      for (const m of MATERIALS_BY_SCORE) {
        const k = m === MATERIAL.IRON ? 'iron' : m === MATERIAL.STONE ? 'stone' : m === MATERIAL.CLAY ? 'clay' : 'wood';
        if (k === 'wood' && !this.hasPickaxe) continue;
        if (this.inventory[k] > 0) { mask[ACTION.BUILD_HOUSE] = 1; break; }
      }
    }
    if (this.hunger < NEEDS.HUNGER_SEEK && berryBushes && berryBushes.some(b => b.state === 'alive'))
      mask[ACTION.EAT_BERRY] = 1;
    if (this.hunger < NEEDS.HUNGER_SEEK && cropPatches && cropPatches.some(c => c.state === 'alive'))
      mask[ACTION.EAT_CROP] = 1;
    if (this.energy < NEEDS.SLEEP_DROWSY)
      mask[ACTION.SLEEP] = 1;
    return mask;
  }

  getValidActions(trees, oreNodes, mudPatches, waterEdgeCols, forge, buildSite, houseSite, berryBushes, cropPatches) {
    const mask = this.getActionMask(trees, oreNodes, mudPatches, waterEdgeCols, forge, buildSite, houseSite, berryBushes, cropPatches);
    const valid = [];
    for (let i = 0; i < ACTION.COUNT; i++) if (mask[i]) valid.push(i);
    return valid;
  }

  // ── Reward (RL) ─────────────────────────────────────────────
  updateReward(dt) {
    if (this.hunger > 50 && this.energy > 50 && this.sleep > 50) {
      this.reward += REWARD.SURVIVAL_HEALTHY * dt;
    } else if (this.hunger > 25 && this.energy > 25 && this.sleep > 25) {
      this.reward += REWARD.SURVIVAL_OK * dt;
    }
    if (this.hunger === 0) this.reward += REWARD.HUNGER_ZERO * dt;
    if (this.state === 'idle') this.reward += REWARD.IDLE_PENALTY * dt;
  }

  addReward(amount) { this.reward += amount; this.episodeReward += amount; }

  getReward() { const r = this.reward; this.reward = 0; return r; }

  // ── Main update ────────────────────────────────────────────────
  update(dt, surfaceYPx, trees, oreNodes, mudPatches, waterEdgeCols, forge, buildSite, houseSite, berryBushes, cropPatches) {
    this.animTime += dt;
    this.updateNeeds(dt);
    this.updateReward(dt);

    // Check if agent is inside the completed house
    const agentCol=Math.max(0,Math.min(WORLD_W-1,Math.floor(this.x/TILE_SIZE)));
    this.insideHouse=houseSite&&houseSite.isShelter&&houseSite.interiorCols.includes(agentCol);

    // Work speed penalty when starving
    const workDt=this.hunger<NEEDS.HUNGER_WORK_SLOW?dt*(0.4+0.6*this.hunger/NEEDS.HUNGER_WORK_SLOW):dt;

    // Sleep override — drowsy agents seek the house; exhausted agents collapse
    if (this.state !== 'sleep' && this.state !== 'walk_to_sleep' && this.energy < NEEDS.SLEEP_TRIGGER) {
      this.state='sleep'; this.path=[]; this.goalCol=-1; this.vx=0;
      this.targetTree=null; this.targetOre=null; this.targetPatch=null; this.targetForge=null;
      this.targetBush=null; this.targetCrop=null; this.addReward(REWARD.ENERGY_COLLAPSE); return;
    }
    if (this.state !== 'sleep' && this.state !== 'walk_to_sleep' && this.energy < NEEDS.SLEEP_DROWSY
        && houseSite && houseSite.isShelter && !this.insideHouse) {
      const path=aStar(agentCol,houseSite.col,surfaceYPx);
      if(path&&path.length>1){
        this.path=path;this.pathIdx=1;this.goalCol=houseSite.col;
        this.nextAction='go_sleep';this.state='walk_to_sleep';
        this.targetTree=null;this.targetOre=null;this.targetPatch=null;
        this.targetBush=null;this.targetCrop=null;
      } else {
        this.state='sleep';this.path=[];this.goalCol=-1;this.vx=0;
      }
      return;
    }
    if (this.state === 'sleep') {
      if (this.energy >= NEEDS.SLEEP_RELEASE) {
        this.state='idle'; this.stateTimer=0.5+Math.random();
        this.insideHouse=false;
      }
      return;
    }
    // Walk to house for sleep — same as walk but collapse to sleep on arrival or if energy bottoms out
    if (this.state === 'walk_to_sleep') {
      if (this.energy < NEEDS.SLEEP_TRIGGER) {
        this.state='sleep';this.path=[];this.goalCol=-1;this.vx=0;return;
      }
      if (this.pathIdx >= this.path.length) {
        this.state='sleep';this.path=[];this.goalCol=-1;this.vx=0;return;
      }
      // Walk logic (same as normal walk)
      const wpCol=this.path[this.pathIdx];
      const wpX=wpCol*TILE_SIZE+TILE_SIZE/2;
      const dx=wpX-this.x;
      if(Math.abs(dx)<1.5){this.x=wpX;this.y=surfaceYPx[wpCol];this.pathIdx++;}
      else{this.vx=Math.sign(dx)*this.speed;this.facingRight=dx>0;this.x+=this.vx*dt;const col=Math.max(0,Math.min(WORLD_W-1,Math.floor(this.x/TILE_SIZE)));this.y=surfaceYPx[col];}
      return;
    }

    // ── Hunger force-seek — starving agents interrupt tasks to find food
    if (this.state !== 'eat_berry' && this.state !== 'eat_crop' && this.hunger < NEEDS.HUNGER_FORCE) {
      // Find nearest alive food source
      let bestCol=-1,bestDist=Infinity,bestType=null,bestRef=null;
      if(berryBushes)for(const b of berryBushes){if(b.state!=='alive')continue;const d=Math.abs(b.col-agentCol);if(d<bestDist){bestDist=d;bestCol=b.col;bestType='eat_berry';bestRef=b;}}
      if(cropPatches)for(const c of cropPatches){if(c.state!=='alive')continue;const d=Math.abs(c.col-agentCol);if(d<bestDist){bestDist=d;bestCol=c.col;bestType='eat_crop';bestRef=c;}}
      if(bestRef){
        const path=aStar(agentCol,bestCol,surfaceYPx);
        if(path&&path.length>0){
          this.path=path;this.pathIdx=Math.min(1,path.length-1);this.goalCol=bestCol;
          this.nextAction=bestType;this.state='walk';
          if(bestType==='eat_berry'){this.targetBush=bestRef;this.targetCrop=null;}
          else{this.targetCrop=bestRef;this.targetBush=null;}
          this.targetTree=null;this.targetOre=null;this.targetPatch=null;
        }
      }
    }

    // ── Eat berry state ───────────────────────────────────────
    if (this.state === 'eat_berry') {
      this.vx=0;
      if(!this.targetBush||this.targetBush.state!=='alive'||this.hunger>=95){
        this.targetBush=null;this.state='idle';this.stateTimer=0.5+Math.random();return;
      }
      this.harvestTimer+=dt;
      if(this.harvestTimer>=FOOD.BERRY_HARVEST_TIME){
        this.harvestTimer=0;
        const restored=this.targetBush.harvest();
        this.hunger=Math.min(100,this.hunger+restored);
        this.addReward(REWARD.EAT_FOOD);
      }
      return;
    }

    // ── Eat crop state ────────────────────────────────────────
    if (this.state === 'eat_crop') {
      this.vx=0;
      if(!this.targetCrop||this.targetCrop.state!=='alive'||this.hunger>=95){
        this.targetCrop=null;this.state='idle';this.stateTimer=0.5+Math.random();return;
      }
      this.harvestTimer+=dt;
      if(this.harvestTimer>=FOOD.CROP_HARVEST_TIME){
        this.harvestTimer=0;
        const restored=this.targetCrop.harvest();
        this.hunger=Math.min(100,this.hunger+restored);
        this.addReward(REWARD.EAT_FOOD);
      }
      return;
    }

    // ── Harvest state ──────────────────────────────────────────
    if (this.state === 'harvest') {
      this.vx = 0;
      if (!this.targetTree || this.targetTree.state !== 'alive'
          || this.inventory.wood >= MATERIAL.WOOD.carryLimit) {
        this.targetTree=null; this.state='idle'; this.stateTimer=0.5+Math.random()*1.5;
        return;
      }
      this.harvestTimer += workDt;
      if (this.harvestTimer >= MATERIAL.WOOD.harvestTime) {
        this.harvestTimer = 0;
        this.inventory.wood += this.targetTree.harvest();
        this.addReward(REWARD.HARVEST_COMPLETE);
      }
      return;
    }

    // ── Mine state ─────────────────────────────────────────────
    if (this.state === 'mine') {
      this.vx = 0;
      const tt = this.targetOre?.tileType;
      const mat    = tt === TILE.ORE_COAL ? MATERIAL.COAL : tt === TILE.ORE_IRON ? MATERIAL.IRON : MATERIAL.STONE;
      const invKey = tt === TILE.ORE_COAL ? 'coal'        : tt === TILE.ORE_IRON ? 'ironOre'     : 'stone';
      if (!this.targetOre || this.targetOre.state !== 'alive'
          || this.inventory[invKey] >= mat.carryLimit) {
        this.targetOre=null; this.state='idle'; this.stateTimer=0.5+Math.random()*1.5;
        return;
      }
      this.harvestTimer += workDt;
      if (this.harvestTimer >= mat.harvestTime) {
        this.harvestTimer = 0;
        const result = this.targetOre.mine();
        if (result) { this.inventory[result.type] = Math.min(mat.carryLimit, this.inventory[result.type] + result.qty); this.addReward(REWARD.MINE_COMPLETE); }
      }
      return;
    }

    // ── Dig state ──────────────────────────────────────────────
    if (this.state === 'dig') {
      this.vx = 0;
      if (!this.targetPatch || this.targetPatch.state !== 'alive' || this.inventory.dirt >= 6) {
        this.targetPatch=null; this.state='idle'; this.stateTimer=0.5+Math.random()*1.5;
        return;
      }
      this.harvestTimer += workDt;
      if (this.harvestTimer >= 3.0) {
        this.harvestTimer = 0;
        this.inventory.dirt += this.targetPatch.dig();
      }
      return;
    }

    // ── Craft state ────────────────────────────────────────────
    if (this.state === 'craft') {
      this.vx = 0;
      if (this.inventory.dirt < 2 || this.inventory.clay >= MATERIAL.CLAY.carryLimit) {
        this.state='idle'; this.stateTimer=0.5+Math.random();
        return;
      }
      this.harvestTimer += workDt;
      if (this.harvestTimer >= MATERIAL.CLAY.recipe.processTime) {
        this.harvestTimer = 0;
        this.inventory.dirt -= 2;
        this.inventory.clay = Math.min(MATERIAL.CLAY.carryLimit, this.inventory.clay + 1);
        this.addReward(REWARD.CRAFT_COMPLETE);
      }
      return;
    }

    // ── Smelt state ────────────────────────────────────────────
    if (this.state === 'smelt') {
      this.vx = 0;
      const recipe = MATERIAL.IRON.recipe;
      if (this.inventory.ironOre < recipe.oreIron || this.inventory.coal < recipe.coal
          || this.inventory.iron >= MATERIAL.IRON.carryLimit || !forge) {
        this.state='idle'; this.stateTimer=0.5+Math.random();
        return;
      }
      forge.startSmelt();
      this.harvestTimer += workDt;
      if (this.harvestTimer >= recipe.processTime) {
        this.harvestTimer = 0;
        this.inventory.ironOre -= recipe.oreIron;
        this.inventory.coal    -= recipe.coal;
        this.inventory.iron     = Math.min(MATERIAL.IRON.carryLimit, this.inventory.iron + 1);
        this.addReward(REWARD.SMELT_COMPLETE);
      }
      return;
    }

    // ── Deposit state ──────────────────────────────────────────
    if (this.state === 'deposit') {
      this.vx=0;
      if(!this.depositMat){
        for(const m of MATERIALS_BY_SCORE){
          const k=m===MATERIAL.IRON?'iron':m===MATERIAL.STONE?'stone':m===MATERIAL.CLAY?'clay':'wood';
          if(this.inventory[k]>0){this.depositMat=m;break;}
        }
      }
      if(!this.depositMat||!buildSite){this.depositMat=null;this.state='idle';this.stateTimer=0.5+Math.random();return;}
      const mat=this.depositMat;
      const key=mat===MATERIAL.IRON?'iron':mat===MATERIAL.STONE?'stone':mat===MATERIAL.CLAY?'clay':'wood';
      if(this.inventory[key]<=0){this.depositMat=null;this.state='idle';this.stateTimer=0.1;return;}
      this.harvestTimer+=workDt;
      if(this.harvestTimer>=mat.buildTime){
        const preFlash=buildSite.collapseFlash;
        this.harvestTimer=0;this.inventory[key]--;buildSite.deposit(mat,this.id);this.depositMat=null;
        this.addReward(REWARD.TOWER_DEPOSIT*mat.towerScore);
        if(buildSite.collapseFlash>preFlash) this.addReward(REWARD.TOWER_COLLAPSE);
      }
      return;
    }

    // ── Build house state ──────────────────────────────────────
    if (this.state === 'build_house') {
      this.vx=0;
      if(!this.depositHouseMat){
        for(const m of MATERIALS_BY_SCORE){
          const k=m===MATERIAL.IRON?'iron':m===MATERIAL.STONE?'stone':m===MATERIAL.CLAY?'clay':'wood';
          if(this.inventory[k]>0){this.depositHouseMat=m;break;}
        }
      }
      if(!this.depositHouseMat||!houseSite||houseSite.isComplete){this.depositHouseMat=null;this.state='idle';this.stateTimer=0.5+Math.random();return;}
      const mat=this.depositHouseMat;
      const key=mat===MATERIAL.IRON?'iron':mat===MATERIAL.STONE?'stone':mat===MATERIAL.CLAY?'clay':'wood';
      if(this.inventory[key]<=0){this.depositHouseMat=null;this.state='idle';this.stateTimer=0.1;return;}
      this.harvestTimer+=workDt;
      if(this.harvestTimer>=mat.buildTime){
        this.harvestTimer=0;this.inventory[key]--;houseSite.deposit(mat,this.id);this.depositHouseMat=null;
        this.addReward(REWARD.HOUSE_DEPOSIT*mat.towerScore);
      }
      return;
    }

    // ── Idle ───────────────────────────────────────────────────
    if (this.state === 'idle') {
      this.vx = 0;
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) this.chooseGoal(surfaceYPx, trees, oreNodes, mudPatches, waterEdgeCols, forge, buildSite, houseSite, berryBushes, cropPatches);
      return;
    }

    // ── Walk ───────────────────────────────────────────────────
    if (this.pathIdx >= this.path.length) {
      if (this.nextAction === 'harvest' && this.targetTree?.state === 'alive') {
        this.state='harvest'; this.harvestTimer=0;
        this.facingRight = (this.targetTree.col * TILE_SIZE) >= this.x;
        this.nextAction=null;
      } else if (this.nextAction === 'mine' && this.targetOre?.state === 'alive') {
        this.state='mine'; this.harvestTimer=0;
        this.facingRight = (this.targetOre.col * TILE_SIZE) >= this.x;
        this.nextAction=null;
      } else if (this.nextAction === 'dig' && this.targetPatch?.state === 'alive') {
        this.state='dig'; this.harvestTimer=0;
        this.facingRight = (this.targetPatch.col * TILE_SIZE) >= this.x;
        this.nextAction=null;
      } else if (this.nextAction === 'craft') {
        this.state='craft'; this.harvestTimer=0;
        this.nextAction=null;
      } else if (this.nextAction === 'smelt' && forge) {
        this.state='smelt'; this.harvestTimer=0;
        this.facingRight = (forge.col * TILE_SIZE) >= this.x;
        this.nextAction=null;
      } else if (this.nextAction === 'deposit' && buildSite) {
        this.state='deposit'; this.harvestTimer=0; this.depositMat=null;
        this.facingRight=(buildSite.col*TILE_SIZE)>=this.x;
        this.nextAction=null;
      } else if (this.nextAction === 'build_house' && houseSite && !houseSite.isComplete) {
        this.state='build_house'; this.harvestTimer=0; this.depositHouseMat=null;
        this.facingRight=(houseSite.col*TILE_SIZE)>=this.x;
        this.nextAction=null;
      } else if (this.nextAction === 'eat_berry' && this.targetBush?.state === 'alive') {
        this.state='eat_berry'; this.harvestTimer=0;
        this.facingRight=(this.targetBush.col*TILE_SIZE)>=this.x;
        this.nextAction=null;
      } else if (this.nextAction === 'eat_crop' && this.targetCrop?.state === 'alive') {
        this.state='eat_crop'; this.harvestTimer=0;
        this.facingRight=(this.targetCrop.col*TILE_SIZE)>=this.x;
        this.nextAction=null;
      } else {
        this.path=[]; this.goalCol=-1; this.nextAction=null;
        this.targetTree=null; this.targetOre=null; this.targetPatch=null;
        this.targetBush=null; this.targetCrop=null;
        this.state='idle'; this.stateTimer=1+Math.random()*3; this.vx=0;
      }
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

// ── Sprite ─────────────────────────────────────────────────────────────────────
function drawAgent(ctx, agent, cam) {
  const z  = cam.zoom;
  const sx = Math.round(agent.x * z - cam.x);
  const sy = Math.round(agent.y * z - cam.y);
  const c  = agent.colors;

  const r = (lx,ly,w,h,col)=>{
    ctx.fillStyle=col;
    ctx.fillRect(Math.round(sx+lx*z),Math.round(sy+ly*z),Math.max(1,Math.round(w*z)),Math.max(1,Math.round(h*z)));
  };

  ctx.save(); ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.beginPath();
  ctx.ellipse(sx,sy,Math.round(6*z),Math.round(2*z),0,0,Math.PI*2); ctx.fill(); ctx.restore();

  if (agent.state === 'sleep') {
    r(-8,-5,14,5,c.pants); r(-8,-5,6,5,c.shirt);
    r(5,-8,6,6,c.skin); r(5,-8,6,2,c.hair);
    if (z>=1.4) {
      const zt=agent.animTime, za=Math.max(0,Math.sin(zt*0.9));
      const offY=(zt*14%(16*z));
      const zcol=agent.insideHouse?'#70e0a0':'#aaccee';
      ctx.save(); ctx.fillStyle=zcol; ctx.textAlign='center';
      ctx.globalAlpha=za*0.85; ctx.font=`bold ${Math.max(7,~~(7*z))}px monospace`;
      ctx.fillText('z',sx+Math.round(9*z),sy-Math.round(10*z)-offY);
      ctx.globalAlpha=za*0.55; ctx.fillText('Z',sx+Math.round(14*z),sy-Math.round(18*z)-offY);
      if(agent.insideHouse){
        ctx.globalAlpha=0.7; ctx.font=`bold ${Math.max(6,~~(5*z))}px monospace`;
        ctx.fillStyle='#70c0a0'; ctx.fillText('🏠',sx+Math.round(18*z),sy-Math.round(10*z));
      }
      ctx.restore();
    }

  } else if (agent.state === 'harvest' || agent.state === 'mine' || agent.state === 'dig' || agent.state === 'eat_berry' || agent.state === 'eat_crop') {
    const isMine = agent.state === 'mine';
    const isDig  = agent.state === 'dig';
    const isEatB = agent.state === 'eat_berry';
    const isEatC = agent.state === 'eat_crop';
    const tt     = agent.targetOre?.tileType;
    const matTime = isEatB ? FOOD.BERRY_HARVEST_TIME : isEatC ? FOOD.CROP_HARVEST_TIME
      : isMine ? (tt === TILE.ORE_COAL ? MATERIAL.COAL.harvestTime : tt === TILE.ORE_IRON ? MATERIAL.IRON.harvestTime : MATERIAL.STONE.harvestTime)
      : isDig ? 3.0
      : MATERIAL.WOOD.harvestTime;
    const prog  = agent.harvestTimer / matTime;
    const chopY = -Math.abs(Math.sin(prog * Math.PI)) * 6;
    const flip  = agent.facingRight ? 1 : -1;

    r(-1,-9,3,9,c.pants); r(-1,-1,3,1,c.shoe);
    r(-4,-15,8,6,c.shirt);
    r(-6,-14,2,5,c.skin);
    r(flip>0?4:-6,-14+chopY,2,5,c.skin);
    if (z>=1.5) {
      // axe=grey, pickaxe=silver/gold for iron ore, shovel=brown
      ctx.fillStyle = isMine ? (tt === TILE.ORE_IRON ? '#c0a878' : '#c0c0c8') : isDig ? '#9a7040' : '#a0a0a8';
      ctx.fillRect(Math.round(sx+(flip>0?6:-8)*z),Math.round(sy+(-14+chopY-2)*z),Math.max(1,Math.round(3*z)),Math.max(1,Math.round(4*z)));
    }
    r(-4,-9,3,9,c.pants); r(-4,-1,3,1,c.shoe);
    r(-3,-22,6,7,c.skin); r(-3,-22,6,2,c.hair);
    if (agent.facingRight) {r(1,-19,1,1,'#080808');r(3,-19,1,1,'#080808');}
    else                   {r(-4,-19,1,1,'#080808');r(-2,-19,1,1,'#080808');}

    if (z>=1.4) {
      const bw=Math.round(18*z), bh=Math.max(2,Math.round(2*z));
      const bx=sx-Math.round(9*z);
      ctx.fillStyle='#1a2a30'; ctx.fillRect(bx,sy+Math.round(2*z),bw,bh);
      ctx.fillStyle=isMine?(tt===TILE.ORE_IRON?'#c0a878':'#727272'):isDig?'#7a5228':'#8b5a2b';
      ctx.fillRect(bx,sy+Math.round(2*z),Math.round(prog*bw),bh);
    }

  } else if (agent.state === 'craft') {
    // Kneeling/mixing pose — arms out front, bobbing
    const prog  = agent.harvestTimer / MATERIAL.CLAY.recipe.processTime;
    const mixY  = Math.sin(agent.animTime * 6) * 2;   // arms oscillate
    r(-3,-8,6,8,c.pants); r(-3,-1,6,1,c.shoe);         // legs (crouched, shorter)
    r(-4,-14,8,6,c.shirt);                              // torso
    r(-6,-13+mixY,2,5,c.skin); r(4,-13-mixY,2,5,c.skin); // both arms mixing
    r(-3,-20,6,6,c.skin); r(-3,-20,6,2,c.hair);
    if (agent.facingRight){r(1,-17,1,1,'#080808');r(3,-17,1,1,'#080808');}
    else                  {r(-4,-17,1,1,'#080808');r(-2,-17,1,1,'#080808');}
    // Clay bowl hint
    if (z>=1.5) {
      ctx.fillStyle='#b5734a';
      ctx.fillRect(Math.round(sx-Math.round(3*z)),Math.round(sy-Math.round(3*z)),Math.max(2,Math.round(6*z)),Math.max(1,Math.round(2*z)));
    }
    if (z>=1.4) {
      const bw=Math.round(18*z), bh=Math.max(2,Math.round(2*z));
      const bx=sx-Math.round(9*z);
      ctx.fillStyle='#1a2a30'; ctx.fillRect(bx,sy+Math.round(2*z),bw,bh);
      ctx.fillStyle='#b5734a';
      ctx.fillRect(bx,sy+Math.round(2*z),Math.round(prog*bw),bh);
    }

  } else if (agent.state === 'deposit' || agent.state === 'build_house') {
    const mat   = agent.state==='build_house' ? agent.depositHouseMat : agent.depositMat;
    const bTime = mat ? mat.buildTime : 1;
    const prog  = agent.harvestTimer / bTime;
    const flip  = agent.facingRight ? 1 : -1;
    r(-1,-9,3,9,c.pants); r(-1,-1,3,1,c.shoe);
    r(-4,-15,8,6,c.shirt);
    r(-6,-14,2,5,c.skin);
    r(flip>0?4:-6,-14,2,5,c.skin);
    if(z>=1.5&&mat){
      ctx.fillStyle=mat.color;
      ctx.fillRect(Math.round(sx+(flip>0?6:-10)*z),Math.round(sy-14*z),Math.max(2,Math.round(4*z)),Math.max(2,Math.round(4*z)));
    }
    r(-4,-9,3,9,c.pants); r(-4,-1,3,1,c.shoe);
    r(-3,-22,6,7,c.skin); r(-3,-22,6,2,c.hair);
    if(agent.facingRight){r(1,-19,1,1,'#080808');r(3,-19,1,1,'#080808');}
    else                 {r(-4,-19,1,1,'#080808');r(-2,-19,1,1,'#080808');}
    if(z>=1.4){
      const bw=Math.round(18*z),bh=Math.max(2,Math.round(2*z));
      const dbx=sx-Math.round(9*z);
      ctx.fillStyle='#1a2a30'; ctx.fillRect(dbx,sy+Math.round(2*z),bw,bh);
      ctx.fillStyle='#d4a830'; ctx.fillRect(dbx,sy+Math.round(2*z),Math.round(prog*bw),bh);
    }

  } else if (agent.state === 'smelt') {
    // Hammering pose at forge — arm swings down repeatedly
    const prog   = agent.harvestTimer / MATERIAL.IRON.recipe.processTime;
    const flip   = agent.facingRight ? 1 : -1;
    const hammerY = -Math.abs(Math.sin(agent.animTime * 4)) * 8;
    r(-1,-9,3,9,c.pants); r(-1,-1,3,1,c.shoe);
    r(-4,-15,8,6,c.shirt);
    r(-6,-14,2,5,c.skin);
    r(flip>0?4:-6,-14+hammerY,2,5,c.skin);
    if (z>=1.5) {
      // Hammer head (dark iron)
      ctx.fillStyle='#484858';
      ctx.fillRect(Math.round(sx+(flip>0?6:-9)*z),Math.round(sy+(-16+hammerY)*z),Math.max(2,Math.round(4*z)),Math.max(2,Math.round(3*z)));
      // Hammer handle
      ctx.fillStyle='#7a5228';
      ctx.fillRect(Math.round(sx+(flip>0?7:-8)*z),Math.round(sy+(-14+hammerY)*z),Math.max(1,Math.round(2*z)),Math.max(2,Math.round(5*z)));
    }
    r(-4,-9,3,9,c.pants); r(-4,-1,3,1,c.shoe);
    r(-3,-22,6,7,c.skin); r(-3,-22,6,2,c.hair);
    if (agent.facingRight){r(1,-19,1,1,'#080808');r(3,-19,1,1,'#080808');}
    else                  {r(-4,-19,1,1,'#080808');r(-2,-19,1,1,'#080808');}
    if (z>=1.4) {
      const bw=Math.round(18*z), bh=Math.max(2,Math.round(2*z));
      const bx=sx-Math.round(9*z);
      ctx.fillStyle='#1a2a30'; ctx.fillRect(bx,sy+Math.round(2*z),bw,bh);
      ctx.fillStyle='#c0a878';
      ctx.fillRect(bx,sy+Math.round(2*z),Math.round(prog*bw),bh);
    }

  } else {
    const walking=agent.state==='walk'||agent.state==='walk_to_sleep';
    const ph=agent.animTime*6;
    const bob=walking?Math.abs(Math.sin(ph*2))*-1:Math.sin(agent.animTime*1.5)*-0.4;
    const l1=walking?Math.max(0,Math.sin(ph))*3:0;
    const l2=walking?Math.max(0,Math.sin(ph+Math.PI))*3:0;
    const a1=walking?Math.sin(ph+Math.PI)*2:0;
    const a2=walking?Math.sin(ph)*2:0;
    const rb=(lx,ly,w,h,col)=>r(lx,ly+bob,w,h,col);
    rb(-1,-9+l2,3,9-l2,c.pants); rb(-1,-1,3,1,c.shoe);
    rb(-4,-15,8,6,c.shirt);
    rb(-6,-14+a1,2,5,c.skin); rb(4,-14+a2,2,5,c.skin);
    rb(-4,-9+l1,3,9-l1,c.pants); rb(-4,-1,3,1,c.shoe);
    rb(-3,-22,6,7,c.skin); rb(-3,-22,6,2,c.hair);
    if (agent.facingRight){rb(1,-19,1,1,'#080808');rb(3,-19,1,1,'#080808');}
    else                  {rb(-4,-19,1,1,'#080808');rb(-2,-19,1,1,'#080808');}
    if (z>=1.8){
      ctx.save(); ctx.font=`bold ${Math.max(8,~~(6.5*z))}px monospace`;
      ctx.fillStyle=c.shirt; ctx.textAlign='center';
      ctx.fillText(`A${agent.id+1}`,sx,sy-~~(25*z)-2); ctx.restore();
    }
  }

  // Status bars (H/E/S)
  if (z>=1.4) {
    const bw=Math.round(18*z), bh=Math.max(2,Math.round(2.5*z));
    const bx=sx-Math.round(9*z);
    const topY=sy-Math.round((agent.state==='sleep'?14:28)*z)-bh*3-4;
    [{val:agent.hunger,max:100,color:'#48c840'},
     {val:agent.energy,max:agent.maxEnergy,color:'#e8c030'},
     {val:agent.sleep, max:100,color:'#4898e8'}
    ].forEach((b,i)=>{
      const by=topY+i*(bh+1), pct=Math.max(0,Math.min(1,b.val/b.max));
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(bx-1,by-1,bw+2,bh+2);
      ctx.fillStyle='#1a2a30';         ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle=pct<0.25?'#e83030':pct<0.5?'#e09020':b.color;
      ctx.fillRect(bx,by,Math.round(pct*bw),bh);
    });
  }
}

// ── Path visualisation ─────────────────────────────────────────────────────────
function drawPaths(ctx, agents, surfaceYPx, cam) {
  const z=cam.zoom;
  for (const a of agents) {
    if (!a.path.length||a.pathIdx>=a.path.length) continue;
    ctx.save(); ctx.strokeStyle=a.colors.shirt; ctx.globalAlpha=0.4;
    ctx.lineWidth=Math.max(1,z*0.8); ctx.setLineDash([Math.round(3*z),Math.round(4*z)]);
    ctx.beginPath(); ctx.moveTo(Math.round(a.x*z-cam.x),Math.round(a.y*z-cam.y));
    for(let i=a.pathIdx;i<a.path.length;i++){
      const col=a.path[i];
      ctx.lineTo(Math.round((col*TILE_SIZE+TILE_SIZE/2)*z-cam.x),Math.round(surfaceYPx[col]*z-cam.y));
    }
    ctx.stroke(); ctx.setLineDash([]);
    if (a.goalCol>=0) {
      const gx=Math.round((a.goalCol*TILE_SIZE+TILE_SIZE/2)*z-cam.x);
      const gy=Math.round(surfaceYPx[a.goalCol]*z-cam.y), fh=Math.round(10*z);
      ctx.globalAlpha=0.85; ctx.lineWidth=Math.max(1,z*0.7);
      ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx,gy-fh); ctx.stroke();
      ctx.fillStyle=a.colors.shirt; ctx.globalAlpha=0.9;
      ctx.beginPath(); ctx.moveTo(gx,gy-fh);
      ctx.lineTo(gx+Math.round(6*z),gy-fh+Math.round(3*z));
      ctx.lineTo(gx,gy-fh+Math.round(6*z)); ctx.fill();
    }
    ctx.restore();
  }
}

// ── Needs + inventory panel ────────────────────────────────────────────────────
function drawNeedsPanel(ctx, agents, W, H, buildSite, houseSite) {
  const ROW=13,PAD=7,PW=600;
  const heads=['AGT','STATE','HGR','NRG','SLP','WD','STN','COAL','ORE','DRT','CLY','IRN','⛏','TWR','HSE'];
  const PH=(agents.length+2)*ROW+PAD*2, px=W-PW-10, py=H-PH-10;
  const cx=[px+PAD,px+46,px+96,px+138,px+180,px+222,px+254,px+284,px+314,px+346,px+378,px+410,px+442,px+474,px+508];

  ctx.fillStyle='rgba(6,12,20,0.88)'; ctx.fillRect(px,py,PW,PH);
  ctx.strokeStyle='#2a4050'; ctx.lineWidth=1; ctx.strokeRect(px+.5,py+.5,PW-1,PH-1);
  ctx.font='bold 9px monospace'; ctx.fillStyle='#c98a63';
  for(let i=0;i<heads.length;i++) ctx.fillText(heads[i],cx[i],py+PAD+ROW-2);
  ctx.fillStyle='#2a4050'; ctx.fillRect(px+PAD,py+PAD+ROW+1,PW-PAD*2,1);

  const drawBar=(x,y,val,max,col)=>{
    const bw=32,bh=6,pct=Math.max(0,Math.min(1,val/max));
    const fc=pct<0.25?'#e83030':pct<0.5?'#e09020':col;
    ctx.fillStyle='#1a2a30'; ctx.fillRect(x,y-8,bw,bh);
    ctx.fillStyle=fc;        ctx.fillRect(x,y-8,Math.round(pct*bw),bh);
    ctx.strokeStyle='#2a4050'; ctx.lineWidth=0.5; ctx.strokeRect(x,y-8,bw,bh);
    ctx.fillStyle='#7a9aaa'; ctx.font='8px monospace';
    ctx.fillText(~~val,x+bw+3,y);
  };

  for(let i=0;i<agents.length;i++){
    const a=agents[i], ry=py+PAD+(i+2)*ROW-2;
    ctx.font='bold 9px monospace';
    ctx.fillStyle=a.colors.shirt; ctx.fillRect(cx[0],ry-8,7,7);
    ctx.fillStyle='#9ab0bc'; ctx.fillText(`A${a.id+1}`,cx[0]+9,ry);
    ctx.font='9px monospace';
    ctx.fillStyle={idle:'#8aaa70',walk:'#70aacc',walk_to_sleep:'#7888cc',sleep:'#8888ee',harvest:'#c8a040',mine:'#a0a0c8',dig:'#c8a060',craft:'#e08840',smelt:'#e0a030',deposit:'#d4a830',build_house:'#70c0a0',eat_berry:'#cc2244',eat_crop:'#d4a830'}[a.state]||'#888';
    ctx.fillText(a.state,cx[1],ry);
    drawBar(cx[2],ry,a.hunger,100,'#48c840');
    drawBar(cx[3],ry,a.energy,a.maxEnergy,'#e8c030');
    drawBar(cx[4],ry,a.sleep,100,'#4898e8');
    ctx.font='bold 9px monospace';
    ctx.fillStyle=a.inventory.wood   >0?'#c8a060':'#4a6878'; ctx.fillText(`🪵${a.inventory.wood}`,  cx[5],ry);
    ctx.fillStyle=a.inventory.stone  >0?'#909090':'#4a6878'; ctx.fillText(a.inventory.stone,          cx[6],ry);
    ctx.fillStyle=a.inventory.coal   >0?'#6868a0':'#4a6878'; ctx.fillText(a.inventory.coal,           cx[7],ry);
    ctx.fillStyle=a.inventory.ironOre>0?'#c89050':'#4a6878'; ctx.fillText(a.inventory.ironOre,        cx[8],ry);
    ctx.fillStyle=a.inventory.dirt   >0?'#9a7040':'#4a6878'; ctx.fillText(a.inventory.dirt,           cx[9],ry);
    ctx.fillStyle=a.inventory.clay   >0?'#c87840':'#4a6878'; ctx.fillText(a.inventory.clay,           cx[10],ry);
    ctx.fillStyle=a.inventory.iron   >0?'#c0a878':'#4a6878'; ctx.fillText(a.inventory.iron,           cx[11],ry);
    ctx.fillStyle=a.hasPickaxe?'#d0d0e8':'#4a6878';          ctx.fillText(a.hasPickaxe?'Y':'–',       cx[12],ry);
    const tsc=buildSite?buildSite.agentScore(a.id):0;
    ctx.fillStyle=tsc>0?'#d4a830':'#4a6878'; ctx.fillText(`${tsc}`,cx[13],ry);
    const hsc=houseSite?houseSite.agentScore(a.id):0;
    ctx.fillStyle=hsc>0?'#70c0a0':'#4a6878'; ctx.fillText(`${hsc}`,cx[14],ry);
  }
}

// ── initSimulation ─────────────────────────────────────────────────────────────
export function initSimulation(canvasId, sectionId) {
  const canvas  = document.getElementById(canvasId);
  const section = document.getElementById(sectionId);
  if (!canvas || !section) return;
  const ctx=canvas.getContext('2d'); ctx.imageSmoothingEnabled=false;
  const cam={x:0,y:0,zoom:2,minZoom:0.5,maxZoom:6};

  const tiles        = new Uint8Array(WORLD_W * WORLD_H);
  const surfaceYPx   = new Uint16Array(WORLD_W);
  const trees        = [];
  const oreNodes     = [];
  const mudPatches   = [];
  const waterEdgeCols= [];
  const berryBushes  = [];
  const cropPatches  = [];
  let avgSurfaceRow  = 60;

  // ── Tree class ────────────────────────────────────────────────
  class Tree {
    constructor(col, surfRow, topRow, leafTiles, woodAmt) {
      this.col=col; this.surfRow=surfRow; this.topRow=topRow; this.leafTiles=leafTiles;
      this.woodMax=woodAmt; this.wood=woodAmt; this.state='alive';
      this.respawnTimer=0; this.respawnTime=35+Math.random()*25;
    }
    harvest() {
      if(this.wood<=0||this.state!=='alive') return 0;
      this.wood--;
      if(this.wood===0) this._deplete();
      return 1;
    }
    _deplete() {
      this.state='depleted';
      for(let r=this.topRow;r<this.surfRow;r++) tiles[r*WORLD_W+this.col]=TILE.SKY;
      for(const[lr,lc]of this.leafTiles) if(tiles[lr*WORLD_W+lc]===TILE.TREE_LEAVES) tiles[lr*WORLD_W+lc]=TILE.SKY;
      this.respawnTimer=this.respawnTime;
    }
    _regrow() {
      this.state='alive'; this.wood=this.woodMax;
      for(let r=this.topRow;r<this.surfRow;r++) tiles[r*WORLD_W+this.col]=TILE.TREE_TRUNK;
      for(const[lr,lc]of this.leafTiles) if(tiles[lr*WORLD_W+lc]===TILE.SKY) tiles[lr*WORLD_W+lc]=TILE.TREE_LEAVES;
    }
    update(dt) { if(this.state!=='depleted') return; this.respawnTimer-=dt; if(this.respawnTimer<=0) this._regrow(); }
    get basePxY() { return (this.surfRow-1)*TILE_SIZE; }
  }

  // ── OreNode class ─────────────────────────────────────────────
  class OreNode {
    constructor(col, surfRow, tileType) {
      this.col=col; this.surfRow=surfRow; this.tileType=tileType;
      this.amountMax=tileType===TILE.ORE_COAL?8+~~(Math.random()*8):6+~~(Math.random()*6);
      this.amount=this.amountMax; this.state='alive';
      this.respawnTimer=0; this.respawnTime=20+Math.random()*15;
    }
    mine() {
      if(this.amount<=0||this.state!=='alive') return null;
      this.amount--;
      const type=this.tileType===TILE.ORE_COAL?'coal':this.tileType===TILE.ORE_IRON?'ironOre':'stone';
      if(this.amount===0) this._deplete();
      return{type,qty:1};
    }
    _deplete() { this.state='depleted'; tiles[this.surfRow*WORLD_W+this.col]=TILE.DIRT; this.respawnTimer=this.respawnTime; }
    _regrow()  { this.state='alive'; this.amount=this.amountMax; tiles[this.surfRow*WORLD_W+this.col]=this.tileType; }
    update(dt) { if(this.state!=='depleted') return; this.respawnTimer-=dt; if(this.respawnTimer<=0) this._regrow(); }
    get basePxY() { return this.surfRow*TILE_SIZE; }
  }

  // ── MudPatch class ────────────────────────────────────────────
  class MudPatch {
    constructor(col, surfRow) {
      this.col=col; this.surfRow=surfRow;
      this.amountMax=6+~~(Math.random()*6); this.amount=this.amountMax;
      this.state='alive'; this.respawnTimer=0; this.respawnTime=15+Math.random()*10;
    }
    dig() {
      if(this.amount<=0||this.state!=='alive') return 0;
      this.amount--;
      if(this.amount===0) this._deplete();
      return 1;
    }
    _deplete() { this.state='depleted'; this.respawnTimer=this.respawnTime; }
    _regrow()  { this.state='alive'; this.amount=this.amountMax; }
    update(dt) { if(this.state!=='depleted') return; this.respawnTimer-=dt; if(this.respawnTimer<=0) this._regrow(); }
    get basePxY() { return this.surfRow*TILE_SIZE; }
  }

  // ── BerryBush class ────────────────────────────────────────────
  class BerryBush {
    constructor(col,surfRow){
      this.col=col;this.surfRow=surfRow;
      this.amountMax=FOOD.BERRY_AMT_MIN+~~(Math.random()*(FOOD.BERRY_AMT_MAX-FOOD.BERRY_AMT_MIN+1));
      this.amount=this.amountMax;this.state='alive';
      this.respawnTimer=0;this.respawnTime=FOOD.BERRY_RESPAWN_MIN+Math.random()*(FOOD.BERRY_RESPAWN_MAX-FOOD.BERRY_RESPAWN_MIN);
    }
    harvest(){if(this.amount<=0||this.state!=='alive')return 0;this.amount--;if(this.amount===0)this._deplete();return FOOD.BERRY_RESTORE;}
    _deplete(){this.state='depleted';this.respawnTimer=this.respawnTime;}
    _regrow(){this.state='alive';this.amount=this.amountMax;}
    update(dt){if(this.state!=='depleted')return;this.respawnTimer-=dt;if(this.respawnTimer<=0)this._regrow();}
    get basePxY(){return this.surfRow*TILE_SIZE;}
  }

  // ── CropPatch class ───────────────────────────────────────────
  class CropPatch {
    constructor(col,surfRow){
      this.col=col;this.surfRow=surfRow;
      this.amountMax=FOOD.CROP_AMT_MIN+~~(Math.random()*(FOOD.CROP_AMT_MAX-FOOD.CROP_AMT_MIN+1));
      this.amount=this.amountMax;this.state='alive';
      this.respawnTimer=0;this.respawnTime=FOOD.CROP_RESPAWN_MIN+Math.random()*(FOOD.CROP_RESPAWN_MAX-FOOD.CROP_RESPAWN_MIN);
    }
    harvest(){if(this.amount<=0||this.state!=='alive')return 0;this.amount--;if(this.amount===0)this._deplete();return FOOD.CROP_RESTORE;}
    _deplete(){this.state='depleted';this.respawnTimer=this.respawnTime;}
    _regrow(){this.state='alive';this.amount=this.amountMax;}
    update(dt){if(this.state!=='depleted')return;this.respawnTimer-=dt;if(this.respawnTimer<=0)this._regrow();}
    get basePxY(){return this.surfRow*TILE_SIZE;}
  }

  // ── Forge class ───────────────────────────────────────────────
  class Forge {
    constructor(col, surfRow) {
      this.col=col; this.surfRow=surfRow;
      this.fireTime=0; this.active=false; this.activeTimer=0;
    }
    startSmelt() { this.active=true; this.activeTimer=0.8; }
    update(dt) {
      this.fireTime+=dt;
      if(this.active){ this.activeTimer-=dt; if(this.activeTimer<=0) this.active=false; }
    }
    get basePxY() { return this.surfRow*TILE_SIZE; }
  }

  // ── BuildSite class ───────────────────────────────────────────
  class BuildSite {
    constructor(col,surfRow){
      this.col=col;this.surfRow=surfRow;
      this.levels=[];           // {mat, agentId}
      this.depositBuffer=0;this.score=0;
      this.pendingAgent=-1;
      this.debris=[];           // falling debris particles from collapse
      this.collapseFlash=0;     // flash timer after collapse
    }
    deposit(mat,agentId){
      this.depositBuffer+=mat.towerScore;this.score+=mat.towerScore;
      this.pendingAgent=agentId;
      while(this.depositBuffer>=5.0){this.depositBuffer-=5.0;this.levels.push({mat,agentId:this.pendingAgent});}
      this.checkStability();
    }
    /** Check structural stability — each layer must support the weight above it */
    checkStability(){
      for(let i=0;i<this.levels.length;i++){
        const layer=this.levels[i];
        let weightAbove=0;
        for(let j=i+1;j<this.levels.length;j++) weightAbove+=this.levels[j].mat.weight;
        if(weightAbove>layer.mat.strength){
          // Collapse from layer i+1 upward
          const collapsed=this.levels.splice(i+1);
          let lostScore=0;
          for(const lv of collapsed) lostScore+=lv.mat.towerScore;
          this.score=Math.max(0,this.score-lostScore);
          this.depositBuffer=0;
          this.collapseFlash=1.5;
          // Spawn debris particles
          const baseY=this.surfRow*TILE_SIZE-(i+1)*TILE_SIZE;
          for(const lv of collapsed){
            for(let p=0;p<3;p++){
              this.debris.push({
                x:this.col*TILE_SIZE+(Math.random()-0.5)*TILE_SIZE*2.5,
                y:baseY-Math.random()*TILE_SIZE*collapsed.length,
                vx:(Math.random()-0.5)*40,
                vy:-20-Math.random()*30,
                color:lv.mat.color,
                life:1.5+Math.random()*1.0,
                size:3+Math.random()*4,
              });
            }
          }
          return;
        }
      }
    }
    /** Stress ratio of the weakest layer (0=safe, 1=collapse) */
    get maxStress(){
      let worst=0;
      for(let i=0;i<this.levels.length;i++){
        let wAbove=0;
        for(let j=i+1;j<this.levels.length;j++) wAbove+=this.levels[j].mat.weight;
        const ratio=wAbove/this.levels[i].mat.strength;
        if(ratio>worst) worst=ratio;
      }
      return worst;
    }
    update(dt){
      if(this.collapseFlash>0) this.collapseFlash=Math.max(0,this.collapseFlash-dt);
      for(let i=this.debris.length-1;i>=0;i--){
        const d=this.debris[i];
        d.vy+=120*dt; d.x+=d.vx*dt; d.y+=d.vy*dt; d.life-=dt;
        if(d.life<=0) this.debris.splice(i,1);
      }
    }
    get levelCount(){return this.levels.length;}
    get basePxY(){return this.surfRow*TILE_SIZE;}
    agentScore(id){let n=0;for(const lv of this.levels)if(lv.agentId===id)n++;return n;}
  }

  // ── HouseSite class ──────────────────────────────────────────
  class HouseSite {
    constructor(col,surfRow){
      this.col=col;this.surfRow=surfRow;
      this.width=7;this.height=5;
      // Sections: floor(7), left wall(3), right wall(3), roof(7) = 20 total
      this.sections=[
        {name:'floor',    needed:7,deposited:0,mat:null},
        {name:'wallLeft', needed:3,deposited:0,mat:null},
        {name:'wallRight',needed:3,deposited:0,mat:null},
        {name:'roof',     needed:7,deposited:0,mat:null},
      ];
      this.deposits=[]; // {mat,agentId}
      this.score=0;
      this.isShelter=false;
      this.isComplete=false;
      this.interiorCols=[];
      this.interiorY=0;
    }
    get totalNeeded(){return this.sections.reduce((s,sec)=>s+sec.needed,0);}
    get totalDeposited(){return this.sections.reduce((s,sec)=>s+sec.deposited,0);}
    get completionPct(){return Math.round(100*this.totalDeposited/this.totalNeeded);}
    deposit(mat,agentId){
      for(const sec of this.sections){
        if(sec.deposited<sec.needed){
          sec.deposited++;sec.mat=mat;
          this.score+=mat.towerScore;
          this.deposits.push({mat,agentId});
          break;
        }
      }
      this._checkCompletion();
    }
    _checkCompletion(){
      const s=this.sections;
      const wallsDone=s[1].deposited>=s[1].needed&&s[2].deposited>=s[2].needed;
      const roofDone =s[3].deposited>=s[3].needed;
      const floorDone=s[0].deposited>=s[0].needed;
      this.isShelter=wallsDone&&roofDone;
      this.isComplete=this.isShelter&&floorDone;
      if(this.isShelter){
        const startCol=this.col-Math.floor(this.width/2)+1;
        this.interiorCols=[];
        for(let c=startCol;c<startCol+this.width-2;c++) this.interiorCols.push(c);
        this.interiorY=(this.surfRow-1)*TILE_SIZE;
      }
    }
    agentScore(id){let n=0;for(const d of this.deposits)if(d.agentId===id)n++;return n;}
    update(dt){}
  }

  // ── World generation ──────────────────────────────────────────
  (function generate() {
    const surface=new Float32Array(WORLD_W); let sum=0;
    for(let x=0;x<WORLD_W;x++){
      const p=x/WORLD_W;
      const h=0.40*Math.sin(p*Math.PI*3.1+0.70)+0.22*Math.sin(p*Math.PI*7.3+1.40)
             +0.14*Math.sin(p*Math.PI*14.7+0.30)+0.07*Math.sin(p*Math.PI*27.1+2.00)
             +0.04*Math.sin(p*Math.PI*51.9+0.90);
      surface[x]=52+((h+0.87)/1.74)*16; sum+=surface[x];
    }
    avgSurfaceRow=sum/WORLD_W;

    for(let row=0;row<WORLD_H;row++) for(let col=0;col<WORLD_W;col++){
      const s=surface[col]; let t;
      if(row<s)       t=row>=WATER_ROW?TILE.WATER:TILE.SKY;
      else if(row<s+1) t=s>=WATER_ROW?TILE.DIRT:TILE.GRASS;
      else if(row<s+5) t=TILE.DIRT;
      else if(row<s+25)t=TILE.STONE;
      else             t=TILE.DEEP_STONE;
      tiles[row*WORLD_W+col]=t;
    }

    let rng=0xdeadbeef;
    const rand=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/0x100000000;};

    let nt=0;
    for(let col=2;col<WORLD_W-2;col++){
      if(col<nt) continue;
      const sr=Math.ceil(surface[col]);
      if(tiles[sr*WORLD_W+col]!==TILE.GRASS||rand()>0.45) continue;
      const th=3+~~(rand()*3),cw=1+~~(rand()*2),ch=1+~~(rand()*2),tt=sr-th;
      for(let r=sr-1;r>=tt;r--) if(r>=0) tiles[r*WORLD_W+col]=TILE.TREE_TRUNK;
      const leafTiles=[];
      for(let dr=-ch-1;dr<=1;dr++) for(let dc=-cw-1;dc<=cw+1;dc++){
        const r=tt-1+dr,c=col+dc;
        if(r<0||r>=WORLD_H||c<0||c>=WORLD_W) continue;
        if((dr/(ch+0.5))**2+(dc/(cw+0.5))**2>1.0) continue;
        if(tiles[r*WORLD_W+c]===TILE.SKY){tiles[r*WORLD_W+c]=TILE.TREE_LEAVES;leafTiles.push([r,c]);}
      }
      trees.push(new Tree(col,sr,tt,leafTiles,5+~~(rand()*8)));
      nt=col+3+~~(rand()*4);
    }

    // Berry bushes — near trees, on grass
    const busyCols=new Set(trees.map(t=>t.col));
    for(const t of trees){
      for(const dc of[-3,-2,2,3,4]){
        const bc=t.col+dc;
        if(bc<2||bc>=WORLD_W-2||busyCols.has(bc)) continue;
        const bsr=Math.ceil(surface[bc]);
        if(bsr<0||bsr>=WORLD_H||tiles[bsr*WORLD_W+bc]!==TILE.GRASS) continue;
        if(rand()>0.30) continue;
        berryBushes.push(new BerryBush(bc,bsr));busyCols.add(bc);
      }
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

    // Rocky outcrops (stone, coal, or iron ore)
    const numOutcrops=25+~~(rand()*6);
    for(let i=0;i<numOutcrops;i++){
      const startCol=3+~~(rand()*(WORLD_W-6)), width=1+~~(rand()*4);
      const rv=rand(), oreType=rv<0.35?TILE.ORE_COAL:rv<0.55?TILE.ORE_IRON:TILE.STONE;
      for(let dc=0;dc<width;dc++){
        const col=startCol+dc;
        if(col<0||col>=WORLD_W) continue;
        const sr=Math.ceil(surface[col]);
        if(sr<0||sr>=WORLD_H) continue;
        const cur=tiles[sr*WORLD_W+col];
        if(cur===TILE.GRASS||cur===TILE.DIRT) tiles[sr*WORLD_W+col]=oreType;
      }
    }

    for(let col=0;col<WORLD_W;col++){
      let found=false;
      for(let row=0;row<WORLD_H;row++){
        const t=tiles[row*WORLD_W+col];
        if(t===TILE.GRASS||t===TILE.DIRT||t===TILE.STONE||t===TILE.DEEP_STONE||t===TILE.ORE_COAL||t===TILE.ORE_IRON){
          surfaceYPx[col]=row*TILE_SIZE; found=true; break;
        }
      }
      if(!found) surfaceYPx[col]=(WORLD_H-1)*TILE_SIZE;
    }

    // Ore nodes from surface outcrops
    for(let col=0;col<WORLD_W;col++){
      const sr=Math.ceil(surface[col]);
      if(sr<0||sr>=WORLD_H) continue;
      const t=tiles[sr*WORLD_W+col];
      if(t===TILE.STONE||t===TILE.ORE_COAL||t===TILE.ORE_IRON) oreNodes.push(new OreNode(col,sr,t));
    }

    // Identify water columns and build waterEdgeCols + mudPatches
    const waterCols=new Uint8Array(WORLD_W);
    for(let col=0;col<WORLD_W;col++)
      for(let row=0;row<WORLD_H;row++)
        if(tiles[row*WORLD_W+col]===TILE.WATER){waterCols[col]=1;break;}

    // waterEdgeCols: land columns within 3 tiles of water (craft sites)
    for(let col=3;col<WORLD_W-3;col++){
      if(waterCols[col]) continue;
      let near=false;
      for(let dc=-3;dc<=3;dc++) if(waterCols[col+dc]){near=true;break;}
      if(near) waterEdgeCols.push(col);
    }

    // Mud patches: land columns immediately adjacent to water
    for(let col=1;col<WORLD_W-1;col++){
      if(waterCols[col]) continue;
      if(!waterCols[col-1]&&!waterCols[col+1]) continue;
      const sr=Math.ceil(surface[col]);
      if(sr<0||sr>=WORLD_H) continue;
      const t=tiles[sr*WORLD_W+col];
      if(t===TILE.GRASS||t===TILE.DIRT) mudPatches.push(new MudPatch(col,sr));
    }

    // Crop patches — near water edges, not on existing mud patches
    const mudCols=new Set(mudPatches.map(m=>m.col));
    for(const col of waterEdgeCols){
      if(mudCols.has(col)||rand()>0.15) continue;
      const sr=Math.ceil(surface[col]);
      if(sr<0||sr>=WORLD_H) continue;
      cropPatches.push(new CropPatch(col,sr));
    }
  })();

  // ── Forge (placed at world centre on solid ground) ─────────────
  const forgeCol = Math.round(WORLD_W / 2);
  let forgeSurfRow = 0;
  for(let row=0;row<WORLD_H;row++){
    const t=tiles[row*WORLD_W+forgeCol];
    if(t===TILE.GRASS||t===TILE.DIRT||t===TILE.STONE){forgeSurfRow=row;break;}
  }
  const forge = new Forge(forgeCol, forgeSurfRow);

  // ── BuildSite (placed at ¾ world width on solid ground) ────────
  const buildSiteCol=Math.round(WORLD_W*3/4);
  let buildSiteSurfRow=0;
  for(let row=0;row<WORLD_H;row++){
    const t=tiles[row*WORLD_W+buildSiteCol];
    if(t===TILE.GRASS||t===TILE.DIRT||t===TILE.STONE){buildSiteSurfRow=row;break;}
  }
  const buildSite=new BuildSite(buildSiteCol,buildSiteSurfRow);

  // ── HouseSite (placed at ¼ world width on solid ground) ────────
  const houseCol=Math.round(WORLD_W/4);
  const houseW=7;
  // Find the lowest (max row) solid surface across the footprint to flatten
  let houseSurfRow=0;
  for(let dc=-Math.floor(houseW/2);dc<=Math.floor(houseW/2);dc++){
    const c=houseCol+dc;
    if(c<0||c>=WORLD_W) continue;
    for(let row=0;row<WORLD_H;row++){
      const t=tiles[row*WORLD_W+c];
      if(t===TILE.GRASS||t===TILE.DIRT||t===TILE.STONE){if(row>houseSurfRow)houseSurfRow=row;break;}
    }
  }
  // Clear trees/leaves from house footprint
  for(let dc=-Math.floor(houseW/2);dc<=Math.floor(houseW/2);dc++){
    const c=houseCol+dc;
    if(c<0||c>=WORLD_W) continue;
    for(let row=0;row<WORLD_H;row++){
      const t=tiles[row*WORLD_W+c];
      if(t===TILE.TREE_TRUNK||t===TILE.TREE_LEAVES) tiles[row*WORLD_W+c]=TILE.SKY;
    }
  }
  for(const tr of trees){
    if(Math.abs(tr.col-houseCol)<=Math.floor(houseW/2)+1) tr.state='depleted';
  }
  const houseSite=new HouseSite(houseCol,houseSurfRow);

  // ── Spawn agents ──────────────────────────────────────────────
  const agents=[];
  for(let i=0;i<6;i++){
    const col=Math.floor(15+(i/6)*(WORLD_W-30));
    agents.push(new Agent(i,col*TILE_SIZE+TILE_SIZE/2,surfaceYPx[col]));
  }
  for(const a of agents) a.chooseGoal(surfaceYPx, trees, oreNodes, mudPatches, waterEdgeCols, forge, buildSite, houseSite, berryBushes, cropPatches);

  // ── Tile helpers ──────────────────────────────────────────────
  const drawStdTile=(px,py,pw,ph,idx)=>{
    const s=STYLE[idx],ht=Math.max(1,~~(ph/5));
    ctx.fillStyle=s[0];ctx.fillRect(px,py,pw,ph);
    ctx.fillStyle=s[1];ctx.fillRect(px,py,pw,ht);
    ctx.fillStyle=s[2];ctx.fillRect(px,py+ph-ht,pw,ht);
  };
  const drawOreTile=(px,py,pw,ph,dots,dc)=>{
    drawStdTile(px,py,pw,ph,TILE.STONE);
    const ds=Math.max(2,~~(pw/5)); ctx.fillStyle=dc;
    for(const[fx,fy]of dots) ctx.fillRect(px+~~(fx*pw),py+~~(fy*ph),ds,ds);
  };

  // ── Resource health bars ──────────────────────────────────────
  function drawTreeHealth(tree) {
    if(tree.state!=='alive'||tree.wood===tree.woodMax) return;
    const z=cam.zoom,ts=TILE_SIZE*z;
    const sx=Math.round(tree.col*ts+ts/2-cam.x), sy=Math.round(tree.basePxY*z-cam.y);
    const bw=Math.round(12*z),bh=Math.max(2,Math.round(2*z)),bx=sx-bw/2;
    const pct=tree.wood/tree.woodMax;
    ctx.fillStyle='#1a2a30'; ctx.fillRect(bx,sy,bw,bh);
    ctx.fillStyle=pct<0.33?'#e83030':pct<0.66?'#e09020':'#48c840';
    ctx.fillRect(bx,sy,Math.round(pct*bw),bh);
  }
  function drawOreHealth(ore) {
    if(ore.state!=='alive'||ore.amount===ore.amountMax) return;
    const z=cam.zoom,ts=TILE_SIZE*z;
    const sx=Math.round(ore.col*ts+ts/2-cam.x), sy=Math.round(ore.basePxY*z-cam.y);
    const bw=Math.round(12*z),bh=Math.max(2,Math.round(2*z)),bx=sx-bw/2;
    const pct=ore.amount/ore.amountMax;
    ctx.fillStyle='#1a2a30'; ctx.fillRect(bx,sy-bh-1,bw,bh);
    ctx.fillStyle=pct<0.33?'#e83030':pct<0.66?'#e09020':'#909090';
    ctx.fillRect(bx,sy-bh-1,Math.round(pct*bw),bh);
  }
  function drawMudHealth(mud) {
    if(mud.state!=='alive'||mud.amount===mud.amountMax) return;
    const z=cam.zoom,ts=TILE_SIZE*z;
    const sx=Math.round(mud.col*ts+ts/2-cam.x), sy=Math.round(mud.basePxY*z-cam.y);
    const bw=Math.round(12*z),bh=Math.max(2,Math.round(2*z)),bx=sx-bw/2;
    const pct=mud.amount/mud.amountMax;
    ctx.fillStyle='#1a2a30'; ctx.fillRect(bx,sy-bh-1,bw,bh);
    ctx.fillStyle=pct<0.33?'#e83030':pct<0.66?'#e09020':'#9a7040';
    ctx.fillRect(bx,sy-bh-1,Math.round(pct*bw),bh);
  }

  // ── Berry bush drawing ─────────────────────────────────────────
  function drawBerryBush(bush) {
    if(bush.state!=='alive') return;
    const z=cam.zoom,ts=TILE_SIZE*z;
    const bx=Math.round(bush.col*ts+ts/2-cam.x);
    const by=Math.round(bush.surfRow*ts-cam.y);
    const bw=Math.max(4,Math.round(8*z)),bh=Math.max(3,Math.round(6*z));
    ctx.fillStyle='#2a8020'; ctx.fillRect(bx-~~(bw/2),by-bh,bw,bh);
    ctx.fillStyle='#3aaa30'; ctx.fillRect(bx-~~(bw/2),by-bh,bw,Math.max(1,~~(bh*0.3)));
    ctx.fillStyle='#1a6018'; ctx.fillRect(bx-~~(bw/2),by-Math.max(1,~~(bh*0.2)),bw,Math.max(1,~~(bh*0.2)));
    const ds=Math.max(1,Math.round(2*z));
    ctx.fillStyle='#cc2244'; ctx.fillRect(bx-Math.round(2*z),by-Math.round(4*z),ds,ds);
    ctx.fillRect(bx+Math.round(1*z),by-Math.round(3*z),ds,ds);
    ctx.fillStyle='#aa1166'; ctx.fillRect(bx-Math.round(1*z),by-Math.round(5*z),ds,ds);
  }
  function drawBerryBushHealth(bush) {
    if(bush.state!=='alive'||bush.amount===bush.amountMax) return;
    const z=cam.zoom,ts=TILE_SIZE*z;
    const sx=Math.round(bush.col*ts+ts/2-cam.x),sy=Math.round(bush.basePxY*z-cam.y);
    const bw=Math.round(12*z),bh=Math.max(2,Math.round(2*z)),bx=sx-bw/2;
    const pct=bush.amount/bush.amountMax;
    ctx.fillStyle='#1a2a30'; ctx.fillRect(bx,sy-Math.round(7*z),bw,bh);
    ctx.fillStyle=pct<0.33?'#e83030':pct<0.66?'#e09020':'#cc2244';
    ctx.fillRect(bx,sy-Math.round(7*z),Math.round(pct*bw),bh);
  }

  // ── Crop patch drawing ────────────────────────────────────────
  function drawCropPatch(crop) {
    if(crop.state!=='alive') return;
    const z=cam.zoom,ts=TILE_SIZE*z;
    const bx=Math.round(crop.col*ts+ts/2-cam.x);
    const by=Math.round(crop.surfRow*ts-cam.y);
    const sw=Math.max(1,Math.round(z)),sh=Math.max(4,Math.round(10*z));
    ctx.fillStyle='#6a8a30';
    for(const off of[-3,0,3]) ctx.fillRect(bx+Math.round(off*z)-~~(sw/2),by-sh,sw,sh);
    const tw=Math.max(2,Math.round(3*z)),th=Math.max(2,Math.round(3*z));
    ctx.fillStyle='#d4a830';
    for(const off of[-3,0,3]) ctx.fillRect(bx+Math.round(off*z)-~~(tw/2),by-sh-th,tw,th);
  }
  function drawCropPatchHealth(crop) {
    if(crop.state!=='alive'||crop.amount===crop.amountMax) return;
    const z=cam.zoom,ts=TILE_SIZE*z;
    const sx=Math.round(crop.col*ts+ts/2-cam.x),sy=Math.round(crop.basePxY*z-cam.y);
    const bw=Math.round(12*z),bh=Math.max(2,Math.round(2*z)),bx=sx-bw/2;
    const pct=crop.amount/crop.amountMax;
    ctx.fillStyle='#1a2a30'; ctx.fillRect(bx,sy-Math.round(14*z),bw,bh);
    ctx.fillStyle=pct<0.33?'#e83030':pct<0.66?'#e09020':'#d4a830';
    ctx.fillRect(bx,sy-Math.round(14*z),Math.round(pct*bw),bh);
  }

  // ── Forge drawing ─────────────────────────────────────────────
  function drawForge(forge) {
    const z=cam.zoom, TS=TILE_SIZE;
    const t=Math.round(TS*z);
    const bx=Math.round(forge.col*TS*z-cam.x);
    const by=Math.round(forge.surfRow*TS*z-cam.y);

    // Base slab (2 tiles wide, 1 tile tall)
    ctx.fillStyle='#505050'; ctx.fillRect(bx-t,by-t,t*2,t);
    ctx.fillStyle='#686868'; ctx.fillRect(bx-t,by-t,t*2,Math.max(2,~~(t*0.15)));
    ctx.fillStyle='#383838'; ctx.fillRect(bx-t,by-Math.max(2,~~(t*0.15)),t*2,Math.max(2,~~(t*0.15)));

    // Chimney (centred, 0.6t wide, rising 2t above base)
    const cw=Math.max(3,~~(t*0.6));
    ctx.fillStyle='#404040'; ctx.fillRect(bx-~~(cw/2),by-t*3,cw,t*2);
    ctx.fillStyle='#585858'; ctx.fillRect(bx-~~(cw/2),by-t*3,cw,Math.max(1,~~(t*0.1)));

    // Fire (always on; brighter when actively smelting)
    const flicker=0.72+0.28*Math.sin(forge.fireTime*8.3+forge.col*0.4);
    const intensity=forge.active?1.0:0.55;
    const fw=Math.max(3,~~(cw*0.85*flicker));
    const fh=Math.max(3,~~(t*0.55*flicker));
    const fx=bx-~~(fw/2), fy=by-t-fh;
    ctx.fillStyle=`rgba(255,${~~(90*flicker)},0,${0.9*intensity})`;
    ctx.fillRect(fx,fy,fw,fh);
    ctx.fillStyle=`rgba(255,215,20,${0.8*flicker*intensity})`;
    ctx.fillRect(fx+~~(fw*0.2),fy+~~(fh*0.35),~~(fw*0.55),~~(fh*0.55));

    // Label
    if (z>=1.4) {
      ctx.save(); ctx.font=`bold ${Math.max(7,~~(5.5*z))}px monospace`;
      ctx.fillStyle='#c0a878'; ctx.textAlign='center';
      ctx.fillText('FORGE',bx,by-t*3-3);
      ctx.restore();
    }
  }

  // ── Colour helpers ────────────────────────────────────────────
  const lighten=col=>{const n=parseInt(col.slice(1),16);const r=Math.min(255,((n>>16)&0xff)+30),g=Math.min(255,((n>>8)&0xff)+30),b=Math.min(255,(n&0xff)+30);return`#${(r<<16|g<<8|b).toString(16).padStart(6,'0')}`;};
  const darken =col=>{const n=parseInt(col.slice(1),16);const r=Math.max(0,((n>>16)&0xff)-30),g=Math.max(0,((n>>8)&0xff)-30),b=Math.max(0,(n&0xff)-30);return`#${(r<<16|g<<8|b).toString(16).padStart(6,'0')}`;};

  // ── BuildSite drawing ─────────────────────────────────────────
  function drawBuildSite(site, agents) {
    const z=cam.zoom,TS=TILE_SIZE;
    const t=Math.round(TS*z);
    const bx=Math.round(site.col*TS*z-cam.x);
    const by=Math.round(site.surfRow*TS*z-cam.y);

    // Foundation: 3 tiles wide, 1 tile tall
    const fw=Math.round(t*3),fh=t,ht=Math.max(2,~~(t*0.15));
    ctx.fillStyle='#484848'; ctx.fillRect(bx-~~(fw/2),by-fh,fw,fh);
    ctx.fillStyle='#606060'; ctx.fillRect(bx-~~(fw/2),by-fh,fw,ht);
    ctx.fillStyle='#303030'; ctx.fillRect(bx-~~(fw/2),by-ht,fw,ht);

    // Tower levels stacked upward from foundation top
    const lw=Math.round(t*2.5);
    for(let i=0;i<site.levels.length;i++){
      const lv=site.levels[i], mat=lv.mat;
      const ly=by-fh-(i+1)*t, lht=Math.max(2,~~(t*0.15));
      ctx.fillStyle=mat.color;       ctx.fillRect(bx-~~(lw/2),ly,lw,t);
      ctx.fillStyle=lighten(mat.color); ctx.fillRect(bx-~~(lw/2),ly,lw,lht);
      ctx.fillStyle=darken(mat.color);  ctx.fillRect(bx-~~(lw/2),ly+t-lht,lw,lht);
      // Agent color stripe on the right edge
      const ac=agents[lv.agentId%agents.length].colors.shirt;
      const sw=Math.max(2,~~(t*0.18));
      ctx.fillStyle=ac; ctx.fillRect(bx+~~(lw/2)-sw,ly,sw,t);
    }

    // Flag on topmost level
    if(site.levels.length>0){
      const topY=by-fh-site.levels.length*t;
      const pw=Math.max(1,~~(t*0.08)),ph=Math.round(t*0.7);
      const fpx=bx-~~(lw/2)+Math.round(lw*0.15);
      ctx.fillStyle='#706050'; ctx.fillRect(fpx,topY-ph,pw,ph);
      ctx.fillStyle='#e04020';
      ctx.beginPath();
      ctx.moveTo(fpx+pw,topY-ph);
      ctx.lineTo(fpx+pw+Math.round(t*0.35),topY-ph+Math.round(t*0.2));
      ctx.lineTo(fpx+pw,topY-ph+Math.round(t*0.4));
      ctx.fill();
    }

    // Collapse flash overlay
    if(site.collapseFlash>0){
      const alpha=0.3*site.collapseFlash;
      ctx.fillStyle=`rgba(230,60,30,${alpha.toFixed(2)})`;
      const totalH=fh+site.levels.length*t;
      ctx.fillRect(bx-~~(fw/2)-2,by-totalH-2,fw+4,totalH+4);
    }

    // Debris particles
    for(const d of site.debris){
      const dx=Math.round(d.x*z-cam.x),dy=Math.round(d.y*z-cam.y);
      const ds=Math.max(1,Math.round(d.size*z));
      ctx.globalAlpha=Math.min(1,d.life);
      ctx.fillStyle=d.color; ctx.fillRect(dx,dy,ds,ds);
    }
    ctx.globalAlpha=1;

    // Stability warning + label
    const stress=site.maxStress;
    if(z>=1.4){
      const topLabelY=site.levels.length>0
        ? by-fh-site.levels.length*t-Math.round(t*0.7)
        : by-fh-Math.round(t*0.3);
      ctx.save(); ctx.font=`bold ${Math.max(7,~~(5.5*z))}px monospace`;
      ctx.fillStyle='#d4a830'; ctx.textAlign='center';
      ctx.fillText(`TOWER  ht.${site.levelCount}  sc.${site.score.toFixed(1)}`,bx,topLabelY);
      if(stress>0.6){
        const warn=stress>0.85?'⚠ CRITICAL':'⚠ UNSTABLE';
        ctx.fillStyle=stress>0.85?'#e83030':'#e09020';
        ctx.fillText(warn,bx,topLabelY+Math.max(8,~~(6*z)));
      }
      ctx.restore();
    }

    // Per-layer stress indicators (colored bar on left edge)
    if(z>=1.2&&site.levels.length>1){
      const barW=Math.max(2,~~(t*0.12));
      for(let i=0;i<site.levels.length;i++){
        let wAbove=0;
        for(let j=i+1;j<site.levels.length;j++) wAbove+=site.levels[j].mat.weight;
        const ratio=wAbove/site.levels[i].mat.strength;
        if(ratio<0.3) continue;
        const ly=by-fh-(i+1)*t;
        ctx.fillStyle=ratio>0.85?'#e83030':ratio>0.6?'#e09020':'#e8d830';
        ctx.fillRect(bx-~~(lw/2)-barW-1,ly,barW,t);
      }
    }
  }

  // ── HouseSite drawing ─────────────────────────────────────────
  function drawHouseSite(site) {
    const z=cam.zoom,TS=TILE_SIZE;
    const t=Math.round(TS*z);
    const hw=site.width,hh=site.height;
    const leftCol=site.col-Math.floor(hw/2);
    const baseRow=site.surfRow;              // floor sits on this row
    const roofRow=baseRow-hh+1;              // top row

    // Helper: tile screen position
    const tx=(col)=>Math.round(col*TS*z-cam.x);
    const ty=(row)=>Math.round(row*TS*z-cam.y);

    const secs=site.sections;
    const floorSec=secs[0],wlSec=secs[1],wrSec=secs[2],roofSec=secs[3];

    // Ghost blueprint outline for unfilled slots
    const ghost=(cx,cy)=>{
      ctx.strokeStyle='rgba(180,160,120,0.25)';ctx.lineWidth=1;
      ctx.setLineDash([Math.max(2,~~(3*z)),Math.max(2,~~(3*z))]);
      ctx.strokeRect(tx(cx)+1,ty(cy)+1,t-2,t-2);
      ctx.setLineDash([]);
    };
    // Filled block
    const block=(cx,cy,mat)=>{
      const px=tx(cx),py=ty(cy),lht=Math.max(1,~~(t*0.15));
      ctx.fillStyle=mat.color;       ctx.fillRect(px,py,t,t);
      ctx.fillStyle=lighten(mat.color); ctx.fillRect(px,py,t,lht);
      ctx.fillStyle=darken(mat.color);  ctx.fillRect(px,py+t-lht,t,lht);
    };

    // Floor (left to right)
    for(let i=0;i<hw;i++){
      if(i<floorSec.deposited&&floorSec.mat) block(leftCol+i,baseRow,floorSec.mat);
      else ghost(leftCol+i,baseRow);
    }
    // Left wall (bottom to top, rows baseRow-1 to baseRow-3)
    for(let i=0;i<wlSec.needed;i++){
      const row=baseRow-1-i;
      if(i<wlSec.deposited&&wlSec.mat) block(leftCol,row,wlSec.mat);
      else ghost(leftCol,row);
    }
    // Right wall (bottom to top)
    for(let i=0;i<wrSec.needed;i++){
      const row=baseRow-1-i;
      if(i<wrSec.deposited&&wrSec.mat) block(leftCol+hw-1,row,wrSec.mat);
      else ghost(leftCol+hw-1,row);
    }
    // Roof (left to right)
    for(let i=0;i<hw;i++){
      if(i<roofSec.deposited&&roofSec.mat) block(leftCol+i,roofRow,roofSec.mat);
      else ghost(leftCol+i,roofRow);
    }

    // Interior shade when shelter is detected
    if(site.isShelter){
      ctx.fillStyle='rgba(0,0,0,0.22)';
      ctx.fillRect(tx(leftCol+1),ty(roofRow+1),t*(hw-2),t*(hh-2));
    }

    // Completion marker: chimney + smoke when complete
    if(site.isComplete){
      const chimX=tx(leftCol+2),chimY=ty(roofRow);
      const cw=Math.max(2,~~(t*0.4)),ch=Math.round(t*0.8);
      ctx.fillStyle='#605040'; ctx.fillRect(chimX+~~(t*0.3),chimY-ch,cw,ch);
      // Smoke puffs
      const st=performance.now()/1000;
      for(let p=0;p<3;p++){
        const phase=st*0.8+p*2.1;
        const drift=Math.sin(phase*1.3)*t*0.3;
        const rise=(phase%3)*t*0.5;
        const alpha=Math.max(0,0.35-rise/(t*1.5));
        if(alpha<=0) continue;
        ctx.fillStyle=`rgba(160,160,170,${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(chimX+~~(t*0.5)+drift,chimY-ch-rise,Math.max(2,~~(t*0.2)),0,Math.PI*2);
        ctx.fill();
      }
    }

    // Label
    if(z>=1.4){
      const labelY=ty(roofRow)-Math.round(t*0.4);
      ctx.save();ctx.font=`bold ${Math.max(7,~~(5.5*z))}px monospace`;
      ctx.textAlign='center';
      const labelX=tx(site.col)+~~(t/2);
      if(site.isComplete){
        ctx.fillStyle='#70c0a0';ctx.fillText('SHELTER',labelX,labelY);
      }else if(site.isShelter){
        ctx.fillStyle='#a0c080';ctx.fillText(`SHELTER ${site.completionPct}%`,labelX,labelY);
      }else{
        ctx.fillStyle='#8a9aaa';ctx.fillText(`HOUSE ${site.completionPct}%`,labelX,labelY);
      }
      if(site.score>0){
        ctx.fillStyle='#d4a830';ctx.fillText(`sc.${site.score.toFixed(1)}`,labelX,labelY+Math.max(8,~~(6*z)));
      }
      ctx.restore();
    }
  }

  // ── Render ────────────────────────────────────────────────────
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

    for(const t of trees)    drawTreeHealth(t);
    for(const n of oreNodes) drawOreHealth(n);
    for(const m of mudPatches) drawMudHealth(m);
    for(const b of berryBushes){drawBerryBush(b);drawBerryBushHealth(b);}
    for(const c of cropPatches){drawCropPatch(c);drawCropPatchHealth(c);}
    drawForge(forge);
    drawBuildSite(buildSite, agents);
    drawHouseSite(houseSite);
    drawPaths(ctx,agents,surfaceYPx,cam);
    for(const a of agents) drawAgent(ctx,a,cam);
    drawNeedsPanel(ctx,agents,W,H,buildSite,houseSite);

    // ── Scoreboard (top-right) ──────────────────────────────────
    {
      const ranked=agents.map(a=>({id:a.id,shirt:a.colors.shirt,sc:buildSite.agentScore(a.id)})).sort((a,b)=>b.sc-a.sc);
      const houseRow=1; // extra row for house status
      const sbW=130,sbRow=13,sbPad=6;
      const sbH=sbPad*2+sbRow*(ranked.length+1+houseRow)+4;
      const sbX=W-sbW-10,sbY=8;
      ctx.fillStyle='rgba(6,12,20,0.88)'; ctx.fillRect(sbX,sbY,sbW,sbH);
      ctx.strokeStyle='#2a4050'; ctx.lineWidth=1; ctx.strokeRect(sbX+.5,sbY+.5,sbW-1,sbH-1);
      ctx.font='bold 9px monospace'; ctx.fillStyle='#d4a830';
      ctx.fillText('🏆 TOWER SCORES',sbX+sbPad,sbY+sbPad+9);
      ctx.fillStyle='#2a4050'; ctx.fillRect(sbX+sbPad,sbY+sbPad+12,sbW-sbPad*2,1);
      for(let i=0;i<ranked.length;i++){
        const r=ranked[i],ry=sbY+sbPad+(i+2)*sbRow;
        ctx.fillStyle=r.shirt; ctx.fillRect(sbX+sbPad,ry-7,6,6);
        ctx.fillStyle=i===0&&r.sc>0?'#d4a830':'#9ab0bc'; ctx.font='bold 9px monospace';
        ctx.fillText(`A${r.id+1}`,sbX+sbPad+9,ry);
        ctx.fillStyle=r.sc>0?'#c98a63':'#4a6878';
        ctx.fillText(`${r.sc} lv`,sbX+sbW-sbPad-30,ry);
      }
      // House status
      const hry=sbY+sbPad+(ranked.length+2)*sbRow+2;
      ctx.fillStyle='#2a4050'; ctx.fillRect(sbX+sbPad,hry-10,sbW-sbPad*2,1);
      ctx.fillStyle=houseSite.isComplete?'#70c0a0':houseSite.isShelter?'#a0c080':'#8a9aaa';
      ctx.font='bold 9px monospace';
      const hLabel=houseSite.isComplete?'SHELTER ✓':`HOUSE ${houseSite.completionPct}%`;
      ctx.fillText(`🏠 ${hLabel}`,sbX+sbPad,hry);
    }

    ctx.fillStyle='rgba(6,12,20,0.82)'; ctx.fillRect(0,0,W,34);
    ctx.fillStyle='#c98a63'; ctx.font='bold 12px monospace'; ctx.fillText('AI LIFE SIMULATION',12,14);
    ctx.fillStyle='#4a6878'; ctx.font='10px monospace';
    ctx.fillText(`obj 16 — food system  ·  drag/arrows  ·  scroll zoom  ·  ${cam.zoom.toFixed(1)}×`,12,28);
  }

  // ── Input ──────────────────────────────────────────────────────
  let drag=null; const keys=new Set();
  canvas.addEventListener('mousedown',e=>{drag={mx:e.clientX,my:e.clientY,cx:cam.x,cy:cam.y};canvas.style.cursor='grabbing';});
  window.addEventListener('mousemove',e=>{if(!drag)return;cam.x=drag.cx-(e.clientX-drag.mx);cam.y=drag.cy-(e.clientY-drag.my);clampCam();});
  window.addEventListener('mouseup',()=>{drag=null;canvas.style.cursor='grab';});
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    const rect=canvas.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top,prev=cam.zoom;
    cam.zoom=Math.min(cam.maxZoom,Math.max(cam.minZoom,cam.zoom*(e.deltaY<0?1.15:1/1.15)));
    cam.x=mx-(mx-cam.x)*cam.zoom/prev;cam.y=my-(my-cam.y)*cam.zoom/prev;clampCam();
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

  // ── Resize ────────────────────────────────────────────────────
  function resize(){canvas.width=section.clientWidth;canvas.height=section.clientHeight;clampCam();}
  new ResizeObserver(resize).observe(section); resize();
  const ts0=TILE_SIZE*cam.zoom;
  cam.x=(WORLD_W*ts0-canvas.width)/2;
  cam.y=Math.max(0,avgSurfaceRow*ts0-canvas.height*0.55);
  clampCam(); canvas.style.cursor='grab';

  // ── Loop ──────────────────────────────────────────────────────
  let last=performance.now();
  function loop(now){
    const dt=Math.min(0.05,(now-last)/1000); last=now;
    handleKeys(dt);
    for(const t of trees)       t.update(dt);
    for(const n of oreNodes)    n.update(dt);
    for(const m of mudPatches)  m.update(dt);
    for(const b of berryBushes) b.update(dt);
    for(const c of cropPatches) c.update(dt);
    forge.update(dt);
    buildSite.update(dt);
    houseSite.update(dt);
    for(const a of agents)     a.update(dt,surfaceYPx,trees,oreNodes,mudPatches,waterEdgeCols,forge,buildSite,houseSite,berryBushes,cropPatches);
    render(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
