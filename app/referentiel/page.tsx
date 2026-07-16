"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

type Marque = { id: string; nom: string };
type Modele = { id: string; nom: string; marqueId: string };

type Onglet = "carrelage" | "finition" | "dimension";

const ONGLETS: { id: Onglet; label: string; bientot?: boolean }[] = [
  { id: "carrelage", label: "Carrelage" },
  { id: "finition", label: "Finition", bientot: true },
  { id: "dimension", label: "Dimension", bientot: true },
];

export default function ReferentielPage() {
  const [onglet, setOnglet] = useState<Onglet>("carrelage");
  const [marques, setMarques] = useState<Marque[]>([]);
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [selectedMarqueId, setSelectedMarqueId] = useState<string | null>(null);

  // Edition / ajout
  const [editMarqueId, setEditMarqueId] = useState<string | null>(null);
  const [editMarqueNom, setEditMarqueNom] = useState("");
  const [newMarqueNom, setNewMarqueNom] = useState("");
  const [showNewMarque, setShowNewMarque] = useState(false);

  const [editModeleId, setEditModeleId] = useState<string | null>(null);
  const [editModeleNom, setEditModeleNom] = useState("");
  const [newModeleNom, setNewModeleNom] = useState("");
  const [showNewModele, setShowNewModele] = useState(false);

  const loadMarques = () =>
    fetch("/api/referentiel/marques").then((r) => r.json()).then((d) => Array.isArray(d) && setMarques(d));

  const loadModeles = (marqueId: string) =>
    fetch(`/api/referentiel/modeles?marqueId=${marqueId}`).then((r) => r.json()).then((d) => Array.isArray(d) && setModeles(d));

  useEffect(() => { loadMarques(); }, []);

  useEffect(() => {
    if (selectedMarqueId) loadModeles(selectedMarqueId);
    else setModeles([]);
    setEditModeleId(null);
    setShowNewModele(false);
    setNewModeleNom("");
  }, [selectedMarqueId]);

  // ── Marques ──
  const createMarque = async () => {
    const nom = newMarqueNom.trim().toUpperCase();
    if (!nom) return;
    await fetch("/api/referentiel/marques", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom }),
    });
    setNewMarqueNom(""); setShowNewMarque(false);
    loadMarques();
  };

  const saveMarque = async (id: string) => {
    const nom = editMarqueNom.trim().toUpperCase();
    if (!nom) return;
    await fetch(`/api/referentiel/marques/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom }),
    });
    setEditMarqueId(null);
    loadMarques();
    if (selectedMarqueId === id) loadModeles(id);
  };

  const deleteMarque = async (id: string) => {
    if (!confirm("Supprimer cette marque et tous ses modèles ?")) return;
    await fetch(`/api/referentiel/marques/${id}`, { method: "DELETE" });
    if (selectedMarqueId === id) setSelectedMarqueId(null);
    loadMarques();
  };

  // ── Modèles ──
  const createModele = async () => {
    const nom = newModeleNom.trim().toUpperCase();
    if (!nom || !selectedMarqueId) return;
    await fetch("/api/referentiel/modeles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, marqueId: selectedMarqueId }),
    });
    setNewModeleNom(""); setShowNewModele(false);
    loadModeles(selectedMarqueId);
  };

  const saveModele = async (id: string) => {
    const nom = editModeleNom.trim().toUpperCase();
    if (!nom) return;
    await fetch(`/api/referentiel/modeles/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom }),
    });
    setEditModeleId(null);
    if (selectedMarqueId) loadModeles(selectedMarqueId);
  };

  const deleteModele = async (id: string) => {
    if (!confirm("Supprimer ce modèle ?")) return;
    await fetch(`/api/referentiel/modeles/${id}`, { method: "DELETE" });
    if (selectedMarqueId) loadModeles(selectedMarqueId);
  };

  const selectedMarque = marques.find((m) => m.id === selectedMarqueId);

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: "7px 10px", border: "1px solid #2563EB", borderRadius: 6,
    fontSize: 13, outline: "none", fontFamily: "inherit", textTransform: "uppercase",
    color: "#1E2640", background: "white",
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer",
    fontWeight: 600, fontSize: 12, background: color, color: "white",
  });

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #EEF1F6; }`}</style>

      {/* Header */}
      <header style={{ background: "#1E2640", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ color: "#94A3B8", display: "flex", alignItems: "center", gap: 6, textDecoration: "none", fontSize: 13, fontWeight: 500 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Retour
          </Link>
          <div style={{ width: 1, height: 24, background: "#374151" }} />
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Référentiel</div>
            <div style={{ color: "#94A3B8", fontSize: 11 }}>Gestion des données de référence</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ href: "/", label: "Étiquettes Atelier" }, { href: "/etiquettes-client", label: "Étiquettes Client" }].map((l) => (
            <Link key={l.href} href={l.href} style={{
              display: "inline-flex", alignItems: "center", textDecoration: "none",
              color: "#94A3B8", fontSize: 12, fontWeight: 600, padding: "6px 12px",
              borderRadius: 6, border: "1px solid #374151",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "#4B5563"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "#374151"; }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* Onglets */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "white", borderRadius: 10, padding: 4, border: "1px solid #E2E8F0", width: "fit-content" }}>
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              onClick={() => !o.bientot && setOnglet(o.id)}
              style={{
                padding: "8px 18px", borderRadius: 7, border: "none", cursor: o.bientot ? "default" : "pointer",
                fontWeight: 600, fontSize: 13, transition: "all 0.15s",
                background: onglet === o.id ? "#2563EB" : "transparent",
                color: onglet === o.id ? "white" : o.bientot ? "#CBD5E1" : "#475569",
              }}
            >
              {o.label}
              {o.bientot && <span style={{ fontSize: 10, marginLeft: 5, opacity: 0.7 }}>À venir</span>}
            </button>
          ))}
        </div>

        {/* Contenu Carrelage */}
        {onglet === "carrelage" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* ── Marques ── */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1E2640" }}>Marques</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{marques.length} marque{marques.length > 1 ? "s" : ""}</div>
                </div>
                <button
                  onClick={() => { setShowNewMarque(true); setEditMarqueId(null); }}
                  style={{ ...btnStyle("#2563EB"), display: "flex", alignItems: "center", gap: 5 }}
                >
                  <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                  Ajouter
                </button>
              </div>

              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                {showNewMarque && (
                  <div style={{ display: "flex", gap: 6, padding: "8px 8px", background: "#F0F7FF", borderRadius: 8, marginBottom: 4 }}>
                    <input
                      autoFocus value={newMarqueNom}
                      onChange={(e) => setNewMarqueNom(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === "Enter") createMarque(); if (e.key === "Escape") { setShowNewMarque(false); setNewMarqueNom(""); } }}
                      placeholder="Nom de la marque…"
                      style={inputStyle}
                    />
                    <button onClick={createMarque} style={btnStyle("#10B981")}>OK</button>
                    <button onClick={() => { setShowNewMarque(false); setNewMarqueNom(""); }} style={btnStyle("#94A3B8")}>✕</button>
                  </div>
                )}

                {marques.length === 0 && !showNewMarque && (
                  <div style={{ textAlign: "center", padding: 24, color: "#94A3B8", fontSize: 13 }}>
                    Aucune marque — cliquez sur Ajouter
                  </div>
                )}

                {marques.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => { if (editMarqueId !== m.id) setSelectedMarqueId(m.id); }}
                    style={{
                      padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                      background: selectedMarqueId === m.id ? "#EFF6FF" : "transparent",
                      border: `1px solid ${selectedMarqueId === m.id ? "#BFDBFE" : "transparent"}`,
                      display: "flex", alignItems: "center", gap: 8, transition: "all 0.1s",
                    }}
                    onMouseEnter={(e) => { if (selectedMarqueId !== m.id) e.currentTarget.style.background = "#F8FAFC"; }}
                    onMouseLeave={(e) => { if (selectedMarqueId !== m.id) e.currentTarget.style.background = "transparent"; }}
                  >
                    {editMarqueId === m.id ? (
                      <>
                        <input
                          autoFocus value={editMarqueNom}
                          onChange={(e) => setEditMarqueNom(e.target.value.toUpperCase())}
                          onKeyDown={(e) => { if (e.key === "Enter") saveMarque(m.id); if (e.key === "Escape") setEditMarqueId(null); }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button onClick={(e) => { e.stopPropagation(); saveMarque(m.id); }} style={btnStyle("#10B981")}>OK</button>
                        <button onClick={(e) => { e.stopPropagation(); setEditMarqueId(null); }} style={btnStyle("#94A3B8")}>✕</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: selectedMarqueId === m.id ? "#1D4ED8" : "#1E2640" }}>
                          {m.nom}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditMarqueId(m.id); setEditMarqueNom(m.nom); }}
                          title="Modifier"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: "2px 4px", borderRadius: 4 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#2563EB")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                        >
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMarque(m.id); }}
                          title="Supprimer"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: "2px 4px", borderRadius: 4 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                        >
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Modèles ── */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1E2640" }}>
                    Modèles{selectedMarque ? ` — ${selectedMarque.nom}` : ""}
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>
                    {selectedMarque ? `${modeles.length} modèle${modeles.length > 1 ? "s" : ""}` : "Sélectionnez une marque"}
                  </div>
                </div>
                {selectedMarque && (
                  <button
                    onClick={() => { setShowNewModele(true); setEditModeleId(null); }}
                    style={{ ...btnStyle("#2563EB"), display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                    Ajouter
                  </button>
                )}
              </div>

              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                {!selectedMarque && (
                  <div style={{ textAlign: "center", padding: 48, color: "#CBD5E1", fontSize: 13 }}>
                    <svg width="32" height="32" fill="none" stroke="#E2E8F0" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto 8px", display: "block" }}>
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    </svg>
                    Sélectionnez une marque
                  </div>
                )}

                {selectedMarque && showNewModele && (
                  <div style={{ display: "flex", gap: 6, padding: "8px 8px", background: "#F0F7FF", borderRadius: 8, marginBottom: 4 }}>
                    <input
                      autoFocus value={newModeleNom}
                      onChange={(e) => setNewModeleNom(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === "Enter") createModele(); if (e.key === "Escape") { setShowNewModele(false); setNewModeleNom(""); } }}
                      placeholder="Nom du modèle…"
                      style={inputStyle}
                    />
                    <button onClick={createModele} style={btnStyle("#10B981")}>OK</button>
                    <button onClick={() => { setShowNewModele(false); setNewModeleNom(""); }} style={btnStyle("#94A3B8")}>✕</button>
                  </div>
                )}

                {selectedMarque && modeles.length === 0 && !showNewModele && (
                  <div style={{ textAlign: "center", padding: 24, color: "#94A3B8", fontSize: 13 }}>
                    Aucun modèle pour cette marque
                  </div>
                )}

                {modeles.map((m) => (
                  <div key={m.id} style={{ padding: "10px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, border: "1px solid transparent" }}>
                    {editModeleId === m.id ? (
                      <>
                        <input
                          autoFocus value={editModeleNom}
                          onChange={(e) => setEditModeleNom(e.target.value.toUpperCase())}
                          onKeyDown={(e) => { if (e.key === "Enter") saveModele(m.id); if (e.key === "Escape") setEditModeleId(null); }}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button onClick={() => saveModele(m.id)} style={btnStyle("#10B981")}>OK</button>
                        <button onClick={() => setEditModeleId(null)} style={btnStyle("#94A3B8")}>✕</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontWeight: 500, fontSize: 13, color: "#1E2640" }}>{m.nom}</span>
                        <button
                          onClick={() => { setEditModeleId(m.id); setEditModeleNom(m.nom); }}
                          title="Modifier"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: "2px 4px", borderRadius: 4 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#2563EB")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                        >
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteModele(m.id)}
                          title="Supprimer"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: "2px 4px", borderRadius: 4 }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                        >
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Contenu Finition / Dimension — placeholder */}
        {(onglet === "finition" || onglet === "dimension") && (
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", padding: 60, textAlign: "center", color: "#94A3B8" }}>
            <svg width="40" height="40" fill="none" stroke="#E2E8F0" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto 12px", display: "block" }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#CBD5E1", marginBottom: 4 }}>Prochainement</div>
            <div style={{ fontSize: 13 }}>Ce référentiel sera disponible dans une prochaine version.</div>
          </div>
        )}

      </div>
    </>
  );
}
