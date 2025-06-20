# Premium Auto

Современный одностраничный сайт автосалона с интегрированной админ-панелью.

## Быстрый старт

1. Откройте `index.html` в браузере.
2. Для входа в админ-панель введите URL "http://localhost:3000/admin.html".
3. Введите логин и пароль:
   - **Логин:** `admin`
   - **Пароль:** `admin123`

## Структура проекта

- `index.html` — основной одностраничный сайт
- `styles.css` — стили сайта
- `script.js` — вся логика сайта и админки
- `images/` — изображения автомобилей и брендов
- `database/schema.sql` — основная структура и тестовые данные для MS SQL Server
- `database/connection.sql` — альтернативный вариант структуры и запросов

## База данных (MS SQL Server)

- Имя БД: `premium_auto`
- Используйте скрипт `database/connection.sql`
- Таблицы: пользователи, клиенты, модели, автомобили, заказы
- Демо-логин для админки: `admin` / `admin123`

## Особенности

- Современный дизайн, адаптивная верстка
- Бургер-меню, плавные анимации
- Админ-панель с разделами: Дашборд, Модели, Заказы, Клиенты, Настройки
- Все в одном сайте, без лишних файлов

---
