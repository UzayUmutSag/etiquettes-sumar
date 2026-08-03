export function printViaIframe(html: string, pageWidth: string, pageHeight: string) {
  document.getElementById("_sumar_print_style")?.remove();
  document.getElementById("_sumar_print_frame")?.remove();

  const style = document.createElement("style");
  style.id = "_sumar_print_style";
  style.textContent = `
    @media print {
      @page { size: ${pageWidth} ${pageHeight}; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; }
      body > * { display: none !important; }
      #_sumar_print_frame {
        display: block !important;
        position: fixed !important;
        left: 0 !important; top: 0 !important;
        width: ${pageWidth} !important;
        height: ${pageHeight} !important;
        border: none !important;
        overflow: hidden !important;
      }
    }
  `;
  document.head.appendChild(style);

  const iframe = document.createElement("iframe");
  iframe.id = "_sumar_print_frame";
  iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${pageWidth};height:${pageHeight};border:none;`;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      window.print();
      setTimeout(() => { style.remove(); iframe.remove(); }, 1000);
    }, 150);
  };

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
}
