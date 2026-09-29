# GM Ledger Sync (extensión de Chrome)

Registra automáticamente las operaciones cerradas de FundingPips (plataforma Match-Trader)
en el **Diario de operaciones** de GM Ledger.

## Cómo funciona

1. La extensión solo se ejecuta en `https://mtr-platform.fundingpips.com/*`.
2. Lee la tabla **Posiciones cerradas** (símbolo, lado, lotes, apertura, cierre, hora, beneficio)
   y la cuenta activa (ej. `2005196`).
3. Envía las operaciones nuevas a `POST /trades/sync` de tu backend con el header `X-API-Key`.
4. El backend ignora duplicados (`trader_id + external_id` es único), así que reenviar es seguro.

No usa tu contraseña de FundingPips ni de GM Ledger: solo un token personal revocable.

## Instalación (modo desarrollador)

1. En GM Ledger → **Diario** → **Generar token**. Cópialo (solo se muestra una vez).
2. Chrome → `chrome://extensions` → activa **Modo de desarrollador**.
3. **Cargar descomprimida** → selecciona esta carpeta `extension/`.
4. Clic en el icono de la extensión → pega la **URL de tu backend en Railway**, el **token**
   y el **tamaño de cuenta** (ej. `10000`) → **Guardar** (acepta el permiso) → **Probar conexión**.
5. En FundingPips deja abierta la pestaña **Posiciones cerradas**. Cada cierre se sincroniza
   en segundos; el icono muestra cuántas operaciones nuevas se registraron.

## Notas

- La plataforma muestra las horas en UTC+0; se guardan como UTC y GM Ledger las muestra en tu hora local.
- El % se calcula como `beneficio / tamaño de cuenta × 100`.
- Si FundingPips cambia el diseño de la tabla, el lector (`parser.js`) puede necesitar ajustes.
