Структура ветки Backend:
```
│ ???
├── backend/                    # ========== ЧАСТЬ ЕГОРА ==========
│   ├── README.md               # Инструкция по бэкенду
│   ├── .gitignore              # venv, __pycache__, .env, uploads
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # Точка входа (запуск сервера)
│   │   │
│   │   ├── models/              # Модели БД
│   │   │   ├── user.py
│   │   │   ├── track.py
│   │   │   ├── album.py
│   │   │   └── playlist.py
│   │   │
│   │   ├── routes/              # API эндпоинты
│   │   │   ├── auth.py
│   │   │   ├── tracks.py
│   │   │   ├── playlists.py
│   │   │   ├── artist.py
│   │   │   └── admin.py
│   │   │
│   │   ├── services/            # Бизнес-логика
│   │   │   ├── recommendation.py
│   │   │   ├── payment.py       # (потом)
│   │   │   └── storage.py       # Работа с файлами
│   │   │
│   │   └── utils/                # Вспомогательное
│   │       ├── auth.py           # JWT токены
│   │       └── validators.py
|
```
