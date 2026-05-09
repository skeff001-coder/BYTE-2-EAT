import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Edges } from "@react-three/drei";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import * as THREE from "three";

// ── WebGL detection ───────────────────────────────────────────────────────────
function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}
const WEBGL_AVAILABLE = checkWebGL();

// ── No-WebGL fallback ─────────────────────────────────────────────────────────
function NoWebGL() {
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #020209 0%, #0a0a1a 100%)",
      color: "white", textAlign: "center", padding: 32, gap: 16,
    }}>
      <div style={{ fontSize: 64 }}>🧱</div>
      <h2 style={{ fontSize: 22, fontWeight: 800 }}>Block Builder 3D</h2>
      <p style={{ fontSize: 15, opacity: 0.7, maxWidth: 320, lineHeight: 1.7 }}>
        This preview can't run WebGL.<br />
        Open the link below on your phone or computer to start building!
      </p>
      <a href={window.location.href} target="_blank" rel="noreferrer" style={{
        marginTop: 8, background: "#3b82f6", color: "white",
        borderRadius: 14, padding: "12px 28px",
        fontWeight: 700, fontSize: 15, textDecoration: "none",
      }}>
        Open full game ↗
      </a>
    </div>
  );
}

// ── Block size modes ──────────────────────────────────────────────────────────
const MODES = [
  {
    key: "atom",
    label: "Atom",
    emoji: "⚛️",
    size: 0.1,
    gap: 0.015,
    gridCell: 0.1,
    gridSection: 0.5,
    gridFade: 7,
    camera: [1.8, 1.5, 1.8] as [number, number, number],
    minDist: 0.4,
    maxDist: 10,
    desc: "Ultra fine blocks",
  },
  {
    key: "micro",
    label: "Micro",
    emoji: "🔭",
    size: 0.2,
    gap: 0.03,
    gridCell: 0.2,
    gridSection: 1,
    gridFade: 13,
    camera: [3.5, 3, 3.5] as [number, number, number],
    minDist: 0.8,
    maxDist: 18,
    desc: "Very fine blocks",
  },
  {
    key: "nano",
    label: "Nano",
    emoji: "🔬",
    size: 0.4,
    gap: 0.06,
    gridCell: 0.4,
    gridSection: 2,
    gridFade: 24,
    camera: [6, 6, 6] as [number, number, number],
    minDist: 2,
    maxDist: 30,
    desc: "Tiny detail blocks",
  },
  {
    key: "small",
    label: "Small",
    emoji: "🧊",
    size: 1,
    gap: 0.08,
    gridCell: 1,
    gridSection: 10,
    gridFade: 60,
    camera: [16, 13, 16] as [number, number, number],
    minDist: 4,
    maxDist: 70,
    desc: "Standard blocks",
  },
  {
    key: "large",
    label: "Large",
    emoji: "🟦",
    size: 2,
    gap: 0.12,
    gridCell: 2,
    gridSection: 10,
    gridFade: 100,
    camera: [28, 22, 28] as [number, number, number],
    minDist: 6,
    maxDist: 120,
    desc: "Big chunky blocks",
  },
  {
    key: "mega",
    label: "Mega",
    emoji: "🏗️",
    size: 4,
    gap: 0.18,
    gridCell: 4,
    gridSection: 20,
    gridFade: 180,
    camera: [50, 40, 50] as [number, number, number],
    minDist: 12,
    maxDist: 220,
    desc: "Massive building blocks",
  },
] as const;

type ModeKey = (typeof MODES)[number]["key"];

// ── Team colour palette ───────────────────────────────────────────────────────
const TEAMS = [
  { hex: "#FF0000", name: "Liverpool"   },
  { hex: "#034694", name: "Chelsea"     },
  { hex: "#F5F5F5", name: "Tottenham"   },
  { hex: "#FFD700", name: "Dortmund"    },
  { hex: "#00A651", name: "Celtic"      },
  { hex: "#6DCFF6", name: "Man City"    },
  { hex: "#FF6600", name: "Netherlands" },
  { hex: "#7B2D8B", name: "Fiorentina"  },
  { hex: "#1C1C1B", name: "Juventus"    },
  { hex: "#0052CC", name: "Edmonton"    },
  { hex: "#EE2737", name: "Arsenal"     },
  { hex: "#A50044", name: "Barcelona"   },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type Block = { id: string; x: number; y: number; z: number; color: string };

const uid = () => `${Date.now()}-${Math.random()}`;

// ── Snap to block-size grid ───────────────────────────────────────────────────
function snapTo(v: number, size: number) {
  return Math.round(v / size) * size;
}

// ── Starfield ─────────────────────────────────────────────────────────────────
function Stars({ count = 1800 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz  = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r     = 180 + Math.random() * 320;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * (Math.random() < 0.5 ? 1 : -0.3);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sz[i] = 0.4 + Math.random() * 1.4;
    }
    return [pos, sz];
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial color="#cce4ff" size={0.9} sizeAttenuation transparent opacity={0.85} fog={false} />
    </points>
  );
}

// ── Single block mesh ─────────────────────────────────────────────────────────
function BlockMesh({
  block, size, gap, eraseMode, onErase,
}: {
  block: Block; size: number; gap: number;
  eraseMode: boolean; onErase: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const visual = size - gap;

  useEffect(() => {
    document.body.style.cursor = hovered ? (eraseMode ? "not-allowed" : "pointer") : "auto";
    return () => { document.body.style.cursor = "auto"; };
  }, [hovered, eraseMode]);

  const col = hovered && eraseMode ? "#ff3333" : block.color;

  return (
    <group position={[block.x, block.y * size + size / 2, block.z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[visual, visual, visual]} />
        <meshStandardMaterial
          color={col}
          roughness={0.22}
          metalness={0.28}
          transparent={hovered && eraseMode}
          opacity={hovered && eraseMode ? 0.55 : 1}
        />
        <Edges lineWidth={hovered ? 2 : 1} color={hovered ? "#ffffff" : "#3a4060"} />
      </mesh>
      {/* top face highlight */}
      <mesh position={[0, visual / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[visual * 0.82, visual * 0.82]} />
        <meshBasicMaterial color="white" transparent opacity={0.07} depthWrite={false} side={THREE.FrontSide} />
      </mesh>
      {/* invisible hit target */}
      <mesh
        visible={false}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
      >
        <boxGeometry args={[size, size, size]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

// ── Ghost block ───────────────────────────────────────────────────────────────
function GhostBlock({ position, color, size, gap }: {
  position: [number, number, number]; color: string; size: number; gap: number;
}) {
  const visual = size - gap;
  return (
    <mesh position={position}>
      <boxGeometry args={[visual, visual, visual]} />
      <meshStandardMaterial color={color} transparent opacity={0.35} roughness={0.3} metalness={0.2} />
      <Edges lineWidth={1.5} color="white" />
    </mesh>
  );
}

// ── Platform glow ─────────────────────────────────────────────────────────────
function PlatformGlow({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <circleGeometry args={[radius, 64]} />
      <meshBasicMaterial color="#1a2a6c" transparent opacity={0.18} depthWrite={false} />
    </mesh>
  );
}

// ── 3-D Scene ─────────────────────────────────────────────────────────────────
function Scene({
  blocks, selectedColor, eraseMode, size, gap,
  gridCell, gridSection, gridFade,
  onAddBlock, onEraseBlock,
}: {
  blocks: Block[]; selectedColor: string; eraseMode: boolean;
  size: number; gap: number;
  gridCell: number; gridSection: number; gridFade: number;
  onAddBlock: (x: number, y: number, z: number) => void;
  onEraseBlock: (id: string) => void;
}) {
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const [ghost, setGhost] = useState<[number, number, number] | null>(null);

  const handleGroundDown = (e: ThreeEvent<PointerEvent>) => {
    downPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleGroundMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (eraseMode) { setGhost(null); return; }
    const gx = snapTo(e.point.x, size);
    const gz = snapTo(e.point.z, size);
    setGhost([gx, size / 2, gz]);
  }, [eraseMode, size]);

  const handleGroundClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (eraseMode) return;
    if (downPos.current) {
      const dx = e.clientX - downPos.current.x;
      const dy = e.clientY - downPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 8) return;
    }
    onAddBlock(snapTo(e.point.x, size), 0, snapTo(e.point.z, size));
  }, [eraseMode, size, onAddBlock]);

  const handleBlockClick = useCallback((e: ThreeEvent<MouseEvent>, block: Block) => {
    if (eraseMode) { e.stopPropagation(); onEraseBlock(block.id); return; }
    e.stopPropagation();
    if (downPos.current) {
      const dx = e.clientX - downPos.current.x;
      const dy = e.clientY - downPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 8) return;
    }
    const top = blocks
      .filter((b) => b.x === block.x && b.z === block.z)
      .reduce((max, b) => Math.max(max, b.y), -1);
    onAddBlock(block.x, top + 1, block.z);
  }, [eraseMode, blocks, onAddBlock, onEraseBlock]);

  const handleBlockMove = useCallback((e: ThreeEvent<PointerEvent>, block: Block) => {
    if (eraseMode) { setGhost(null); return; }
    const top = blocks
      .filter((b) => b.x === block.x && b.z === block.z)
      .reduce((max, b) => Math.max(max, b.y), -1);
    setGhost([block.x, (top + 1) * size + size / 2, block.z]);
  }, [eraseMode, blocks, size]);

  return (
    <>
      <Stars />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[14, 22, 10]} intensity={1.6} color="#d0e8ff" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004} />
      <directionalLight position={[-10, 6, -12]} intensity={0.35} color="#ffe4b0" />
      <directionalLight position={[0, 4, -20]} intensity={0.5} color="#8b5cf6" />
      <hemisphereLight args={["#0d1b45", "#000000", 0.5]} />
      <pointLight position={[0, size * 0.5, 0]} intensity={0.4} color="#3b82f6" distance={gridFade * 0.3} />

      {/* Infinite grid */}
      <Grid
        position={[0, 0, 0]}
        args={[500, 500]}
        cellSize={gridCell}
        cellThickness={0.4}
        cellColor="#1e3a6e"
        sectionSize={gridSection}
        sectionThickness={0.9}
        sectionColor="#2563eb"
        fadeDistance={gridFade}
        fadeStrength={2.5}
        infiniteGrid
      />

      <PlatformGlow radius={gridFade * 0.22} />

      {/* Invisible ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}
        onPointerDown={handleGroundDown}
        onPointerMove={handleGroundMove}
        onPointerLeave={() => setGhost(null)}
        onClick={handleGroundClick}
        receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial transparent opacity={0} side={THREE.FrontSide} />
      </mesh>

      {/* Placed blocks */}
      {blocks.map((block) => (
        <group key={block.id}
          onPointerDown={handleGroundDown}
          onPointerMove={(e) => { e.stopPropagation(); handleBlockMove(e, block); }}
          onClick={(e) => handleBlockClick(e, block)}>
          <BlockMesh block={block} size={size} gap={gap} eraseMode={eraseMode} onErase={onEraseBlock} />
        </group>
      ))}

      {/* Ghost */}
      {!eraseMode && ghost && <GhostBlock position={ghost} color={selectedColor} size={size} gap={gap} />}
    </>
  );
}

// ── UI button ─────────────────────────────────────────────────────────────────
function Btn({ onClick, active, bg, children }: {
  onClick: () => void; active?: boolean; bg?: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={{
      background: bg ?? (active ? "#3b82f6" : "rgba(255,255,255,0.08)"),
      color: "white",
      border: active ? "1.5px solid rgba(255,255,255,0.45)" : "1.5px solid rgba(255,255,255,0.12)",
      borderRadius: 14, padding: "9px 18px", fontSize: 14, fontWeight: 700,
      cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", letterSpacing: 0.2,
      backdropFilter: "blur(8px)",
    }}>
      {children}
    </button>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function App() {
  const [activeMode, setActiveMode] = useState<ModeKey>("small");
  const [allBlocks, setAllBlocks] = useState<Record<ModeKey, Block[]>>({
    atom: [], micro: [], nano: [], small: [], large: [], mega: [],
  });
  const [allHistory, setAllHistory] = useState<Record<ModeKey, Block[][]>>({
    atom: [[]], micro: [[]], nano: [[]], small: [[]], large: [[]], mega: [[]],
  });
  const [selectedColor, setSelectedColor] = useState(TEAMS[0].hex);
  const [eraseMode, setEraseMode] = useState(false);

  const mode = MODES.find((m) => m.key === activeMode)!;
  const blocks  = allBlocks[activeMode];
  const history = allHistory[activeMode];

  const switchMode = (key: ModeKey) => {
    setActiveMode(key);
    setEraseMode(false);
  };

  const addBlock = useCallback(
    (x: number, y: number, z: number) => {
      setAllBlocks((prev) => {
        const cur = prev[activeMode];
        if (cur.some((b) => b.x === x && b.y === y && b.z === z)) return prev;
        const next = [...cur, { id: uid(), x, y, z, color: selectedColor }];
        setAllHistory((h) => ({ ...h, [activeMode]: [...h[activeMode].slice(-49), next] }));
        return { ...prev, [activeMode]: next };
      });
    },
    [activeMode, selectedColor]
  );

  const eraseBlock = useCallback((id: string) => {
    setAllBlocks((prev) => {
      const next = prev[activeMode].filter((b) => b.id !== id);
      setAllHistory((h) => ({ ...h, [activeMode]: [...h[activeMode].slice(-49), next] }));
      return { ...prev, [activeMode]: next };
    });
  }, [activeMode]);

  const undo = useCallback(() => {
    setAllHistory((h) => {
      const cur = h[activeMode];
      if (cur.length <= 1) return h;
      const prev = cur[cur.length - 2];
      setAllBlocks((b) => ({ ...b, [activeMode]: prev }));
      return { ...h, [activeMode]: cur.slice(0, -1) };
    });
  }, [activeMode]);

  const clear = useCallback(() => {
    if (blocks.length === 0) return;
    setAllBlocks((b) => ({ ...b, [activeMode]: [] }));
    setAllHistory((h) => ({ ...h, [activeMode]: [[]] }));
  }, [activeMode, blocks.length]);

  if (!WEBGL_AVAILABLE) return <NoWebGL />;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#020209" }}>

      {/* ── 3-D Canvas ── */}
      <Canvas
        key={activeMode}
        shadows
        camera={{ position: mode.camera, fov: 45 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        style={{ background: "radial-gradient(ellipse at 50% 40%, #0a0e2a 0%, #020209 70%)" }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={["#020209", mode.gridFade * 0.8, mode.gridFade * 2.5]} />
        <OrbitControls
          enableDamping dampingFactor={0.1}
          minDistance={mode.minDist} maxDistance={mode.maxDist}
          maxPolarAngle={Math.PI / 2 - 0.03}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        />
        <Scene
          blocks={blocks}
          selectedColor={selectedColor}
          eraseMode={eraseMode}
          size={mode.size}
          gap={mode.gap}
          gridCell={mode.gridCell}
          gridSection={mode.gridSection}
          gridFade={mode.gridFade}
          onAddBlock={addBlock}
          onEraseBlock={eraseBlock}
        />
      </Canvas>

      {/* ── Mode tabs ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "12px 12px 0",
        background: "linear-gradient(180deg, rgba(2,2,9,0.92) 0%, transparent 100%)",
      }}>
        {/* Mode switcher */}
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 6, flexWrap: "nowrap", overflowX: "auto" }}>
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => switchMode(m.key)}
              style={{
                background: activeMode === m.key
                  ? "rgba(59,130,246,0.85)"
                  : "rgba(255,255,255,0.07)",
                color: activeMode === m.key ? "white" : "rgba(255,255,255,0.5)",
                border: activeMode === m.key
                  ? "1.5px solid rgba(99,179,255,0.7)"
                  : "1.5px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "5px 9px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.18s",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                gap: 3,
                flexShrink: 0,
                letterSpacing: 0.2,
              }}
            >
              <span style={{ fontSize: 13 }}>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Active mode label + controls row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "4px 4px 10px",
        }}>
          <div>
            <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 800, fontSize: 18, textShadow: "0 0 20px rgba(99,102,241,0.8)" }}>
              🧱 Block Builder
            </span>
            <span style={{ marginLeft: 10, color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
              {mode.desc} · {mode.size}u
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn onClick={undo} bg="rgba(255,255,255,0.07)">↩</Btn>
            <Btn onClick={clear} bg="rgba(239,68,68,0.25)">🗑</Btn>
          </div>
        </div>
      </div>

      {/* ── Block counter ── */}
      <div style={{
        position: "absolute", top: 100, right: 14,
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(8px)",
        borderRadius: 10, padding: "3px 10px",
        color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600,
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        {blocks.length} block{blocks.length !== 1 ? "s" : ""}
      </div>

      {/* ── Hint ── */}
      {blocks.length === 0 && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          color: "rgba(255,255,255,0.28)",
          fontSize: 15, fontWeight: 600, pointerEvents: "none", lineHeight: 1.7,
        }}>
          Tap the grid to place blocks<br />
          <span style={{ fontSize: 12, opacity: 0.7 }}>Drag to rotate · Pinch to zoom</span>
        </div>
      )}

      {/* ── Bottom UI ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "10px 16px 28px",
        background: "linear-gradient(0deg, rgba(2,2,9,0.92) 0%, transparent 100%)",
      }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, justifyContent: "center" }}>
          <Btn onClick={() => setEraseMode(false)} active={!eraseMode}>🧱 Build</Btn>
          <Btn onClick={() => setEraseMode(true)} active={eraseMode} bg={eraseMode ? "rgba(239,68,68,0.55)" : undefined}>🗑 Erase</Btn>
        </div>

        {!eraseMode && (
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            {TEAMS.map(({ hex, name }) => {
              const active = selectedColor === hex;
              return (
                <button
                  key={hex}
                  onClick={() => setSelectedColor(hex)}
                  title={name}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: 3, background: "none", border: "none", cursor: "pointer",
                    padding: 0, flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", background: hex,
                    border: active ? "3px solid white" : "2px solid rgba(255,255,255,0.15)",
                    boxShadow: active ? `0 0 0 2px ${hex}99, 0 0 16px ${hex}aa` : "none",
                    transform: active ? "scale(1.3)" : "scale(1)",
                    transition: "all 0.15s",
                    outline: hex === "#F5F5F5" || hex === "#1C1C1B" ? "1px solid rgba(255,255,255,0.2)" : "none",
                    outlineOffset: -2,
                  }} />
                  <span style={{
                    fontSize: 7.5, color: active ? "white" : "rgba(255,255,255,0.45)",
                    fontWeight: 700, letterSpacing: 0.1,
                    maxWidth: 36, textAlign: "center", lineHeight: 1.2,
                    transition: "color 0.15s",
                  }}>
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {eraseMode && (
          <p style={{ textAlign: "center", color: "#fca5a5", fontSize: 14, fontWeight: 700 }}>
            Tap a block to remove it
          </p>
        )}
      </div>
    </div>
  );
}
