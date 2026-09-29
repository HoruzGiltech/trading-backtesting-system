const $ = (id) => document.getElementById(id);

function showStatus(status) {
  if (!status) return;
  const when = status.at ? ` (${new Date(status.at).toLocaleString()})` : "";
  $("status").className = status.ok ? "ok" : "err";
  $("status").textContent = status.message + when;
}

async function load() {
  const cfg = await chrome.storage.local.get({ apiUrl: "", apiToken: "", accountSize: "", lastStatus: null });
  $("apiUrl").value = cfg.apiUrl;
  $("apiToken").value = cfg.apiToken;
  $("accountSize").value = cfg.accountSize;
  showStatus(cfg.lastStatus);
}

async function requestHostPermission(apiUrl) {
  const origin = new URL(apiUrl).origin + "/*";
  return chrome.permissions.request({ origins: [origin] });
}

$("save").addEventListener("click", async () => {
  const apiUrl = $("apiUrl").value.trim().replace(/\/$/, "");
  try { new URL(apiUrl); } catch { return showStatus({ ok: false, message: "La URL de la API no es válida." }); }
  const granted = await requestHostPermission(apiUrl);
  if (!granted) return showStatus({ ok: false, message: "Necesito permiso para conectarme a tu API." });
  await chrome.storage.local.set({
    apiUrl,
    apiToken: $("apiToken").value.trim(),
    accountSize: $("accountSize").value.trim(),
  });
  showStatus({ ok: true, message: "Configuración guardada.", at: new Date().toISOString() });
});

$("test").addEventListener("click", async () => {
  const { apiUrl, apiToken } = await chrome.storage.local.get({ apiUrl: "", apiToken: "" });
  if (!apiUrl || !apiToken) return showStatus({ ok: false, message: "Guarda primero la URL y el token." });
  try {
    const res = await fetch(`${apiUrl}/trades/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiToken },
      body: JSON.stringify({ trades: [] }),
    });
    showStatus(res.ok
      ? { ok: true, message: "Conexión correcta con GM Ledger.", at: new Date().toISOString() }
      : { ok: false, message: res.status === 401 ? "Token inválido o revocado." : `Error ${res.status}.` });
  } catch (err) {
    showStatus({ ok: false, message: `No se pudo conectar: ${err.message}` });
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.lastStatus) showStatus(changes.lastStatus.newValue);
});

load();
