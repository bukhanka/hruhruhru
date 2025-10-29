# Настройка переменных окружения

Создай файл `.env.local` в корне проекта со следующим содержимым:

```bash
# Google AI API Key (обязательно для генерации)
GOOGLE_API_KEY=твой_ключ_здесь

# YouTube Data API v3 Key (опционально)
YOUTUBE_API_KEY=твой_youtube_ключ_здесь
```

## Получение ключей

### 1. Google AI API Key (обязательно)

1. Открой https://ai.google.dev/gemini-api/docs/api-key
2. Нажми "Get API key"
3. Скопируй ключ и вставь в `.env.local`

### 2. YouTube Data API v3 Key (опционально)

1. Открой https://console.cloud.google.com/
2. Создай новый проект или выбери существующий
3. Перейди в "APIs & Services" → "Enable APIs and Services"
4. Найди "YouTube Data API v3" и включи
5. Перейди в "Credentials" → "Create Credentials" → "API Key"
6. Скопируй ключ и вставь в `.env.local`

**Примечание:** Без YouTube API ключа видео не будут добавлены в карточки профессий, но всё остальное (текст, изображения, данные HH.ru) будет работать нормально.

## Пример .env.local

```bash
GOOGLE_API_KEY=AIzaSyD...your_actual_key_here
YOUTUBE_API_KEY=AIzaSyB...your_youtube_key_here
```

После создания файла запусти генерацию:

```bash
npm run generate
```

