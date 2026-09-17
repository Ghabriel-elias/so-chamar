const BUBBLE =
  "M24 9H40A14 14 0 0 1 54 23V32A14 14 0 0 1 40 46H38.4L34 53Q32 56 30 53L25.6 46H24A14 14 0 0 1 10 32V23A14 14 0 0 1 24 9Z";
const CHECK = "M22 27.5 29 34.5 42 21.5";

export function BrandIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect width="64" height="64" rx="16" className="fill-blue" />
      <path d={BUBBLE} className="fill-white" />
      <path
        d={CHECK}
        fill="none"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-orange"
      />
    </svg>
  );
}
