export function printViaIframe(html: string, width: string, height: string) {
  const prev = document.getElementById("_sumar_print_frame");
  if (prev) prev.remove();

  const blob = new Blob([html], { type: "text/html; charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.id = "_sumar_print_frame";
  iframe.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${width};height:${height};border:none;`;

  iframe.onload = () => {
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    URL.revokeObjectURL(url);
    setTimeout(() => iframe.remove(), 3000);
  };

  document.body.appendChild(iframe);
  iframe.src = url;
}
