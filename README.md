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
