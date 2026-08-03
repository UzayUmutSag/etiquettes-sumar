"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FormulaireEtiquette from "@/components/FormulaireEtiquette";
import EtiquettePreview from "@/components/EtiquettePreview";

type CommandeNotion = {
  id: string;
  numeroCommande: string;
  numeroDevis: string;
  client: string;
  dateCommande: string | null;
  dateReception: string | null;
  dateLivraison: string | null;
  avancement: string;
};

type FormData = {
  marque: string;
  reference: string;
  refClient: string;
  clientFinal: string;
  nbCarreaux: string;
  dimOriginale: string;
  dimFaconnage: string;
  typeProduit: string;
  finition: string;
  quantite: string;
  observation: string;
};

const FORM_VIDE: FormData = {
  marque: "", reference: "", refClient: "", clientFinal: "", nbCarreaux: "",
  dimOriginale: "", dimFaconnage: "", typeProduit: "", finition: "", quantite: "", observation: "",
};

const STATUT_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  "À faire":            { bg: "#FEE2E2", text: "#B91C1C", dot: "#EF4444" },
  "Découpé":            { bg: "#DBEAFE", text: "#1D4ED8", dot: "#3B82F6" },
  "Façonné":            { bg: "#EDE9FE", text: "#6D28D9", dot: "#8B5CF6" },
  "Partiellement livré":{ bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  "Abandonné":          { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
  "Emballé":            { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  "Prêt à partir":      { bg: "#FFEDD5", text: "#9A3412", dot: "#F97316" },
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

function StatutBadge({ statut }: { statut: string }) {
  const s = STATUT_STYLE[statut] ?? { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" };
  return (
    <span style={{ background: s.bg, color: s.text, display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {statut || "—"}
    </span>
  );
}

export default function Home() {
  const [commandes, setCommandes] = useState<CommandeNotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [sel, setSel] = useState<CommandeNotion | null>(null);
  const [formData, setFormData] = useState<FormData>(FORM_VIDE);
  const [etiquette, setEtiquette] = useState<(CommandeNotion & FormData) | null>(null);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    fetch("/api/commandes")
      .then((r) => r.json())
      .then((data) => { if (data.error) setErreur(data.error); else setCommandes(data); })
      .catch(() => setErreur("Impossible de contacter Notion"))
      .finally(() => setLoading(false));
  }, []);

  const filtrees = commandes
    .filter((c) =>
      [c.numeroCommande, c.client, c.numeroDevis].some((v) =>
        v?.toLowerCase().includes(recherche.toLowerCase())
      )
    )
    .sort((a, b) => {
      const num = (s: string) => parseInt(s?.split("-").pop() || "0", 10);
      return num(b.numeroCommande) - num(a.numeroCommande);
    });

  const selectionner = (c: CommandeNotion) => { setSel(c); setFormData(FORM_VIDE); setEtiquette(null); };
  const generer = () => {
    if (!sel) return;
    const upper = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, v.toUpperCase()])
    ) as FormData;
    setFormData(upper);
    setEtiquette({ ...sel, ...upper });
  };

  const imprimer = async () => {
    if (!sel || !etiquette) return;

    await fetch("/api/etiquettes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notionCommandeId: sel.id, numeroCommande: sel.numeroCommande,
        numeroDevis: sel.numeroDevis, client: sel.client,
        dateReception: sel.dateReception ? new Date(sel.dateReception) : null,
        dateLivraison: sel.dateLivraison ? new Date(sel.dateLivraison) : null,
        avancement: sel.avancement,
        marque: formData.marque || null, reference: formData.reference || null,
        clientFinal: formData.clientFinal || null,
        refClient: formData.refClient || null,
        nbCarreaux: formData.nbCarreaux ? parseInt(formData.nbCarreaux) : null,
        dimOriginale: formData.dimOriginale || null, dimFaconnage: formData.dimFaconnage || null,
        typeProduit: formData.typeProduit || null, finition: formData.finition || null,
        quantite: formData.quantite ? parseInt(formData.quantite) : null,
        observation: formData.observation || null,
      }),
    });

    const fmt = (d: string | null) =>
      d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
    const up = (s: string) => (s || "—").toUpperCase();
    const fontMain = '"Arial Black", "Arial Bold", Arial, sans-serif';
    const fontBody = "Arial, sans-serif";

    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Étiquette ${etiquette.numeroCommande}</title>
      <style>
        @page { size: 75mm 125mm; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { width: 75mm; height: 125mm; font-family: ${fontBody}; color: #000; background: white; }
        .wrap { width: 75mm; height: 125mm; border: 2px solid #000; display: flex; flex-direction: column; overflow: hidden; }
        .header { padding: 1.5mm 2.5mm 1mm; border-bottom: 2px solid #000; }
        .client-name { font-family: ${fontMain}; font-weight: 900; font-size: 4.5mm; line-height: 1.05; text-transform: uppercase; }
        .cmd-line { display: flex; align-items: baseline; gap: 2mm; margin-top: 0.5mm; }
        .cmd { font-size: 3mm; font-weight: 700; }
        .devis { font-size: 3mm; }
        .client-final { font-size: 2.6mm; margin-top: 0.3mm; }
        .date-block { border-bottom: 2px solid #000; padding: 1mm 2mm; text-align: center; }
        .date-label { font-weight: 700; font-size: 2.5mm; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 0.3mm; }
        .date-val { font-family: ${fontMain}; font-weight: 900; font-size: 7.5mm; letter-spacing: -0.02em; line-height: 1; }
        .table { flex: 1; display: flex; flex-direction: column; border-bottom: 2px solid #000; }
        .row { display: flex; border-bottom: 1.5px solid #000; height: 9mm; }
        .row-label { width: 20mm; border-right: 1.5px solid #000; padding: 1mm 1.5mm; display: flex; align-items: center; font-size: 2.3mm; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; line-height: 1.25; }
        .row-val { flex: 1; padding: 0.8mm 1.5mm; display: flex; align-items: center; font-family: ${fontMain}; font-weight: 700; font-size: 4mm; }
        .fin-row { display: flex; border-bottom: 1.5px solid #000; min-height: 9mm; }
        .fin-label { width: 20mm; border-right: 1.5px solid #000; padding: 1mm 1.5mm; display: flex; align-items: center; font-size: 2.3mm; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; line-height: 1.25; }
        .fin-tags { flex: 1; padding: 0.8mm 1.5mm; display: flex; flex-wrap: wrap; align-content: center; gap: 0.8mm; }
        .fin-tag { border: 1.5px solid #000; padding: 0.4mm 1.2mm; font-size: 4mm; font-weight: 700; line-height: 1.3; white-space: nowrap; }
        .dim-row { display: flex; border-bottom: 1.5px solid #000; height: 11mm; }
        .dim-cell { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.8mm 1.5mm; }
        .dim-cell-label { font-size: 2.3mm; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.3mm; }
        .dim-cell-val { font-family: ${fontMain}; font-weight: 900; font-size: 4.5mm; }
        .dim-sep { display: flex; align-items: center; padding: 0 1mm; font-family: ${fontMain}; font-weight: 900; font-size: 6mm; }
        .obs-row { display: flex; flex: 1; }
        .obs-label { width: 20mm; border-right: 1.5px solid #000; padding: 1mm 1.5mm; font-size: 2.3mm; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; line-height: 1.25; word-break: break-word; }
        .obs-val { flex: 1; padding: 1mm 1.5mm; font-size: 3mm; line-height: 1.4; }
      </style>
    </head><body>
      <div class="wrap">
        <div class="header">
          <div class="client-name">${etiquette.client || "—"}</div>
          <div class="cmd-line">
            <span class="cmd">${etiquette.numeroCommande || "—"}${etiquette.numeroDevis ? ` - ${etiquette.numeroDevis}` : ""}</span>
          </div>
          <div class="client-final"><div>Client final : ${up(etiquette.clientFinal)}</div><div>Référence Client : ${up(etiquette.refClient)}</div></div>
        </div>
        <div class="date-block">
          <div class="date-label">Livraison planifiée le</div>
          <div class="date-val">${fmt(etiquette.dateLivraison)}</div>
        </div>
        <div class="table">
          <div class="row"><div class="row-label">Marque</div><div class="row-val">${up(etiquette.marque)}</div></div>
          <div class="row"><div class="row-label">Référence</div><div class="row-val">${up(etiquette.reference)}</div></div>
          <div class="row"><div class="row-label">CARREAUX FOURNIS</div><div class="row-val">${etiquette.nbCarreaux ? etiquette.nbCarreaux + " carreaux" : "—"}</div></div>
          <div class="row"><div class="row-label">QTÉ À PRO</div><div class="row-val">${etiquette.quantite ? etiquette.quantite + " U" : "—"}</div></div>
          <div class="dim-row">
            <div class="dim-cell" style="border-right:1.5px solid #000">
              <div class="dim-cell-label">Origine</div>
              <div class="dim-cell-val">${up(etiquette.dimOriginale)}</div>
            </div>
            <div class="dim-sep">→</div>
            <div class="dim-cell" style="border-left:1.5px solid #000">
              <div class="dim-cell-label">Après façonnage</div>
              <div class="dim-cell-val">${up(etiquette.dimFaconnage)}</div>
            </div>
          </div>
          <div class="fin-row">
            <div class="fin-label">Finition</div>
            <div class="fin-tags">
              ${etiquette.typeProduit ? `<span class="fin-tag fin-tag-type">${up(etiquette.typeProduit)}</span>` : ""}
              ${etiquette.finition ? etiquette.finition.split(", ").filter(Boolean).map((f: string) => `<span class="fin-tag">${f.toUpperCase()}</span>`).join("") : ""}
              ${!etiquette.typeProduit && !etiquette.finition ? `<span style="font-family:${fontMain};font-weight:700;font-size:4mm">—</span>` : ""}
            </div>
          </div>
          ${etiquette.observation ? `<div class="obs-row">
            <div class="obs-label">OBS</div>
            <div class="obs-val">${etiquette.observation}</div>
          </div>` : ""}
        </div>
        <div class="spacer"></div>
      </div>
    </body></html>`;

    const win = window.open("", "_blank", "width=400,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); win.close(); };
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #EEF1F6; }
        input, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        @media print {
          @page { size: 75mm 125mm; margin: 0; }
          body * { visibility: hidden; }
          .etiquette-print, .etiquette-print * { visibility: visible; }
          .etiquette-print { position: fixed !important; top: 0 !important; left: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <header className="no-print" style={{ background: "#1E2640", padding: "0 28px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, background: "#2563EB", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h6M7 16h8"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>Étiquettes Atelier</div>
            <div style={{ color: "#94A3B8", fontSize: 11 }}>75 × 125 mm · Sumar.F</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#475569", fontSize: 12, marginRight: 4 }}>
            {commandes.length > 0 && `${commandes.length} commande${commandes.length > 1 ? "s" : ""} en cours`}
          </span>
          <Link href="/etiquettes-client" style={{
            display: "flex", alignItems: "center", gap: 6, textDecoration: "none",
            color: "#94A3B8", fontSize: 12, fontWeight: 600, padding: "6px 12px",
            borderRadius: 6, border: "1px solid #374151", transition: "all 0.15s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "#4B5563"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "#374151"; }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            Étiquettes Client
          </Link>
          <Link href="/referentiel" style={{
            display: "flex", alignItems: "center", gap: 6, textDecoration: "none",
            color: "#94A3B8", fontSize: 12, fontWeight: 600, padding: "6px 12px",
            borderRadius: 6, border: "1px solid #374151", transition: "all 0.15s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "#4B5563"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "#374151"; }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h7"/>
            </svg>
            Référentiel
          </Link>
        </div>
      </header>

      <div className="no-print" style={{ display: "flex", height: "calc(100vh - 56px)" }}>

        {/* Sidebar */}
        <aside style={{ width: 280, background: "white", borderRight: "1px solid #E2E8F0",
          display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}
                width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input value={recherche} onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une commande..."
                style={{ width: "100%", padding: "8px 10px 8px 30px", border: "1px solid #E2E8F0",
                  borderRadius: 8, fontSize: 13, outline: "none", color: "#1E2640", background: "#F8FAFC" }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && (
              <div style={{ padding: 20, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                Chargement Notion…
              </div>
            )}
            {erreur && (
              <div style={{ margin: 12, padding: 12, background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: 8, color: "#B91C1C", fontSize: 12 }}>{erreur}</div>
            )}
            {!loading && !erreur && filtrees.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                Aucune commande trouvée
              </div>
            )}
            {filtrees.map((c) => {
              const isActive = sel?.id === c.id;
              const s = STATUT_STYLE[c.avancement] ?? { dot: "#9CA3AF" };
              return (
                <button key={c.id} onClick={() => selectionner(c)}
                  style={{ width: "100%", textAlign: "left", padding: "12px 16px",
                    borderBottom: "1px solid #F8FAFC", background: isActive ? "#EFF6FF" : "white",
                    borderLeft: isActive ? "3px solid #2563EB" : "3px solid transparent",
                    cursor: "pointer", transition: "background 0.1s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, fontSize: 13,
                      color: isActive ? "#1D4ED8" : "#1E2640" }}>{c.numeroCommande || "—"}</span>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", fontWeight: 500, marginBottom: 2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.client || "—"}
                  </div>
                  {c.numeroDevis && (
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>Devis {c.numeroDevis}</div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Zone centrale */}
        <main style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          {!sel ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12, color: "#94A3B8" }}>
              <svg width="48" height="48" fill="none" stroke="#CBD5E1" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
              </svg>
              <span style={{ fontSize: 14 }}>Sélectionnez une commande dans la liste</span>
            </div>
          ) : (
            <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Bloc Notion */}
              <section style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9",
                  display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" fill="none" stroke="#94A3B8" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                    color: "#94A3B8", textTransform: "uppercase" }}>Données Notion</span>
                </div>
                <div style={{ padding: "18px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px 24px" }}>
                  {[
                    { label: "N° Commande", value: sel.numeroCommande, mono: true },
                    { label: "N° Devis", value: sel.numeroDevis, mono: true },
                    { label: "Statut", value: null, badge: sel.avancement },
                    { label: "Client", value: sel.client, span: 2 },
                    { label: "Livraison ciblée", value: fmt(sel.dateLivraison) },
                    { label: "Réception", value: fmt(sel.dateReception) },
                  ].map(({ label, value, mono, badge, span }, i) => (
                    <div key={i} style={{ gridColumn: span ? `span ${span}` : undefined }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
                        color: "#94A3B8", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                      {badge !== undefined ? (
                        <StatutBadge statut={badge} />
                      ) : (
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1E2640",
                          fontFamily: mono ? "ui-monospace, monospace" : "inherit" }}>
                          {value || "—"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Formulaire */}
              <FormulaireEtiquette
                formData={formData}
                onChange={(f, v) => setFormData((p) => ({ ...p, [f]: v.toUpperCase() }))}
                onGenerer={generer}
              />
            </div>
          )}
        </main>

        {/* Aperçu */}
        <aside style={{ width: 480, background: "#F8FAFC", borderLeft: "1px solid #E2E8F0",
          display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", background: "white" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E2640" }}>Aperçu étiquette</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>75 × 125 mm</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24 }}>
            {etiquette ? (
              <EtiquettePreview data={etiquette} />
            ) : (
              <div style={{ textAlign: "center", color: "#CBD5E1" }}>
                <div style={{ width: 114, height: 189, border: "2px dashed #E2E8F0", borderRadius: 6,
                  margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="28" height="28" fill="none" stroke="#E2E8F0" strokeWidth="1.5" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M7 8h10M7 12h6M7 16h8"/>
                  </svg>
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>Remplissez le formulaire<br/>puis cliquez sur Générer</div>
              </div>
            )}
          </div>
          {etiquette && (
            <div style={{ padding: 16, borderTop: "1px solid #E2E8F0", background: "white" }}>
              <button onClick={imprimer}
                style={{ width: "100%", background: "#2563EB", color: "white", border: "none",
                  padding: "12px 0", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Imprimer l&apos;étiquette
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Zone impression */}
      {etiquette && (
        <div style={{ display: "none" }} className="print:block">
          <EtiquettePreview data={etiquette} />
        </div>
      )}
    </>
  );
}
