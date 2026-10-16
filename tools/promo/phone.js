// Pantalla de iPhone para las capturas: barra de estado (hora, cobertura, wifi, batería), Dynamic Island e indicador de inicio
'use strict';
const Phone = (() => {
  const ICONS = '<svg viewBox="0 0 18 12" style="width:18em;height:12em"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>' +
    '<svg viewBox="0 0 16 12" style="width:16em;height:12em"><path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3C13.4 1.4 10.8.4 8 .4S2.6 1.4.5 3.4l1.2 1.3C3.4 3.1 5.6 2.2 8 2.2zm0 3.6c1.4 0 2.7.5 3.7 1.4l1.2-1.3C11.6 4.7 9.9 4 8 4s-3.6.7-4.9 1.9l1.2 1.3c1-.9 2.3-1.4 3.7-1.4zM8 9.4c-.6 0-1.1.2-1.5.6L8 11.6 9.5 10c-.4-.4-.9-.6-1.5-.6z"/></svg>' +
    '<svg viewBox="0 0 27 13" style="width:27em;height:13em"><rect x=".5" y=".5" width="23" height="12" rx="3.6" fill="none" stroke="#fff" stroke-opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2.2"/><path d="M25 4.4v4.2c.9-.3 1.5-1.1 1.5-2.1s-.6-1.8-1.5-2.1z" fill-opacity=".45"/></svg>';
  const inner = (img, sb) => `<div class="scr"${sb ? ` style="--sb:${sb}"` : ''}><div class="sbar"><span class="tm">9:41</span><span class="ic">${ICONS}</span></div><i class="island"></i>${img}<i class="home"></i></div>`;
  // 1em = 1 punto de iOS
  // el ancho sale del estilo del móvil (no del tamaño en pantalla: puede estar oculto o girado)
  function fit(root) {
    for (const s of (root || document).querySelectorAll('.phone .scr')) {
      const ph = s.closest('.phone'), pad = parseFloat(getComputedStyle(ph).paddingLeft) || 0, w = parseFloat(ph.style.width) - 2 * pad;
      s.style.fontSize = (w / 393) + 'px';
    }
  }
  return { inner, fit };
})();
