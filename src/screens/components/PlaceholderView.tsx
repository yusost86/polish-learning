import type { ReactNode } from "react";

import { BackButton } from "./BackButton";

interface PlaceholderViewProps {
  title: string;
  detail?: string;
  onBack: () => void;
  children?: ReactNode;
}

export function PlaceholderView({ title, detail, onBack, children }: PlaceholderViewProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <BackButton onClick={onBack} />
      <h1 style={{ fontSize: 24 }}>{title}</h1>
      {detail && (
        <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 15, lineHeight: 1.5 }}>
          {detail}
        </p>
      )}
      {children}
    </div>
  );
}
