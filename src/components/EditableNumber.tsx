import { useState } from "react";
import { formatNumberBR } from "@/lib/utils";

export function EditableNumber({
  value, unit, disabled, onCommit, placeholder = "—",
}: {
  value: number | null; unit?: string; disabled?: boolean;
  onCommit: (v: number | null) => void; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");

  if (disabled) {
    return <span className="tabular-nums text-muted-foreground">{formatNumberBR(value, unit)}</span>;
  }
  if (!editing) {
    return (
      <button
        className="w-full rounded px-2 py-1 text-right tabular-nums hover:bg-secondary/60"
        onClick={() => { setRaw(value == null ? "" : String(value)); setEditing(true); }}
      >
        {value == null ? <span className="text-muted-foreground">{placeholder}</span> : formatNumberBR(value, unit)}
      </button>
    );
  }
  const commit = () => {
    setEditing(false);
    const norm = raw.replace(/\./g, "").replace(",", ".").trim();
    if (norm === "") { onCommit(null); return; }
    const n = Number(norm);
    if (!isNaN(n)) onCommit(n);
  };
  return (
    <input
      autoFocus type="text" inputMode="decimal" value={raw}
      style={{ width: `${Math.max(4, raw.length + 2)}ch` }}
      className="rounded border border-input px-2 py-1 text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
      onChange={(e) => setRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
    />
  );
}
