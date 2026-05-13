const SIZE = {
  sm: { fontSize: "1.25rem", letterSpacing: "0.03em" },
  md: { fontSize: "1.6rem",  letterSpacing: "0.03em" },
  lg: { fontSize: "2rem",    letterSpacing: "0.03em" },
} as const;

interface Props {
  size?: keyof typeof SIZE;
  className?: string;
}

export function BrandLogo({ size = "md", className }: Props) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "'Righteous', cursive",
        fontWeight: 400,
        lineHeight: 1.1,
        ...SIZE[size],
        background: "linear-gradient(135deg, #ff79c6 0%, #bd93f9 48%, #64dfdf 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        filter: "drop-shadow(0 0 14px rgba(189,147,249,0.55)) drop-shadow(0 0 4px rgba(255,121,198,0.35))",
        display: "inline-block",
      }}
    >
      Byte 2 Eat
    </span>
  );
}
