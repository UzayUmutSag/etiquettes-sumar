export function printViaIframe(html: string, pageWidth: string, pageHeight: string) {
  document.getElementById("_sumar_print_style")?.remove();
  document.getElementById("_sumar_print_frame")?.remove();

  // CSS injecté dans la page principale : pendant l'impression, tout est caché
  // sauf l'iframe qui est affiché en pleine page
  const style = document.createElement("style");
  style.id = "_sumar_print_style";
  style.textContent = `
    @media print {
      @page { size: ${pageWidth} ${pageHeight}; margin: 0; }
      body > * { visibility: hidden; }
      #_sumar_print_frame {
        visibility: visible !important;
        position: fixed !important;
        left: 0 !important; top: 0 !important;
        width: 100% !important; height: 100% !important;
        border: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  // Iframe hors écran mais avec les vraies dimensions (pour que l'autofit fonctionne)
  const iframe = document.createElement("iframe");
  iframe.id = "_sumar_print_frame";
  iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${pageWidth};height:${pageHeight};border:none;`;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    // Petite pause pour laisser le script autofit se terminer dans l'iframe
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        style.remove();
        iframe.remove();
      }, 1000);
    }, 150);
  };

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
}
