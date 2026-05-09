import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Edges } from "@react-three/drei";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import * as THREE from "three";

// ── WebGL detection ───────────────────────────────────────────────────────────
function checkWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch { return false; }
}
const WEBGL_AVAILABLE = checkWebGL();

function NoWebGL() {
  return (
    <div style={{ width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",background:"linear-gradient(160deg,#020209,#0a0a1a)",
      color:"white",textAlign:"center",padding:32,gap:16 }}>
      <div style={{ fontSize:64 }}>🧱</div>
      <h2 style={{ fontSize:22,fontWeight:800 }}>Block Builder 3D</h2>
      <p style={{ fontSize:15,opacity:0.7,maxWidth:320,lineHeight:1.7 }}>
        This preview can't run WebGL.<br />Open the link below on your phone or computer!
      </p>
      <a href={window.location.href} target="_blank" rel="noreferrer" style={{
        marginTop:8,background:"#3b82f6",color:"white",borderRadius:14,
        padding:"12px 28px",fontWeight:700,fontSize:15,textDecoration:"none" }}>
        Open full game ↗
      </a>
    </div>
  );
}

// ── Block size modes ──────────────────────────────────────────────────────────
const MODES = [
  { key:"atom",  label:"Atom",  emoji:"⚛️",  size:0.1, gap:0.015, gridCell:0.1, gridSection:0.5, gridFade:7,   camera:[1.8,1.5,1.8]   as [number,number,number], minDist:0.4, maxDist:10,  desc:"Ultra fine"  },
  { key:"micro", label:"Micro", emoji:"🔭",  size:0.2, gap:0.03,  gridCell:0.2, gridSection:1,   gridFade:13,  camera:[3.5,3,3.5]     as [number,number,number], minDist:0.8, maxDist:18,  desc:"Very fine"   },
  { key:"nano",  label:"Nano",  emoji:"🔬",  size:0.4, gap:0.06,  gridCell:0.4, gridSection:2,   gridFade:24,  camera:[6,6,6]         as [number,number,number], minDist:2,   maxDist:30,  desc:"Tiny"        },
  { key:"small", label:"Small", emoji:"🧊",  size:1,   gap:0.08,  gridCell:1,   gridSection:10,  gridFade:60,  camera:[16,13,16]      as [number,number,number], minDist:4,   maxDist:70,  desc:"Standard"    },
  { key:"large", label:"Large", emoji:"🟦",  size:2,   gap:0.12,  gridCell:2,   gridSection:10,  gridFade:100, camera:[28,22,28]      as [number,number,number], minDist:6,   maxDist:120, desc:"Chunky"      },
  { key:"mega",  label:"Mega",  emoji:"🏗️", size:4,   gap:0.18,  gridCell:4,   gridSection:20,  gridFade:180, camera:[50,40,50]      as [number,number,number], minDist:12,  maxDist:220, desc:"Massive"     },
] as const;
type ModeKey = (typeof MODES)[number]["key"];

// ── Premier League teams ──────────────────────────────────────────────────────
const PL = "https://resources.premierleague.com/premierleague/badges";
const TEAMS = [
  { hex:"#FF0000", name:"Liverpool",    logo:`${PL}/t14.png`  },
  { hex:"#EF0107", name:"Arsenal",      logo:`${PL}/t3.png`   },
  { hex:"#DA291C", name:"Man Utd",      logo:`${PL}/t1.png`   },
  { hex:"#FF3B30", name:"Nottm Forest", logo:`${PL}/t17.png`  },
  { hex:"#E30013", name:"Bournemouth",  logo:`${PL}/t91.png`  },
  { hex:"#D71920", name:"Southampton",  logo:`${PL}/t20.png`  },
  { hex:"#D0021B", name:"Brentford",    logo:`${PL}/t94.png`  },
  { hex:"#C4122E", name:"Crystal Pal", logo:`${PL}/t31.png`  },
  { hex:"#6DCFF6", name:"Man City",     logo:`${PL}/t43.png`  },
  { hex:"#005BBB", name:"Chelsea",      logo:`${PL}/t8.png`   },
  { hex:"#0057FF", name:"Brighton",     logo:`${PL}/t36.png`  },
  { hex:"#0047AB", name:"Everton",      logo:`${PL}/t11.png`  },
  { hex:"#003FDB", name:"Leicester",    logo:`${PL}/t13.png`  },
  { hex:"#3A78D4", name:"Ipswich",      logo:`${PL}/t40.png`  },
  { hex:"#888888", name:"Fulham",       logo:`${PL}/t54.png`  },
  { hex:"#FDB913", name:"Wolves",       logo:`${PL}/t39.png`  },
  { hex:"#CC3366", name:"West Ham",     logo:`${PL}/t21.png`  },
  { hex:"#9B1C31", name:"Aston Villa",  logo:`${PL}/t7.png`   },
  { hex:"#1C1C1B", name:"Newcastle",    logo:`${PL}/t4.png`   },
  { hex:"#F0F0F0", name:"Tottenham",    logo:`${PL}/t6.png`   },
];

// ── Stadium backgrounds ───────────────────────────────────────────────────────
const WK = "https://commons.wikimedia.org/wiki/Special:FilePath";
const STADIUMS = [
  { id:"space",    name:"🌌 Space",      label:null,              preview:"#0a0e2a",  url:null,    isPitch:false },
  { id:"pitch",    name:"🟩 Pitch",      label:null,              preview:"#1d6010",  url:null,    isPitch:true  },
  { id:"anfield",  name:"Anfield",       label:"Liverpool",       preview:"#C8102E",  isPitch:false,
    url:`${WK}/Anfield_from_the_Kop.jpg?width=1280` },
  { id:"emirates", name:"Emirates",      label:"Arsenal",         preview:"#EF0107",  isPitch:false,
    url:`${WK}/Emirates_Stadium_exterior.jpg?width=1280` },
  { id:"old-traf", name:"Old Trafford",  label:"Man Utd",         preview:"#DA291C",  isPitch:false,
    url:`${WK}/Old_Trafford_inside_20060726_1.jpg?width=1280` },
  { id:"etihad",   name:"Etihad",        label:"Man City",        preview:"#6DCFF6",  isPitch:false,
    url:`${WK}/Etihad_Stadium%2C_Manchester.jpg?width=1280` },
  { id:"stamford", name:"Stamford Bge",  label:"Chelsea",         preview:"#005BBB",  isPitch:false,
    url:`${WK}/Stamford_Bridge_exterior.jpg?width=1280` },
  { id:"spurs",    name:"Spurs Stadium", label:"Tottenham",       preview:"#d8d8d8",  isPitch:false,
    url:`${WK}/Tottenham_Hotspur_Stadium_interior.jpg?width=1280` },
  { id:"stjames",  name:"St James' Pk",  label:"Newcastle",       preview:"#1C1C1B",  isPitch:false,
    url:`${WK}/St_James%27_Park.jpg?width=1280` },
  { id:"villa",    name:"Villa Park",    label:"Aston Villa",     preview:"#9B1C31",  isPitch:false,
    url:`${WK}/Villa_Park_Interior_2014.jpg?width=1280` },
  { id:"london",   name:"London Stad.",  label:"West Ham",        preview:"#CC3366",  isPitch:false,
    url:`${WK}/London_Stadium_interior.jpg?width=1280` },
  { id:"amex",     name:"Amex Stadium",  label:"Brighton",        preview:"#0057FF",  isPitch:false,
    url:`${WK}/The_American_Express_Community_Stadium.jpg?width=1280` },
  { id:"goodison", name:"Goodison Pk",   label:"Everton",         preview:"#0047AB",  isPitch:false,
    url:`${WK}/Goodison_Park.jpg?width=1280` },
  { id:"molineux", name:"Molineux",      label:"Wolves",          preview:"#FDB913",  isPitch:false,
    url:`${WK}/Molineux_Stadium.jpg?width=1280` },
  { id:"citygrnd", name:"City Ground",   label:"Nottm Forest",    preview:"#FF3B30",  isPitch:false,
    url:`${WK}/The_City_Ground_from_the_Bridgford_End.jpg?width=1280` },
  { id:"kingpow",  name:"King Power",    label:"Leicester",       preview:"#003FDB",  isPitch:false,
    url:`${WK}/King_Power_Stadium.jpg?width=1280` },
  { id:"selhurst", name:"Selhurst Pk",   label:"Crystal Pal.",    preview:"#C4122E",  isPitch:false,
    url:`${WK}/Selhurst_Park.jpg?width=1280` },
  { id:"craven",   name:"Craven Cott.",  label:"Fulham",          preview:"#888888",  isPitch:false,
    url:`${WK}/Craven_Cottage_exterior.jpg?width=1280` },
  { id:"portman",  name:"Portman Road",  label:"Ipswich",         preview:"#3A78D4",  isPitch:false,
    url:`${WK}/Portman_Road.jpg?width=1280` },
  { id:"vitality", name:"Vitality Stad.",label:"Bournemouth",     preview:"#E30013",  isPitch:false,
    url:`${WK}/Dean_Court.jpg?width=1280` },
  { id:"stmarys",  name:"St Mary's",     label:"Southampton",     preview:"#D71920",  isPitch:false,
    url:`${WK}/St_Mary%27s_Stadium%2C_Southampton.jpg?width=1280` },
  { id:"gtech",    name:"Gtech Comm.",   label:"Brentford",       preview:"#D0021B",  isPitch:false,
    url:`${WK}/Brentford_Community_Stadium_-_panorama.jpg?width=1280` },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type Block = { id:string; x:number; y:number; z:number; color:string; logo:string };
type PhysicsState = { px:number;py:number;pz:number;vx:number;vy:number;vz:number;rx:number;ry:number;rz:number;arx:number;ary:number;arz:number };

const uid = () => `${Date.now()}-${Math.random()}`;
function snapTo(v: number, size: number) { return Math.round(v / size) * size; }
function haptic() { try { navigator.vibrate(10); } catch { /* not supported */ } }

function makeChaosPhysics(block: Block, size: number): PhysicsState {
  return {
    px:block.x, py:block.y*size+size/2, pz:block.z,
    vx:(Math.random()-0.5)*size*9, vy:Math.random()*size*5+size*2, vz:(Math.random()-0.5)*size*9,
    rx:0, ry:0, rz:0,
    arx:(Math.random()-0.5)*0.18, ary:(Math.random()-0.5)*0.18, arz:(Math.random()-0.5)*0.18,
  };
}

// ── Texture cache ─────────────────────────────────────────────────────────────
const _texCache = new Map<string, THREE.Texture | null>();
function useLogoTexture(url: string): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(() => _texCache.get(url) ?? null);
  useEffect(() => {
    if (_texCache.has(url)) { setTex(_texCache.get(url) ?? null); return; }
    new THREE.TextureLoader().load(
      url,
      (t) => { t.colorSpace = THREE.SRGBColorSpace; _texCache.set(url, t); setTex(t); },
      undefined,
      () => { _texCache.set(url, null); },
    );
  }, [url]);
  return tex;
}

// ── Football texture ──────────────────────────────────────────────────────────
let _fbTex: THREE.CanvasTexture | null = null;
function getFootballTex(): THREE.CanvasTexture {
  if (_fbTex) return _fbTex;
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.font = "190px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("⚽", 128, 128);
  _fbTex = new THREE.CanvasTexture(c);
  return _fbTex;
}

// ── Scene background (sets scene.background + fog) ────────────────────────────
function SceneBackground({ stadiumId, gridFade }: { stadiumId: string; gridFade: number }) {
  const { scene } = useThree();
  const stadium = STADIUMS.find(s => s.id === stadiumId) ?? STADIUMS[0];

  useEffect(() => {
    if (stadium.isPitch) {
      scene.background = new THREE.Color("#1d6010");
      scene.fog = new THREE.Fog("#1d6010", gridFade * 0.6, gridFade * 2);
      return () => { scene.background = null; scene.fog = null; };
    }
    if (!stadium.url) {
      scene.background = new THREE.Color("#020209");
      scene.fog = new THREE.Fog("#020209", gridFade * 0.8, gridFade * 2.5);
      return () => { scene.background = null; scene.fog = null; };
    }
    scene.fog = null;
    const loader = new THREE.TextureLoader();
    loader.load(
      stadium.url,
      (t) => { t.colorSpace = THREE.SRGBColorSpace; scene.background = t; },
      undefined,
      () => { scene.background = new THREE.Color("#020209"); scene.fog = new THREE.Fog("#020209", gridFade*0.8, gridFade*2.5); },
    );
    return () => { scene.background = null; scene.fog = null; };
  }, [stadiumId, gridFade, scene, stadium]);

  return null;
}

// ── Starfield (only in space mode) ───────────────────────────────────────────
function Stars() {
  const ref = useRef<THREE.Points>(null);
  const [positions, sizes] = useMemo(() => {
    const n = 1800, pos = new Float32Array(n * 3), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = 180 + Math.random()*320, theta = Math.random()*Math.PI*2, phi = Math.acos(2*Math.random()-1);
      pos[i*3]   = r*Math.sin(phi)*Math.cos(theta);
      pos[i*3+1] = Math.abs(r*Math.cos(phi))*(Math.random()<0.5?1:-0.3);
      pos[i*3+2] = r*Math.sin(phi)*Math.sin(theta);
      sz[i] = 0.4 + Math.random()*1.4;
    }
    return [pos, sz];
  }, []);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime()*0.008; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size"     args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial color="#cce4ff" size={0.9} sizeAttenuation transparent opacity={0.85} fog={false} />
    </points>
  );
}

// ── Logo + football face planes ───────────────────────────────────────────────
function LogoFaces({ visual, logoTex }: { visual: number; logoTex: THREE.Texture | null }) {
  const fbTex = getFootballTex();
  const h = visual / 2, o = 0.003, pw = visual * 0.8, ph = visual * 0.75;
  return (
    <>
      {logoTex && (
        <>
          <mesh position={[0,0,h+o]}><planeGeometry args={[pw,pw]} /><meshBasicMaterial map={logoTex} transparent alphaTest={0.05} depthWrite={false} /></mesh>
          <mesh position={[0,0,-(h+o)]} rotation={[0,Math.PI,0]}><planeGeometry args={[pw,pw]} /><meshBasicMaterial map={logoTex} transparent alphaTest={0.05} depthWrite={false} /></mesh>
          <mesh position={[h+o,0,0]} rotation={[0,-Math.PI/2,0]}><planeGeometry args={[pw,pw]} /><meshBasicMaterial map={logoTex} transparent alphaTest={0.05} depthWrite={false} /></mesh>
          <mesh position={[-(h+o),0,0]} rotation={[0,Math.PI/2,0]}><planeGeometry args={[pw,pw]} /><meshBasicMaterial map={logoTex} transparent alphaTest={0.05} depthWrite={false} /></mesh>
        </>
      )}
      <mesh position={[0,h+o,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[ph,ph]} /><meshBasicMaterial map={fbTex} transparent alphaTest={0.05} depthWrite={false} /></mesh>
    </>
  );
}

// ── Static block mesh ─────────────────────────────────────────────────────────
function BlockMesh({ block, size, gap, eraseMode, onErase }: {
  block: Block; size: number; gap: number; eraseMode: boolean; onErase: (id:string)=>void;
}) {
  const [hovered, setHovered] = useState(false);
  const logoTex = useLogoTexture(block.logo);
  const visual = size - gap;
  const col = hovered && eraseMode ? "#ff3333" : block.color;
  useEffect(() => {
    document.body.style.cursor = hovered ? (eraseMode ? "not-allowed" : "pointer") : "auto";
    return () => { document.body.style.cursor = "auto"; };
  }, [hovered, eraseMode]);
  return (
    <group position={[block.x, block.y*size+size/2, block.z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[visual,visual,visual]} />
        <meshStandardMaterial color={col} roughness={0.22} metalness={0.28}
          transparent={hovered&&eraseMode} opacity={hovered&&eraseMode?0.5:1} />
        <Edges lineWidth={hovered?2:1} color={hovered?"#fff":"#3a4060"} />
      </mesh>
      <LogoFaces visual={visual} logoTex={eraseMode?null:logoTex} />
      <mesh visible={false}
        onPointerEnter={(e)=>{ e.stopPropagation(); setHovered(true); }}
        onPointerLeave={()=>setHovered(false)}>
        <boxGeometry args={[size,size,size]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

// ── Physics block (chaos mode) ────────────────────────────────────────────────
function PhysicsBlock({ block, size, gap, init }: {
  block: Block; size: number; gap: number; init: PhysicsState;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const p = useRef<PhysicsState>({ ...init });
  const logoTex = useLogoTexture(block.logo);
  const visual = size - gap;
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05), s = p.current;
    s.vy -= 20*d;
    s.px += s.vx*d; s.py += s.vy*d; s.pz += s.vz*d;
    s.rx += s.arx; s.ry += s.ary; s.rz += s.arz;
    const floor = size*0.5;
    if (s.py < floor) { s.py=floor; s.vy=Math.abs(s.vy)*0.5; s.vx*=0.88; s.vz*=0.88; s.arx*=0.78; s.ary*=0.78; s.arz*=0.78; }
    if (Math.abs(s.px)>50) s.vx*=-0.75;
    if (Math.abs(s.pz)>50) s.vz*=-0.75;
    if (groupRef.current) { groupRef.current.position.set(s.px,s.py,s.pz); groupRef.current.rotation.set(s.rx,s.ry,s.rz); }
  });
  return (
    <group ref={groupRef} position={[init.px,init.py,init.pz]}>
      <mesh castShadow><boxGeometry args={[visual,visual,visual]} /><meshStandardMaterial color={block.color} roughness={0.22} metalness={0.28} /><Edges lineWidth={1} color="#3a4060" /></mesh>
      <LogoFaces visual={visual} logoTex={logoTex} />
    </group>
  );
}

// ── Player kit colours per team ───────────────────────────────────────────────
const PLAYER_KITS = [
  { jersey:"#D00010", shorts:"#D00010", socks:"#D00010", skin:"#e8b48a", name:"Liverpool"    },
  { jersey:"#EF0107", shorts:"#FFFFFF", socks:"#FFFFFF", skin:"#d4956a", name:"Arsenal"      },
  { jersey:"#DA291C", shorts:"#FFFFFF", socks:"#000000", skin:"#c8803c", name:"Man Utd"      },
  { jersey:"#CC0000", shorts:"#FFFFFF", socks:"#CC0000", skin:"#e8b48a", name:"Nottm Forest" },
  { jersey:"#6DCFF6", shorts:"#FFFFFF", socks:"#6DCFF6", skin:"#c87941", name:"Man City"     },
  { jersey:"#0057AA", shorts:"#0057AA", socks:"#FFFFFF", skin:"#e8c49a", name:"Chelsea"      },
  { jersey:"#0047AB", shorts:"#FFFFFF", socks:"#FFFFFF", skin:"#d4956a", name:"Everton"      },
  { jersey:"#FDB913", shorts:"#0A0A0A", socks:"#FDB913", skin:"#b06828", name:"Wolves"       },
  { jersey:"#F8F8F8", shorts:"#1a1a44", socks:"#F8F8F8", skin:"#e8b48a", name:"Tottenham"    },
  { jersey:"#1a1a1a", shorts:"#1a1a1a", socks:"#FFFFFF", skin:"#c87941", name:"Newcastle"    },
  { jersey:"#9B1C31", shorts:"#74003E", socks:"#9B1C31", skin:"#e8c49a", name:"Aston Villa"  },
  { jersey:"#7A1429", shorts:"#1E5F9C", socks:"#7A1429", skin:"#d4956a", name:"West Ham"     },
];

// ── Walking player ────────────────────────────────────────────────────────────
type PlayerConfig = { id:number; kitIdx:number; lane:number; direction:1|-1; speed:number; phase:number };

function WalkingPlayer({ cfg, size, gridFade }: { cfg: PlayerConfig; size: number; gridFade: number }) {
  const kit = PLAYER_KITS[(cfg.kitIdx ?? 0) % PLAYER_KITS.length] ?? PLAYER_KITS[0];

  const groupRef = useRef<THREE.Group>(null);
  const lHipRef  = useRef<THREE.Group>(null);
  const rHipRef  = useRef<THREE.Group>(null);
  const lShlRef  = useRef<THREE.Group>(null);
  const rShlRef  = useRef<THREE.Group>(null);
  const t = useRef(cfg.phase);

  // Scale: players are the same height as one block
  const ph  = size * 1.0;   // total player height
  const hr  = ph  * 0.13;   // head radius
  const bh  = ph  * 0.33;   // body (jersey) height
  const bw  = ph  * 0.11;   // body radius
  const lh  = ph  * 0.32;   // leg height
  const lw  = ph  * 0.065;  // leg radius
  const ah  = ph  * 0.26;   // arm height
  const aw  = ph  * 0.055;  // arm radius
  const hipY = lh;
  const shlY = hipY + bh * 0.88; // shoulder y

  const range = gridFade * 0.42; // how far left/right players walk

  useFrame((_, dt) => {
    t.current += dt * cfg.speed;
    // Walk across X axis; wrap around when they exit
    const progress = (t.current * size * 2.6) % (range * 2);
    const x = cfg.direction > 0 ? -range + progress : range - progress;
    if (groupRef.current) {
      groupRef.current.position.x = x;
      groupRef.current.rotation.y = cfg.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    // Leg + arm swing
    const swing = Math.sin(t.current * 9) * 0.58;
    if (lHipRef.current) lHipRef.current.rotation.x =  swing;
    if (rHipRef.current) rHipRef.current.rotation.x = -swing;
    if (lShlRef.current) lShlRef.current.rotation.x = -swing * 0.7;
    if (rShlRef.current) rShlRef.current.rotation.x =  swing * 0.7;
  });

  return (
    <group ref={groupRef} position={[cfg.direction > 0 ? -range : range, 0, cfg.lane]}>
      {/* Head */}
      <mesh position={[0, hipY+bh+hr*1.15, 0]} castShadow>
        <sphereGeometry args={[hr, 10, 10]} />
        <meshStandardMaterial color={kit.skin} roughness={0.8} />
      </mesh>
      {/* Body / jersey */}
      <mesh position={[0, hipY+bh*0.5, 0]} castShadow>
        <cylinderGeometry args={[bw*0.88, bw, bh, 8]} />
        <meshStandardMaterial color={kit.jersey} roughness={0.55} metalness={0.05} />
      </mesh>
      {/* Shorts */}
      <mesh position={[0, hipY+bh*0.08, 0]} castShadow>
        <cylinderGeometry args={[bw*1.0, bw*0.82, bh*0.32, 8]} />
        <meshStandardMaterial color={kit.shorts} roughness={0.7} />
      </mesh>
      {/* Left shoulder → arm */}
      <group ref={lShlRef} position={[-(bw+aw*0.6), shlY, 0]}>
        <mesh position={[0, -ah*0.5, 0]} castShadow>
          <cylinderGeometry args={[aw, aw*0.85, ah, 6]} />
          <meshStandardMaterial color={kit.jersey} roughness={0.55} />
        </mesh>
      </group>
      {/* Right shoulder → arm */}
      <group ref={rShlRef} position={[bw+aw*0.6, shlY, 0]}>
        <mesh position={[0, -ah*0.5, 0]} castShadow>
          <cylinderGeometry args={[aw, aw*0.85, ah, 6]} />
          <meshStandardMaterial color={kit.jersey} roughness={0.55} />
        </mesh>
      </group>
      {/* Left hip → leg */}
      <group ref={lHipRef} position={[-bw*0.52, hipY, 0]}>
        <mesh position={[0, -lh*0.5, 0]} castShadow>
          <cylinderGeometry args={[lw, lw*1.1, lh, 6]} />
          <meshStandardMaterial color={kit.socks} roughness={0.7} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -lh+lw, lw*0.7]} castShadow>
          <boxGeometry args={[lw*2.2, lw*1.4, lw*2.8]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
      </group>
      {/* Right hip → leg */}
      <group ref={rHipRef} position={[bw*0.52, hipY, 0]}>
        <mesh position={[0, -lh*0.5, 0]} castShadow>
          <cylinderGeometry args={[lw, lw*1.1, lh, 6]} />
          <meshStandardMaterial color={kit.socks} roughness={0.7} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -lh+lw, lw*0.7]} castShadow>
          <boxGeometry args={[lw*2.2, lw*1.4, lw*2.8]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

// ── Ghost block ───────────────────────────────────────────────────────────────
function GhostBlock({ position, color, size, gap }: {
  position:[number,number,number]; color:string; size:number; gap:number;
}) {
  const visual = size - gap;
  return (
    <mesh position={position}>
      <boxGeometry args={[visual,visual,visual]} />
      <meshStandardMaterial color={color} transparent opacity={0.32} roughness={0.3} metalness={0.2} />
      <Edges lineWidth={1.5} color="white" />
    </mesh>
  );
}

// ── Platform glow ─────────────────────────────────────────────────────────────
function PlatformGlow({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.01,0]}>
      <circleGeometry args={[radius, 64]} />
      <meshBasicMaterial color="#1a2a6c" transparent opacity={0.18} depthWrite={false} />
    </mesh>
  );
}

// ── 3-D Scene ─────────────────────────────────────────────────────────────────
function Scene({
  blocks, selectedColor, eraseMode, size, gap, gridCell, gridSection, gridFade,
  chaosMode, chaosPhysics, stadiumId, onAddBlock, onEraseBlock,
}: {
  blocks: Block[]; selectedColor: string; eraseMode: boolean;
  size: number; gap: number; gridCell: number; gridSection: number; gridFade: number;
  chaosMode: boolean; chaosPhysics: Map<string, PhysicsState>; stadiumId: string;
  onAddBlock: (x:number,y:number,z:number)=>void; onEraseBlock: (id:string)=>void;
}) {
  const downPos = useRef<{x:number;y:number}|null>(null);
  const [ghost, setGhost] = useState<[number,number,number]|null>(null);

  const isSpace = stadiumId === "space";
  const isPitch = STADIUMS.find(s => s.id === stadiumId)?.isPitch ?? false;

  // Generate stable player configs per mode — staggered lanes, different kits
  const playerConfigs = useMemo<PlayerConfig[]>(() => {
    // 6 lanes spread across the visible Z range; alternating directions
    const step = gridFade * 0.14;
    return [
      { id:0, kitIdx:0,  lane: -step*2.5, direction: 1,  speed:0.50, phase:0    },
      { id:1, kitIdx:3,  lane: -step*1.2, direction:-1,  speed:0.44, phase:5.5  },
      { id:2, kitIdx:4,  lane:  step*0.1, direction: 1,  speed:0.56, phase:11   },
      { id:3, kitIdx:1,  lane:  step*1.4, direction:-1,  speed:0.48, phase:2.5  },
      { id:4, kitIdx:7,  lane:  step*2.6, direction: 1,  speed:0.52, phase:8    },
      { id:5, kitIdx:9,  lane: -step*0.4, direction:-1,  speed:0.42, phase:15   },
    ];
  }, [gridFade]);

  const handleGroundDown = (e: ThreeEvent<PointerEvent>) => { downPos.current = {x:e.clientX,y:e.clientY}; };

  const handleGroundMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (eraseMode || chaosMode) { setGhost(null); return; }
    setGhost([snapTo(e.point.x, size), size/2, snapTo(e.point.z, size)]);
  }, [eraseMode, chaosMode, size]);

  const handleGroundClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (eraseMode || chaosMode) return;
    if (downPos.current) {
      const dx = e.clientX - downPos.current.x, dy = e.clientY - downPos.current.y;
      if (Math.sqrt(dx*dx+dy*dy) > 8) return;
    }
    onAddBlock(snapTo(e.point.x, size), 0, snapTo(e.point.z, size));
  }, [eraseMode, chaosMode, size, onAddBlock]);

  const handleBlockClick = useCallback((e: ThreeEvent<MouseEvent>, block: Block) => {
    if (chaosMode) return;
    if (eraseMode) { e.stopPropagation(); onEraseBlock(block.id); return; }
    e.stopPropagation();
    if (downPos.current) {
      const dx = e.clientX - downPos.current.x, dy = e.clientY - downPos.current.y;
      if (Math.sqrt(dx*dx+dy*dy) > 8) return;
    }
    const top = blocks.filter(b=>b.x===block.x&&b.z===block.z).reduce((m,b)=>Math.max(m,b.y),-1);
    onAddBlock(block.x, top+1, block.z);
  }, [chaosMode, eraseMode, blocks, onAddBlock, onEraseBlock]);

  const handleBlockMove = useCallback((e: ThreeEvent<PointerEvent>, block: Block) => {
    if (eraseMode || chaosMode) { setGhost(null); return; }
    const top = blocks.filter(b=>b.x===block.x&&b.z===block.z).reduce((m,b)=>Math.max(m,b.y),-1);
    setGhost([block.x, (top+1)*size+size/2, block.z]);
  }, [eraseMode, chaosMode, blocks, size]);

  const gridColor  = isPitch ? "#2d8a1a" : "#1e3a6e";
  const secColor   = isPitch ? "#3aaa22" : "#2563eb";
  const ambStrength = isPitch ? 0.6 : 0.3;

  return (
    <>
      <SceneBackground stadiumId={stadiumId} gridFade={gridFade} />
      {isSpace && <Stars />}

      <ambientLight intensity={ambStrength} />
      <directionalLight position={[14,22,10]} intensity={1.6} color="#d0e8ff" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004} />
      <directionalLight position={[-10,6,-12]} intensity={0.35} color="#ffe4b0" />
      <directionalLight position={[0,4,-20]}   intensity={0.5}  color="#8b5cf6" />
      <hemisphereLight args={["#0d1b45","#000000",0.5]} />
      <pointLight position={[0,size*0.5,0]} intensity={0.4} color="#3b82f6" distance={gridFade*0.3} />

      <Grid position={[0,0,0]} args={[500,500]}
        cellSize={gridCell} cellThickness={0.4} cellColor={gridColor}
        sectionSize={gridSection} sectionThickness={0.9} sectionColor={secColor}
        fadeDistance={gridFade} fadeStrength={2.5} infiniteGrid />
      <PlatformGlow radius={gridFade*0.22} />

      {/* Walking players */}
      {playerConfigs.map(cfg => (
        <WalkingPlayer key={cfg.id} cfg={cfg} size={size} gridFade={gridFade} />
      ))}

      {/* Invisible ground */}
      {!chaosMode && (
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]}
          onPointerDown={handleGroundDown} onPointerMove={handleGroundMove}
          onPointerLeave={()=>setGhost(null)} onClick={handleGroundClick} receiveShadow>
          <planeGeometry args={[2000,2000]} />
          <meshStandardMaterial transparent opacity={0} side={THREE.FrontSide} />
        </mesh>
      )}

      {/* Blocks */}
      {blocks.map((block) =>
        chaosMode ? (
          <PhysicsBlock key={block.id} block={block} size={size} gap={gap}
            init={chaosPhysics.get(block.id) ?? makeChaosPhysics(block, size)} />
        ) : (
          <group key={block.id}
            onPointerDown={handleGroundDown}
            onPointerMove={(e)=>{ e.stopPropagation(); handleBlockMove(e, block); }}
            onClick={(e)=>handleBlockClick(e, block)}>
            <BlockMesh block={block} size={size} gap={gap} eraseMode={eraseMode} onErase={onEraseBlock} />
          </group>
        )
      )}

      {!eraseMode && !chaosMode && ghost && <GhostBlock position={ghost} color={selectedColor} size={size} gap={gap} />}
    </>
  );
}

// ── UI button ─────────────────────────────────────────────────────────────────
function Btn({ onClick, active, bg, title, children }: {
  onClick:()=>void; active?:boolean; bg?:string; title?:string; children:React.ReactNode;
}) {
  return (
    <button onClick={onClick} title={title} style={{
      background: bg ?? (active ? "#3b82f6" : "rgba(255,255,255,0.08)"),
      color: "white",
      border: active ? "1.5px solid rgba(255,255,255,0.45)" : "1.5px solid rgba(255,255,255,0.12)",
      borderRadius:14, padding:"8px 14px", fontSize:14, fontWeight:700,
      cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap", backdropFilter:"blur(8px)",
    }}>
      {children}
    </button>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function App() {
  const [activeMode,  setActiveMode]  = useState<ModeKey>("small");
  const [allBlocks,   setAllBlocks]   = useState<Record<ModeKey,Block[]>>({ atom:[],micro:[],nano:[],small:[],large:[],mega:[] });
  const [allHistory,  setAllHistory]  = useState<Record<ModeKey,Block[][]>>({ atom:[[]],micro:[[]],nano:[[]],small:[[]],large:[[]],mega:[[]] });
  const [selectedColor, setSelectedColor] = useState(TEAMS[0].hex);
  const [eraseMode,   setEraseMode]   = useState(false);
  const [chaosMode,   setChaosMode]   = useState(false);
  const [chaosPhysics,setChaosPhysics]= useState<Map<string,PhysicsState>>(new Map());
  const [stadiumId,   setStadiumId]   = useState("space");
  const [sharing,     setSharing]     = useState(false);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  const mode   = MODES.find(m => m.key === activeMode)!;
  const blocks = allBlocks[activeMode];
  const selectedTeam = TEAMS.find(t => t.hex === selectedColor) ?? TEAMS[0];

  const switchMode = (key: ModeKey) => { setActiveMode(key); setEraseMode(false); setChaosMode(false); };

  const addBlock = useCallback((x:number,y:number,z:number) => {
    setAllBlocks(prev => {
      const cur = prev[activeMode];
      if (cur.some(b => b.x===x&&b.y===y&&b.z===z)) return prev;
      haptic();
      const next = [...cur, { id:uid(), x, y, z, color:selectedColor, logo:selectedTeam.logo }];
      setAllHistory(h => ({ ...h, [activeMode]: [...h[activeMode].slice(-49), next] }));
      return { ...prev, [activeMode]: next };
    });
  }, [activeMode, selectedColor, selectedTeam.logo]);

  const eraseBlock = useCallback((id:string) => {
    setAllBlocks(prev => {
      const next = prev[activeMode].filter(b => b.id !== id);
      setAllHistory(h => ({ ...h, [activeMode]: [...h[activeMode].slice(-49), next] }));
      return { ...prev, [activeMode]: next };
    });
  }, [activeMode]);

  const undo = useCallback(() => {
    setAllHistory(h => {
      const cur = h[activeMode];
      if (cur.length <= 1) return h;
      setAllBlocks(b => ({ ...b, [activeMode]: cur[cur.length-2] }));
      return { ...h, [activeMode]: cur.slice(0,-1) };
    });
  }, [activeMode]);

  const clear = useCallback(() => {
    if (blocks.length === 0) return;
    setAllBlocks(b => ({ ...b, [activeMode]: [] }));
    setAllHistory(h => ({ ...h, [activeMode]: [[]] }));
    setChaosMode(false);
  }, [activeMode, blocks.length]);

  const toggleChaos = useCallback(() => {
    if (!chaosMode) {
      const map = new Map<string,PhysicsState>();
      blocks.forEach(b => map.set(b.id, makeChaosPhysics(b, mode.size)));
      setChaosPhysics(map);
      setEraseMode(false);
    }
    setChaosMode(m => !m);
  }, [chaosMode, blocks, mode.size]);

  const handleShare = useCallback(async () => {
    const gl = glRef.current;
    if (!gl || sharing) return;
    setSharing(true);
    try {
      const url = gl.domElement.toDataURL("image/png");
      const blob = await fetch(url).then(r => r.blob());
      const file = new File([blob], "block-builder.png", { type:"image/png" });
      if (navigator.share && (navigator as {canShare?:(o:object)=>boolean}).canShare?.({ files:[file] })) {
        await navigator.share({ title:"My Block Builder!", files:[file] });
      } else {
        Object.assign(document.createElement("a"), { href:url, download:"block-builder.png" }).click();
      }
    } catch { /* cancelled */ }
    setSharing(false);
  }, [sharing]);

  if (!WEBGL_AVAILABLE) return <NoWebGL />;

  return (
    <div style={{ width:"100%", height:"100%", position:"relative", background:"#020209" }}>

      {/* ── Canvas ── */}
      <Canvas key={activeMode} shadows
        camera={{ position:mode.camera, fov:45 }}
        gl={{ antialias:true, alpha:false, preserveDrawingBuffer:true,
              toneMapping:THREE.ACESFilmicToneMapping, toneMappingExposure:1.1 }}
        style={{ background:"#020209" }}
        dpr={[1,2]}
        onCreated={({ gl }) => { glRef.current = gl; }}
      >
        <OrbitControls enableDamping dampingFactor={0.1}
          minDistance={mode.minDist} maxDistance={mode.maxDist}
          maxPolarAngle={Math.PI/2 - 0.03}
          touches={{ ONE:THREE.TOUCH.ROTATE, TWO:THREE.TOUCH.DOLLY_ROTATE }} />
        <Scene
          blocks={blocks} selectedColor={selectedColor}
          eraseMode={eraseMode} size={mode.size} gap={mode.gap}
          gridCell={mode.gridCell} gridSection={mode.gridSection} gridFade={mode.gridFade}
          chaosMode={chaosMode} chaosPhysics={chaosPhysics} stadiumId={stadiumId}
          onAddBlock={addBlock} onEraseBlock={eraseBlock} />
      </Canvas>

      {/* ── Top bar ── */}
      <div style={{ position:"absolute", top:0, left:0, right:0, padding:"10px 10px 0",
        background:"linear-gradient(180deg,rgba(2,2,9,0.95) 0%,transparent 100%)" }}>

        {/* Size tabs */}
        <div style={{ display:"flex", gap:4, justifyContent:"center", marginBottom:5, flexWrap:"nowrap", overflowX:"auto" }}>
          {MODES.map(m => (
            <button key={m.key} onClick={() => switchMode(m.key)} style={{
              background: activeMode===m.key ? "rgba(59,130,246,0.85)" : "rgba(255,255,255,0.07)",
              color: activeMode===m.key ? "white" : "rgba(255,255,255,0.5)",
              border: activeMode===m.key ? "1.5px solid rgba(99,179,255,0.7)" : "1.5px solid rgba(255,255,255,0.08)",
              borderRadius:10, padding:"5px 9px", fontSize:11, fontWeight:700,
              cursor:"pointer", transition:"all 0.18s", backdropFilter:"blur(8px)",
              display:"flex", alignItems:"center", gap:3, flexShrink:0,
            }}>
              <span style={{ fontSize:13 }}>{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>

        {/* Title + actions */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"3px 2px 8px" }}>
          <div>
            <span style={{ color:"white", fontWeight:800, fontSize:15, textShadow:"0 0 20px rgba(99,102,241,0.8)" }}>🧱 Block Builder</span>
            <span style={{ marginLeft:7, color:"rgba(255,255,255,0.3)", fontSize:10 }}>{mode.desc} · {mode.size}u</span>
          </div>
          <div style={{ display:"flex", gap:5 }}>
            <Btn onClick={undo} bg="rgba(255,255,255,0.07)" title="Undo">↩</Btn>
            <Btn onClick={clear} bg="rgba(239,68,68,0.22)" title="Clear">🗑</Btn>
            <Btn onClick={handleShare} bg={sharing?"rgba(34,197,94,0.5)":"rgba(255,255,255,0.07)"} title="Share screenshot">{sharing?"⏳":"📷"}</Btn>
            <Btn onClick={toggleChaos} bg={chaosMode?"rgba(239,68,68,0.75)":"rgba(255,255,255,0.07)"} title="Chaos physics!">💥</Btn>
          </div>
        </div>

        {/* Stadium picker */}
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8,
          msOverflowStyle:"none", scrollbarWidth:"none" }}>
          {STADIUMS.map(s => {
            const active = stadiumId === s.id;
            return (
              <button key={s.id} onClick={() => setStadiumId(s.id)} style={{
                flexShrink:0, background:"none", border:"none", padding:0, cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center", gap:2, width:58,
              }}>
                <div style={{
                  width:56, height:28, borderRadius:7,
                  background: s.preview,
                  border: active ? "2px solid white" : "1.5px solid rgba(255,255,255,0.18)",
                  boxShadow: active ? `0 0 10px ${s.preview}cc` : "none",
                  transform: active ? "scale(1.1)" : "scale(1)",
                  transition:"all 0.15s",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize: 14,
                }}>
                  {s.isPitch ? "⚽" : !s.url ? "✨" : ""}
                </div>
                <span style={{ fontSize:7.5, color: active?"white":"rgba(255,255,255,0.45)",
                  fontWeight:700, textAlign:"center", lineHeight:1.2,
                  width:58, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                  {s.name}
                </span>
                {s.label && (
                  <span style={{ fontSize:6.5, color:"rgba(255,255,255,0.28)", textAlign:"center",
                    width:58, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                    {s.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Block counter ── */}
      <div style={{ position:"absolute", top:148, right:14,
        background:"rgba(255,255,255,0.07)", backdropFilter:"blur(8px)",
        borderRadius:10, padding:"3px 10px",
        color:"rgba(255,255,255,0.5)", fontSize:12, fontWeight:600,
        border:"1px solid rgba(255,255,255,0.1)" }}>
        {blocks.length} block{blocks.length!==1?"s":""}
      </div>

      {/* ── Chaos label ── */}
      {chaosMode && (
        <div style={{ position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%,-50%)", pointerEvents:"none",
          color:"#ff3b30", fontSize:22, fontWeight:900, letterSpacing:2,
          textShadow:"0 0 30px #ff3b30cc", animation:"pulse 0.8s infinite alternate" }}>
          💥 CHAOS 💥
        </div>
      )}

      {/* ── Hint ── */}
      {blocks.length === 0 && !chaosMode && (
        <div style={{ position:"absolute", top:"55%", left:"50%",
          transform:"translate(-50%,-50%)", textAlign:"center",
          color:"rgba(255,255,255,0.25)", fontSize:14, fontWeight:600,
          pointerEvents:"none", lineHeight:1.7 }}>
          Tap the grid to place blocks<br />
          <span style={{ fontSize:11, opacity:0.7 }}>Drag to rotate · Pinch to zoom</span>
        </div>
      )}

      {/* ── Bottom UI ── */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0,
        padding:"10px 14px 26px",
        background:"linear-gradient(0deg,rgba(2,2,9,0.96) 0%,transparent 100%)" }}>

        {!chaosMode && (
          <div style={{ display:"flex", gap:8, marginBottom:10, justifyContent:"center" }}>
            <Btn onClick={()=>setEraseMode(false)} active={!eraseMode}>🧱 Build</Btn>
            <Btn onClick={()=>setEraseMode(true)} active={eraseMode} bg={eraseMode?"rgba(239,68,68,0.55)":undefined}>🗑 Erase</Btn>
          </div>
        )}

        {chaosMode && (
          <div style={{ textAlign:"center", marginBottom:10 }}>
            <Btn onClick={toggleChaos} bg="rgba(59,130,246,0.6)">⏹ Stop Chaos</Btn>
          </div>
        )}

        {/* Team palette — larger icons */}
        {!eraseMode && !chaosMode && (
          <div style={{ display:"flex", gap:5, justifyContent:"center", flexWrap:"wrap", maxWidth:440, margin:"0 auto" }}>
            {TEAMS.map(({ hex, name, logo }) => {
              const active = selectedColor === hex;
              const isDark = hex === "#1C1C1B";
              return (
                <button key={hex} onClick={()=>setSelectedColor(hex)} title={name}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center",
                    gap:3, background:"none", border:"none", cursor:"pointer",
                    padding:0, flexShrink:0, width:42 }}>
                  <div style={{
                    width:40, height:40, borderRadius:"50%", background:hex,
                    border: active ? "2.5px solid white" : isDark ? "1.5px solid rgba(255,255,255,0.35)" : "1.5px solid rgba(255,255,255,0.15)",
                    boxShadow: active ? `0 0 0 2.5px ${hex}88, 0 0 18px ${hex}bb` : "none",
                    transform: active ? "scale(1.22)" : "scale(1)",
                    transition:"all 0.15s",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <img src={logo} alt={name}
                      onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }}
                      style={{ width:30, height:30, objectFit:"contain",
                        filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.7))" }} />
                  </div>
                  <span style={{ fontSize:8.5, color:active?"white":"rgba(255,255,255,0.45)",
                    fontWeight:700, width:42, textAlign:"center", lineHeight:1.25,
                    overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {eraseMode && (
          <p style={{ textAlign:"center", color:"#fca5a5", fontSize:14, fontWeight:700 }}>
            Tap a block to remove it
          </p>
        )}
      </div>

      <style>{`
        @keyframes pulse { from{opacity:0.6} to{opacity:1} }
        div::-webkit-scrollbar { display:none }
      `}</style>
    </div>
  );
}
