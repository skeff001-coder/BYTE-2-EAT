const SIZE = {
  sm:  { fontSize: "1.25rem",                      letterSpacing: "0.03em" },
  md:  { fontSize: "1.6rem",                       letterSpacing: "0.03em" },
  lg:  { fontSize: "2rem",                         letterSpacing: "0.03em" },
  xl:  { fontSize: "clamp(2rem, 7vw, 3.2rem)",     letterSpacing: "0.02em" },
  "2xl": { fontSize: "clamp(2.6rem, 10vw, 5.5rem)", letterSpacing: "0.01em" },
} as const;

const VARIANT = {
  neon: {
    gradient: "linear-gradient(135deg, #ff79c6 0%, #bd93f9 48%, #64dfdf 100%)",
    glow: "drop-shadow(0 0 14px rgba(189,147,249,0.55)) drop-shadow(0 0 4px rgba(255,121,198,0.35))",
  },
  primary: {
    gradient: "linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)",
    glow: "drop-shadow(0 0 22px rgba(74,222,128,0.65)) drop-shadow(0 0 8px rgba(34,211,238,0.45))",
  },
} as const;

const SHADOW_3D =
  "drop-shadow(1px 2px 0px #15803d)" +
  " drop-shadow(2px 4px 0px #0e7490)" +
  " drop-shadow(3px 6px 0px #0f766e)" +
  " drop-shadow(4px 8px 0px #14532d)" +
  " drop-shadow(5px 10px 18px rgba(0,0,0,0.6))";

interface Props {
  size?: keyof typeof SIZE;
  variant?: keyof typeof VARIANT;
  shadow3d?: boolean;
  className?: string;
}

export function BrandLogo({ size = "md", variant = "neon", shadow3d = false, className }: Props) {
  const { gradient, glow } = VARIANT[variant];
  return (
    <span
      className={className}
      style={{
        fontFamily: "'Righteous', cursive",
        fontWeight: 400,
        lineHeight: 1.1,
        ...SIZE[size],
        background: gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        filter: shadow3d ? SHADOW_3D : glow,
        display: "inline-block",
      }}
    >
      Byte 2 Eat
    </span>
  );
}
