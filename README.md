para activar entorno en windows
venv\Scripts\activate

comando para recargar la app
uvicorn app.main:app --reload

user de prueba
{
"email": "userprueba2@example.com",
"password": "1234",
"full_name": "prueba"
}

para generar migraciones despues de crear el model y el schema
alembic revision --autogenerate -m "comentario"
alembic upgrade head

## Diario de operaciones + extensión de Chrome

- Backend: tablas `trades` y `api_tokens` (migración `a7d3e1f2b4c5`), endpoints `GET/PATCH/DELETE /trades`,
  `POST /trades/sync` (auth por `X-API-Key`) y `POST/GET/DELETE /api-tokens`.
- Frontend: página **Diario** (`/journal`) con resumen, tabla de operaciones y gestión de tokens.
- Extensión: carpeta `extension/` — ver `extension/README.md`.

## Exportar a CSV y días sin operar

- Migración `b8e4f2a3c5d6` (`alembic upgrade head`): agrega el valor `NO_TRADE` al enum `resulttype` y permite
  NULL en `symbol/side/volume/open_price/close_price` de `trades`.
- Endpoints `POST /trades/no-trade-days` (`{date, reason}`) y `POST /backtests/{id}/no-trade-days`
  (`{entry_date, reason}`). Un día sin operar por fecha; no cuenta en las métricas del resumen.
- Frontend: botones **+ Día sin operar** y **Descargar CSV** en Diario y en el detalle de backtest
  (el CSV se genera en el navegador, separado por comas y en UTF-8).

## Lado y precios en los días de backtest

- Migración `c9f5a3b4d6e7`: agrega `side`, `open_price` y `close_price` a `backtest_entries` (NULL en filas
  antiguas y en días sin operar). El símbolo no se guarda por fila: es el `asset` del backtest.
- Frontend: el formulario "Agregar día" pide Lado, Precio apertura y Precio cierre (obligatorios) y muestra el
  Símbolo bloqueado; la tabla y el CSV del backtest incluyen esas columnas.

## Página 404, icono de pestaña y errores de login

- `frontend/src/pages/NotFoundPage.tsx` en una ruta comodín (`*`): cualquier dirección inexistente muestra la
  página 404 de GM Ledger.
- `frontend/vercel.json`: rewrite de SPA para que abrir o recargar rutas como `/login` o `/journal` cargue la
  app y no el 404 de Vercel.
- Login: un 401 en `/auth/*` lo maneja el formulario ("Usuario o contraseña inválidos, intenta de nuevo.");
  en el resto de peticiones un 401 sigue cerrando la sesión y llevando a `/login`.
- Icono de la pestaña: `frontend/public/gm-ledger-icon.svg` (logo de GM Ledger).

## Entorno local

- Base de datos: `docker compose up -d` (puerto `POSTGRES_PORT` del `.env` de la raíz) y `alembic upgrade head`.
- Backend: `uvicorn app.main:app --reload --port <puerto>` desde `backend/`.
- Frontend: `npx vite --port <puerto>` desde `frontend/`; `VITE_API_URL` en `frontend/.env` debe apuntar al
  backend y el origen del frontend debe estar en `CORS_ORIGINS` del `.env` de la raíz.
- Si otro proyecto ocupa 5432/8000/5173, basta con cambiar esos puertos en los dos `.env` (no se versionan).

## Despliegue

- Flujo: rama de feature -> Pull Request -> merge a `main`.
- Railway (backend): ejecuta `alembic upgrade head` al arrancar, así que las migraciones se aplican solas.
  Para forzar un deploy usar `Ctrl+K` -> **Deploy latest commit**; **Redeploy** repite el commit anterior.
- Vercel (frontend): despliega con cada push a `main`. Si un deploy falla, **Redeploy** reconstruye ese mismo commit.
