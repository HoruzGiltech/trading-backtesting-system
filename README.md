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
