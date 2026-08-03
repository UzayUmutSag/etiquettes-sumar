"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";

export type EtiquetteClientData = {
  numeroCommande: string;
  numeroDevis?: string | null;
  client: string;
  clientFinal: string | null;
  refClient: string | null;
  marque: string | null;
  reference: string | null;
  dimOriginale: string | null;
  dimFaconnage: string | null;
  typeProduit: string | null;
  finition: string | null;
  quantite: number | null;
};

type Props = {
  data: EtiquetteClientData;
  colisNumero: number;
  colisTotal: number;
  nombreParColis?: number;
  dateProduction?: string;
  logoData?: string | null;
  logoOrientation?: "horizontal" | "square" | null;
};

const up = (s: string | null | undefined) => (s || "—").toUpperCase();

export const fmtDateProd = (d: string) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

/** Réduit la police par pas de 0.5px jusqu'à ce que le texte tienne dans son parent. */
function FitText({ text, maxPx, minPx, fontFamily, style }: {
  text: string;
  maxPx: number;
  minPx: number;
  fontFamily?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    let size = maxPx;
    el.style.fontSize = `${size}px`;
    let iter = 0;
    while (
      iter++ < 300 && size > minPx &&
      (el.offsetHeight > parent.clientHeight || el.scrollWidth > el.offsetWidth)
    ) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
  }, [text, maxPx, minPx]);

  return (
    <div ref={ref} style={{ fontSize: maxPx, fontFamily, overflow: "hidden", width: "100%", ...style }}>
      {text}
    </div>
  );
}

export default function EtiquetteClientPreview({ data, nombreParColis, dateProduction, logoData, logoOrientation }: Props) {
  const W = 283; // 75mm @ 96dpi
  const H = 189; // 50mm @ 96dpi
  const B = "1.5px solid #000";
  const fontMain = '"Arial Black","Arial Bold",Arial,sans-serif';
  const fontBody = "Arial,sans-serif";
  const pxNum = (mm: number) => Math.round((mm / 75) * W);
  const px = (mm: number) => `${pxNum(mm)}px`;
  const qte = nombreParColis ?? data.quantite;

  const SecLabel = ({ children }: { children: string }) => (
    <div style={{
      fontSize: px(1.7), fontWeight: 700, textTransform: "uppercase",
      color: "#000", letterSpacing: "0.04em", marginBottom: px(0.4),
      lineHeight: 1, flexShrink: 0,
    }}>
      {children}
    </div>
  );

  return (
    <div style={{ transform: "scale(1.5)", transformOrigin: "top center" }}>
      <div style={{
        width: W, height: H, border: "1.5px solid #000", display: "flex", flexDirection: "column",
        background: "white", fontFamily: fontBody, overflow: "hidden",
        boxSizing: "border-box", color: "#000",
      }}>

        {/* ── LIGNE 1 : Client notion | Qté / carton ── */}
        <div style={{ display: "flex", borderBottom: B, flex: 1 }}>
          <div style={{
            flex: 3, borderRight: B, overflow: "hidden",
            display: "flex",
            flexDirection: logoData && logoOrientation === "horizontal" ? "column" : "row",
            alignItems: "center",
          }}>
            {logoData && logoOrientation === "horizontal" && (
              <div style={{
                flexShrink: 0, width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: `${px(1)} ${px(1.5)} 0`, overflow: "hidden",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoData} style={{ maxHeight: px(9), maxWidth: "100%", objectFit: "contain" }} alt="" />
              </div>
            )}
            {logoData && logoOrientation !== "horizontal" && (
              <div style={{
                width: px(14), flexShrink: 0, alignSelf: "stretch",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: px(1), overflow: "hidden",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoData} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} alt="" />
              </div>
            )}
            <div style={{ flex: 1, padding: `${px(0.5)} ${px(1.5)}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", width: "100%" }}>
              <FitText
                text={up(data.client)}
                maxPx={logoData ? pxNum(3.2) : pxNum(4.5)}
                minPx={pxNum(2)}
                fontFamily={fontMain}
                style={{ fontWeight: 700, lineHeight: 1.1, textTransform: "uppercase", textAlign: "center" }}
              />
            </div>
          </div>
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: `${px(1)} ${px(1)}`, overflow: "hidden",
          }}>
            <div style={{ fontFamily: fontMain, fontWeight: 900, fontSize: px(8), lineHeight: 1 }}>
              {qte != null ? `${qte}` : "—"}
            </div>
            <div style={{ fontSize: px(2.2), color: "#555", marginTop: px(0.4) }}>unités</div>
          </div>
        </div>

        {/* ── LIGNE 2 : Marque / Référence | Format Origine ── */}
        <div style={{ display: "flex", borderBottom: B, flex: "0 0 auto" }}>
          <div style={{
            flex: 3, padding: `${px(0.5)} ${px(1.5)}`, borderRight: B,
            display: "flex", flexDirection: "column", justifyContent: "flex-start",
            overflow: "hidden",
          }}>
            <SecLabel>Marque / Référence</SecLabel>
            <FitText
              text={up(data.marque)}
              maxPx={pxNum(3)}
              minPx={pxNum(2)}
              fontFamily={fontMain}
              style={{ fontWeight: 700, lineHeight: 1.1, textTransform: "uppercase" }}
            />
            <FitText
              text={up(data.reference)}
              maxPx={pxNum(3)}
              minPx={pxNum(1.5)}
              style={{ fontWeight: 400, textTransform: "uppercase", marginTop: px(0.2), lineHeight: 1.2 }}
            />
          </div>
          <div style={{
            flex: 2, padding: `${px(0.5)} ${px(1.2)}`,
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            overflow: "hidden",
          }}>
            <SecLabel>Format Origine</SecLabel>
            <FitText
              text={up(data.dimOriginale)}
              maxPx={pxNum(4)}
              minPx={pxNum(2)}
              fontFamily={fontMain}
              style={{ fontWeight: 700, lineHeight: 1.1, textTransform: "uppercase", textAlign: "center" }}
            />
          </div>
        </div>

        {/* ── LIGNE 3 : Client final | Façonnage · Finition ── */}
        <div style={{ display: "flex", borderBottom: B, flex: "0 0 auto", overflow: "hidden" }}>
          <div style={{
            flex: 3, padding: `${px(0.5)} ${px(1.5)}`, borderRight: B,
            display: "flex", flexDirection: "column", justifyContent: "flex-start",
            overflow: "hidden",
          }}>
            <SecLabel>Client Final</SecLabel>
            <FitText
              text={up(data.clientFinal || "—")}
              maxPx={pxNum(3)}
              minPx={pxNum(2)}
              fontFamily={fontMain}
              style={{ fontWeight: 700, lineHeight: 1.1, textTransform: "uppercase" }}
            />
            {data.refClient && (
              <div style={{ fontSize: px(2.1), color: "#555", marginTop: px(0.3), lineHeight: 1.2, overflow: "hidden" }}>
                Réf : {up(data.refClient)}
              </div>
            )}
          </div>
          <div style={{
            flex: 2, padding: `${px(0.5)} ${px(1.2)}`,
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            overflow: "hidden",
          }}>
            <SecLabel>Façonnage · Finition</SecLabel>
            <FitText
              text={up(data.dimFaconnage)}
              maxPx={pxNum(3)}
              minPx={pxNum(2)}
              fontFamily={fontMain}
              style={{ fontWeight: 700, lineHeight: 1.1, textTransform: "uppercase", textAlign: "center" }}
            />
            {(data.typeProduit || data.finition) && (
              <FitText
                text={[data.typeProduit, data.finition].filter(Boolean).map(s => s!.toUpperCase()).join(" · ")}
                maxPx={pxNum(3)}
                minPx={pxNum(1.5)}
                style={{ fontWeight: 700, textTransform: "uppercase", marginTop: px(0.2), lineHeight: 1.2, textAlign: "center" }}
              />
            )}
            {dateProduction && (
              <div style={{ fontSize: px(2.1), color: "#444", marginTop: px(0.3), lineHeight: 1.2, overflow: "hidden" }}>
                Prod. : {fmtDateProd(dateProduction)}
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER : N° Commande + N° Devis ── */}
        <div style={{
          padding: `${px(0.6)} ${px(1.5)}`, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", gap: px(1), overflow: "hidden",
        }}>
          <span style={{ fontFamily: fontBody, fontWeight: 400, fontSize: px(2.5), lineHeight: 1 }}>
            {data.numeroCommande || "—"}
          </span>
          {data.numeroDevis && (
            <>
              <span style={{ fontSize: px(2.5), fontWeight: 400 }}>-</span>
              <span style={{ fontSize: px(2.5), fontWeight: 400 }}>
                {data.numeroDevis}
              </span>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
