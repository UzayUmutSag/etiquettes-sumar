export function printViaIframe(html: string, pageWidth: string, pageHeight: string) {
  document.getElementById("_sumar_print_frame")?.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "_sumar_print_frame";
  iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${pageWidth};height:${pageHeight};border:none;`;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => { iframe.remove(); }, 1000);
    }, 150);
  };

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
}
