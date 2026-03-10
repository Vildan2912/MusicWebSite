Структура ветки Frontend:
|
├── frontend/                  
│   ├── README.md              # Информация о структуре ветки Frontend
│   ├── .gitignore             # То, что не будет включаться в репо
│   ├── index.html             # Главная страница сайта
│   │
│   ├── pages/                  # Отдельные HTML страницы
|   |   ├── music.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── player.html
│   │   ├── artist-cabinet.html
│   │   ├── listener-cabinet.html
│   │   └── admin-panel.html
│   │
│   ├── css/                    # Стили
│   │   ├── main.css
│   │   ├── player.css
│   │   └── cabinet.css
│   │
│   ├── js/                      # JavaScript (логика сайта)
│   │   ├── main.js
│   │   ├── api/                  # Запросы к бэкенду
│   │   │   ├── auth.js
│   │   │   ├── tracks.js
│   │   │   └── user.js
│   │   ├── components/           # Повторяющиеся компоненты
│   │   │   ├── player.js
│   │   │   └── playlist.js
│   │   └── utils/                # Вспомогательные функции
│   │       └── helpers.js
│   │
│   └── assets/                   # Картинки, иконки
│       ├── images/
│       └── icons/
│
