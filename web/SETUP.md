# Генератор Вайба - Инструкция по запуску

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка API ключей

#### Google AI API (для генерации текста и изображений)
👉 https://ai.google.dev/gemini-api/docs/api-key

#### YouTube Data API v3 (для поиска видео)
1. Открой https://console.cloud.google.com/
2. Создай проект (или используй существующий)
3. APIs & Services → Enable APIs → YouTube Data API v3 → Enable
4. Credentials → Create Credentials → API Key
5. Скопируй ключ

Создай файл `.env.local` в корне проекта:

```bash
GOOGLE_API_KEY=твой_google_ai_ключ
YOUTUBE_API_KEY=твой_youtube_ключ  # опционально, но рекомендуется
```

**Примечание:** Без YouTube API видео не будут добавлены, но всё остальное будет работать.

### 3. Генерация контента

Запусти скрипт генерации профессий:

```bash
npm run generate
```

Это создаст:
- ✅ JSON файлы в `data/professions/`
- ✅ Изображения в `public/generated/`
- ✅ 3 профессии (2 IT + 1 не-IT)

Генерация займёт ~5-10 минут для всех профессий.

### 4. Запуск приложения

```bash
npm run dev
```

Открой http://localhost:3000

---

## Что генерируется

Для каждой профессии AI создаёт:

### Текстовый контент (Gemini 2.0 Flash):
- 📅 Расписание рабочего дня (6 событий)
- 🛠 Стек технологий (8-10 инструментов)
- 💰 Польза для бизнеса (4 метрики)
- 📈 Карьерный путь (4 этапа)
- 🎯 Необходимые скиллы (5 штук)
- 💬 Интерактивный диалог

### Визуал (Imagen 3):
- 🖼 4 изображения атмосферы профессии

### Данные (HH.ru API):
- 📊 Количество вакансий
- 🎯 Уровень конкуренции

---

## Структура проекта

```
vibe-generator/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Главная страница
│   ├── profession/[id]/         # Страница профессии
│   ├── api/
│   │   ├── professions/         # API: список профессий
│   │   └── profession/[id]/     # API: данные профессии
│   ├── globals.css              # Стили
│   └── layout.tsx               # Layout
├── scripts/
│   └── generate-professions.ts  # Скрипт генерации
├── data/
│   └── professions/             # JSON с данными
│       ├── devops-engineer.json
│       └── ...
├── public/
│   └── generated/               # Сгенерированные изображения
│       ├── devops-engineer/
│       └── ...
└── .env.local                   # API ключи (не в git)
```

---

## Добавление новой профессии

Отредактируй `scripts/generate-professions.ts`:

```typescript
const professions = [
  { name: "DevOps Engineer", level: "Middle", company: "стартап" },
  { name: "Frontend Developer", level: "Junior", company: "стартап" },
  { name: "Бариста", level: "Junior", company: "кофейня" },
  // Добавь свою:
  { name: "Data Scientist", level: "Senior", company: "корпорация" },
];
```

Запусти генерацию заново:

```bash
npm run generate
```

---

## Требования хакатона

✅ **3 профессии** - 1 IT, 1 не-IT, 1 на выбор  
✅ **Карточка профессии** с расписанием, стеком, пользой  
✅ **Визуал** - мудборд из 4 изображений  
✅ **Интеграция HH.ru API** - статистика вакансий  
✅ **Интерактив** - диалоги с выбором ответа  
✅ **Современный UI** - градиенты, анимации, темная тема  

---

## Полезные команды

```bash
# Запуск dev-сервера
npm run dev

# Генерация профессий
npm run generate

# Билд для продакшена
npm run build

# Запуск продакшен-версии
npm start
```

---

## Troubleshooting

### Ошибка: "GOOGLE_API_KEY not found"
Создай `.env.local` и добавь свой API ключ.

### Ошибка генерации изображений
Imagen может быть недоступен в некоторых регионах. Используй VPN или приложение вернёт плейсхолдеры.

### Профессии не отображаются
Проверь что файлы созданы в `data/professions/`. Если нет - запусти `npm run generate`.

---

## API Limits

**Google Gemini API (бесплатный тир):**
- Gemini 2.0 Flash: 15 запросов/минуту
- Imagen 3: 10 запросов/минуту

**HH.ru API:**
- 10 запросов/секунду с одного IP
- Авторизация не требуется

---

## Для презентации

1. Загрузи сгенерированные данные на GitHub
2. Задеплой на Vercel (автоматически)
3. Добавь `.env` в Vercel с API ключом (опционально)
4. Готово! 🎉

---

**Удачи на хакатоне! 🚀**

