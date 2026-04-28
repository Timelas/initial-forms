# Forms Platform MVP

MVP сервиса приема форм и админки под новый контракт.

Проект теперь может работать в двух режимах:

- обычный Node server для локального запуска
- Vercel function через `vercel.json` и [api/index.js](/Users/aleksandra/Desktop/tg-bot/api/index.js:1)

- единый public API `POST /api/forms/:formKey`
- отдельная админка `/admin`
- конфиг сайтов и форм без правки кода
- Telegram routing через server-side env vars
- CORS с явным preflight и JSON-ошибками
- anti-spam: rate limit, honeypot, minimum fill time, rejected log

## Что внутри

- `src/server.js` — HTTP server, routes, CORS, admin API, public API
- `src/admin-page.js` — встроенная админка без сборщика
- `src/storage.js` — JSON storage для MVP
- `src/telegram.js` — доставка в Telegram Bot API
- `data/registry.json` — sites/forms registry и краткий audit log
- `data/rejected.ndjson` — журнал отклоненных заявок

## Запуск

1. Скопировать `.env.example` в `.env` или экспортировать переменные окружения.
2. Запустить:

```bash
npm start
```

Для локальной разработки:

```bash
npm run dev
```

## Admin auth

Админ API и `/admin` защищены Basic Auth через:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

В коде также есть заготовка под cookie session для `/api/admin/login`, если позже потребуется отдельный login screen.

## Frontend contract

Пример:

```js
fetch("https://forms.company-domain.ru/api/forms/karina_audit_form", {
  method: "POST",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  body: JSON.stringify({
    name: "Ivan",
    contact: "+79990000000",
    consent: "on",
    submittedAt: Date.now() - 3000,
    website: ""
  })
});
```

## Ограничения MVP

- storage пока на JSON, не SQLite/Postgres
- на Vercel JSON storage живет только во временной FS и не подходит как постоянное production-хранилище
- multipart parser рассчитан на `multipart/form-data` без файлов
- Turnstile пока только конфигурационный флаг и проверка наличия токена, без верификации в Cloudflare
- audit history хранится укороченно в `registry.json`
- UI пока single-page без экрана логина и без publish/draft workflow

## Что логируется

- method
- path
- origin
- referer
- requestOrigin
- contentType
- formKey
- siteId
- parsedFields
- reason
- ip
- результат отправки в Telegram

## Рекомендуемый production deploy

ТЗ предполагает custom domain, например:

- `https://forms.company-domain.ru`

Предпочтительнее:

- Railway
- Render
- Fly.io
- VPS
- Cloud Run

Если использовать Vercel:

- только custom domain
- отключить protection/auth для production API domain
- не использовать `*.vercel.app` как production endpoint
- для production storage вынести registry из JSON в внешнюю БД, иначе изменения из админки не будут надежно сохраняться

## Следующий шаг

Для production-версии логично заменить `storage.js` на SQLite/Postgres слой и добавить:

- отдельный экран логина
- историю изменений
- draft/publish
- реальную Turnstile verification
- экспорт/import registry
