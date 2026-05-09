import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
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
        This preview can't run WebGL.<br />Open on your phone or computer!
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

// ── Block themes: free (half-and-half) + premium (official logos) ─────────────
type BlockTheme = { id:string; name:string; hex:string; logo:string; premiumLogo:string };
const PL = "https://resources.premierleague.com/premierleague/badges";
const BLOCK_THEMES: BlockTheme[] = [
  { id:"liverpool",   name:"Merseyside Red",      hex:"#C8102E", logo:"half|#C8102E|#F6EB61|⚽", premiumLogo:`${PL}/t14.png` },
  { id:"arsenal",     name:"North London Red",    hex:"#EF0107", logo:"half|#EF0107|#FFFFFF|⚽", premiumLogo:`${PL}/t3.png`  },
  { id:"manutd",      name:"Manchester Red",      hex:"#DA291C", logo:"half|#DA291C|#FBE122|⚽", premiumLogo:`${PL}/t1.png`  },
  { id:"nforest",     name:"Forest Red",          hex:"#CC0000", logo:"half|#CC0000|#FFFFFF|⚽", premiumLogo:`${PL}/t17.png` },
  { id:"bournemouth", name:"Dorset Red",          hex:"#E30013", logo:"half|#E30013|#000000|⚽", premiumLogo:`${PL}/t91.png` },
  { id:"southampton", name:"South Coast Red",     hex:"#D71920", logo:"half|#D71920|#FFFFFF|⚽", premiumLogo:`${PL}/t20.png` },
  { id:"brentford",   name:"West London Bees",    hex:"#D0021B", logo:"half|#D0021B|#FFFFFF|⚽", premiumLogo:`${PL}/t94.png` },
  { id:"cpfc",        name:"South London Eagles", hex:"#C4122E", logo:"half|#C4122E|#005DB8|⚽", premiumLogo:`${PL}/t31.png` },
  { id:"mancity",     name:"Sky Blue",            hex:"#6DCFF6", logo:"half|#6DCFF6|#FFFFFF|🏆", premiumLogo:`${PL}/t43.png` },
  { id:"chelsea",     name:"London Blue",         hex:"#005BBB", logo:"half|#005BBB|#FFFFFF|⚽", premiumLogo:`${PL}/t8.png`  },
  { id:"brighton",    name:"Seagulls Blue",       hex:"#0057FF", logo:"half|#0057FF|#FFFFFF|⚽", premiumLogo:`${PL}/t36.png` },
  { id:"everton",     name:"Merseyside Blue",     hex:"#0047AB", logo:"half|#0047AB|#FFFFFF|⚽", premiumLogo:`${PL}/t11.png` },
  { id:"leicester",   name:"Foxes Blue",          hex:"#003FDB", logo:"half|#003FDB|#FDBE11|🏆", premiumLogo:`${PL}/t13.png` },
  { id:"ipswich",     name:"Tractor Boys",        hex:"#3A78D4", logo:"half|#3A78D4|#FFFFFF|⚽", premiumLogo:`${PL}/t40.png` },
  { id:"fulham",      name:"Cottage White",       hex:"#888888", logo:"half|#000000|#FFFFFF|⚽", premiumLogo:`${PL}/t54.png` },
  { id:"wolves",      name:"West Midlands Gold",  hex:"#FDB913", logo:"half|#FDB913|#231F20|⚽", premiumLogo:`${PL}/t39.png` },
  { id:"westham",     name:"East London Claret",  hex:"#CC3366", logo:"half|#7A1429|#1E5F9C|⚽", premiumLogo:`${PL}/t21.png` },
  { id:"astonvilla",  name:"Midlands Claret",     hex:"#9B1C31", logo:"half|#670E36|#95BFE5|⚽", premiumLogo:`${PL}/t7.png`  },
  { id:"newcastle",   name:"Tyneside Magpies",    hex:"#1C1C1B", logo:"half|#1C1C1B|#FFFFFF|⚽", premiumLogo:`${PL}/t4.png`  },
  { id:"tottenham",   name:"North London White",  hex:"#F0F0F0", logo:"half|#FFFFFF|#132257|🏆", premiumLogo:`${PL}/t6.png`  },
];

// ── Player kits ───────────────────────────────────────────────────────────────
const KITS = [
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

// ── Types ─────────────────────────────────────────────────────────────────────
type Block = { id:string; x:number; y:number; z:number; color:string; logo:string };
type PhysicsState = { px:number;py:number;pz:number;vx:number;vy:number;vz:number;rx:number;ry:number;rz:number;arx:number;ary:number;arz:number };
type BallData = { px:number;py:number;pz:number;vx:number;vy:number;vz:number;rotX:number;rotZ:number;cooldown:number };
type RunBehavior = { x:number;z:number;dirX:number;dirZ:number;speed:number;facingY:number;timer:number;mode:0|1;kickT:number;legPhase:number };
type PlayerCfg = { id:number; kitIdx:number; startX:number; startZ:number; phase:number };

const uid = () => `${Date.now()}-${Math.random()}`;
function snapTo(v: number, size: number) { return Math.round(v / size) * size; }
function haptic() { try { navigator.vibrate(10); } catch { /* noop */ } }

function makeChaosPhysics(block: Block, size: number): PhysicsState {
  return {
    px:block.x, py:block.y*size+size/2, pz:block.z,
    vx:(Math.random()-0.5)*size*9, vy:Math.random()*size*5+size*2, vz:(Math.random()-0.5)*size*9,
    rx:0, ry:0, rz:0,
    arx:(Math.random()-0.5)*0.18, ary:(Math.random()-0.5)*0.18, arz:(Math.random()-0.5)*0.18,
  };
}

// ── Canvas texture helpers ─────────────────────────────────────────────────────
const _halfTexCache   = new Map<string, THREE.CanvasTexture>();
const _customTexCache = new Map<string, THREE.CanvasTexture>();

function makeHalfTex(logo: string): THREE.CanvasTexture {
  if (_halfTexCache.has(logo)) return _halfTexCache.get(logo)!;
  const parts  = logo.split("|");
  const colorA = parts[1] ?? "#CC0000";
  const colorB = parts[2] ?? "#FFFFFF";
  const emoji  = decodeURIComponent(parts[3] ?? "⚽");
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = colorA; ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = colorB;
  ctx.beginPath(); ctx.moveTo(256,0); ctx.lineTo(256,256); ctx.lineTo(0,256); ctx.closePath(); ctx.fill();
  ctx.font = "120px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(emoji, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  _halfTexCache.set(logo, tex);
  return tex;
}

function makeCustomTex(logo: string): THREE.CanvasTexture {
  if (_customTexCache.has(logo)) return _customTexCache.get(logo)!;
  const parts  = logo.split("|");
  const colorA = parts[1] ?? "#CC0000";
  const colorB = parts[2] ?? "#FFFFFF";
  const name   = decodeURIComponent(parts[3] ?? "Team");
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = colorA; ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = colorB;
  ctx.beginPath(); ctx.moveTo(256,0); ctx.lineTo(256,256); ctx.lineTo(0,256); ctx.closePath(); ctx.fill();
  const sz = name.length > 9 ? 24 : name.length > 6 ? 32 : name.length > 3 ? 42 : 56;
  ctx.font = `bold ${sz}px sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const r = parseInt(colorA.slice(1,3)||"00",16);
  const g = parseInt(colorA.slice(3,5)||"00",16);
  const b = parseInt(colorA.slice(5,7)||"00",16);
  ctx.fillStyle = (r*0.299+g*0.587+b*0.114) > 140 ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.88)";
  ctx.fillText(name.substring(0,12), 128, 128);
  const tex = new THREE.CanvasTexture(c);
  _customTexCache.set(logo, tex);
  return tex;
}

// ── Texture cache ─────────────────────────────────────────────────────────────
const _texCache = new Map<string, THREE.Texture | null>();
function useLogoTexture(url: string): THREE.Texture | null {
  const isHalf   = url.startsWith("half|");
  const isCustom = url.startsWith("custom|");
  const canvasTex = useMemo<THREE.Texture | null>(() => {
    if (isHalf)   return makeHalfTex(url);
    if (isCustom) return makeCustomTex(url);
    return null;
  }, [url, isHalf, isCustom]);
  const [urlTex, setUrlTex] = useState<THREE.Texture | null>(() =>
    (!isHalf && !isCustom) ? (_texCache.get(url) ?? null) : null
  );
  useEffect(() => {
    if (isHalf || isCustom) return;
    if (_texCache.has(url)) { setUrlTex(_texCache.get(url) ?? null); return; }
    new THREE.TextureLoader().load(
      url,
      (t) => { t.colorSpace = THREE.SRGBColorSpace; _texCache.set(url, t); setUrlTex(t); },
      undefined,
      () => { _texCache.set(url, null); },
    );
  }, [url, isHalf, isCustom]);
  return (isHalf || isCustom) ? canvasTex : urlTex;
}

// ── Football emoji texture ────────────────────────────────────────────────────
let _fbTex: THREE.CanvasTexture | null = null;
function getFootballTex(): THREE.CanvasTexture {
  if (_fbTex) return _fbTex;
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.font = "210px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("⚽", 128, 128);
  _fbTex = new THREE.CanvasTexture(c);
  return _fbTex;
}

// ── Football with physics ─────────────────────────────────────────────────────
function Football({ size, ballRef }: { size: number; ballRef: React.MutableRefObject<BallData> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const r = size * 0.17;

  useFrame((_, dt) => {
    const b = ballRef.current;
    const d = Math.min(dt, 0.04);

    // Gravity when airborne
    if (b.py > r + 0.001 || b.vy > 0) b.vy -= 24 * d;

    b.px += b.vx * d;
    b.py += b.vy * d;
    b.pz += b.vz * d;
    b.cooldown -= d;

    // Ground
    if (b.py < r) {
      b.py = r;
      if (b.vy < -size * 0.5) {
        b.vy = Math.abs(b.vy) * 0.48; // bounce
      } else {
        b.vy = 0;
      }
      b.vx *= 0.91;
      b.vz *= 0.91;
    }

    // Rolling spin
    b.rotX += b.vz * d * 3.5;
    b.rotZ -= b.vx * d * 3.5;

    // Boundary bounce
    const bound = size * 13;
    if (Math.abs(b.px) > bound) { b.vx *= -0.72; b.px = Math.sign(b.px) * bound; }
    if (Math.abs(b.pz) > bound) { b.vz *= -0.72; b.pz = Math.sign(b.pz) * bound; }

    if (meshRef.current) {
      meshRef.current.position.set(b.px, b.py, b.pz);
      meshRef.current.rotation.set(b.rotX, 0, b.rotZ);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, r, 0]} castShadow>
      <sphereGeometry args={[r, 16, 16]} />
      <meshStandardMaterial map={getFootballTex()} roughness={0.25} metalness={0.05} />
    </mesh>
  );
}

// ── Running football player ───────────────────────────────────────────────────
function RunningPlayer({ cfg, size, gridFade, ballRef }: {
  cfg: PlayerCfg; size: number; gridFade: number;
  ballRef: React.MutableRefObject<BallData>;
}) {
  const kit = KITS[(cfg.kitIdx ?? 0) % KITS.length] ?? KITS[0];

  const groupRef  = useRef<THREE.Group>(null);
  const upperRef  = useRef<THREE.Group>(null); // upper body for lean
  const lHipRef   = useRef<THREE.Group>(null);
  const rHipRef   = useRef<THREE.Group>(null);
  const lShlRef   = useRef<THREE.Group>(null);
  const rShlRef   = useRef<THREE.Group>(null);

  const behavior = useRef<RunBehavior>({
    x: cfg.startX, z: cfg.startZ,
    dirX: Math.sin(cfg.phase), dirZ: Math.cos(cfg.phase),
    speed: 2.2 + Math.random() * 1.8,
    facingY: cfg.phase,
    timer: Math.random() * 1.5,
    mode: 0, // 0=free, 1=chasing
    kickT: 0,
    legPhase: cfg.phase * 4,
  });

  // Proportions — player is 1.25 × block height for nice visibility
  const ph  = size * 1.25;
  const hr  = ph * 0.112;
  const bh  = ph * 0.31;
  const bw  = ph * 0.112;
  const lh  = ph * 0.34;
  const lw  = ph * 0.066;
  const ah  = ph * 0.27;
  const aw  = ph * 0.052;
  const hipY = lh;
  const shlY = hipY + bh * 0.86;

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.04);
    const beh = behavior.current;
    const ball = ballRef.current;

    beh.timer    -= d;
    if (beh.kickT > 0) beh.kickT -= d * 5;

    // Ball distance
    const bdx = ball.px - beh.x;
    const bdz = ball.pz - beh.z;
    const bdist = Math.sqrt(bdx * bdx + bdz * bdz);
    const chaseRange = size * 11;
    const kickRange  = size * 1.6;

    // ── Kick ──
    if (ball.cooldown <= 0 && bdist < kickRange) {
      // Kick the ball!  angle roughly toward "open space" (forward + random spread)
      const kickAngle = beh.facingY + (Math.random() - 0.5) * 2.2;
      const kickSpeed = size * (7 + Math.random() * 6);
      ball.vx = Math.sin(kickAngle) * kickSpeed;
      ball.vz = Math.cos(kickAngle) * kickSpeed;
      ball.vy = size * (3.5 + Math.random() * 3.5);
      ball.cooldown = 1.2 + Math.random() * 1.2;
      beh.kickT = 1;
      beh.mode  = 0;
      beh.timer = 0.4;
    }
    // ── Chase ball ──
    else if (ball.cooldown <= 0 && bdist < chaseRange) {
      beh.mode = 1;
      const len = bdist || 1;
      beh.dirX  = bdx / len;
      beh.dirZ  = bdz / len;
      beh.speed = 4.8 + Math.random() * 0.8; // full sprint
    }
    // ── Free sprint ──
    else {
      beh.mode = 0;
      if (beh.timer <= 0) {
        // Dart to a new random direction with enthusiasm
        const angle = Math.random() * Math.PI * 2;
        beh.dirX  = Math.sin(angle);
        beh.dirZ  = Math.cos(angle);
        beh.speed = 2.5 + Math.random() * 2.8; // varied paces
        beh.timer = 0.8 + Math.random() * 1.8;
      }
    }

    // Move
    const spd = beh.speed * size;
    beh.x += beh.dirX * spd * d;
    beh.z += beh.dirZ * spd * d;

    // Boundary — bounce back toward centre
    const bound = gridFade * 0.36;
    if (Math.abs(beh.x) > bound) {
      beh.x = Math.sign(beh.x) * bound;
      beh.dirX = -beh.dirX;
      beh.timer = 0;
    }
    if (Math.abs(beh.z) > bound) {
      beh.z = Math.sign(beh.z) * bound;
      beh.dirZ = -beh.dirZ;
      beh.timer = 0;
    }

    // Smooth facing toward movement direction
    const targetY = Math.atan2(beh.dirX, beh.dirZ);
    const diff = ((targetY - beh.facingY) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    beh.facingY += diff * Math.min(d * 9, 1);

    // Accumulate leg phase proportional to speed
    beh.legPhase += d * beh.speed * 11;

    // Apply to group
    if (groupRef.current) {
      groupRef.current.position.set(beh.x, 0, beh.z);
      groupRef.current.rotation.y = beh.facingY;
    }

    // Upper body forward lean when sprinting
    const lean = Math.min(beh.speed * 0.038, 0.28);
    if (upperRef.current) upperRef.current.rotation.x = -lean;

    // Leg swing — faster and bigger when sprinting
    const swingAmt = Math.min(beh.speed / 4.5, 1) * 0.7;
    const legSwing = Math.sin(beh.legPhase) * swingAmt;
    const armSwing = Math.sin(beh.legPhase) * swingAmt * 0.6;
    const kickAnim = beh.kickT > 0 ? Math.sin(beh.kickT * Math.PI) * 1.3 : 0;

    if (lHipRef.current) lHipRef.current.rotation.x =  legSwing + kickAnim;
    if (rHipRef.current) rHipRef.current.rotation.x = -legSwing;
    if (lShlRef.current) lShlRef.current.rotation.x = -armSwing;
    if (rShlRef.current) rShlRef.current.rotation.x =  armSwing;
  });

  return (
    <group ref={groupRef} position={[cfg.startX, 0, cfg.startZ]}>
      {/* Legs */}
      <group ref={lHipRef} position={[-bw * 0.5, hipY, 0]}>
        <mesh position={[0, -lh * 0.5, 0]} castShadow>
          <cylinderGeometry args={[lw, lw * 1.1, lh, 6]} />
          <meshStandardMaterial color={kit.socks} roughness={0.7} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -lh + lw * 0.5, lw * 0.85]} castShadow>
          <boxGeometry args={[lw * 2.2, lw * 1.3, lw * 2.6]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.45} />
        </mesh>
      </group>
      <group ref={rHipRef} position={[bw * 0.5, hipY, 0]}>
        <mesh position={[0, -lh * 0.5, 0]} castShadow>
          <cylinderGeometry args={[lw, lw * 1.1, lh, 6]} />
          <meshStandardMaterial color={kit.socks} roughness={0.7} />
        </mesh>
        <mesh position={[0, -lh + lw * 0.5, lw * 0.85]} castShadow>
          <boxGeometry args={[lw * 2.2, lw * 1.3, lw * 2.6]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.45} />
        </mesh>
      </group>

      {/* Upper body group (lean forward when running) */}
      <group ref={upperRef} position={[0, hipY, 0]}>
        {/* Shorts */}
        <mesh position={[0, bh * 0.06, 0]} castShadow>
          <cylinderGeometry args={[bw * 1.02, bw * 0.85, bh * 0.3, 8]} />
          <meshStandardMaterial color={kit.shorts} roughness={0.65} />
        </mesh>
        {/* Jersey */}
        <mesh position={[0, bh * 0.5, 0]} castShadow>
          <cylinderGeometry args={[bw * 0.9, bw, bh, 8]} />
          <meshStandardMaterial color={kit.jersey} roughness={0.5} metalness={0.06} />
        </mesh>
        {/* Arms */}
        <group ref={lShlRef} position={[-(bw + aw * 0.55), bh * 0.84, 0]}>
          <mesh position={[0, -ah * 0.5, 0]} castShadow>
            <cylinderGeometry args={[aw, aw * 0.85, ah, 5]} />
            <meshStandardMaterial color={kit.jersey} roughness={0.5} />
          </mesh>
        </group>
        <group ref={rShlRef} position={[bw + aw * 0.55, bh * 0.84, 0]}>
          <mesh position={[0, -ah * 0.5, 0]} castShadow>
            <cylinderGeometry args={[aw, aw * 0.85, ah, 5]} />
            <meshStandardMaterial color={kit.jersey} roughness={0.5} />
          </mesh>
        </group>
        {/* Neck */}
        <mesh position={[0, bh + ph * 0.025, 0]} castShadow>
          <cylinderGeometry args={[hr * 0.52, hr * 0.6, ph * 0.05, 6]} />
          <meshStandardMaterial color={kit.skin} roughness={0.8} />
        </mesh>
        {/* Head */}
        <mesh position={[0, bh + ph * 0.06 + hr, 0]} castShadow>
          <sphereGeometry args={[hr, 12, 12]} />
          <meshStandardMaterial color={kit.skin} roughness={0.78} />
        </mesh>
        {/* Hair cap */}
        <mesh position={[0, bh + ph * 0.06 + hr * 1.55, 0]} castShadow>
          <sphereGeometry args={[hr * 0.76, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// ── Pitch markings ────────────────────────────────────────────────────────────
function PitchLine({ pts, opacity = 0.52 }: { pts: [number,number,number][]; opacity?: number }) {
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setFromPoints(pts.map(([x,y,z]) => new THREE.Vector3(x,y,z)));
    const mat = new THREE.LineBasicMaterial({ color:"white", transparent:true, opacity, fog:false, depthWrite:false });
    return new THREE.Line(geo, mat);
  }, [pts, opacity]);
  useEffect(() => () => {
    lineObj.geometry.dispose();
    (lineObj.material as THREE.Material).dispose();
  }, [lineObj]);
  return <primitive object={lineObj} />;
}

function PitchMarkings({ gridFade }: { gridFade: number }) {
  const segments = useMemo(() => {
    const L = gridFade * 0.62;   // pitch length along Z
    const W = gridFade * 0.40;   // pitch width  along X
    const y = 0.018;             // just above grid surface
    const hl = L / 2, hw = W / 2;

    const paDepth = L * 0.157;    // penalty area depth  (16.5 m)
    const paHW    = W * 0.297;    // penalty area half-width (20.16 m)
    const syDepth = L * 0.052;    // six-yard box depth (5.5 m)
    const syHW    = W * 0.135;    // six-yard box half-width (9.16 m)
    const ccR     = Math.min(L,W) * 0.140;  // centre-circle radius (9.15 m)
    const penDist = L * 0.105;    // penalty spot from goal line (11 m)
    const spotR   = Math.max(0.08, L * 0.004);
    const crnR    = Math.max(0.12, L * 0.008); // corner arc radius (1 m)

    // arc(cx, cz, r, startAngle, endAngle) — angle 0 = +Z, π/2 = +X
    function arc(cx:number,cz:number,r:number,a0:number,a1:number,segs=40): [number,number,number][] {
      const pts: [number,number,number][] = [];
      for (let i=0;i<=segs;i++) {
        const a = a0+(a1-a0)*(i/segs);
        pts.push([cx+Math.sin(a)*r, y, cz+Math.cos(a)*r]);
      }
      return pts;
    }
    function rect(x1:number,z1:number,x2:number,z2:number): [number,number,number][] {
      return [[x1,y,z1],[x2,y,z1],[x2,y,z2],[x1,y,z2],[x1,y,z1]];
    }
    function spot(cx:number,cz:number): [number,number,number][] {
      return arc(cx,cz,spotR,0,Math.PI*2,10);
    }

    // Penalty D half-angle: part of 9.15m circle outside the penalty area
    const dCos = (paDepth - penDist) / ccR;
    const dHalf = (dCos>=-1&&dCos<=1) ? Math.acos(dCos) : Math.PI*0.55;

    return [
      // Outer boundary
      rect(-hw,-hl,hw,hl),
      // Centre line
      [[-hw,y,0],[hw,y,0]] as [number,number,number][],
      // Centre circle + spot
      arc(0,0,ccR,0,Math.PI*2),
      spot(0,0),
      // ── Bottom end (z = -hl) ──
      rect(-paHW,-hl,paHW,-hl+paDepth),
      rect(-syHW,-hl,syHW,-hl+syDepth),
      spot(0,-hl+penDist),
      arc(0,-hl+penDist,ccR,-dHalf,dHalf,32),   // D arc faces infield (+Z)
      // ── Top end (z = +hl) ──
      rect(-paHW,hl,paHW,hl-paDepth),
      rect(-syHW,hl,syHW,hl-syDepth),
      spot(0,hl-penDist),
      arc(0,hl-penDist,ccR,Math.PI-dHalf,Math.PI+dHalf,32), // D arc faces infield (-Z)
      // Corner arcs (quarter circles, radius 1m)
      arc(-hw,-hl,crnR,-Math.PI/2,0,10),
      arc( hw,-hl,crnR, Math.PI,-Math.PI/2+0.001,10),
      arc(-hw, hl,crnR, 0,Math.PI/2,10),
      arc( hw, hl,crnR, Math.PI/2,Math.PI,10),
    ];
  }, [gridFade]);

  return (
    <>
      {segments.map((pts, i) => (
        <PitchLine key={i} pts={pts} />
      ))}
    </>
  );
}

// ── Stadium crowd colours ─────────────────────────────────────────────────────
const CROWD_HEX = [
  0xCC0000, 0xFF2222, 0xDD0000,
  0xFFFFFF, 0xF5F5F5, 0xEEEEEE,
  0x0044BB, 0x003399, 0x0055CC,
  0xFFCC00, 0xDDAA00, 0xFFBB11,
  0x111111, 0x333333, 0x555555,
  0xFF6600, 0xCC4400, 0xFF8833,
  0x880000, 0xAA1100, 0x660000,
  0x88AAFF, 0x99CCFF, 0xBBDDFF,
];

// ── Floodlight tower ──────────────────────────────────────────────────────────
function FloodlightTower({ px, pz, poleH, size }: {
  px: number; pz: number; poleH: number; size: number;
}) {
  const poleThin = Math.max(size * 0.03, poleH * 0.018);
  const lampW = poleH * 0.22;
  const lampH = poleH * 0.022;
  const lampD = poleH * 0.07;
  return (
    <group position={[px, 0, pz]}>
      {/* Main tapered pole */}
      <mesh position={[0, poleH * 0.5, 0]} castShadow>
        <cylinderGeometry args={[poleThin * 0.55, poleThin, poleH, 6]} />
        <meshStandardMaterial color="#6b7a8d" metalness={0.78} roughness={0.28} />
      </mesh>
      {/* Mid cross-brace */}
      <mesh position={[0, poleH * 0.52, 0]}>
        <boxGeometry args={[poleThin * 5, poleThin * 0.5, poleThin * 0.5]} />
        <meshStandardMaterial color="#6b7a8d" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Lamp bank at top, angled slightly down */}
      <group position={[0, poleH, 0]}>
        <mesh rotation={[Math.PI / 7, 0, 0]}>
          <boxGeometry args={[lampW, lampH, lampD]} />
          <meshStandardMaterial color="#ffffcc" emissive="#ffffee" emissiveIntensity={7} roughness={0.05} />
        </mesh>
        <pointLight color="#fff4cc" intensity={poleH * 1.2} distance={poleH * 11}
          decay={1.4} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} />
      </group>
    </group>
  );
}

// ── Goal net lines ────────────────────────────────────────────────────────────
function GoalNetLines({ gW, gH, gD, dz }: { gW: number; gH: number; gD: number; dz: number }) {
  const lineObj = useMemo(() => {
    const pts: number[] = [];
    const p = (x1:number,y1:number,z1:number, x2:number,y2:number,z2:number) =>
      pts.push(x1,y1,z1, x2,y2,z2);
    const nW = 10, nH = 6, nD = 4;
    const bz = dz * gD;
    // Back face grid
    for (let i=0;i<=nW;i++) { const x=-gW/2+(gW/nW)*i; p(x,0,bz,  x,gH,bz); }
    for (let j=0;j<=nH;j++) { const y=(gH/nH)*j;       p(-gW/2,y,bz, gW/2,y,bz); }
    // Top face runs
    for (let i=0;i<=nW;i++) { const x=-gW/2+(gW/nW)*i; p(x,gH,0, x,gH,bz); }
    for (let j=0;j<=nD;j++) { const z=dz*(gD/nD)*j;    p(-gW/2,gH,z, gW/2,gH,z); }
    // Left side
    for (let j=0;j<=nH;j++) { const y=(gH/nH)*j; p(-gW/2,y,0, -gW/2,y,bz); }
    for (let j=0;j<=nD;j++) { const z=dz*(gD/nD)*j; p(-gW/2,0,z, -gW/2,gH,z); }
    // Right side
    for (let j=0;j<=nH;j++) { const y=(gH/nH)*j; p(gW/2,y,0, gW/2,y,bz); }
    for (let j=0;j<=nD;j++) { const z=dz*(gD/nD)*j; p(gW/2,0,z, gW/2,gH,z); }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
    const mat = new THREE.LineBasicMaterial({ color:"#ffffff", transparent:true, opacity:0.28, fog:false });
    return new THREE.LineSegments(geo, mat);
  }, [gW, gH, gD, dz]);
  useEffect(() => () => {
    lineObj.geometry.dispose();
    (lineObj.material as THREE.Material).dispose();
  }, [lineObj]);
  return <primitive object={lineObj} />;
}

// ── Football goal ─────────────────────────────────────────────────────────────
function FootballGoal({ cz, dz, size, pitchW }: {
  cz: number; dz: number; size: number; pitchW: number;
}) {
  const gW = pitchW * 0.108;
  const gH = Math.max(size * 0.6, pitchW * 0.036);
  const gD = gH * 0.78;
  const postR = Math.max(size * 0.018, gH * 0.04);
  return (
    <group position={[0, 0, cz]}>
      {/* Posts */}
      <mesh position={[-gW/2, gH/2, 0]} castShadow>
        <cylinderGeometry args={[postR, postR, gH, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.22} metalness={0.55} />
      </mesh>
      <mesh position={[gW/2, gH/2, 0]} castShadow>
        <cylinderGeometry args={[postR, postR, gH, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.22} metalness={0.55} />
      </mesh>
      {/* Crossbar */}
      <mesh position={[0, gH, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
        <cylinderGeometry args={[postR, postR, gW + postR*2, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.22} metalness={0.55} />
      </mesh>
      <GoalNetLines gW={gW} gH={gH} gD={gD} dz={dz} />
    </group>
  );
}

// ── Stadium stands + crowd + flags ────────────────────────────────────────────
function StadiumStands({ pitchL, pitchW, size, gridFade }: {
  pitchL: number; pitchW: number; size: number; gridFade: number;
}) {
  const { positions, colors, seatS, flagsData, hl, hw, standEnd } = useMemo(() => {
    const hl = pitchL / 2, hw = pitchW / 2;
    const gap      = gridFade * 0.030;
    const rows     = 7;
    const rowDepth = gridFade * 0.013;
    const rowRise  = gridFade * 0.0075;
    const baseY    = 0.05;
    const unitSeat = gridFade * 0.015;
    const seatS    = unitSeat * 0.82;

    const longCols  = Math.round(pitchL / unitSeat);
    const shortCols = Math.round(pitchW / unitSeat);
    const pos: [number,number,number][] = [];
    const col: number[] = [];

    for (let r = 0; r < rows; r++) {
      const y    = baseY + r * rowRise + rowRise * 0.65;
      const back = gap + r * rowDepth + rowDepth * 0.5;
      for (let c = 0; c < longCols; c++) {
        const z    = -pitchL/2 + (c+0.5)*(pitchL/longCols);
        const cIdx = (Math.floor(c/7)*3 + r) % CROWD_HEX.length;
        pos.push([-hw-back, y, z]); col.push(CROWD_HEX[cIdx]);
        pos.push([ hw+back, y, z]); col.push(CROWD_HEX[(cIdx+5)%CROWD_HEX.length]);
      }
      for (let c = 0; c < shortCols; c++) {
        const x    = -pitchW/2 + (c+0.5)*(pitchW/shortCols);
        const cIdx = (Math.floor(c/5)*3 + r + 8) % CROWD_HEX.length;
        pos.push([x, y, -hl-back]); col.push(CROWD_HEX[cIdx]);
        pos.push([x, y,  hl+back]); col.push(CROWD_HEX[(cIdx+7)%CROWD_HEX.length]);
      }
    }

    // Flags scattered across top rows
    const flagPH = gridFade * 0.026;
    const flagsData: { x:number; y:number; z:number; color:string; phase:number }[] = [];
    const addFlags = (side: 0|1|2|3, n: number) => {
      for (let i=0; i<n; i++) {
        const t = (i+0.5)/n;
        const rOff = i % rows;
        const back = gap + (rows-1-rOff)*rowDepth + rowDepth*0.5;
        const fy   = baseY + (rows-1-rOff)*rowRise + rowRise*0.65 + flagPH*0.5;
        let x=0, z=0;
        if (side===0) { x=-hw-back; z=-pitchL/2+pitchL*t; }
        if (side===1) { x= hw+back; z=-pitchL/2+pitchL*t; }
        if (side===2) { x=-pitchW/2+pitchW*t; z=-hl-back; }
        if (side===3) { x=-pitchW/2+pitchW*t; z= hl+back; }
        const hex = CROWD_HEX[(i*4+side*5) % CROWD_HEX.length];
        flagsData.push({ x, y:fy, z, color:`#${hex.toString(16).padStart(6,"0")}`, phase:i*0.62+side*1.1 });
      }
    };
    addFlags(0,11); addFlags(1,11); addFlags(2,7); addFlags(3,7);

    const standEnd = gap + rows * rowDepth;
    return { positions:pos, colors:col, seatS, flagsData, hl, hw, standEnd };
  }, [pitchL, pitchW, gridFade]);

  const count  = positions.length;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const flagRefs = useRef<(THREE.Group|null)[]>([]);

  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    const mat4 = new THREE.Matrix4();
    const c3   = new THREE.Color();
    for (let i=0; i<count; i++) {
      const [x,y,z] = positions[i];
      mat4.makeTranslation(x, y, z);
      m.setMatrixAt(i, mat4);
      m.setColorAt(i, c3.setHex(colors[i]));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [positions, colors, count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    flagRefs.current.forEach((ref, i) => {
      if (ref) ref.rotation.z = Math.sin(t*2.8 + (flagsData[i]?.phase ?? 0)) * 0.18;
    });
  });

  const flagPH  = gridFade * 0.026;
  const flagCW  = gridFade * 0.012;
  const flagCH  = gridFade * 0.008;
  const poleR   = Math.max(size * 0.008, flagPH * 0.028);
  const baseBox = 0.05;

  return (
    <>
      {/* Crowd seats */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[seatS, seatS * 0.9, seatS]} />
        <meshStandardMaterial roughness={0.65} />
      </instancedMesh>

      {/* Concrete stand bases */}
      <mesh position={[-hw-standEnd*0.5, baseBox*0.5, 0]}>
        <boxGeometry args={[standEnd, baseBox, pitchL+standEnd*0.4]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.95} />
      </mesh>
      <mesh position={[hw+standEnd*0.5, baseBox*0.5, 0]}>
        <boxGeometry args={[standEnd, baseBox, pitchL+standEnd*0.4]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.95} />
      </mesh>
      <mesh position={[0, baseBox*0.5, -hl-standEnd*0.5]}>
        <boxGeometry args={[pitchW+standEnd*2.6, baseBox, standEnd]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.95} />
      </mesh>
      <mesh position={[0, baseBox*0.5, hl+standEnd*0.5]}>
        <boxGeometry args={[pitchW+standEnd*2.6, baseBox, standEnd]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.95} />
      </mesh>

      {/* Waving flags and scarves */}
      {flagsData.map((fd, i) => (
        <group key={i}
          ref={el => { flagRefs.current[i] = el; }}
          position={[fd.x, fd.y, fd.z]}>
          <mesh position={[0, -flagPH*0.45, 0]}>
            <cylinderGeometry args={[poleR, poleR, flagPH, 4]} />
            <meshStandardMaterial color="#999" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[flagCW*0.5, 0, 0]}>
            <boxGeometry args={[flagCW, flagCH, flagCH * 0.3]} />
            <meshBasicMaterial color={fd.color} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars() {
  const ref = useRef<THREE.Points>(null);
  const [positions, sizes] = useMemo(() => {
    const n = 1800, pos = new Float32Array(n * 3), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = 180 + Math.random()*320, t = Math.random()*Math.PI*2, p = Math.acos(2*Math.random()-1);
      pos[i*3]   = r*Math.sin(p)*Math.cos(t);
      pos[i*3+1] = Math.abs(r*Math.cos(p))*(Math.random()<0.5?1:-0.3);
      pos[i*3+2] = r*Math.sin(p)*Math.sin(t);
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
  const h = visual/2, o = 0.003, pw = visual*0.8, ph = visual*0.75;
  return (
    <>
      {logoTex && (<>
        <mesh position={[0,0,h+o]}><planeGeometry args={[pw,pw]} /><meshBasicMaterial map={logoTex} transparent alphaTest={0.05} depthWrite={false} /></mesh>
        <mesh position={[0,0,-(h+o)]} rotation={[0,Math.PI,0]}><planeGeometry args={[pw,pw]} /><meshBasicMaterial map={logoTex} transparent alphaTest={0.05} depthWrite={false} /></mesh>
        <mesh position={[h+o,0,0]} rotation={[0,-Math.PI/2,0]}><planeGeometry args={[pw,pw]} /><meshBasicMaterial map={logoTex} transparent alphaTest={0.05} depthWrite={false} /></mesh>
        <mesh position={[-(h+o),0,0]} rotation={[0,Math.PI/2,0]}><planeGeometry args={[pw,pw]} /><meshBasicMaterial map={logoTex} transparent alphaTest={0.05} depthWrite={false} /></mesh>
      </>)}
      <mesh position={[0,h+o,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[ph,ph]} /><meshBasicMaterial map={fbTex} transparent alphaTest={0.05} depthWrite={false} /></mesh>
    </>
  );
}

// ── Static block mesh ─────────────────────────────────────────────────────────
function BlockMesh({ block, size, gap, eraseMode, onErase }: {
  block:Block; size:number; gap:number; eraseMode:boolean; onErase:(id:string)=>void;
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
  block:Block; size:number; gap:number; init:PhysicsState;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const p = useRef<PhysicsState>({ ...init });
  const logoTex = useLogoTexture(block.logo);
  const visual = size - gap;
  useFrame((_, dt) => {
    const d = Math.min(dt,0.05), s = p.current;
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
  chaosMode, chaosPhysics, onAddBlock, onEraseBlock,
}: {
  blocks:Block[]; selectedColor:string; eraseMode:boolean;
  size:number; gap:number; gridCell:number; gridSection:number; gridFade:number;
  chaosMode:boolean; chaosPhysics:Map<string,PhysicsState>;
  onAddBlock:(x:number,y:number,z:number)=>void; onEraseBlock:(id:string)=>void;
}) {
  const downPos = useRef<{x:number;y:number}|null>(null);
  const [ghost, setGhost] = useState<[number,number,number]|null>(null);

  // Shared ball state — one ball rolling around the whole scene
  const ballRef = useRef<BallData>({
    px:0, py:size*0.17, pz:0,
    vx:size*2.1, vy:0, vz:size*1.5,
    rotX:0, rotZ:0, cooldown:0,
  });

  // 8 players with different kits, spread across the field
  const playerCfgs = useMemo<PlayerCfg[]>(() => {
    const s = gridFade * 0.28;
    return [
      { id:0, kitIdx:0,  startX:-s*0.9, startZ:-s*0.7, phase:0.4  },
      { id:1, kitIdx:4,  startX: s*0.9, startZ:-s*0.7, phase:2.8  },
      { id:2, kitIdx:1,  startX:-s*0.4, startZ: s*0.5, phase:1.1  },
      { id:3, kitIdx:8,  startX: s*0.4, startZ: s*0.5, phase:4.2  },
      { id:4, kitIdx:2,  startX: 0,     startZ:-s*0.95,phase:5.8  },
      { id:5, kitIdx:5,  startX: 0,     startZ: s*0.95,phase:3.5  },
      { id:6, kitIdx:7,  startX:-s*0.7, startZ: s*0.05,phase:0.9  },
      { id:7, kitIdx:9,  startX: s*0.7, startZ: s*0.05,phase:2.1  },
    ];
  }, [gridFade]);

  const handleGroundDown = (e: ThreeEvent<PointerEvent>) => { downPos.current={x:e.clientX,y:e.clientY}; };

  const handleGroundMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (eraseMode||chaosMode) { setGhost(null); return; }
    setGhost([snapTo(e.point.x,size), size/2, snapTo(e.point.z,size)]);
  }, [eraseMode,chaosMode,size]);

  const handleGroundClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (eraseMode||chaosMode) return;
    if (downPos.current) {
      const dx=e.clientX-downPos.current.x, dy=e.clientY-downPos.current.y;
      if (Math.sqrt(dx*dx+dy*dy)>8) return;
    }
    onAddBlock(snapTo(e.point.x,size), 0, snapTo(e.point.z,size));
  }, [eraseMode,chaosMode,size,onAddBlock]);

  const handleBlockClick = useCallback((e: ThreeEvent<MouseEvent>, block: Block) => {
    if (chaosMode) return;
    if (eraseMode) { e.stopPropagation(); onEraseBlock(block.id); return; }
    e.stopPropagation();
    if (downPos.current) {
      const dx=e.clientX-downPos.current.x, dy=e.clientY-downPos.current.y;
      if (Math.sqrt(dx*dx+dy*dy)>8) return;
    }
    const top = blocks.filter(b=>b.x===block.x&&b.z===block.z).reduce((m,b)=>Math.max(m,b.y),-1);
    onAddBlock(block.x, top+1, block.z);
  }, [chaosMode,eraseMode,blocks,onAddBlock,onEraseBlock]);

  const handleBlockMove = useCallback((e: ThreeEvent<PointerEvent>, block: Block) => {
    if (eraseMode||chaosMode) { setGhost(null); return; }
    const top = blocks.filter(b=>b.x===block.x&&b.z===block.z).reduce((m,b)=>Math.max(m,b.y),-1);
    setGhost([block.x,(top+1)*size+size/2,block.z]);
  }, [eraseMode,chaosMode,blocks,size]);

  return (
    <>
      <Stars />
      {/* Base ambient — kept low so floodlights dominate */}
      <ambientLight intensity={0.14} />
      <directionalLight position={[14,22,10]} intensity={0.7} color="#d0e8ff" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004} />
      <directionalLight position={[-10,6,-12]} intensity={0.18} color="#ffe4b0" />
      <directionalLight position={[0,4,-20]}   intensity={0.22} color="#8b5cf6" />
      <hemisphereLight args={["#0d1b45","#000000",0.35]} />
      <pointLight position={[0,size*0.5,0]} intensity={0.25} color="#3b82f6" distance={gridFade*0.3} />

      <Grid position={[0,0,0]} args={[500,500]}
        cellSize={gridCell} cellThickness={0.4} cellColor="#1e3a6e"
        sectionSize={gridSection} sectionThickness={0.9} sectionColor="#2563eb"
        fadeDistance={gridFade} fadeStrength={2.5} infiniteGrid />
      <PlatformGlow radius={gridFade*0.22} />
      <PitchMarkings gridFade={gridFade} />

      {/* ── Stadium atmosphere ── */}
      {(() => {
        const pL = gridFade * 0.62, pW = gridFade * 0.40;
        const hL = pL / 2,         hW = pW / 2;
        const sEnd = gridFade * (0.030 + 7 * 0.013); // stand depth
        const ftOff = sEnd + gridFade * 0.045;        // floodlight corner offset
        const pH = gridFade * 0.20;                   // pole height
        return (
          <>
            <StadiumStands pitchL={pL} pitchW={pW} size={size} gridFade={gridFade} />
            {/* Goals — net faces infield (away from pitch) */}
            <FootballGoal cz={-hL} dz={-1} size={size} pitchW={pW} />
            <FootballGoal cz={ hL} dz={ 1} size={size} pitchW={pW} />
            {/* 4 floodlight towers at corners of the stands */}
            <FloodlightTower px={-hW-ftOff} pz={-hL-ftOff} poleH={pH} size={size} />
            <FloodlightTower px={ hW+ftOff} pz={-hL-ftOff} poleH={pH} size={size} />
            <FloodlightTower px={-hW-ftOff} pz={ hL+ftOff} poleH={pH} size={size} />
            <FloodlightTower px={ hW+ftOff} pz={ hL+ftOff} poleH={pH} size={size} />
          </>
        );
      })()}

      {/* Football */}
      <Football size={size} ballRef={ballRef} />

      {/* Players sprinting and chasing */}
      {playerCfgs.map(cfg => (
        <RunningPlayer key={cfg.id} cfg={cfg} size={size} gridFade={gridFade} ballRef={ballRef} />
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

      {blocks.map((block) =>
        chaosMode ? (
          <PhysicsBlock key={block.id} block={block} size={size} gap={gap}
            init={chaosPhysics.get(block.id)??makeChaosPhysics(block,size)} />
        ) : (
          <group key={block.id}
            onPointerDown={handleGroundDown}
            onPointerMove={(e)=>{ e.stopPropagation(); handleBlockMove(e,block); }}
            onClick={(e)=>handleBlockClick(e,block)}>
            <BlockMesh block={block} size={size} gap={gap} eraseMode={eraseMode} onErase={onEraseBlock} />
          </group>
        )
      )}

      {!eraseMode&&!chaosMode&&ghost&&<GhostBlock position={ghost} color={selectedColor} size={size} gap={gap} />}
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
      color:"white",
      border: active ? "1.5px solid rgba(255,255,255,0.45)" : "1.5px solid rgba(255,255,255,0.12)",
      borderRadius:14, padding:"8px 14px", fontSize:14, fontWeight:700,
      cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap", backdropFilter:"blur(8px)",
    }}>
      {children}
    </button>
  );
}

// ── Premium lock popup ────────────────────────────────────────────────────────
function PremiumLockPopup({ onClose, onBuy }: { onClose:()=>void; onBuy:()=>void }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)",
      backdropFilter:"blur(5px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:400 }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"linear-gradient(145deg,#0f0f20,#1a1a32)", borderRadius:24,
        border:"1.5px solid rgba(255,255,255,0.14)", padding:"32px 28px", maxWidth:300, width:"90%",
        textAlign:"center", boxShadow:"0 24px 64px rgba(0,0,0,0.85)" }}>
        <div style={{ fontSize:52, marginBottom:10 }}>🔒</div>
        <h3 style={{ color:"white", fontWeight:900, fontSize:20, margin:"0 0 8px", letterSpacing:-0.3 }}>
          Unlock the Premier Pack
        </h3>
        <p style={{ color:"rgba(255,255,255,0.55)", fontSize:13.5, lineHeight:1.65, margin:"0 0 22px" }}>
          Official Premier League badges on every block — one-time unlock
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.7)",
            border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"10px 18px",
            fontSize:13, fontWeight:600, cursor:"pointer" }}>Maybe later</button>
          <button onClick={onBuy} style={{ background:"linear-gradient(135deg,#f59e0b,#ef4444)",
            color:"white", border:"none", borderRadius:12, padding:"10px 20px",
            fontSize:14, fontWeight:800, cursor:"pointer", boxShadow:"0 4px 16px rgba(239,68,68,0.45)",
            letterSpacing:0.2 }}>⚽ Buy — 99p</button>
        </div>
      </div>
    </div>
  );
}

// ── Theme shop drawer ─────────────────────────────────────────────────────────
function ShopDrawer({
  open, onClose, isPremiumUser, hasCustomTeam,
  selectedThemeId, onSelectPremium, onBuyPremier,
  customTeam, onCustomTeamChange, onBuyCustom, onSelectCustom,
}: {
  open:boolean; onClose:()=>void;
  isPremiumUser:boolean; hasCustomTeam:boolean;
  selectedThemeId:string;
  onSelectPremium:(id:string)=>void; onBuyPremier:()=>void;
  customTeam:{name:string;colorA:string;colorB:string};
  onCustomTeamChange:(t:{name:string;colorA:string;colorB:string})=>void;
  onBuyCustom:()=>void; onSelectCustom:()=>void;
}) {
  const cardStyle: React.CSSProperties = {
    background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)",
    borderRadius:16, padding:"16px", display:"flex", flexDirection:"column", gap:12,
  };
  const buyBtnStyle: React.CSSProperties = {
    background:"linear-gradient(135deg,#f59e0b,#ef4444)", color:"white", border:"none",
    borderRadius:10, padding:"10px 0", fontSize:13, fontWeight:800, cursor:"pointer",
    width:"100%", letterSpacing:0.2,
  };
  const labelStyle: React.CSSProperties = { color:"white", fontWeight:800, fontSize:15 };
  const descStyle:  React.CSSProperties = { color:"rgba(255,255,255,0.5)", fontSize:12.5, lineHeight:1.55, margin:0 };

  return (
    <>
      {open && <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
        backdropFilter:"blur(3px)", zIndex:300 }} />}
      <div style={{
        position:"fixed", top:0, right: open ? 0 : "-110%", width:"min(340px,100vw)",
        height:"100%", background:"linear-gradient(170deg,#0a0a1e 0%,#0d0d26 100%)",
        borderLeft:"1px solid rgba(255,255,255,0.1)", overflowY:"auto",
        transition:"right 0.3s cubic-bezier(0.4,0,0.2,1)", zIndex:301,
        display:"flex", flexDirection:"column",
      }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"18px 18px 14px", borderBottom:"1px solid rgba(255,255,255,0.08)", flexShrink:0 }}>
          <span style={{ color:"white", fontWeight:900, fontSize:17, letterSpacing:-0.2 }}>🛒 Theme Shop</span>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", color:"white", border:"none",
            borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:14, fontWeight:700 }}>✕</button>
        </div>

        <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:14, overflowY:"auto" }}>

          {/* Premier Pack */}
          <div style={cardStyle}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={labelStyle}>⚽ Premier Pack</span>
              {isPremiumUser
                ? <span style={{ color:"#4ade80", fontSize:12, fontWeight:700, background:"rgba(74,222,128,0.12)",
                    padding:"3px 10px", borderRadius:20 }}>✓ Unlocked</span>
                : <span style={{ color:"#fbbf24", fontSize:12, fontWeight:800 }}>99p</span>}
            </div>
            <p style={descStyle}>Official Premier League club badges on your building blocks.</p>

            {/* Team grid preview */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {BLOCK_THEMES.map(t => {
                const isSelected = isPremiumUser && selectedThemeId === t.id;
                return (
                  <button key={t.id} title={t.name}
                    onClick={() => isPremiumUser ? onSelectPremium(t.id) : undefined}
                    style={{ position:"relative", width:40, height:40, borderRadius:"50%",
                      border: isSelected ? "2.5px solid white" : "1.5px solid rgba(255,255,255,0.15)",
                      overflow:"hidden", cursor: isPremiumUser ? "pointer" : "default",
                      background:"#111", padding:0, flexShrink:0,
                      boxShadow: isSelected ? "0 0 0 2px rgba(255,255,255,0.3)" : "none",
                      transform: isSelected ? "scale(1.12)" : "scale(1)", transition:"all 0.15s" }}>
                    {isPremiumUser
                      ? <img src={t.premiumLogo} alt={t.name}
                          style={{ width:30, height:30, objectFit:"contain",
                            position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)" }}
                          onError={e=>{ (e.target as HTMLImageElement).style.display="none"; }} />
                      : <>
                          <div style={{ position:"absolute", inset:0,
                            background:`linear-gradient(135deg,${t.logo.split("|")[1]??t.hex} 50%,${t.logo.split("|")[2]??"#fff"} 50%)`,
                            filter:"blur(1px) brightness(0.45)" }} />
                          <span style={{ position:"relative", fontSize:14 }}>🔒</span>
                        </>}
                  </button>
                );
              })}
            </div>
            {!isPremiumUser && <button style={buyBtnStyle} onClick={onBuyPremier}>Buy Premier Pack — 99p</button>}
          </div>

          {/* Custom Team */}
          <div style={cardStyle}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={labelStyle}>🏷️ Your Team</span>
              {hasCustomTeam
                ? <span style={{ color:"#4ade80", fontSize:12, fontWeight:700, background:"rgba(74,222,128,0.12)",
                    padding:"3px 10px", borderRadius:20 }}>✓ Unlocked</span>
                : <span style={{ color:"#fbbf24", fontSize:12, fontWeight:800 }}>99p</span>}
            </div>
            <p style={descStyle}>Type your own team name onto every block you place — your colours, your badge.</p>

            {hasCustomTeam ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {/* Name input */}
                <div>
                  <label style={{ color:"rgba(255,255,255,0.55)", fontSize:11, fontWeight:700,
                    display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>
                    Team Name (max 10 chars)
                  </label>
                  <input value={customTeam.name} maxLength={10}
                    onChange={e => onCustomTeamChange({ ...customTeam, name:e.target.value })}
                    style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.07)",
                      border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"8px 10px",
                      color:"white", fontSize:14, fontWeight:700, outline:"none" }} />
                </div>
                {/* Colour pickers */}
                <div style={{ display:"flex", gap:10 }}>
                  {(["colorA","colorB"] as const).map((field, i) => (
                    <div key={field} style={{ flex:1 }}>
                      <label style={{ color:"rgba(255,255,255,0.55)", fontSize:11, fontWeight:700,
                        display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>
                        {i===0 ? "Primary" : "Secondary"}
                      </label>
                      <input type="color" value={customTeam[field]}
                        onChange={e => onCustomTeamChange({ ...customTeam, [field]:e.target.value })}
                        style={{ width:"100%", height:36, borderRadius:8, border:"1px solid rgba(255,255,255,0.15)",
                          cursor:"pointer", background:"rgba(0,0,0,0)", padding:2 }} />
                    </div>
                  ))}
                </div>
                {/* Preview + select */}
                <button onClick={onSelectCustom} style={{
                  ...buyBtnStyle, background: selectedThemeId==="custom"
                    ? "linear-gradient(135deg,#4ade80,#22d3ee)" : "rgba(255,255,255,0.1)",
                  color:"white", border: selectedThemeId==="custom" ? "none" : "1px solid rgba(255,255,255,0.2)",
                }}>
                  {selectedThemeId==="custom" ? "✓ Selected as active" : "Use my team's block"}
                </button>
              </div>
            ) : (
              <button style={buyBtnStyle} onClick={onBuyCustom}>Buy Your Team — 99p</button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function App() {
  const [activeMode,    setActiveMode]    = useState<ModeKey>("small");
  const [allBlocks,     setAllBlocks]     = useState<Record<ModeKey,Block[]>>({ atom:[],micro:[],nano:[],small:[],large:[],mega:[] });
  const [allHistory,    setAllHistory]    = useState<Record<ModeKey,Block[][]>>({ atom:[[]],micro:[[]],nano:[[]],small:[[]],large:[[]],mega:[[]] });
  const [selectedThemeId, setSelectedThemeId] = useState<string>(BLOCK_THEMES[0].id);
  const [eraseMode,     setEraseMode]     = useState(false);
  const [chaosMode,     setChaosMode]     = useState(false);
  const [chaosPhysics,  setChaosPhysics]  = useState<Map<string,PhysicsState>>(new Map());
  const [sharing,       setSharing]       = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [hasCustomTeam, setHasCustomTeam] = useState(false);
  const [shopOpen,      setShopOpen]      = useState(false);
  const [showLock,      setShowLock]      = useState(false);
  const [customTeam,    setCustomTeam]    = useState({ name:"My Team", colorA:"#FF0000", colorB:"#FFFFFF" });
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  const mode   = MODES.find(m => m.key === activeMode)!;
  const blocks = allBlocks[activeMode];

  // Derived theme values
  const selectedTheme = BLOCK_THEMES.find(t => t.id === selectedThemeId) ?? BLOCK_THEMES[0];
  const activeColor = selectedThemeId === "custom" ? customTeam.colorA : selectedTheme.hex;
  const activeLogo  = selectedThemeId === "custom"
    ? `custom|${customTeam.colorA}|${customTeam.colorB}|${encodeURIComponent(customTeam.name)}`
    : (isPremiumUser ? selectedTheme.premiumLogo : selectedTheme.logo);

  // Keep refs so addBlock closure always has latest values without stale captures
  const activeColorRef = useRef(activeColor);
  const activeLogoRef  = useRef(activeLogo);
  activeColorRef.current = activeColor;
  activeLogoRef.current  = activeLogo;

  const switchMode = (key: ModeKey) => { setActiveMode(key); setEraseMode(false); setChaosMode(false); };

  const addBlock = useCallback((x:number,y:number,z:number) => {
    setAllBlocks(prev => {
      const cur = prev[activeMode];
      if (cur.some(b=>b.x===x&&b.y===y&&b.z===z)) return prev;
      haptic();
      const next = [...cur, { id:uid(), x, y, z, color:activeColorRef.current, logo:activeLogoRef.current }];
      setAllHistory(h=>({ ...h, [activeMode]:[...h[activeMode].slice(-49),next] }));
      return { ...prev, [activeMode]:next };
    });
  }, [activeMode]);

  const eraseBlock = useCallback((id:string) => {
    setAllBlocks(prev => {
      const next = prev[activeMode].filter(b=>b.id!==id);
      setAllHistory(h=>({ ...h, [activeMode]:[...h[activeMode].slice(-49),next] }));
      return { ...prev, [activeMode]:next };
    });
  }, [activeMode]);

  const undo = useCallback(() => {
    setAllHistory(h => {
      const cur = h[activeMode];
      if (cur.length<=1) return h;
      setAllBlocks(b=>({ ...b, [activeMode]:cur[cur.length-2] }));
      return { ...h, [activeMode]:cur.slice(0,-1) };
    });
  }, [activeMode]);

  const clear = useCallback(() => {
    if (blocks.length===0) return;
    setAllBlocks(b=>({ ...b, [activeMode]:[] }));
    setAllHistory(h=>({ ...h, [activeMode]:[[]] }));
    setChaosMode(false);
  }, [activeMode, blocks.length]);

  const toggleChaos = useCallback(() => {
    if (!chaosMode) {
      const map = new Map<string,PhysicsState>();
      blocks.forEach(b => map.set(b.id, makeChaosPhysics(b, mode.size)));
      setChaosPhysics(map);
      setEraseMode(false);
    }
    setChaosMode(m=>!m);
  }, [chaosMode, blocks, mode.size]);

  const handleShare = useCallback(async () => {
    const gl = glRef.current;
    if (!gl||sharing) return;
    setSharing(true);
    try {
      const url = gl.domElement.toDataURL("image/png");
      const blob = await fetch(url).then(r=>r.blob());
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
        style={{ background:"radial-gradient(ellipse at 50% 40%,#0a0e2a 0%,#020209 70%)" }}
        dpr={[1,2]}
        onCreated={({ gl }) => { glRef.current = gl; }}
      >
        <fog attach="fog" args={["#020209", mode.gridFade*0.8, mode.gridFade*2.5]} />
        <OrbitControls enableDamping dampingFactor={0.1}
          minDistance={mode.minDist} maxDistance={mode.maxDist}
          maxPolarAngle={Math.PI/2 - 0.03}
          touches={{ ONE:THREE.TOUCH.ROTATE, TWO:THREE.TOUCH.DOLLY_ROTATE }} />
        <Scene
          blocks={blocks} selectedColor={activeColor}
          eraseMode={eraseMode} size={mode.size} gap={mode.gap}
          gridCell={mode.gridCell} gridSection={mode.gridSection} gridFade={mode.gridFade}
          chaosMode={chaosMode} chaosPhysics={chaosPhysics}
          onAddBlock={addBlock} onEraseBlock={eraseBlock} />
      </Canvas>

      {/* ── Top bar ── */}
      <div style={{ position:"absolute", top:0, left:0, right:0, padding:"10px 10px 0",
        background:"linear-gradient(180deg,rgba(2,2,9,0.95) 0%,transparent 100%)" }}>

        {/* Size tabs */}
        <div style={{ display:"flex", gap:4, justifyContent:"center", marginBottom:5, flexWrap:"nowrap", overflowX:"auto" }}>
          {MODES.map(m => (
            <button key={m.key} onClick={()=>switchMode(m.key)} style={{
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
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"3px 2px 10px" }}>
          <div>
            <span style={{ color:"white", fontWeight:800, fontSize:15, textShadow:"0 0 20px rgba(99,102,241,0.8)" }}>🧱 Block Builder</span>
            <span style={{ marginLeft:7, color:"rgba(255,255,255,0.3)", fontSize:10 }}>{mode.desc} · {mode.size}u</span>
          </div>
          <div style={{ display:"flex", gap:5 }}>
            <Btn onClick={undo}           bg="rgba(255,255,255,0.07)" title="Undo">↩</Btn>
            <Btn onClick={clear}          bg="rgba(239,68,68,0.22)"   title="Clear">🗑</Btn>
            <Btn onClick={handleShare}    bg={sharing?"rgba(34,197,94,0.5)":"rgba(255,255,255,0.07)"} title="Share screenshot">{sharing?"⏳":"📷"}</Btn>
            <Btn onClick={toggleChaos}    bg={chaosMode?"rgba(239,68,68,0.75)":"rgba(255,255,255,0.07)"} title="Chaos physics!">💥</Btn>
            <button onClick={()=>setShopOpen(true)} title="Theme Shop"
              style={{ background:"rgba(255,255,255,0.07)", color:"white",
                border:"1.5px solid rgba(255,255,255,0.12)", borderRadius:14,
                padding:"8px 12px", fontSize:16, cursor:"pointer",
                backdropFilter:"blur(8px)", transition:"all 0.15s",
                boxShadow: isPremiumUser ? "0 0 10px rgba(251,191,36,0.4)" : "none" }}>
              🛒{!isPremiumUser && <span style={{ position:"absolute", top:-2, right:-2, background:"#ef4444",
                borderRadius:"50%", width:8, height:8, display:"inline-block", verticalAlign:"top",
                marginLeft:-8, marginTop:-4 }} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Block counter ── */}
      <div style={{ position:"absolute", top:96, right:14,
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
      {blocks.length===0 && !chaosMode && (
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

        {/* Free block palette */}
        {!eraseMode && !chaosMode && (
          <div style={{ display:"flex", gap:5, justifyContent:"center", flexWrap:"wrap",
            maxWidth:460, margin:"0 auto", overflowX:"auto" }}>
            {BLOCK_THEMES.map(t => {
              const active = selectedThemeId === t.id;
              const isDark = t.hex === "#1C1C1B" || t.hex === "#888888";
              const colorB = t.logo.split("|")[2] ?? "#FFFFFF";
              return (
                <button key={t.id} onClick={()=>setSelectedThemeId(t.id)} title={t.name}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center",
                    gap:3, background:"none", border:"none", cursor:"pointer", padding:0, flexShrink:0, width:42 }}>
                  <div style={{
                    width:40, height:40, borderRadius:"50%", overflow:"hidden",
                    background:`linear-gradient(135deg,${t.hex} 50%,${colorB} 50%)`,
                    border: active ? "2.5px solid white" : isDark ? "1.5px solid rgba(255,255,255,0.35)" : "1.5px solid rgba(255,255,255,0.15)",
                    boxShadow: active ? `0 0 0 2.5px ${t.hex}88, 0 0 18px ${t.hex}bb` : "none",
                    transform: active ? "scale(1.22)" : "scale(1)",
                    transition:"all 0.15s",
                    display:"flex", alignItems:"center", justifyContent:"center", position:"relative",
                  }}>
                    {isPremiumUser
                      ? <img src={t.premiumLogo} alt={t.name}
                          onError={e=>{(e.target as HTMLImageElement).style.display="none";}}
                          style={{ width:30, height:30, objectFit:"contain",
                            filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.7))", position:"relative", zIndex:1 }} />
                      : <span style={{ fontSize:14, position:"relative", zIndex:1 }}>
                          {t.logo.split("|")[3] ?? "⚽"}
                        </span>}
                  </div>
                  <span style={{ fontSize:8.5, color:active?"white":"rgba(255,255,255,0.45)",
                    fontWeight:700, width:42, textAlign:"center", lineHeight:1.25,
                    overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                    {t.name}
                  </span>
                </button>
              );
            })}
            {/* Custom team slot */}
            {hasCustomTeam && (
              <button onClick={()=>setSelectedThemeId("custom")} title="My Team"
                style={{ display:"flex", flexDirection:"column", alignItems:"center",
                  gap:3, background:"none", border:"none", cursor:"pointer", padding:0, flexShrink:0, width:42 }}>
                <div style={{
                  width:40, height:40, borderRadius:"50%", overflow:"hidden",
                  background:`linear-gradient(135deg,${customTeam.colorA} 50%,${customTeam.colorB} 50%)`,
                  border: selectedThemeId==="custom" ? "2.5px solid white" : "1.5px solid rgba(255,255,255,0.35)",
                  boxShadow: selectedThemeId==="custom" ? `0 0 0 2.5px ${customTeam.colorA}88, 0 0 18px ${customTeam.colorA}bb` : "none",
                  transform: selectedThemeId==="custom" ? "scale(1.22)" : "scale(1)",
                  transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <span style={{ fontSize:9, fontWeight:900, color:"rgba(255,255,255,0.9)",
                    textShadow:"0 1px 3px rgba(0,0,0,0.8)", lineHeight:1, textAlign:"center", padding:2 }}>
                    {customTeam.name.substring(0,4)}
                  </span>
                </div>
                <span style={{ fontSize:8.5, color:selectedThemeId==="custom"?"white":"rgba(255,255,255,0.45)",
                  fontWeight:700, width:42, textAlign:"center", lineHeight:1.25,
                  overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                  My Team
                </span>
              </button>
            )}
          </div>
        )}
        {eraseMode && (
          <p style={{ textAlign:"center", color:"#fca5a5", fontSize:14, fontWeight:700 }}>
            Tap a block to remove it
          </p>
        )}
      </div>

      {/* ── Theme Shop Drawer ── */}
      <ShopDrawer
        open={shopOpen}
        onClose={()=>setShopOpen(false)}
        isPremiumUser={isPremiumUser}
        hasCustomTeam={hasCustomTeam}
        selectedThemeId={selectedThemeId}
        onSelectPremium={id=>{ setSelectedThemeId(id); setShopOpen(false); }}
        onBuyPremier={()=>{ setIsPremiumUser(true); }}
        customTeam={customTeam}
        onCustomTeamChange={t=>{ _customTexCache.clear(); setCustomTeam(t); }}
        onBuyCustom={()=>{ setHasCustomTeam(true); }}
        onSelectCustom={()=>{ setSelectedThemeId("custom"); setShopOpen(false); }}
      />

      {/* ── Premium lock popup ── */}
      {showLock && (
        <PremiumLockPopup
          onClose={()=>setShowLock(false)}
          onBuy={()=>{ setIsPremiumUser(true); setShowLock(false); }}
        />
      )}

      <style>{`
        @keyframes pulse { from{opacity:0.6} to{opacity:1} }
        div::-webkit-scrollbar { display:none }
      `}</style>
    </div>
  );
}
