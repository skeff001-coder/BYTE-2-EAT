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
      <a
        href={window.location.href}
        target="_blank"
        rel="noreferrer"
        style={{
          marginTop: 8, background: "#3b82f6", color: "white",
          borderRadius: 14, padding: "12px 28px",
          fontWeight: 700, fontSize: 15, textDecoration: "none",
        }}
      >
        Open full game ↗
      </a>
      <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6"].map(c => (
          <div key={c} style={{ width: 28, height: 28, borderRadius: 6, background: c }} />
        ))}
      </div>
      <p style={{ fontSize: 12, opacity: 0.4, marginTop: 4 }}>12 colours · snap-to-grid · pinch zoom · undo</p>
    </div>
  );
}

// ── Colour palette ────────────────────────────────────────────────────────────
const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#ffffff", "#94a3b8", "#92400e", "#111827",
];

// ── Types ─────────────────────────────────────────────────────────────────────
type Block = { id: string; x: number; y: number; z: number; color: string };

// ── Helpers ───────────────────────────────────────────────────────────────────
const snap = (v: number) => Math.round(v);
const uid  = () => `${Date.now()}-${Math.random()}`;

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
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.008;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        color="#cce4ff"
        size={0.9}
        sizeAttenuation
        transparent
        opacity={0.85}
        fog={false}
      />
    </points>
  );
}

// ── Single block mesh ─────────────────────────────────────────────────────────
function BlockMesh({
  block,
  eraseMode,
  onErase,
}: {
  block: Block;
  eraseMode: boolean;
  onErase: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const SIDE = 0.92;

  useEffect(() => {
    document.body.style.cursor = hovered ? (eraseMode ? "not-allowed" : "pointer") : "auto";
    return () => { document.body.style.cursor = "auto"; };
  }, [hovered, eraseMode]);

  const col = hovered && eraseMode ? "#ff3333" : block.color;

  return (
    <group position={[block.x, block.y + 0.5, block.z]}>
      {/* Main body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[SIDE, SIDE, SIDE]} />
        <meshStandardMaterial
          color={col}
          roughness={0.22}
          metalness={0.28}
          transparent={hovered && eraseMode}
          opacity={hovered && eraseMode ? 0.55 : 1}
          envMapIntensity={0.6}
        />
        <Edges
          lineWidth={hovered ? 2 : 1}
          color={hovered ? "white" : "rgba(255,255,255,0.18)"}
        />
      </mesh>

      {/* Top face highlight — subtle bright cap */}
      <mesh position={[0, SIDE / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[SIDE * 0.82, SIDE * 0.82]} />
        <meshBasicMaterial
          color="white"
          transparent
          opacity={0.07}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Invisible hit surface */}
      <mesh
        visible={false}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

// ── Preview ghost block ───────────────────────────────────────────────────────
function GhostBlock({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.92, 0.92, 0.92]} />
      <meshStandardMaterial color={color} transparent opacity={0.35} roughness={0.3} metalness={0.2} />
      <Edges lineWidth={1.5} color="white" />
    </mesh>
  );
}

// ── Platform glow (flat disc under the grid) ─────────────────────────────────
function PlatformGlow() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <circleGeometry args={[12, 64]} />
      <meshBasicMaterial color="#1a2a6c" transparent opacity={0.18} depthWrite={false} />
    </mesh>
  );
}

// ── 3-D Scene ─────────────────────────────────────────────────────────────────
function Scene({
  blocks,
  selectedColor,
  eraseMode,
  onAddBlock,
  onEraseBlock,
}: {
  blocks: Block[];
  selectedColor: string;
  eraseMode: boolean;
  onAddBlock: (x: number, y: number, z: number) => void;
  onEraseBlock: (id: string) => void;
}) {
  const downPos = useRef<{ x: number; y: number } | null>(null);
  const [ghost, setGhost] = useState<[number, number, number] | null>(null);

  const handleGroundDown = (e: ThreeEvent<PointerEvent>) => {
    downPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleGroundMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (eraseMode) { setGhost(null); return; }
      setGhost([snap(e.point.x), 0.5, snap(e.point.z)]);
    },
    [eraseMode]
  );

  const handleGroundClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (eraseMode) return;
      if (downPos.current) {
        const dx = e.clientX - downPos.current.x;
        const dy = e.clientY - downPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 8) return;
      }
      onAddBlock(snap(e.point.x), 0, snap(e.point.z));
    },
    [eraseMode, onAddBlock]
  );

  const handleBlockClick = useCallback(
    (e: ThreeEvent<MouseEvent>, block: Block) => {
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
    },
    [eraseMode, blocks, onAddBlock, onEraseBlock]
  );

  const handleBlockMove = useCallback(
    (e: ThreeEvent<PointerEvent>, block: Block) => {
      if (eraseMode) { setGhost(null); return; }
      const top = blocks
        .filter((b) => b.x === block.x && b.z === block.z)
        .reduce((max, b) => Math.max(max, b.y), -1);
      setGhost([block.x, top + 1.5, block.z]);
    },
    [eraseMode, blocks]
  );

  return (
    <>
      {/* ── Stars ── */}
      <Stars />

      {/* ── Lighting ── */}
      <ambientLight intensity={0.3} />
      {/* Key light — cool-white from above-right */}
      <directionalLight
        position={[14, 22, 10]}
        intensity={1.6}
        color="#d0e8ff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
      />
      {/* Fill light — warm, low from opposite */}
      <directionalLight position={[-10, 6, -12]} intensity={0.35} color="#ffe4b0" />
      {/* Rim light — purple from behind */}
      <directionalLight position={[0, 4, -20]} intensity={0.5} color="#8b5cf6" />
      {/* Ground bounce */}
      <hemisphereLight args={["#0d1b45", "#000000", 0.5]} />
      {/* Faint floor point glow */}
      <pointLight position={[0, 0.5, 0]} intensity={0.4} color="#3b82f6" distance={18} />

      {/* ── Infinite grid ── */}
      <Grid
        position={[0, 0, 0]}
        args={[200, 200]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#1e3a6e"
        sectionSize={10}
        sectionThickness={0.9}
        sectionColor="#2563eb"
        fadeDistance={60}
        fadeStrength={2.5}
        infiniteGrid
      />

      {/* Subtle glow halo under build area */}
      <PlatformGlow />

      {/* ── Invisible ground plane ── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={handleGroundDown}
        onPointerMove={handleGroundMove}
        onPointerLeave={() => setGhost(null)}
        onClick={handleGroundClick}
        receiveShadow
      >
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial transparent opacity={0} side={THREE.FrontSide} />
      </mesh>

      {/* ── Placed blocks ── */}
      {blocks.map((block) => (
        <group
          key={block.id}
          onPointerDown={handleGroundDown}
          onPointerMove={(e) => { e.stopPropagation(); handleBlockMove(e, block); }}
          onClick={(e) => handleBlockClick(e, block)}
        >
          <BlockMesh block={block} eraseMode={eraseMode} onErase={onEraseBlock} />
        </group>
      ))}

      {/* ── Ghost preview ── */}
      {!eraseMode && ghost && <GhostBlock position={ghost} color={selectedColor} />}
    </>
  );
}

// ── UI button ─────────────────────────────────────────────────────────────────
function Btn({
  onClick, active, bg, children,
}: {
  onClick: () => void;
  active?: boolean;
  bg?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: bg ?? (active ? "#3b82f6" : "rgba(255,255,255,0.08)"),
        color: "white",
        border: active ? "1.5px solid rgba(255,255,255,0.45)" : "1.5px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: "9px 18px",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        letterSpacing: 0.2,
        backdropFilter: "blur(8px)",
      }}
    >
      {children}
    </button>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function App() {
  const [blocks,        setBlocks]        = useState<Block[]>([]);
  const [selectedColor, setSelectedColor] = useState(COLORS[5]);
  const [eraseMode,     setEraseMode]     = useState(false);
  const [history,       setHistory]       = useState<Block[][]>([[]]);

  const addBlock = useCallback(
    (x: number, y: number, z: number) => {
      setBlocks((prev) => {
        if (prev.some((b) => b.x === x && b.y === y && b.z === z)) return prev;
        const next = [...prev, { id: uid(), x, y, z, color: selectedColor }];
        setHistory((h) => [...h.slice(-49), next]);
        return next;
      });
    },
    [selectedColor]
  );

  const eraseBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      setHistory((h) => [...h.slice(-49), next]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length <= 1) return h;
      const prev = h[h.length - 2];
      setBlocks(prev);
      return h.slice(0, -1);
    });
  }, []);

  const clear = useCallback(() => {
    if (blocks.length === 0) return;
    setBlocks([]);
    setHistory([[]]);
  }, [blocks.length]);

  if (!WEBGL_AVAILABLE) return <NoWebGL />;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#020209" }}>
      {/* ── 3-D Canvas ── */}
      <Canvas
        shadows
        camera={{ position: [16, 13, 16], fov: 45 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        style={{ background: "radial-gradient(ellipse at 50% 40%, #0a0e2a 0%, #020209 70%)" }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={["#020209", 60, 140]} />
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={4}
          maxDistance={70}
          maxPolarAngle={Math.PI / 2 - 0.03}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_ROTATE,
          }}
        />
        <Scene
          blocks={blocks}
          selectedColor={selectedColor}
          eraseMode={eraseMode}
          onAddBlock={addBlock}
          onEraseBlock={eraseBlock}
        />
      </Canvas>

      {/* ── Top bar ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg, rgba(2,2,9,0.82) 0%, transparent 100%)",
        pointerEvents: "none",
      }}>
        <div style={{ color: "white", fontWeight: 800, fontSize: 20, letterSpacing: -0.3, textShadow: "0 0 20px rgba(99,102,241,0.8)" }}>
          🧱 Block Builder
        </div>
        <div style={{ display: "flex", gap: 8, pointerEvents: "all" }}>
          <Btn onClick={undo} bg="rgba(255,255,255,0.07)">↩ Undo</Btn>
          <Btn onClick={clear} bg="rgba(239,68,68,0.25)">🗑 Clear</Btn>
        </div>
      </div>

      {/* ── Block counter ── */}
      <div style={{
        position: "absolute", top: 62, right: 16,
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(8px)",
        borderRadius: 10, padding: "3px 10px",
        color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600,
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
          color: "rgba(255,255,255,0.3)",
          fontSize: 15,
          fontWeight: 600,
          pointerEvents: "none",
          lineHeight: 1.7,
        }}>
          Tap the grid to place blocks<br />
          <span style={{ fontSize: 12, opacity: 0.7 }}>Drag to rotate · Pinch to zoom</span>
        </div>
      )}

      {/* ── Bottom UI ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "10px 16px 28px",
        background: "linear-gradient(0deg, rgba(2,2,9,0.88) 0%, transparent 100%)",
      }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, justifyContent: "center" }}>
          <Btn onClick={() => setEraseMode(false)} active={!eraseMode}>
            🧱 Build
          </Btn>
          <Btn onClick={() => setEraseMode(true)} active={eraseMode} bg={eraseMode ? "rgba(239,68,68,0.55)" : undefined}>
            🗑 Erase
          </Btn>
        </div>

        {!eraseMode && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                style={{
                  width: 34, height: 34,
                  borderRadius: "50%",
                  background: c,
                  border: selectedColor === c ? "3px solid white" : "3px solid rgba(255,255,255,0.1)",
                  boxShadow: selectedColor === c ? `0 0 0 2px ${c}99, 0 0 14px ${c}88` : "none",
                  cursor: "pointer",
                  transform: selectedColor === c ? "scale(1.28)" : "scale(1)",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
              />
            ))}
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
