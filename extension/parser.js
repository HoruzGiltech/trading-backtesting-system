// Lee la tabla "Posiciones cerradas" de la plataforma Match-Trader (FundingPips)
// y devuelve una lista de operaciones normalizadas. Sin efectos secundarios.
(function (global) {
  const HEADER_KEYS = {
    symbol: ["símbolo", "simbolo", "symbol"],
    volume: ["volumen", "volume"],
    open_price: ["precio de apertura", "open price"],
    close_price: ["precio de cierre", "close price"],
    closed_at: ["hora de cierre", "close time"],
    profit: ["beneficio", "profit"],
  };
  const DEFAULT_ORDER = ["symbol", "volume", "open_price", "close_price", "closed_at", "profit"];

  function toNumber(text) {
    const clean = String(text).replace(/[^\d.,+-]/g, "");
    // "1,234.50" -> 1234.50 ; "1.234,50" -> 1234.50
    const normalized = /,\d{1,2}$/.test(clean) && clean.includes(".")
      ? clean.replace(/\./g, "").replace(",", ".")
      : /,\d{1,2}$/.test(clean) ? clean.replace(",", ".") : clean.replace(/,/g, "");
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : null;
  }

  function parseSide(text) {
    const t = text.toLowerCase();
    if (t.includes("venta") || t.includes("sell")) return "SELL";
    if (t.includes("compra") || t.includes("buy")) return "BUY";
    return null;
  }

  // "29/09/2026 13:55:51" (hora mostrada por la plataforma, UTC+0) -> ISO UTC
  function parseDate(text) {
    const m = text.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\D+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!m) return null;
    const [, d, mo, y, h, mi, s = "00"] = m;
    const iso = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${mi}:${s}Z`;
    return isNaN(Date.parse(iso)) ? null : iso;
  }

  function columnOrder(root) {
    const headers = [...root.querySelectorAll("ui-list-header-item")].map((h) => h.innerText.trim().toLowerCase());
    const order = headers.map((h) => Object.keys(HEADER_KEYS).find((k) => HEADER_KEYS[k].includes(h)) || null);
    return order.filter(Boolean).length >= 6 ? order : DEFAULT_ORDER;
  }

  function readClosedPositions(doc) {
    const root = doc.querySelector("trade-closed-positions-desktop");
    if (!root) return { account: null, trades: [] };

    const accountEl = doc.querySelector('[data-testid="trading-account-name"]');
    const account = accountEl ? accountEl.innerText.trim() : null;
    const order = columnOrder(root);

    const trades = [];
    for (const row of root.querySelectorAll('[data-testid="closed-positions-desktop-list-row"]')) {
      const cells = [...row.querySelectorAll("ui-list-row-item")].map((c) => c.innerText.trim());
      const raw = {};
      order.forEach((key, i) => { if (key) raw[key] = cells[i] ?? ""; });

      const [symbolLine, ...rest] = (raw.symbol || "").split("\n");
      const side = parseSide(rest.join(" ") || raw.symbol || "");
      const trade = {
        source: "fundingpips",
        account_number: account,
        symbol: (symbolLine || "").trim().toUpperCase(),
        side,
        volume: toNumber(raw.volume),
        open_price: toNumber(raw.open_price),
        close_price: toNumber(raw.close_price),
        closed_at: parseDate((raw.closed_at || "").replace(/\n/g, " ")),
        profit: toNumber(raw.profit),
      };
      if (!trade.symbol || !trade.side || trade.volume == null || trade.open_price == null ||
          trade.close_price == null || !trade.closed_at || trade.profit == null) continue;

      trade.external_id = ["fp", account || "na", trade.symbol, trade.side, trade.volume,
        trade.open_price, trade.close_price, trade.closed_at].join("|");
      trades.push(trade);
    }
    return { account, trades };
  }

  global.GMLParser = { readClosedPositions, parseDate, toNumber, parseSide };
})(typeof window !== "undefined" ? window : globalThis);
