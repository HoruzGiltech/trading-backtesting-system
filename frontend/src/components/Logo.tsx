export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <rect width="46" height="46" rx="10" fill="var(--surface)" stroke="var(--border)" />
      <circle cx="23" cy="23" r="13" fill="none" stroke="var(--accent)" strokeWidth="4"
        strokeLinecap="round" strokeDasharray="60 23" strokeDashoffset="-11" />
      <line x1="24" y1="25" x2="35" y2="25" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
      <rect x="31" y="29" width="4" height="9" rx="1" fill="var(--accent)" />
      <rect x="37" y="22" width="4" height="16" rx="1" fill="var(--accent)" />
      <rect x="43" y="16" width="4" height="22" rx="1" fill="var(--accent)" />
    </svg>
  );
}

export function LogoLockup({ iconSize = 32 }: { iconSize?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <LogoIcon size={iconSize} />
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 16, color: "var(--text)" }}>
          GM<span style={{ color: "var(--text-muted)", fontWeight: 500 }}> Ledger</span>
        </div>
      </div>
    </div>
  );
}