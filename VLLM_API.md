# vLLM API Documentation

## Обзор

Этот проект использует vLLM для запуска модели `RedHatAI/Qwen3-8B-NVFP4` в Docker контейнере с поддержкой GPU.

## Запуск

```bash
# Запустить контейнер
sudo docker-compose up -d

# Проверить статус
sudo docker-compose ps

# Просмотр логов
sudo docker-compose logs -f vllm

# Остановить контейнер
sudo docker-compose down
```

## API Endpoints

### Chat Completions

Основной endpoint для генерации ответов от модели.

**Endpoint:** `POST http://localhost:8000/v1/chat/completions`

**Пример запроса:**

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "RedHatAI/Qwen3-8B-NVFP4",
    "messages": [{"role": "user", "content": "Привет!"}],
    "max_tokens": 1000
  }'
```

**Параметры запроса:**

- `model` (string, required): Имя модели - `"RedHatAI/Qwen3-8B-NVFP4"`
- `messages` (array, required): Массив сообщений для диалога
  - `role` (string): Роль отправителя - `"user"`, `"assistant"`, или `"system"`
  - `content` (string): Текст сообщения
- `max_tokens` (integer, optional): Максимальное количество токенов в ответе (по умолчанию: 256)
- `temperature` (float, optional): Параметр случайности генерации (0.0 - 2.0, по умолчанию: 1.0)
- `top_p` (float, optional): Ядерная выборка (0.0 - 1.0, по умолчанию: 1.0)

**Пример ответа:**

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1761841730,
  "model": "RedHatAI/Qwen3-8B-NVFP4",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "<think>\n...</think>\n\nПривет! Как я могу помочь тебе?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 150,
    "total_tokens": 162
  }
}
```

### Список моделей

Получить список доступных моделей.

**Endpoint:** `GET http://localhost:8000/v1/models`

**Пример запроса:**

```bash
curl http://localhost:8000/v1/models
```

## Особенности модели Qwen3-8B-NVFP4

- **Reasoning режим**: Модель использует режим рассуждений (`<think>`), который помогает улучшить качество ответов
- **FP4 квантование**: Модель использует 4-битную квантовацию для экономии памяти GPU
- **Максимальная длина**: `max_model_len` установлена на 8192 токена

## Примеры использования

### Простой диалог

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "RedHatAI/Qwen3-8B-NVFP4",
    "messages": [
      {"role": "user", "content": "Расскажи о квантовых компьютерах"}
    ],
    "max_tokens": 500,
    "temperature": 0.7
  }'
```

### Многораундовый диалог

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "RedHatAI/Qwen3-8B-NVFP4",
    "messages": [
      {"role": "user", "content": "Привет!"},
      {"role": "assistant", "content": "Привет! Как дела?"},
      {"role": "user", "content": "Отлично, спасибо!"}
    ],
    "max_tokens": 200
  }'
```

### С системным промптом

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "RedHatAI/Qwen3-8B-NVFP4",
    "messages": [
      {"role": "system", "content": "Ты полезный AI-ассистент."},
      {"role": "user", "content": "Помоги написать код на Python"}
    ],
    "max_tokens": 1000
  }'
```

## Конфигурация

Текущая конфигурация Docker Compose:

- **Модель**: `RedHatAI/Qwen3-8B-NVFP4`
- **Порт**: `8000`
- **Max model length**: `8192` токенов
- **GPU memory utilization**: `0.7` (70%)
- **Max num sequences**: `64`
- **Tensor parallel size**: `1`

## Устранение проблем

### Проблема: Недостаточно памяти GPU

Если возникает ошибка `CUDA out of memory`, уменьшите `gpu_memory_utilization` в `docker-compose.yml`:

```yaml
- "--gpu-memory-utilization"
- "0.5"  # Вместо 0.7
```

### Проблема: Модель генерирует слишком мало токенов

Увеличьте `max_tokens` в запросе API. Reasoning токены учитываются в общем лимите, поэтому для более длинных ответов нужно увеличить `max_tokens`.

### Проверка статуса

```bash
# Проверить статус контейнера
sudo docker-compose ps

# Проверить использование GPU
sudo docker exec vllm nvidia-smi

# Проверить логи
sudo docker-compose logs vllm --tail=50
```

## Дополнительная информация

- [vLLM Documentation](https://docs.vllm.ai/en/latest/)
- [Qwen3-8B-NVFP4 Model Card](https://huggingface.co/RedHatAI/Qwen3-8B-NVFP4)

