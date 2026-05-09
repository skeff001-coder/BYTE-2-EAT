import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid, Edges } from "@react-three/drei";
import { useState, useRef, useCallback, useEffect } from "react";
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
      background: "linear-gradient(160deg, #0f0f23 0%, #1a1a3e 100%)",
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

  useEffect(() => {
    document.body.style.cursor = hovered ? (eraseMode ? "not-allowed" : "pointer") : "auto";
    return () => { document.body.style.cursor = "auto"; };
  }, [hovered, eraseMode]);

  return (
    <mesh
      position={[block.x, block.y + 0.5, block.z]}
      onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={hovered && eraseMode ? "#ff3333" : block.color}
        roughness={0.35}
        metalness={0.1}
        transparent={hovered && eraseMode}
        opacity={hovered && eraseMode ? 0.6 : 1}
      />
      <Edges
        lineWidth={1}
        color={hovered ? "white" : "rgba(0,0,0,0.3)"}
      />
    </mesh>
  );
}

// ── Preview ghost block ───────────────────────────────────────────────────────
function GhostBlock({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} transparent opacity={0.4} />
      <Edges lineWidth={1.5} color="white" />
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

  // ── Ground events ──
  const handleGroundDown = (e: ThreeEvent<PointerEvent>) => {
    downPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleGroundMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (eraseMode) { setGhost(null); return; }
      const gx = snap(e.point.x);
      const gz = snap(e.point.z);
      setGhost([gx, 0.5, gz]);
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
      const gx = snap(e.point.x);
      const gz = snap(e.point.z);
      onAddBlock(gx, 0, gz);
    },
    [eraseMode, onAddBlock]
  );

  // ── Block-top events ──
  const handleBlockClick = useCallback(
    (e: ThreeEvent<MouseEvent>, block: Block) => {
      if (eraseMode) { e.stopPropagation(); onEraseBlock(block.id); return; }
      e.stopPropagation();
      if (downPos.current) {
        const dx = e.clientX - downPos.current.x;
        const dy = e.clientY - downPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 8) return;
      }
      // stack on top
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
      {/* Lighting */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[12, 20, 12]} intensity={1.3} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <directionalLight position={[-8, 10, -8]} intensity={0.25} />
      <hemisphereLight args={["#334155", "#1e1b4b", 0.4]} />

      {/* Grid floor */}
      <Grid
        position={[0, 0, 0]}
        args={[60, 60]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#3b4270"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#5b6ab0"
        fadeDistance={35}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Invisible ground — for placing on empty grid */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={handleGroundDown}
        onPointerMove={handleGroundMove}
        onPointerLeave={() => setGhost(null)}
        onClick={handleGroundClick}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial transparent opacity={0} side={THREE.FrontSide} />
      </mesh>

      {/* Placed blocks */}
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

      {/* Ghost preview */}
      {!eraseMode && ghost && <GhostBlock position={ghost} color={selectedColor} />}
    </>
  );
}

// ── UI helpers ────────────────────────────────────────────────────────────────
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
        background: bg ?? (active ? "#3b82f6" : "#1e293b"),
        color: "white",
        border: active ? "2px solid rgba(255,255,255,0.5)" : "2px solid transparent",
        borderRadius: 14,
        padding: "9px 18px",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        letterSpacing: 0.2,
      }}
    >
      {children}
    </button>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function App() {
  const [blocks,        setBlocks]        = useState<Block[]>([]);
  const [selectedColor, setSelectedColor] = useState(COLORS[4]);
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
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#0f0f23" }}>
      {/* ── 3-D Canvas ── */}
      <Canvas
        shadows
        camera={{ position: [14, 12, 14], fov: 48 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "linear-gradient(160deg, #0f0f23 0%, #1a1a3e 100%)" }}
      >
        <OrbitControls
          enableDamping
          dampingFactor={0.12}
          minDistance={3}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2 - 0.02}
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
        background: "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 100%)",
        pointerEvents: "none",
      }}>
        <div style={{ color: "white", fontWeight: 800, fontSize: 20, letterSpacing: -0.3 }}>
          🧱 Block Builder
        </div>
        <div style={{ display: "flex", gap: 8, pointerEvents: "all" }}>
          <Btn onClick={undo} bg="#334155">↩ Undo</Btn>
          <Btn onClick={clear} bg="#7f1d1d">🗑 Clear</Btn>
        </div>
      </div>

      {/* ── Block counter ── */}
      <div style={{
        position: "absolute", top: 62, right: 16,
        background: "rgba(0,0,0,0.5)",
        borderRadius: 10, padding: "3px 10px",
        color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600,
      }}>
        {blocks.length} block{blocks.length !== 1 ? "s" : ""}
      </div>

      {/* ── Hint ── */}
      {blocks.length === 0 && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          color: "rgba(255,255,255,0.35)",
          fontSize: 15,
          fontWeight: 600,
          pointerEvents: "none",
          lineHeight: 1.6,
        }}>
          Tap the grid to place blocks<br />
          <span style={{ fontSize: 12, opacity: 0.7 }}>Drag to rotate · Pinch to zoom</span>
        </div>
      )}

      {/* ── Bottom UI ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "10px 16px 28px",
        background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)",
      }}>
        {/* Mode buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, justifyContent: "center" }}>
          <Btn onClick={() => setEraseMode(false)} active={!eraseMode}>
            🧱 Build
          </Btn>
          <Btn onClick={() => setEraseMode(true)} active={eraseMode} bg={eraseMode ? "#ef4444" : undefined}>
            🗑 Erase
          </Btn>
        </div>

        {/* Colour palette */}
        {!eraseMode && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                style={{
                  width: 36, height: 36,
                  borderRadius: "50%",
                  background: c,
                  border: selectedColor === c ? "3px solid white" : "3px solid rgba(255,255,255,0.15)",
                  boxShadow: selectedColor === c ? `0 0 0 2px ${c}88, 0 0 12px ${c}66` : "none",
                  cursor: "pointer",
                  transform: selectedColor === c ? "scale(1.25)" : "scale(1)",
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
