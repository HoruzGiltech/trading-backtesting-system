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
