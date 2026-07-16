"use client";
import { useState, useEffect } from "react";

export type ComboOption = { id: string; nom: string };

type Props = {
  label: string;
  value: string;
  options: ComboOption[];
  onChange: (value: string) => void;
  onNew?: (nom: string) => Promise<ComboOption | null>;
  onSelect?: (option: ComboOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function ComboboxField({
  label, value, options, onChange, onNew, onSelect, placeholder, disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setInputVal(value); }, [value]);

  const upper = inputVal.toUpperCase();
  const filtered = upper
    ? options.filter((o) => o.nom.includes(upper))
    : options;

  const handleSelect = (opt: ComboOption) => {
    setInputVal(opt.nom);
    onChange(opt.nom);
    onSelect?.(opt);
    setOpen(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase();
    setInputVal(v);
    onChange(v);
    onSelect?.(null);
    setOpen(true);
  };

  const handleBlur = async () => {
    setOpen(false);
    const val = inputVal.trim().toUpperCase();
    if (!val) { onSelect?.(null); return; }
    const existing = options.find((o) => o.nom === val);
    if (existing) { onSelect?.(existing); return; }
    if (onNew) {
      setSaving(true);
      try {
        const created = await onNew(val);
        if (created) onSelect?.(created);
      } finally {
        setSaving(false);
      }
    }
  };

  const border = open ? "#2563EB" : "#E2E8F0";

  return (
    <div style={{ position: "relative" }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 600, color: "#64748B",
        marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase",
        display: "flex", alignItems: "center", gap: 6,
      } as React.CSSProperties}>
        {label}
        {saving && (
          <span style={{ fontSize: 10, color: "#10B981", fontWeight: 500 }}>Enregistrement…</span>
        )}
      </label>
      <div style={{ position: "relative" }}>
        <input
          value={inputVal}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            width: "100%", padding: "9px 30px 9px 12px",
            border: `1px solid ${border}`, borderRadius: 7, fontSize: 13,
            color: "#1E2640", outline: "none",
            background: disabled ? "#F1F5F9" : "#FAFAFA",
            transition: "border-color 0.15s", fontFamily: "inherit",
            textTransform: "uppercase", cursor: disabled ? "not-allowed" : "text",
            boxSizing: "border-box",
          }}
        />
        <svg
          width="12" height="12" fill="none" stroke="#94A3B8" strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0,
          background: "white", border: "1px solid #E2E8F0", borderRadius: 8,
          zIndex: 100, maxHeight: 200, overflowY: "auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        }}>
          {filtered.map((opt) => (
            <div
              key={opt.id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
              style={{
                padding: "9px 12px", fontSize: 13, cursor: "pointer",
                color: "#1E2640", fontWeight: 500,
                borderBottom: "1px solid #F8FAFC",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              {opt.nom}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
