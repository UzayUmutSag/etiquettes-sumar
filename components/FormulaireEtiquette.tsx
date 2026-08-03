"use client";
import { useState, useEffect } from "react";
import ComboboxField, { ComboOption } from "./ComboboxField";

type FormData = {
  marque: string; reference: string; refClient: string; clientFinal: string; nbCarreaux: string;
  dimOriginale: string; dimFaconnage: string; typeProduit: string; finition: string; quantite: string; observation: string;
};

type Props = {
  formData: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  onGenerer: () => void;
};

type ChampConfig = { label: string; field: keyof FormData; placeholder: string; type?: string; col2?: boolean };

const AUTRES_GROUPES: { titre: string; icon: React.ReactNode; champs: ChampConfig[] }[] = [
  {
    titre: "Client",
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    champs: [
      { label: "Client final", field: "clientFinal" as keyof FormData, placeholder: "Nom du client final" },
      { label: "Réf. client", field: "refClient" as keyof FormData, placeholder: "ex: REF-12345" },
    ],
  },
  {
    titre: "Quantités",
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 3h18M3 9h18M3 15h18M3 21h18"/>
      </svg>
    ),
    champs: [
      { label: "Carreaux fournis", field: "nbCarreaux" as keyof FormData, placeholder: "ex: 120", type: "number" },
      { label: "Quantité à produire", field: "quantite" as keyof FormData, placeholder: "ex: 100", type: "number" },
    ],
  },
  {
    titre: "Dimensions",
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
      </svg>
    ),
    champs: [
      { label: "Dimension originale", field: "dimOriginale" as keyof FormData, placeholder: "ex: 600 × 600 mm" },
      { label: "Dimension après façonnage", field: "dimFaconnage" as keyof FormData, placeholder: "ex: 595 × 595 mm" },
    ],
  },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1px solid #E2E8F0",
  borderRadius: 7, fontSize: 13, color: "#1E2640", outline: "none",
  background: "#FAFAFA", transition: "border-color 0.15s", boxSizing: "border-box",
};

type TypeOpt = { id: string; nom: string };

export default function FormulaireEtiquette({ formData, onChange, onGenerer }: Props) {
  const [marques, setMarques] = useState<ComboOption[]>([]);
  const [modeles, setModeles] = useState<ComboOption[]>([]);
  const [selectedMarqueId, setSelectedMarqueId] = useState<string | null>(null);

  const [types, setTypes] = useState<TypeOpt[]>([]);
  const [finitionsDisponibles, setFinitionsDisponibles] = useState<TypeOpt[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [finitionsChoisies, setFinitionsChoisies] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/referentiel/marques")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setMarques(data))
      .catch(() => {});
    fetch("/api/referentiel/types")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setTypes(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedMarqueId) { setModeles([]); return; }
    fetch(`/api/referentiel/modeles?marqueId=${selectedMarqueId}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setModeles(data))
      .catch(() => {});
  }, [selectedMarqueId]);

  const handleMarqueNew = async (nom: string): Promise<ComboOption | null> => {
    const r = await fetch("/api/referentiel/marques", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom }),
    });
    if (!r.ok) return null;
    const created: ComboOption = await r.json();
    setMarques((prev) =>
      [...prev.filter((m) => m.id !== created.id), created].sort((a, b) => a.nom.localeCompare(b.nom))
    );
    return created;
  };

  useEffect(() => {
    if (!selectedTypeId) { setFinitionsDisponibles([]); return; }
    fetch(`/api/referentiel/finitions?typeId=${selectedTypeId}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setFinitionsDisponibles(data))
      .catch(() => {});
  }, [selectedTypeId]);

  const handleTypeChange = (typeId: string, typeNom: string) => {
    setSelectedTypeId(typeId);
    setFinitionsChoisies([]);
    onChange("typeProduit", typeNom);
    onChange("finition", "");
  };

  const toggleFinition = (nom: string) => {
    const updated = finitionsChoisies.includes(nom)
      ? finitionsChoisies.filter((f) => f !== nom)
      : [...finitionsChoisies, nom];
    setFinitionsChoisies(updated);
    onChange("finition", updated.join(", "));
  };

  const handleMarqueSelect = (opt: ComboOption | null) => {
    if (opt) {
      setSelectedMarqueId(opt.id);
    } else {
      setSelectedMarqueId(null);
      onChange("reference", "");
    }
  };

  const handleModeleNew = async (nom: string): Promise<ComboOption | null> => {
    if (!selectedMarqueId) return null;
    const r = await fetch("/api/referentiel/modeles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, marqueId: selectedMarqueId }),
    });
    if (!r.ok) return null;
    const created: ComboOption = await r.json();
    setModeles((prev) =>
      [...prev.filter((m) => m.id !== created.id), created].sort((a, b) => a.nom.localeCompare(b.nom))
    );
    return created;
  };

  return (
    <section style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="14" height="14" fill="none" stroke="#94A3B8" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#94A3B8", textTransform: "uppercase" }}>
          Informations atelier
        </span>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {/* Produit — comboboxes Marque + Modèle */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, color: "#475569" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <circle cx="7" cy="7" r="1" fill="currentColor"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Produit</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
            <ComboboxField
              label="Marque"
              value={formData.marque}
              options={marques}
              onChange={(v) => onChange("marque", v)}
              onNew={handleMarqueNew}
              onSelect={handleMarqueSelect}
              placeholder="ex: VILLEROY & BOCH"
            />
            <ComboboxField
              label="Modèle"
              value={formData.reference}
              options={modeles}
              onChange={(v) => onChange("reference", v)}
              onNew={selectedMarqueId ? handleModeleNew : undefined}
              placeholder={selectedMarqueId ? "ex: GRES PORCELLANATO" : "Choisir une marque d'abord"}
              disabled={!selectedMarqueId}
            />
          </div>
        </div>

        {/* Autres groupes */}
        {AUTRES_GROUPES.map((groupe) => (
          <div key={groupe.titre} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, color: "#475569" }}>
              {groupe.icon}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{groupe.titre}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
              {groupe.champs.map(({ label, field, placeholder, type, col2 }) => (
                <div key={field} style={{ gridColumn: col2 ? "span 2" : undefined }}>
                  <label style={{
                    display: "block", fontSize: 11, fontWeight: 600, color: "#64748B",
                    marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase",
                  }}>
                    {label}
                  </label>
                  <input
                    type={type ?? "text"}
                    value={formData[field]}
                    onChange={(e) => onChange(field, e.target.value)}
                    placeholder={placeholder}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                    onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Type & Finitions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, color: "#475569" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Type & Finitions</span>
          </div>

          {/* Sélecteur de type */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Type
            </label>
            <select
              value={selectedTypeId ?? ""}
              onChange={(e) => {
                const opt = types.find((t) => t.id === e.target.value);
                if (opt) handleTypeChange(opt.id, opt.nom);
                else { setSelectedTypeId(null); setFinitionsChoisies([]); onChange("typeProduit", ""); onChange("finition", ""); }
              }}
              style={{ ...inputStyle, cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%2394A3B8' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 30 }}
            >
              <option value="">— Choisir un type —</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.nom}</option>
              ))}
            </select>
          </div>

          {/* Cases à cocher des finitions */}
          {selectedTypeId && (
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Finitions
              </label>
              {finitionsDisponibles.length === 0 ? (
                <div style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>Aucune finition pour ce type</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                  {finitionsDisponibles.map((f) => {
                    const checked = finitionsChoisies.includes(f.nom);
                    return (
                      <label key={f.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFinition(f.nom)}
                          style={{ width: 15, height: 15, accentColor: "#2563EB", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: 13, fontWeight: checked ? 600 : 400, color: checked ? "#1D4ED8" : "#475569" }}>
                          {f.nom}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Observation */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, color: "#475569" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Observation</span>
          </div>
          <textarea
            value={formData.observation}
            onChange={(e) => onChange("observation", e.target.value)}
            placeholder="Notes, remarques particulières…"
            rows={3}
            style={{ ...inputStyle, resize: "none", fontFamily: "inherit", lineHeight: 1.5 }}
            onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
            onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
          />
        </div>
      </div>

      <div style={{ padding: "0 20px 20px" }}>
        <button onClick={onGenerer} style={{
          width: "100%", background: "#1E2640", color: "white", border: "none",
          padding: "11px 0", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          Générer l&apos;aperçu
        </button>
      </div>
    </section>
  );
}
