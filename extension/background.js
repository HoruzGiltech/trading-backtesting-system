// Service worker: envía las operaciones nuevas al backend de GM Ledger.
const MAX_SENT_IDS = 3000;

async function getConfig() {
  return chrome.storage.local.get({ apiUrl: "", apiToken: "", accountSize: "", sentIds: [] });
}

async function setStatus(status) {
  await chrome.storage.local.set({ lastStatus: { ...status, at: new Date().toISOString() } });
  const text = status.ok ? (status.created ? String(status.created) : "") : "!";
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: status.ok ? "#4FAE8E" : "#C1554B" });
}

async function syncTrades(trades) {
  const { apiUrl, apiToken, accountSize, sentIds } = await getConfig();
  if (!apiUrl || !apiToken) {
    await setStatus({ ok: false, message: "Configura la URL de la API y tu token en las opciones." });
    return;
  }

  const sent = new Set(sentIds);
  const pending = trades.filter((t) => !sent.has(t.external_id));
  if (pending.length === 0) return;

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/trades/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiToken },
      body: JSON.stringify({
        account_size: accountSize ? Number(accountSize) : null,
        trades: pending,
      }),
    });
    if (res.status === 401) {
      await setStatus({ ok: false, message: "Token inválido o revocado. Genera uno nuevo en GM Ledger." });
      return;
    }
    if (!res.ok) {
      await setStatus({ ok: false, message: `Error del servidor (${res.status}).` });
      return;
    }
    const data = await res.json();
    const updated = [...sentIds, ...pending.map((t) => t.external_id)].slice(-MAX_SENT_IDS);
    await chrome.storage.local.set({ sentIds: updated });
    await setStatus({
      ok: true,
      created: data.created,
      message: `Sincronizado: ${data.created} nueva(s), ${data.skipped} ya registrada(s).`,
    });
  } catch (err) {
    await setStatus({ ok: false, message: `No se pudo conectar con la API: ${err.message}` });
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "gml:closed-trades" && Array.isArray(msg.trades)) {
    syncTrades(msg.trades);
  }
});
