# Исправление расчета средней зарплаты из API HH.ru

## Проблема

В скрипте `web/scripts/generate-professions.ts` функция `fetchVacanciesStats()` неправильно рассчитывала среднюю зарплату из API HH.ru.

### Найденные ошибки:

1. ❌ **Смешивание валют** - складывались USD, KZT, UZS и RUR без конвертации
2. ❌ **Дублирование значений** - в массив добавлялись ОБА значения `salary.from` и `salary.to`, удваивая данные
3. ❌ **Отсутствие фильтра по региону** - попадали вакансии из Казахстана, Узбекистана и других стран
4. ❌ **Неверная валюта рубля** - в API используется код `"RUR"`, а не `"RUB"`

### Пример проблемы:

```typescript
// СТАРЫЙ КОД (неправильно):
data.items?.forEach((vacancy: any) => {
  if (vacancy.salary?.from) {
    salaries.push(vacancy.salary.from);  // 1000 USD
  }
  if (vacancy.salary?.to) {
    salaries.push(vacancy.salary.to);    // 500000 KZT
  }
});

// Результат: среднее от [1000, 500000] = 250500 (бессмысленное число)
```

### Результат проблемы:

В файле `web/data/professions/frontend-developer.json`:
```json
{
  "avgSalary": 983539  // Неправильно!
}
```

Это число получилось из-за смешивания разных валют и дублирования значений.

---

## Решение

### Внесенные изменения:

1. ✅ **Добавлен фильтр по России**: `area=113` в параметрах запроса
2. ✅ **Фильтрация по валюте**: обрабатываются только вакансии с `currency === 'RUR'`
3. ✅ **Корректный расчет**: для каждой вакансии берется среднее между `from` и `to`
4. ✅ **Округление**: результат округляется до тысяч для читаемости
5. ✅ **Улучшенное логирование**: показывает количество обработанных вакансий

### Новый код:

```typescript
async function fetchVacanciesStats(profession: string) {
  // Запрос только по России (area=113)
  const response = await fetch(
    `https://api.hh.ru/vacancies?text=${encodeURIComponent(profession)}&per_page=20&order_by=relevance&area=113`
  );
  
  const salaries: number[] = [];
  
  data.items?.forEach((vacancy: any) => {
    // Фильтруем только рубли
    if (vacancy.salary && vacancy.salary.currency === 'RUR') {
      const from = vacancy.salary.from;
      const to = vacancy.salary.to;
      
      // Вычисляем среднее для ОДНОЙ вакансии
      if (from && to) {
        salaries.push((from + to) / 2);  // Среднее между от и до
      } else if (from) {
        salaries.push(from);
      } else if (to) {
        salaries.push(to);
      }
    }
  });
  
  // Округляем до тысяч
  const avgSalary = salaries.length > 0 
    ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length / 1000) * 1000
    : null;
}
```

---

## Результаты

### До исправления:
- Frontend Developer: **983,539 ₽** ❌ (неправильно)

### После исправления:
- Frontend Developer: **135,000 ₽** ✅ (реалистично для Junior-Middle)
- DevOps Engineer: **174,000 ₽** ✅
- Бариста: **97,000 ₽** ✅

---

## Структура API HH.ru

### Объект salary:

```typescript
{
  "salary": {
    "from": 150000,        // Зарплата от (может быть null)
    "to": 200000,          // Зарплата до (может быть null)
    "currency": "RUR",     // Валюта: RUR, USD, KZT, UZS, и др.
    "gross": true          // true = до налогов, false = на руки
  }
}
```

### Коды регионов:

- `113` - Россия
- `40` - Казахстан
- `5` - Украина
- `26` - Беларусь

### Коды валют:

- `RUR` - Российский рубль
- `USD` - Доллар США
- `EUR` - Евро
- `KZT` - Казахстанский тенге
- `UZS` - Узбекский сум

---

## Рекомендации

### При работе с API HH.ru всегда учитывайте:

1. **Валюту** - не все вакансии в рублях
2. **Регион** - используйте параметр `area` для фильтрации
3. **Null значения** - поля `from` и `to` могут быть пустыми
4. **Gross/Net** - поле `gross` указывает на зарплату до/после налогов
5. **Rate limits** - максимум 10 запросов в секунду с одного IP

### Полезные ссылки:

- Документация API: https://dev.hh.ru/
- Список регионов: https://api.hh.ru/areas
- Список валют: https://api.hh.ru/dictionaries
- Примеры запросов:
  - https://api.hh.ru/vacancies?text=Frontend&area=113
  - https://api.hh.ru/vacancies?text=DevOps&per_page=20

---

## Что дальше?

После исправления необходимо **перегенерировать данные профессий**:

```bash
cd web
npm run generate
```

Это обновит файлы в `web/data/professions/` с корректными данными о зарплатах.

