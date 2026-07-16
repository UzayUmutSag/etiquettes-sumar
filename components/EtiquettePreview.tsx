type EtiquetteData = {
  numeroCommande: string;
  numeroDevis: string;
  client: string;
  dateReception: string | null;
  dateLivraison: string | null;
  avancement: string;
  marque: string;
  reference: string;
  refClient: string;
  clientFinal: string;
  nbCarreaux: string;
  dimOriginale: string;
  dimFaconnage: string;
  finition: string;
  quantite: string;
  observation: string;
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const up = (s: string) => (s || "—").toUpperCase();

export default function EtiquettePreview({ data }: { data: EtiquetteData }) {
  // 75mm × 125mm à 96dpi ≈ 283 × 472px — on scale 1.5x pour l'aperçu écran
  const W = 283;
  const H = 472;
  const B = "1.5px solid #000";
  const B2 = "2px solid #000";
  const fontMain = '"Arial Black", "Arial Bold", Arial, sans-serif';
  const fontBody = "Arial, sans-serif";

  return (
    <>
      <style>{`
        @media print {
          @page { size: 75mm 125mm; margin: 0; }
          .etiquette-screen { display: none !important; }
          .etiquette-print {
            display: block !important;
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 75mm !important; height: 125mm !important;
          }
        }
        @media screen {
          .etiquette-print { display: none !important; }
        }
      `}</style>

      {/* Aperçu écran (scale 1.5x) */}
      <div className="etiquette-screen" style={{ transform: "scale(1.5)", transformOrigin: "top center", color: "#000" }}>
        <Etiquette data={data} W={W} H={H} B={B} B2={B2} fontMain={fontMain} fontBody={fontBody} />
      </div>

      {/* Version impression exacte */}
      <div className="etiquette-print">
        <Etiquette data={data} W={W} H={H} B={B} B2={B2} fontMain={fontMain} fontBody={fontBody} print />
      </div>
    </>
  );
}

function Etiquette({ data, W, H, B, B2, fontMain, fontBody, print }: {
  data: EtiquetteData; W: number; H: number; B: string; B2: string;
  fontMain: string; fontBody: string; print?: boolean;
}) {
  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  const containerStyle: React.CSSProperties = print
    ? { width: "75mm", height: "125mm", border: "1.5px solid #000", display: "flex", flexDirection: "column",
        background: "white", fontFamily: fontBody, overflow: "hidden", boxSizing: "border-box", color: "#000" }
    : { width: W, height: H, border: B2, display: "flex", flexDirection: "column",
        background: "white", fontFamily: fontBody, overflow: "hidden", boxSizing: "border-box", color: "#000" };

  const px = print
    ? (mm: number) => `${mm}mm`
    : (mm: number) => `${Math.round((mm / 75) * W)}px`;

  return (
    <div style={containerStyle}>

      {/* EN-TÊTE */}
      <div style={{ padding: `${px(1.5)} ${px(2.5)} ${px(1)}`, borderBottom: B2 }}>
        <div style={{ fontFamily: fontMain, fontWeight: 900, fontSize: px(6),
          lineHeight: 1.05, textTransform: "uppercase" }}>
          {data.client || "—"}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: px(2), marginTop: px(0.5) }}>
          <span style={{ fontFamily: fontMain, fontWeight: 700, fontSize: px(4) }}>{data.numeroCommande || "—"}</span>
          <span style={{ fontSize: px(3) }}>{data.numeroDevis || ""}</span>
        </div>
        <div style={{ fontSize: px(2.6), marginTop: px(0.3) }}>
          Client final : {(data.clientFinal || "—").toUpperCase()} · Réf. : {(data.refClient || "—").toUpperCase()}
        </div>
      </div>

      {/* DATE LIVRAISON */}
      <div style={{ borderBottom: B2, padding: `${px(1)} ${px(2)}`, textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: px(2.5), letterSpacing: "0.12em",
          textTransform: "uppercase", marginBottom: px(0.3) }}>Livraison planifiée le</div>
        <div style={{ fontFamily: fontMain, fontWeight: 900, fontSize: px(9.5),
          letterSpacing: "-0.02em", lineHeight: 1 }}>
          {data.dateLivraison
            ? new Date(data.dateLivraison).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
            : "—"}
        </div>
      </div>

      {/* TABLEAU */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", borderBottom: B2 }}>

        <Row label="MARQUE" value={(data.marque || "—").toUpperCase()} px={px} B={B} fontMain={fontMain} />
        <Row label="RÉFÉRENCE" value={(data.reference || "—").toUpperCase()} px={px} B={B} fontMain={fontMain} />
        <Row label={<>NB CARREAUX<br />FOURNIS</>} value={data.nbCarreaux ? `${data.nbCarreaux} carreaux` : "—"} px={px} B={B} fontMain={fontMain} />
        <Row label={<>QTÉ À<br />PRODUIRE</>} value={data.quantite ? `${data.quantite} U` : "—"} px={px} B={B} fontMain={fontMain} />

        {/* Dimensions */}
        <div style={{ display: "flex", borderBottom: B, height: px(15) }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", borderRight: B, padding: `${px(2)} ${px(1.5)}` }}>
            <div style={{ fontSize: px(2.3), fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", marginBottom: px(0.3) }}>Origine</div>
            <div style={{ fontFamily: fontMain, fontWeight: 900, fontSize: px(5.5) }}>
              {(data.dimOriginale || "—").toUpperCase()}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", padding: `0 ${px(1)}`,
            fontFamily: fontMain, fontWeight: 900, fontSize: px(6) }}>→</div>
          <div style={{ flex: 1.3, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", borderLeft: B, padding: `${px(2)} ${px(1.5)}` }}>
            <div style={{ fontSize: px(2.3), fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", marginBottom: px(0.3) }}>Après façonnage</div>
            <div style={{ fontFamily: fontMain, fontWeight: 900, fontSize: px(5.5) }}>
              {(data.dimFaconnage || "—").toUpperCase()}
            </div>
          </div>
        </div>

        <Row label="FINITION" value={(data.finition || "—").toUpperCase()} px={px} B={B} fontMain={fontMain} />

        {/* Observations */}
        {data.observation && (
          <div style={{ display: "flex", flex: 1 }}>
            <div style={{ width: px(20), borderRight: B, padding: `${px(1)} ${px(1.5)}`,
              display: "flex", alignItems: "flex-start" }}>
              <span style={{ fontSize: px(2.3), fontWeight: 700, letterSpacing: "0.04em",
                textTransform: "uppercase" }}>OBS</span>
            </div>
            <div style={{ flex: 1, padding: `${px(1)} ${px(1.5)}`, fontSize: px(3), lineHeight: 1.4 }}>
              {data.observation}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function Row({ label, value, px, B, fontMain }: {
  label: React.ReactNode; value: string;
  px: (mm: number) => string; B: string; fontMain: string;
}) {
  return (
    <div style={{ display: "flex", borderBottom: B, height: px(9) }}>
      <div style={{ width: px(20), borderRight: B, padding: `${px(1)} ${px(1.5)}`,
        display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: px(2.3), fontWeight: 700, letterSpacing: "0.04em",
          textTransform: "uppercase", lineHeight: 1.25 }}>{label}</span>
      </div>
      <div style={{ flex: 1, padding: `${px(0.8)} ${px(1.5)}`, display: "flex", alignItems: "center" }}>
        <span style={{ fontFamily: fontMain, fontWeight: 700, fontSize: px(4.2) }}>{value}</span>
      </div>
    </div>
  );
}
