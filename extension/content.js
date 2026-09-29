// Observa la tabla "Posiciones cerradas" y envía las operaciones al service worker.
(function () {
  let timer = null;
  let lastSignature = "";

  function scan() {
    const { trades } = window.GMLParser.readClosedPositions(document);
    if (trades.length === 0) return;
    const signature = trades.map((t) => t.external_id).join(",");
    if (signature === lastSignature) return; // nada nuevo en pantalla
    lastSignature = signature;
    chrome.runtime.sendMessage({ type: "gml:closed-trades", trades }).catch(() => {});
  }

  function scheduleScan() {
    clearTimeout(timer);
    timer = setTimeout(scan, 1500);
  }

  new MutationObserver(scheduleScan).observe(document.body, { childList: true, subtree: true });
  setInterval(() => { lastSignature = ""; scan(); }, 60_000); // reintento periódico
  scheduleScan();
})();
