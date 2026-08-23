interface StatRowProps {
  label: string;
  value: string | number;
}

export function StatRow({ label, value }: StatRowProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 }}>
      <span style={{ color: "var(--text-dim)" }}>{label}</span>
      <span className="mono" style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
