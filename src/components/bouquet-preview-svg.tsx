/**
 * Lightweight illustrative bouquet — colour/mood/wrap/ribbon only.
 * Not a photo of the delivered arrangement.
 */
export function BouquetPreviewSvg({
  mood,
  wrap,
  ribbon,
  className = "",
}: {
  mood: string;
  wrap: string;
  ribbon: string;
  className?: string;
}) {
  const petal = mood || "#f0d5d2";
  const petalDeep = shade(mood || "#f0d5d2", -18);
  const paper = wrap || "#c4a574";
  const bow = ribbon || "#c07a76";

  return (
    <div
      className={`relative overflow-hidden rounded-[1.5rem] bg-[linear-gradient(165deg,#fffaf6_0%,#f3e7dc_100%)] ${className}`.trim()}
      aria-hidden
    >
      <svg
        viewBox="0 0 320 400"
        className="h-full w-full"
        role="img"
        focusable="false"
      >
        <defs>
          <radialGradient id="bloom" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor={petal} stopOpacity="0.95" />
            <stop offset="70%" stopColor={petalDeep} stopOpacity="0.9" />
            <stop offset="100%" stopColor={petalDeep} stopOpacity="0.55" />
          </radialGradient>
        </defs>

        {/* Wrapping cone */}
        <path
          d="M110 210 L160 360 L210 210 Z"
          fill={paper}
          opacity="0.92"
        />
        <path
          d="M118 215 L160 345 L202 215 Z"
          fill="#fff"
          opacity="0.12"
        />

        {/* Stems */}
        <path
          d="M150 200 C148 250 152 300 160 340"
          stroke="#5c574f"
          strokeWidth="3"
          fill="none"
          opacity="0.45"
        />
        <path
          d="M170 195 C172 250 168 300 160 340"
          stroke="#5c574f"
          strokeWidth="3"
          fill="none"
          opacity="0.35"
        />

        {/* Bloom clusters */}
        <ellipse cx="160" cy="150" rx="78" ry="88" fill="url(#bloom)" />
        <circle cx="128" cy="120" r="36" fill={petal} opacity="0.9" />
        <circle cx="190" cy="118" r="34" fill={petalDeep} opacity="0.88" />
        <circle cx="160" cy="95" r="30" fill={petal} opacity="0.95" />
        <circle cx="145" cy="155" r="28" fill={petalDeep} opacity="0.75" />
        <circle cx="180" cy="158" r="26" fill={petal} opacity="0.8" />
        <circle cx="160" cy="130" r="14" fill="#fff4eb" opacity="0.55" />

        {/* Ribbon */}
        <path
          d="M132 250 C150 235 170 235 188 250 C170 258 150 258 132 250 Z"
          fill={bow}
        />
        <path
          d="M148 252 L140 292 L156 268 Z"
          fill={bow}
          opacity="0.9"
        />
        <path
          d="M172 252 L180 292 L164 268 Z"
          fill={bow}
          opacity="0.85"
        />
        <circle cx="160" cy="250" r="7" fill={shade(bow, -10)} />
      </svg>
    </div>
  );
}

function shade(hex: string, amount: number) {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const num = Number.parseInt(raw, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (num & 255) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
