const SIZE = {
  sm: { fontSize: "1.25rem", letterSpacing: "0.03em" },
  md: { fontSize: "1.6rem",  letterSpacing: "0.03em" },
  lg: { fontSize: "2rem",    letterSpacing: "0.03em" },
  xl: { fontSize: "3.2rem",  letterSpacing: "0.02em" },
} as const;

const VARIANT = {
  neon: {
    gradient: "linear-gradient(135deg, #ff79c6 0%, #bd93f9 48%, #64dfdf 100%)",
    glow: "drop-shadow(0 0 14px rgba(189,147,249,0.55)) drop-shadow(0 0 4px rgba(255,121,198,0.35))",
  },
  primary: {
    gradient: "var(--gradient-primary)",
    glow: "drop-shadow(0 0 16px rgba(34,197,94,0.4)) drop-shadow(0 0 5px rgba(16,185,129,0.3))",
  },
} as const;

interface Props {
  size?: keyof typeof SIZE;
  variant?: keyof typeof VARIANT;
  className?: string;
}

export function BrandLogo({ size = "md", variant = "neon", className }: Props) {
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
        filter: glow,
        display: "inline-block",
      }}
    >
      Byte 2 Eat
    </span>
  );
}
