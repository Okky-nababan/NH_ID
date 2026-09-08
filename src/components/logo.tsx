import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
  withRing?: boolean;
};

/** Lambang resmi Naposobulung HKBP Immanuel Dumai. */
export function Logo({ size = 40, className = "", withRing = true }: LogoProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-white ${
        withRing ? "ring-2 ring-white/40" : ""
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo-nhid.png"
        alt="Lambang Naposobulung HKBP Immanuel Dumai"
        fill
        sizes={`${size}px`}
        className="rounded-full object-contain p-0.5"
        priority
        unoptimized
      />
    </span>
  );
}

/** Lambang resmi HKBP (dipakai berdampingan dengan lambang Naposobulung). */
export function HkbpLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-white ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo-hkbp.webp"
        alt="Lambang HKBP"
        fill
        sizes={`${size}px`}
        className="rounded-full object-contain p-1"
        unoptimized
      />
    </span>
  );
}
