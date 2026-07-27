"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

type Marque = { id: string; nom: string };
type Modele = { id: string; nom: string; marqueId: string };
type TypeProduit = { id: string; nom: string };
type FinitionProduit = { id: string; nom: string; typeId: string };

type Onglet = "carrelage" | "finition" | "clients" | "dimension";

const ONGLETS: { id: Onglet; label: string; bientot?: boolean }[] = [
  { id: "carrelage", label: "Carrelage" },
  { id: "finition", label: "Finition" },
  { id: "clients", label: "Clients" },
  { id: "dimension", label: "Dimension", bientot: true },
];

export default function ReferentielPage() {
  const [onglet, setOnglet] = useState<Onglet>("carrelage");

  // ── Carrelage state ──
  const [marques, setMarques] = useState<Marque[]>([]);
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [selectedMarqueId, setSelectedMarqueId] = useState<string | null>(null);
  const [editMarqueId, setEditMarqueId] = useState<string | null>(null);
  const [editMarqueNom, setEditMarqueNom] = useState("");
  const [newMarqueNom, setNewMarqueNom] = useState("");
  const [showNewMarque, setShowNewMarque] = useState(false);
  const [editModeleId, setEditModeleId] = useState<string | null>(null);
  const [editModeleNom, setEditModeleNom] = useState("");
  const [newModeleNom, setNewModeleNom] = useState("");
  const [showNewModele, setShowNewModele] = useState(false);

  // ── Clients state ──
  type ClientLogo = { id: string; nomClient: string; logoData: string | null };
  const [clients, setClients] = useState<ClientLogo[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // ── Finition state ──
  const [types, setTypes] = useState<TypeProduit[]>([]);
  const [finitions, setFinitions] = useState<FinitionProduit[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [editTypeId, setEditTypeId] = useState<string | null>(null);
  const [editTypeNom, setEditTypeNom] = useState("");
  const [newTypeNom, setNewTypeNom] = useState("");
  const [showNewType, setShowNewType] = useState(false);
  const [editFinitionId, setEditFinitionId] = useState<string | null>(null);
  const [editFinitionNom, setEditFinitionNom] = useState("");
  const [newFinitionNom, setNewFinitionNom] = useState("");
  const [showNewFinition, setShowNewFinition] = useState(false);

  // ── Clients loaders ──
  const loadClients = () => {
    setLoadingClients(true);
    fetch("/api/referentiel/clients").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setClients(d);
      setLoadingClients(false);
    });
  };

  useEffect(() => { if (onglet === "clients") loadClients(); }, [onglet]);

  const uploadLogo = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const logoData = e.target?.result as string;
      await fetch(`/api/referentiel/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoData }),
      });
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, logoData } : c)));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = async (id: string) => {
    await fetch(`/api/referentiel/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoData: null }),
    });
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, logoData: null } : c)));
  };

  // ── Carrelage loaders ──
  const loadMarques = () =>
    fetch("/api/referentiel/marques").then((r) => r.json()).then((d) => Array.isArray(d) && setMarques(d));
  const loadModeles = (marqueId: string) =>
    fetch(`/api/referentiel/modeles?marqueId=${marqueId}`).then((r) => r.json()).then((d) => Array.isArray(d) && setModeles(d));

  useEffect(() => { loadMarques(); }, []);
  useEffect(() => {
    if (selectedMarqueId) loadModeles(selectedMarqueId);
    else setModeles([]);
    setEditModeleId(null); setShowNewModele(false); setNewModeleNom("");
  }, [selectedMarqueId]);

  // ── Finition loaders ──
  const loadTypes = () =>
    fetch("/api/referentiel/types").then((r) => r.json()).then((d) => Array.isArray(d) && setTypes(d));
  const loadFinitions = (typeId: string) =>
    fetch(`/api/referentiel/finitions?typeId=${typeId}`).then((r) => r.json()).then((d) => Array.isArray(d) && setFinitions(d));

  useEffect(() => { loadTypes(); }, []);
  useEffect(() => {
    if (selectedTypeId) loadFinitions(selectedTypeId);
    else setFinitions([]);
    setEditFinitionId(null); setShowNewFinition(false); setNewFinitionNom("");
  }, [selectedTypeId]);

  // ── Marques CRUD ──
  const createMarque = async () => {
    const nom = newMarqueNom.trim().toUpperCase();
    if (!nom) return;
    await fetch("/api/referentiel/marques", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom }) });
    setNewMarqueNom(""); setShowNewMarque(false); loadMarques();
  };
  const saveMarque = async (id: string) => {
    const nom = editMarqueNom.trim().toUpperCase();
    if (!nom) return;
    await fetch(`/api/referentiel/marques/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom }) });
    setEditMarqueId(null); loadMarques();
    if (selectedMarqueId === id) loadModeles(id);
  };
  const deleteMarque = async (id: string) => {
    if (!confirm("Supprimer cette marque et tous ses modèles ?")) return;
    await fetch(`/api/referentiel/marques/${id}`, { method: "DELETE" });
    if (selectedMarqueId === id) setSelectedMarqueId(null);
    loadMarques();
  };

  // ── Modèles CRUD ──
  const createModele = async () => {
    const nom = newModeleNom.trim().toUpperCase();
    if (!nom || !selectedMarqueId) return;
    await fetch("/api/referentiel/modeles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom, marqueId: selectedMarqueId }) });
    setNewModeleNom(""); setShowNewModele(false);
    loadModeles(selectedMarqueId);
  };
  const saveModele = async (id: string) => {
    const nom = editModeleNom.trim().toUpperCase();
    if (!nom) return;
    await fetch(`/api/referentiel/modeles/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom }) });
    setEditModeleId(null);
    if (selectedMarqueId) loadModeles(selectedMarqueId);
  };
  const deleteModele = async (id: string) => {
    if (!confirm("Supprimer ce modèle ?")) return;
    await fetch(`/api/referentiel/modeles/${id}`, { method: "DELETE" });
    if (selectedMarqueId) loadModeles(selectedMarqueId);
  };

  // ── Types CRUD ──
  const createType = async () => {
    const nom = newTypeNom.trim().toUpperCase();
    if (!nom) return;
    await fetch("/api/referentiel/types", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom }) });
    setNewTypeNom(""); setShowNewType(false); loadTypes();
  };
  const saveType = async (id: string) => {
    const nom = editTypeNom.trim().toUpperCase();
    if (!nom) return;
    await fetch(`/api/referentiel/types/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom }) });
    setEditTypeId(null); loadTypes();
    if (selectedTypeId === id) loadFinitions(id);
  };
  const deleteType = async (id: string) => {
    if (!confirm("Supprimer ce type et toutes ses finitions ?")) return;
    await fetch(`/api/referentiel/types/${id}`, { method: "DELETE" });
    if (selectedTypeId === id) setSelectedTypeId(null);
    loadTypes();
  };

  // ── Finitions CRUD ──
  const createFinition = async () => {
    const nom = newFinitionNom.trim().toUpperCase();
    if (!nom || !selectedTypeId) return;
    await fetch("/api/referentiel/finitions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom, typeId: selectedTypeId }) });
    setNewFinitionNom(""); setShowNewFinition(false);
    loadFinitions(selectedTypeId);
  };
  const saveFinition = async (id: string) => {
    const nom = editFinitionNom.trim().toUpperCase();
    if (!nom) return;
    await fetch(`/api/referentiel/finitions/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom }) });
    setEditFinitionId(null);
    if (selectedTypeId) loadFinitions(selectedTypeId);
  };
  const deleteFinition = async (id: string) => {
    if (!confirm("Supprimer cette finition ?")) return;
    await fetch(`/api/referentiel/finitions/${id}`, { method: "DELETE" });
    if (selectedTypeId) loadFinitions(selectedTypeId);
  };

  const selectedMarque = marques.find((m) => m.id === selectedMarqueId);
  const selectedType = types.find((t) => t.id === selectedTypeId);

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: "7px 10px", border: "1px solid #2563EB", borderRadius: 6,
    fontSize: 13, outline: "none", fontFamily: "inherit", textTransform: "uppercase",
    color: "#1E2640", background: "white",
  };
  const btnStyle = (color: string): React.CSSProperties => ({
    padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer",
    fontWeight: 600, fontSize: 12, background: color, color: "white",
  });

  const iconEdit = (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
  const iconDelete = (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
    </svg>
  );
  const iconAdd = (
    <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  );

  const iconBtn = (handler: () => void, icon: React.ReactNode, hoverColor: string) => (
    <button onClick={handler} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: "2px 4px", borderRadius: 4 }}
      onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}>
      {icon}
    </button>
  );

  return (
    <>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #EEF1F6; }`}</style>

      <header style={{ background: "#1E2640", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ color: "#94A3B8", display: "flex", alignItems: "center", gap: 6, textDecoration: "none", fontSize: 13, fontWeight: 500 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
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
            <Link key={l.href} href={l.href} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", color: "#94A3B8", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 6, border: "1px solid #374151" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "#4B5563"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "#374151"; }}>
              {l.label}
            </Link>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* Onglets */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "white", borderRadius: 10, padding: 4, border: "1px solid #E2E8F0", width: "fit-content" }}>
          {ONGLETS.map((o) => (
            <button key={o.id} onClick={() => !o.bientot && setOnglet(o.id)} style={{
              padding: "8px 18px", borderRadius: 7, border: "none", cursor: o.bientot ? "default" : "pointer",
              fontWeight: 600, fontSize: 13, transition: "all 0.15s",
              background: onglet === o.id ? "#2563EB" : "transparent",
              color: onglet === o.id ? "white" : o.bientot ? "#CBD5E1" : "#475569",
            }}>
              {o.label}
              {o.bientot && <span style={{ fontSize: 10, marginLeft: 5, opacity: 0.7 }}>À venir</span>}
            </button>
          ))}
        </div>

        {/* ── Onglet Carrelage ── */}
        {onglet === "carrelage" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* Marques */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1E2640" }}>Marques</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{marques.length} marque{marques.length > 1 ? "s" : ""}</div>
                </div>
                <button onClick={() => { setShowNewMarque(true); setEditMarqueId(null); }} style={{ ...btnStyle("#2563EB"), display: "flex", alignItems: "center", gap: 5 }}>
                  {iconAdd} Ajouter
                </button>
              </div>
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                {showNewMarque && (
                  <div style={{ display: "flex", gap: 6, padding: "8px 8px", background: "#F0F7FF", borderRadius: 8, marginBottom: 4 }}>
                    <input autoFocus value={newMarqueNom} onChange={(e) => setNewMarqueNom(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === "Enter") createMarque(); if (e.key === "Escape") { setShowNewMarque(false); setNewMarqueNom(""); } }}
                      placeholder="Nom de la marque…" style={inputStyle} />
                    <button onClick={createMarque} style={btnStyle("#10B981")}>OK</button>
                    <button onClick={() => { setShowNewMarque(false); setNewMarqueNom(""); }} style={btnStyle("#94A3B8")}>✕</button>
                  </div>
                )}
                {marques.length === 0 && !showNewMarque && (
                  <div style={{ textAlign: "center", padding: 24, color: "#94A3B8", fontSize: 13 }}>Aucune marque — cliquez sur Ajouter</div>
                )}
                {marques.map((m) => (
                  <div key={m.id} onClick={() => { if (editMarqueId !== m.id) setSelectedMarqueId(m.id); }}
                    style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: selectedMarqueId === m.id ? "#EFF6FF" : "transparent", border: `1px solid ${selectedMarqueId === m.id ? "#BFDBFE" : "transparent"}`, display: "flex", alignItems: "center", gap: 8, transition: "all 0.1s" }}
                    onMouseEnter={(e) => { if (selectedMarqueId !== m.id) e.currentTarget.style.background = "#F8FAFC"; }}
                    onMouseLeave={(e) => { if (selectedMarqueId !== m.id) e.currentTarget.style.background = "transparent"; }}>
                    {editMarqueId === m.id ? (
                      <>
                        <input autoFocus value={editMarqueNom} onChange={(e) => setEditMarqueNom(e.target.value.toUpperCase())}
                          onKeyDown={(e) => { if (e.key === "Enter") saveMarque(m.id); if (e.key === "Escape") setEditMarqueId(null); }}
                          onClick={(e) => e.stopPropagation()} style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={(e) => { e.stopPropagation(); saveMarque(m.id); }} style={btnStyle("#10B981")}>OK</button>
                        <button onClick={(e) => { e.stopPropagation(); setEditMarqueId(null); }} style={btnStyle("#94A3B8")}>✕</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: selectedMarqueId === m.id ? "#1D4ED8" : "#1E2640" }}>{m.nom}</span>
                        {iconBtn((e) => { (e as unknown as React.MouseEvent).stopPropagation(); setEditMarqueId(m.id); setEditMarqueNom(m.nom); }, iconEdit, "#2563EB")}
                        {iconBtn((e) => { (e as unknown as React.MouseEvent).stopPropagation(); deleteMarque(m.id); }, iconDelete, "#EF4444")}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modèles */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1E2640" }}>Modèles{selectedMarque ? ` — ${selectedMarque.nom}` : ""}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{selectedMarque ? `${modeles.length} modèle${modeles.length > 1 ? "s" : ""}` : "Sélectionnez une marque"}</div>
                </div>
                {selectedMarque && (
                  <button onClick={() => { setShowNewModele(true); setEditModeleId(null); }} style={{ ...btnStyle("#2563EB"), display: "flex", alignItems: "center", gap: 5 }}>
                    {iconAdd} Ajouter
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
                    <input autoFocus value={newModeleNom} onChange={(e) => setNewModeleNom(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === "Enter") createModele(); if (e.key === "Escape") { setShowNewModele(false); setNewModeleNom(""); } }}
                      placeholder="Nom du modèle…" style={inputStyle} />
                    <button onClick={createModele} style={btnStyle("#10B981")}>OK</button>
                    <button onClick={() => { setShowNewModele(false); setNewModeleNom(""); }} style={btnStyle("#94A3B8")}>✕</button>
                  </div>
                )}
                {selectedMarque && modeles.length === 0 && !showNewModele && (
                  <div style={{ textAlign: "center", padding: 24, color: "#94A3B8", fontSize: 13 }}>Aucun modèle pour cette marque</div>
                )}
                {modeles.map((m) => (
                  <div key={m.id} style={{ padding: "10px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, border: "1px solid transparent" }}>
                    {editModeleId === m.id ? (
                      <>
                        <input autoFocus value={editModeleNom} onChange={(e) => setEditModeleNom(e.target.value.toUpperCase())}
                          onKeyDown={(e) => { if (e.key === "Enter") saveModele(m.id); if (e.key === "Escape") setEditModeleId(null); }}
                          style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={() => saveModele(m.id)} style={btnStyle("#10B981")}>OK</button>
                        <button onClick={() => setEditModeleId(null)} style={btnStyle("#94A3B8")}>✕</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontWeight: 500, fontSize: 13, color: "#1E2640" }}>{m.nom}</span>
                        {iconBtn(() => { setEditModeleId(m.id); setEditModeleNom(m.nom); }, iconEdit, "#2563EB")}
                        {iconBtn(() => deleteModele(m.id), iconDelete, "#EF4444")}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── Onglet Finition ── */}
        {onglet === "finition" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* Types */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1E2640" }}>Types</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{types.length} type{types.length > 1 ? "s" : ""}</div>
                </div>
                <button onClick={() => { setShowNewType(true); setEditTypeId(null); }} style={{ ...btnStyle("#2563EB"), display: "flex", alignItems: "center", gap: 5 }}>
                  {iconAdd} Ajouter
                </button>
              </div>
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                {showNewType && (
                  <div style={{ display: "flex", gap: 6, padding: "8px 8px", background: "#F0F7FF", borderRadius: 8, marginBottom: 4 }}>
                    <input autoFocus value={newTypeNom} onChange={(e) => setNewTypeNom(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === "Enter") createType(); if (e.key === "Escape") { setShowNewType(false); setNewTypeNom(""); } }}
                      placeholder="Nom du type…" style={inputStyle} />
                    <button onClick={createType} style={btnStyle("#10B981")}>OK</button>
                    <button onClick={() => { setShowNewType(false); setNewTypeNom(""); }} style={btnStyle("#94A3B8")}>✕</button>
                  </div>
                )}
                {types.length === 0 && !showNewType && (
                  <div style={{ textAlign: "center", padding: 24, color: "#94A3B8", fontSize: 13 }}>Aucun type — cliquez sur Ajouter</div>
                )}
                {types.map((t) => (
                  <div key={t.id} onClick={() => { if (editTypeId !== t.id) setSelectedTypeId(t.id); }}
                    style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", background: selectedTypeId === t.id ? "#EFF6FF" : "transparent", border: `1px solid ${selectedTypeId === t.id ? "#BFDBFE" : "transparent"}`, display: "flex", alignItems: "center", gap: 8, transition: "all 0.1s" }}
                    onMouseEnter={(e) => { if (selectedTypeId !== t.id) e.currentTarget.style.background = "#F8FAFC"; }}
                    onMouseLeave={(e) => { if (selectedTypeId !== t.id) e.currentTarget.style.background = "transparent"; }}>
                    {editTypeId === t.id ? (
                      <>
                        <input autoFocus value={editTypeNom} onChange={(e) => setEditTypeNom(e.target.value.toUpperCase())}
                          onKeyDown={(e) => { if (e.key === "Enter") saveType(t.id); if (e.key === "Escape") setEditTypeId(null); }}
                          onClick={(e) => e.stopPropagation()} style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={(e) => { e.stopPropagation(); saveType(t.id); }} style={btnStyle("#10B981")}>OK</button>
                        <button onClick={(e) => { e.stopPropagation(); setEditTypeId(null); }} style={btnStyle("#94A3B8")}>✕</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: selectedTypeId === t.id ? "#1D4ED8" : "#1E2640" }}>{t.nom}</span>
                        {iconBtn(() => { setEditTypeId(t.id); setEditTypeNom(t.nom); }, iconEdit, "#2563EB")}
                        {iconBtn(() => deleteType(t.id), iconDelete, "#EF4444")}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Finitions */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1E2640" }}>Finitions{selectedType ? ` — ${selectedType.nom}` : ""}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{selectedType ? `${finitions.length} finition${finitions.length > 1 ? "s" : ""}` : "Sélectionnez un type"}</div>
                </div>
                {selectedType && (
                  <button onClick={() => { setShowNewFinition(true); setEditFinitionId(null); }} style={{ ...btnStyle("#2563EB"), display: "flex", alignItems: "center", gap: 5 }}>
                    {iconAdd} Ajouter
                  </button>
                )}
              </div>
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                {!selectedType && (
                  <div style={{ textAlign: "center", padding: 48, color: "#CBD5E1", fontSize: 13 }}>
                    <svg width="32" height="32" fill="none" stroke="#E2E8F0" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto 8px", display: "block" }}>
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    </svg>
                    Sélectionnez un type
                  </div>
                )}
                {selectedType && showNewFinition && (
                  <div style={{ display: "flex", gap: 6, padding: "8px 8px", background: "#F0F7FF", borderRadius: 8, marginBottom: 4 }}>
                    <input autoFocus value={newFinitionNom} onChange={(e) => setNewFinitionNom(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === "Enter") createFinition(); if (e.key === "Escape") { setShowNewFinition(false); setNewFinitionNom(""); } }}
                      placeholder="Nom de la finition…" style={inputStyle} />
                    <button onClick={createFinition} style={btnStyle("#10B981")}>OK</button>
                    <button onClick={() => { setShowNewFinition(false); setNewFinitionNom(""); }} style={btnStyle("#94A3B8")}>✕</button>
                  </div>
                )}
                {selectedType && finitions.length === 0 && !showNewFinition && (
                  <div style={{ textAlign: "center", padding: 24, color: "#94A3B8", fontSize: 13 }}>Aucune finition pour ce type</div>
                )}
                {finitions.map((f) => (
                  <div key={f.id} style={{ padding: "10px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, border: "1px solid transparent" }}>
                    {editFinitionId === f.id ? (
                      <>
                        <input autoFocus value={editFinitionNom} onChange={(e) => setEditFinitionNom(e.target.value.toUpperCase())}
                          onKeyDown={(e) => { if (e.key === "Enter") saveFinition(f.id); if (e.key === "Escape") setEditFinitionId(null); }}
                          style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={() => saveFinition(f.id)} style={btnStyle("#10B981")}>OK</button>
                        <button onClick={() => setEditFinitionId(null)} style={btnStyle("#94A3B8")}>✕</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontWeight: 500, fontSize: 13, color: "#1E2640" }}>{f.nom}</span>
                        {iconBtn(() => { setEditFinitionId(f.id); setEditFinitionNom(f.nom); }, iconEdit, "#2563EB")}
                        {iconBtn(() => deleteFinition(f.id), iconDelete, "#EF4444")}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── Onglet Clients ── */}
        {onglet === "clients" && (
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1E2640" }}>Logos Clients</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>
                {loadingClients ? "Synchronisation depuis Notion…" : `${clients.length} client${clients.length !== 1 ? "s" : ""}`}
              </div>
            </div>
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
              {loadingClients && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "#94A3B8", fontSize: 13 }}>
                  Chargement…
                </div>
              )}
              {!loadingClients && clients.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "#94A3B8", fontSize: 13 }}>
                  Aucun client trouvé dans Notion
                </div>
              )}
              {clients.map((c) => (
                <div key={c.id} style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ height: 100, background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {c.logoData ? (
                      <img src={c.logoData} alt={c.nomClient} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 8 }} />
                    ) : (
                      <svg width="32" height="32" fill="none" stroke="#CBD5E1" strokeWidth="1.5" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 600, fontSize: 11, color: "#1E2640", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.nomClient}>
                      {c.nomClient}
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      <label style={{ ...btnStyle("#2563EB"), flex: 1, textAlign: "center", cursor: "pointer", display: "block", padding: "5px 8px", fontSize: 11 }}>
                        {c.logoData ? "Changer" : "Ajouter"}
                        <input type="file" accept="image/*" style={{ display: "none" }}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(c.id, f); e.target.value = ""; }} />
                      </label>
                      {c.logoData && (
                        <button onClick={() => removeLogo(c.id)} style={{ ...btnStyle("#EF4444"), padding: "5px 8px", fontSize: 11 }}>✕</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Onglet Dimension ── */}
        {onglet === "dimension" && (
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
