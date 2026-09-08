type LogoProps = {
  size?: number;
  className?: string;
  withRing?: boolean;
};

export function Logo({ size = 40, className = "", withRing = true }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Lambang NHKBP Immanuel Dumai"
    >
      {withRing && (
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="var(--brand-blue)"
          strokeWidth="2"
          opacity="0.35"
        />
      )}
      <circle cx="50" cy="58" r="24" fill="none" stroke="var(--brand-blue)" strokeWidth="9" />
      <rect x="44" y="14" width="12" height="34" rx="2" fill="var(--brand-blue)" />
      <rect x="34" y="24" width="32" height="12" rx="2" fill="var(--brand-blue)" />
      <path
        d="M22 78 Q50 68 78 78 L78 88 Q50 80 22 88 Z"
        fill="var(--brand-blue)"
      />
      <text
        x="50"
        y="86"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="#ffffff"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        HKBP
      </text>
    </svg>
  );
}
