"use client";

import { useState, useEffect, type ReactNode, type CSSProperties } from "react";
import { printViaIframe } from "@/lib/printFrame";
import Link from "next/link";
import EtiquetteClientPreview from "@/components/EtiquetteClientPreview";

type EtiquetteAtelier = {
  id: string;
  notionCommandeId: string;
  numeroCommande: string;
  numeroDevis: string | null;
  client: string;
  dateLivraison: string | null;
  avancement: string | null;
  marque: string | null;
  reference: string | null;
  refClient: string | null;
  clientFinal: string | null;
  nbCarreaux: number | null;
  dimOriginale: string | null;
  dimFaconnage: string | null;
  typeProduit: string | null;
  finition: string | null;
  quantite: number | null;
  observation: string | null;
  creeLe: string;
  nbImpressions: number;
};

const STATUT_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  "À faire":             { bg: "#FEE2E2", text: "#B91C1C", dot: "#EF4444" },
  "Découpé":             { bg: "#DBEAFE", text: "#1D4ED8", dot: "#3B82F6" },
  "Façonné":             { bg: "#EDE9FE", text: "#6D28D9", dot: "#8B5CF6" },
  "Partiellement livré": { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  "Abandonné":           { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
  "Emballé":             { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  "Prêt à partir":       { bg: "#FFEDD5", text: "#9A3412", dot: "#F97316" },
};

const up = (s: string | null | undefined) => (s || "—").toUpperCase();
const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

function StatutBadge({ statut }: { statut: string | null }) {
  const s = STATUT_STYLE[statut ?? ""] ?? { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" };
  return (
    <span style={{
      background: s.bg, color: s.text, display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {statut || "—"}
    </span>
  );
}

const numInput: CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1px solid #E2E8F0",
  borderRadius: 7, fontSize: 13, color: "#1E2640", outline: "none",
  background: "#FAFAFA", boxSizing: "border-box", fontFamily: "inherit",
};

export default function EtiqettesClientPage() {
  type LigneColis = { nombre: number; totalColis: number };

  const [etiquettes, setEtiquettes] = useState<EtiquetteAtelier[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<EtiquetteAtelier | null>(null);
  const [lignes, setLignes] = useState<LigneColis[]>([{ nombre: 1, totalColis: 1 }]);
  const [activeLigne, setActiveLigne] = useState(0);
  const [dateProduction, setDateProduction] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [logoMap, setLogoMap] = useState<Record<string, string>>({});
  const [logoData, setLogoData] = useState<string | null>(null);
  const [logoOrientation, setLogoOrientation] = useState<"horizontal" | "square" | null>(null);

  useEffect(() => {
    setDateProduction(new Date().toISOString().slice(0, 10));
    // Croise les étiquettes locales avec les commandes Notion "Affichage atelier"
    Promise.all([
      fetch("/api/etiquettes").then((r) => r.json()),
      fetch("/api/commandes").then((r) => r.json()),
    ])
      .then(([etiquettes, commandes]) => {
        if (!Array.isArray(etiquettes) || !Array.isArray(commandes)) return;
        const notionIds = new Set(commandes.map((c: { id: string }) => c.id));
        setEtiquettes(etiquettes.filter((e) => notionIds.has(e.notionCommandeId)));
      })
      .finally(() => setLoading(false));
    fetch("/api/referentiel/clients")
      .then((r) => r.json())
      .then((clients: { nomClient: string; logoData: string | null }[]) => {
        if (!Array.isArray(clients)) return;
        const map: Record<string, string> = {};
        clients.forEach((c) => { if (c.logoData) map[c.nomClient] = c.logoData; });
        setLogoMap(map);
      })
      .catch(() => {});
  }, []);

  // Si logoMap arrive après la sélection (race au démarrage), on applique le logo rétroactivement
  useEffect(() => {
    if (!sel || logoData !== null) return;
    const logo = logoMap[sel.client] ?? null;
    if (!logo) return;
    setLogoData(logo);
    const img = new Image();
    img.onload = () => setLogoOrientation(img.naturalWidth > img.naturalHeight * 1.4 ? "horizontal" : "square");
    img.onerror = () => setLogoOrientation("square");
    img.src = logo;
  }, [logoMap, sel, logoData]);

  const filtrees = etiquettes.filter((e) =>
    [e.numeroCommande, e.client, e.clientFinal, e.reference, e.marque].some((v) =>
      v?.toLowerCase().includes(recherche.toLowerCase())
    )
  );

  const selectionner = (e: EtiquetteAtelier) => {
    setSel(e);
    setLignes([{ nombre: 1, totalColis: 1 }]);
    setActiveLigne(0);
    setDateProduction(new Date().toISOString().slice(0, 10));
    setShowPreview(false);
    const logo = logoMap[e.client] ?? null;
    setLogoData(logo);
    setLogoOrientation(null);
    if (logo) {
      const img = new Image();
      img.onload = () => setLogoOrientation(img.naturalWidth > img.naturalHeight * 1.4 ? "horizontal" : "square");
      img.onerror = () => setLogoOrientation("square");
      img.src = logo;
    }
  };

  const updateLigne = (i: number, field: keyof LigneColis, val: number) => {
    setLignes((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: Math.max(1, val || 1) } : l));
    setActiveLigne(i);
    if (showPreview) setShowPreview(true);
  };

  const addLigne = () => {
    const last = lignes[lignes.length - 1];
    setLignes((prev) => [...prev, { nombre: 1, totalColis: last?.totalColis ?? 1 }]);
    setActiveLigne(lignes.length);
  };

  const removeLigne = (i: number) => {
    if (lignes.length === 1) return;
    setLignes((prev) => prev.filter((_, idx) => idx !== i));
    setActiveLigne((prev) => Math.min(prev, lignes.length - 2));
  };

  const generer = () => setShowPreview(true);

  const imprimer = () => {
    if (!sel) return;

    // Save en arrière-plan (pas besoin d'attendre pour imprimer)
    fetch("/api/etiquettes-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        etiquetteAtelierId: sel.id,
        dateProduction: dateProduction ? new Date(dateProduction + "T00:00:00") : null,
        lignes: JSON.stringify(lignes),
        nbEtiquettes: lignes.reduce((s, l) => s + l.totalColis, 0),
      }),
    }).catch(() => {});

    const fontMain = '"Arial Black","Arial Bold",Arial,sans-serif';
    const fontBody = "Arial,sans-serif";

    const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

    const clientNotion = up(sel.client);
    const clientFinalVal = up(sel.clientFinal || "—");
    const marqueVal = up(sel.marque);
    const modeleVal = up(sel.reference);
    const dimOrigVal = up(sel.dimOriginale);
    const dimFaçVal = up(sel.dimFaconnage);
    const finitionVal = [sel.typeProduit, sel.finition].filter(Boolean).map(s => s!.toUpperCase()).join(" · ") || "—";
    const refClientVal = sel.refClient ? `Réf : ${up(sel.refClient)}` : "";
    const devisVal = sel.numeroDevis || "";
    const dateVal = dateProduction ? `Prod. : ${fmtDate(dateProduction)}` : "";

    const labelHtml = (ligne: LigneColis) => `
      <div class="wrap">
        <div class="row1">
          <div class="r1-left">
            ${logoData && logoOrientation === "horizontal" ? `<div class="r1-logo-h"><img src="${logoData}" /></div>` : ""}
            ${logoData && logoOrientation !== "horizontal" ? `<div class="r1-logo-s"><img src="${logoData}" /></div>` : ""}
            <div class="r1-client">
              <div class="client-notion" data-autofit="${logoData ? 3.2 : 4.5}" data-min="2">${clientNotion}</div>
            </div>
          </div>
          <div class="r1-right">
            <div class="qte-val">${ligne.nombre}</div>
            <div class="qte-sub">unités</div>
          </div>
        </div>
        <div class="row2">
          <div class="r2-left">
            <div class="sec-lbl">Marque / Référence</div>
            <div class="marque-val" data-autofit="3" data-min="2">${marqueVal}</div>
            <div class="modele-val" data-autofit="3" data-min="1.5">${modeleVal}</div>
          </div>
          <div class="r2-right">
            <div class="sec-lbl">Format Origine</div>
            <div class="dim-orig-val" data-autofit="4" data-min="2">${dimOrigVal}</div>
          </div>
        </div>
        <div class="row3">
          <div class="r3-left">
            <div class="sec-lbl">Client Final</div>
            <div class="client-final-val" data-autofit="3" data-min="2">${clientFinalVal}</div>
            ${refClientVal ? `<div class="ref-client">${refClientVal}</div>` : ""}
          </div>
          <div class="r3-right">
            <div class="sec-lbl">Façonnage · Finition</div>
            <div class="faconnage-val" data-autofit="3" data-min="2">${dimFaçVal}</div>
            <div class="finition-val" data-autofit="3" data-min="1.5">${finitionVal}</div>
            ${dateVal ? `<div class="date-val">${dateVal}</div>` : ""}
          </div>
        </div>
        <div class="footer">
          <span class="footer-val">${sel.numeroCommande || "—"}</span>
          ${devisVal ? `<span class="footer-val">-</span><span class="footer-val">${devisVal}</span>` : ""}
        </div>
      </div>`;

    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Étiquettes Client ${sel.numeroCommande}</title>
      <style>
        @page { size: 70mm 50mm; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: ${fontBody}; color: #000; background: white; }
        .wrap { width: 70mm; height: 50mm; border: 1.5px solid #000; display: flex; flex-direction: column; overflow: hidden; page-break-after: always; }
        /* Row 1 */
        .row1 { display: flex; border-bottom: 1.5px solid #000; flex: 1; }
        .r1-left { flex: 3; border-right: 1.5px solid #000; display: flex; align-items: center; overflow: hidden; flex-direction: ${logoData && logoOrientation === "horizontal" ? "column" : "row"}; ${logoData && logoOrientation === "horizontal" ? "justify-content: center;" : ""} }
        .r1-logo-h { flex-shrink: 0; width: 100%; display: flex; align-items: center; justify-content: center; padding: 1mm 1.5mm 0.5mm; overflow: hidden; }
        .r1-logo-h img { max-height: 8mm; max-width: 100%; object-fit: contain; }
        .r1-logo-s { width: 14mm; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 1mm; overflow: hidden; }
        .r1-logo-s img { max-width: 100%; max-height: 12mm; object-fit: contain; }
        .r1-client { flex: ${logoData && logoOrientation === "horizontal" ? "0 0 auto" : "1"}; padding: 0.5mm 1.5mm; display: flex; align-items: center; justify-content: center; overflow: hidden; width: 100%; }
        .client-notion { font-family: ${fontMain}; font-weight: 900; font-size: 4.5mm; line-height: 1.1; text-transform: uppercase; word-break: keep-all; overflow-wrap: normal; overflow: hidden; text-align: center; }
        .r1-right { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1mm; }
        .qte-val { font-family: ${fontMain}; font-weight: 900; font-size: 8mm; line-height: 1; }
        .qte-sub { font-size: 2.2mm; color: #555; margin-top: 0.4mm; }
        /* Row 2 */
        .row2 { display: flex; border-bottom: 1.5px solid #000; flex: 0 0 auto; }
        .r2-left { flex: 3; padding: 0.5mm 1.5mm; border-right: 1.5px solid #000; display: flex; flex-direction: column; justify-content: flex-start; overflow: hidden; }
        .r2-right { flex: 2; padding: 0.5mm 1.2mm; display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden; }
        /* Row 3 */
        .row3 { display: flex; border-bottom: 1.5px solid #000; flex: 0 0 auto; overflow: hidden; }
        .r3-left { flex: 3; padding: 0.5mm 1.5mm; border-right: 1.5px solid #000; display: flex; flex-direction: column; justify-content: flex-start; overflow: hidden; }
        .r3-right { flex: 2; padding: 0.5mm 1.2mm; display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden; }
        /* Footer */
        .footer { padding: 0.6mm 1.5mm; flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 1mm; overflow: hidden; }
        /* Shared */
        .sec-lbl { font-size: 1.7mm; font-weight: 700; text-transform: uppercase; color: #000; letter-spacing: 0.04em; margin-bottom: 0.4mm; line-height: 1; }
        .r2-right .sec-lbl, .r3-right .sec-lbl { text-align: center; }
        .marque-val { font-family: ${fontMain}; font-weight: 700; font-size: 3mm; line-height: 1.1; text-transform: uppercase; }
        .modele-val { font-size: 3mm; font-weight: 400; text-transform: uppercase; line-height: 1.2; }
        .dim-orig-val { font-family: ${fontMain}; font-weight: 700; font-size: 4mm; line-height: 1.1; text-transform: uppercase; text-align: center; }
        .client-final-val { font-family: ${fontMain}; font-weight: 700; font-size: 3mm; line-height: 1.1; text-transform: uppercase; overflow: hidden; }
        .ref-client { font-size: 2.1mm; color: #555; line-height: 1.2; }
        .faconnage-val { font-family: ${fontMain}; font-weight: 700; font-size: 3mm; line-height: 1.1; text-transform: uppercase; text-align: center; }
        .finition-val { font-size: 3mm; font-weight: 700; text-transform: uppercase; line-height: 1.2; text-align: center; }
        .date-val { font-size: 2.1mm; color: #444; line-height: 1.2; text-align: center; }
        .footer-val { font-family: ${fontBody}; font-weight: 400; font-size: 2.5mm; line-height: 1; }
      </style>
      <script>
        function autofit() {
          document.querySelectorAll('[data-autofit]').forEach(function(el) {
            var parent = el.parentElement;
            if (!parent) return;
            var max = parseFloat(el.getAttribute('data-autofit'));
            var min = parseFloat(el.getAttribute('data-min') || '1');
            var size = max;
            el.style.fontSize = size + 'mm';
            var iter = 0;
            while (iter++ < 600 && size > min) {
              if (el.offsetHeight <= parent.clientHeight && el.scrollWidth <= el.offsetWidth) break;
              size -= 0.05;
              el.style.fontSize = size + 'mm';
            }
          });
        }
        window.addEventListener('load', autofit);
        window.addEventListener('beforeprint', autofit);
      </script>
    </head><body>
      ${lignes.flatMap((ligne) => Array.from({ length: ligne.totalColis }, () => labelHtml(ligne))).join("")}
    </body></html>`;

    printViaIframe(html, "70mm", "50mm");
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #EEF1F6; }
        input, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <header style={{
        background: "#1E2640", padding: "0 28px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, background: "#059669", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>
              Étiquettes Client
            </div>
            <div style={{ color: "#94A3B8", fontSize: 11 }}>75 × 50 mm · Sumar.F</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#475569", fontSize: 12 }}>
            {etiquettes.length > 0 && `${etiquettes.length} étiquette${etiquettes.length > 1 ? "s" : ""} en cours`}
          </span>
          <NavLink href="/" label="Étiquettes Atelier" />
          <NavLink href="/referentiel" label="Référentiel" />
        </div>
      </header>

      <div style={{ display: "flex", height: "calc(100vh - 56px)" }}>

        {/* Sidebar : étiquettes atelier sauvegardées */}
        <aside style={{
          width: 290, background: "white", borderRight: "1px solid #E2E8F0",
          display: "flex", flexDirection: "column", flexShrink: 0,
        }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#94A3B8", textTransform: "uppercase", marginBottom: 10 }}>
              Étiquettes atelier (non livrées)
            </div>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}
                width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input value={recherche} onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher…"
                style={{
                  width: "100%", padding: "8px 10px 8px 30px", border: "1px solid #E2E8F0",
                  borderRadius: 8, fontSize: 13, outline: "none", color: "#1E2640", background: "#F8FAFC",
                }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && (
              <div style={{ padding: 20, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                Chargement…
              </div>
            )}
            {!loading && filtrees.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                Aucune étiquette trouvée.<br />
                <span style={{ fontSize: 11, color: "#CBD5E1" }}>
                  Créez des étiquettes atelier d&apos;abord.
                </span>
              </div>
            )}
            {filtrees.map((e) => {
              const isActive = sel?.id === e.id;
              const s = STATUT_STYLE[e.avancement ?? ""] ?? { dot: "#9CA3AF" };
              const clientName = e.clientFinal || e.client || "—";
              return (
                <button key={e.id} onClick={() => selectionner(e)}
                  style={{
                    width: "100%", textAlign: "left", padding: "12px 16px",
                    borderBottom: "1px solid #F8FAFC",
                    background: isActive ? "#F0FDF4" : "white",
                    borderLeft: isActive ? "3px solid #059669" : "3px solid transparent",
                    cursor: "pointer",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{
                      fontFamily: "ui-monospace, monospace", fontWeight: 700, fontSize: 12,
                      color: isActive ? "#059669" : "#1E2640",
                    }}>
                      {e.numeroCommande || "—"}
                    </span>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: "#1E2640", marginBottom: 2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {clientName}
                  </div>
                  {(e.marque || e.reference) && (
                    <div style={{
                      fontSize: 11, color: "#64748B",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {[e.marque, e.reference].filter(Boolean).join(" — ")}
                    </div>
                  )}
                  {e.dateLivraison && (
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                      Livraison: {fmt(e.dateLivraison)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Zone centrale : infos + formulaire colis */}
        <main style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          {!sel ? (
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12, color: "#94A3B8",
            }}>
              <svg width="48" height="48" fill="none" stroke="#CBD5E1" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <span style={{ fontSize: 14 }}>Sélectionnez une étiquette atelier</span>
            </div>
          ) : (
            <div style={{ maxWidth: 620, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Infos de l'étiquette atelier */}
              <section style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" fill="none" stroke="#94A3B8" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#94A3B8", textTransform: "uppercase" }}>
                    Étiquette atelier sélectionnée
                  </span>
                </div>
                <div style={{ padding: "18px 20px" }}>
                  {/* Ligne 1 : commande + devis + statut + livraison */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px 24px", marginBottom: 16 }}>
                    <InfoField label="N° Commande" value={sel.numeroCommande} mono />
                    <InfoField label="N° Devis" value={sel.numeroDevis || "—"} mono />
                    <InfoField label="Statut" badge={<StatutBadge statut={sel.avancement} />} />
                    <InfoField label="Livraison" value={fmt(sel.dateLivraison)} />
                  </div>
                  {/* Ligne 2 : client + client final + ref client */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px 24px", marginBottom: 16 }}>
                    <InfoField label="Client (Notion)" value={sel.client} />
                    <InfoField label="Client final" value={sel.clientFinal || "—"} />
                    <InfoField label="Réf. client" value={sel.refClient || "—"} />
                  </div>
                  {/* Ligne 3 : produit */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px 24px", marginBottom: 16 }}>
                    <InfoField label="Marque" value={sel.marque || "—"} />
                    <InfoField label="Modèle" value={sel.reference || "—"} />
                    <InfoField label="Type" value={sel.typeProduit || "—"} />
                  </div>
                  {/* Ligne 3b : finitions */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px 24px", marginBottom: 16 }}>
                    <InfoField label="Finitions" value={sel.finition || "—"} />
                  </div>
                  {/* Ligne 4 : dimensions + qté */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px 24px" }}>
                    <InfoField label="Dim. originale" value={sel.dimOriginale || "—"} />
                    <InfoField label="Dim. façonnage" value={sel.dimFaconnage || "—"} />
                    <InfoField label="Quantité" value={sel.quantite ? `${sel.quantite} U` : "—"} />
                  </div>
                </div>
              </section>

              {/* Formulaire colis */}
              <section style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" fill="none" stroke="#94A3B8" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#94A3B8", textTransform: "uppercase" }}>
                    Informations colis
                  </span>
                </div>
                <div style={{ padding: 20 }}>
                  {/* Date de production */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Date de production
                    </label>
                    <input
                      type="date"
                      value={dateProduction}
                      onChange={(e) => setDateProduction(e.target.value)}
                      style={numInput}
                      onFocus={(e) => (e.target.style.borderColor = "#059669")}
                      onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                    />
                  </div>

                  {/* En-têtes colonnes */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 28px", gap: "0 12px", marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Nombre de produit
                    </label>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Nombre total de colis
                    </label>
                    <div />
                  </div>

                  {/* Lignes dynamiques */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {lignes.map((ligne, i) => (
                      <div key={i} style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr 28px", gap: "0 12px", alignItems: "center",
                        background: activeLigne === i && showPreview ? "#F0FDF4" : "transparent",
                        borderRadius: 6, padding: activeLigne === i && showPreview ? "4px 6px" : "0",
                        transition: "background 0.15s",
                      }}>
                        <input
                          type="number" min={1} value={ligne.nombre}
                          onChange={(e) => updateLigne(i, "nombre", parseInt(e.target.value))}
                          onFocus={() => setActiveLigne(i)}
                          style={{ ...numInput, borderColor: activeLigne === i && showPreview ? "#059669" : "#E2E8F0" }}
                        />
                        <input
                          type="number" min={1} value={ligne.totalColis}
                          onChange={(e) => updateLigne(i, "totalColis", parseInt(e.target.value))}
                          onFocus={() => setActiveLigne(i)}
                          style={{ ...numInput, borderColor: activeLigne === i && showPreview ? "#059669" : "#E2E8F0" }}
                        />
                        <button
                          onClick={() => removeLigne(i)}
                          disabled={lignes.length === 1}
                          title="Supprimer cette ligne"
                          style={{
                            width: 28, height: 36, border: "none", borderRadius: 6, cursor: lignes.length === 1 ? "default" : "pointer",
                            background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                            color: lignes.length === 1 ? "#E2E8F0" : "#94A3B8",
                            transition: "color 0.15s",
                          }}
                          onMouseEnter={(e) => { if (lignes.length > 1) e.currentTarget.style.color = "#EF4444"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = lignes.length === 1 ? "#E2E8F0" : "#94A3B8"; }}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Bouton ajouter */}
                  <button onClick={addLigne} style={{
                    width: "100%", background: "transparent", color: "#059669", border: "1.5px dashed #6EE7B7",
                    padding: "8px 0", borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16,
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#F0FDF4"; e.currentTarget.style.borderColor = "#059669"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#6EE7B7"; }}
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Ajouter une ligne
                  </button>

                  <button onClick={generer} style={{
                    width: "100%", background: "#1E2640", color: "white", border: "none",
                    padding: "11px 0", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    Générer l&apos;aperçu
                    {lignes.reduce((s, l) => s + l.totalColis, 0) > 1 && <span style={{ fontSize: 11, opacity: 0.8 }}>({lignes.reduce((s, l) => s + l.totalColis, 0)} étiquettes)</span>}
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>

        {/* Aperçu */}
        <aside style={{
          width: 480, background: "#F8FAFC", borderLeft: "1px solid #E2E8F0",
          display: "flex", flexDirection: "column", flexShrink: 0,
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", background: "white" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E2640" }}>Aperçu étiquette client</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>75 × 50 mm</div>
          </div>
          <div style={{
            flex: 1, overflowY: "auto", display: "flex", alignItems: "flex-start",
            justifyContent: "center", padding: 24, paddingTop: 48,
          }}>
            {showPreview && sel ? (
              <EtiquetteClientPreview
                data={sel}
                colisNumero={activeLigne + 1}
                colisTotal={lignes[activeLigne]?.totalColis ?? 1}
                nombreParColis={lignes[activeLigne]?.nombre}
                dateProduction={dateProduction}
                logoData={logoData}
              logoOrientation={logoOrientation}
              />
            ) : (
              <div style={{ textAlign: "center", color: "#CBD5E1" }}>
                <div style={{
                  width: 114, height: 76, border: "2px dashed #E2E8F0", borderRadius: 6,
                  margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="28" height="28" fill="none" stroke="#E2E8F0" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>
                  Sélectionnez une étiquette<br />puis cliquez sur Générer
                </div>
              </div>
            )}
          </div>
          {showPreview && sel && (
            <div style={{ padding: 16, borderTop: "1px solid #E2E8F0", background: "white" }}>
              <button onClick={imprimer} style={{
                width: "100%", background: "#059669", color: "white", border: "none",
                padding: "12px 0", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Imprimer l&apos;étiquette client
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function InfoField({ label, value, mono, badge }: {
  label: string; value?: string; mono?: boolean; badge?: ReactNode;
}) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "#94A3B8", textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      {badge ?? (
        <div style={{
          fontSize: 14, fontWeight: 600, color: "#1E2640",
          fontFamily: mono ? "ui-monospace, monospace" : "inherit",
        }}>
          {value || "—"}
        </div>
      )}
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 6, textDecoration: "none",
      color: "#94A3B8", fontSize: 12, fontWeight: 600, padding: "6px 12px",
      borderRadius: 6, border: "1px solid #374151",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "#4B5563"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "#374151"; }}
    >
      {label}
    </Link>
  );
}
