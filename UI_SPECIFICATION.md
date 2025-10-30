# UI Спецификация - Генератор Вайба (Mobile First)

## Обзор проекта

**Название:** Генератор Вайба  
**Цель:** Помочь студентам и начинающим специалистам почувствовать атмосферу профессии изнутри  
**Целевая аудитория:** Студенты, начинающие специалисты (18-25 лет), активные пользователи мобильных устройств, зумеры  
**Стиль:** Современный mobile-first, вдохновленный обновленным HH.ru (2024) и современными мобильными приложениями  
**Подход:** Progressive Web App (PWA) с фокусом на мобильный опыт и эмоции

### Философия дизайна: "Вайб" от HH.ru

> *"Был работающий, функциональный, качественный продукт, но он не вызывал эмоций, которые говорили бы о том, что с продуктом приятно работать."*  
> — Михаил Пономаренко, дизайн-директор hh.group ([источник](https://www.setters.media/post/rebranding-headhunter))

Наш проект следует современной философии HeadHunter 2024:

#### 1. **Look & Feel превыше функциональности**
Продукт должен не только выполнять свои функции, но и создавать определенный **вайб** — эмоциональную связь с пользователем.

#### 2. **Эмоции + Инструмент**
> *"Когда все одинаково, ты выбираешь по эмоции, по тому, что тебе кажется приятнее."*

Примеры из жизни:
- **Excel vs Notion** - обе создают таблицы, но Notion выбирают за приятность
- **HH.ru старый vs новый** - оба работают, но новый создает эмоцию

#### 3. **Ориентация на зумеров**
Целевая аудитория (18-25 лет) выросла на современных digital-продуктах:
- TikTok, Instagram, Telegram
- Привыкли к быстрым, визуальным интерфейсам
- Ценят эстетику наравне с функциональностью

#### 4. **Современный визуал**
> *"С 2016 года много чего поменялось, и мы в какой-то момент упустили субстанцию современного визуала и перестали соответствовать современному рыночному восприятию."*

**Что это значит для нас:**
- Используем актуальные дизайн-тренды 2024-2025
- Минималистичный, но не скучный
- Яркие акценты, живые эмоции
- Визуальная иерархия и "воздух"

#### 5. **Узнаваемость через простоту**
HH.ru сократили название до **"hh"** - две строчные буквы в красном квадрате. Это:
- ✅ Просто запомнить
- ✅ Легко идентифицировать
- ✅ Работает как иконка приложения
- ✅ Узнаваемо даже без текста

**Применяем к нашему проекту:**
- Простые, понятные иконки
- Четкая визуальная идентификация
- Минимум текста, максимум смысла

---

## 1. Mobile-First Философия

### Принципы проектирования

1. **Mobile as Primary** - мобильная версия является основной, desktop - расширение
2. **Thumb-Friendly** - все интерактивные элементы доступны для взаимодействия большим пальцем
3. **Content First** - приоритет контенту над декоративными элементами
4. **Gestures** - использование свайпов, тапов, долгих нажатий
5. **Performance** - быстрая загрузка даже на медленных сетях

### Зоны досягаемости на мобильном экране

```
┌─────────────────────┐
│   Сложная зона      │ ← Верхняя часть (только для контента)
│                     │
│   Удобная зона      │ ← Средняя часть (основной контент)
│                     │
│   Зона большого     │ ← Нижняя часть (основные действия)
│   пальца            │
└─────────────────────┘
```

**Правило:** Основные кнопки действий размещаем внизу экрана (навигация, отправка сообщений)

---

## 2. Цветовая палитра HH.ru (Адаптированная)

### Основные цвета (Primary)

| Назначение | Цвет | HEX | RGB | Использование |
|------------|------|-----|-----|---------------|
| **HH Красный** | ![#FF0000](https://via.placeholder.com/15/FF0000/000000?text=+) | `#FF0000` | `rgb(255, 0, 0)` | Основной бренд, кнопки CTA |
| **HH Темный** | ![#000000](https://via.placeholder.com/15/000000/000000?text=+) | `#000000` | `rgb(0, 0, 0)` | Фон приложения, темные элементы |
| **HH Светлый фон** | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) | `#FFFFFF` | `rgb(255, 255, 255)` | Фон карточек, контентных блоков |
| **Акцент синий** | ![#0094FF](https://via.placeholder.com/15/0094FF/000000?text=+) | `#0094FF` | `rgb(0, 148, 255)` | Ссылки, вторичные действия |

### Дополнительные цвета

| Назначение | Цвет | HEX | Использование |
|------------|------|-----|---------------|
| **Текст основной** | ![#262626](https://via.placeholder.com/15/262626/000000?text=+) | `#262626` | Основной текст на светлом фоне |
| **Текст вторичный** | ![#747474](https://via.placeholder.com/15/747474/000000?text=+) | `#747474` | Вторичный текст, подписи |
| **Фон светло-серый** | ![#F5F5F5](https://via.placeholder.com/15/F5F5F5/000000?text=+) | `#F5F5F5` | Фон страницы, разделители |
| **Фон карточки** | ![#FAFAFA](https://via.placeholder.com/15/FAFAFA/000000?text=+) | `#FAFAFA` | Фон карточек вакансий |
| **Бордер** | ![#E0E0E0](https://via.placeholder.com/15/E0E0E0/000000?text=+) | `#E0E0E0` | Границы, разделители |

### Семантические цвета

| Назначение | Цвет | HEX | Использование |
|------------|------|-----|---------------|
| **Успех** | ![#00A854](https://via.placeholder.com/15/00A854/000000?text=+) | `#00A854` | Успешные действия, зеленые метки |
| **Предупреждение** | ![#FFA500](https://via.placeholder.com/15/FFA500/000000?text=+) | `#FFA500` | Предупреждения |
| **Ошибка** | ![#E74C3C](https://via.placeholder.com/15/E74C3C/000000?text=+) | `#E74C3C` | Ошибки |
| **Информация** | ![#3498DB](https://via.placeholder.com/15/3498DB/000000?text=+) | `#3498DB` | Информационные блоки |

### Градиенты для "вайба"

```css
/* Теплый градиент (офис, день) */
.gradient-warm {
  background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%);
}

/* Холодный градиент (IT, ночь) */
.gradient-cool {
  background: linear-gradient(135deg, #0094FF 0%, #7B68EE 100%);
}

/* Нейтральный градиент (общий) */
.gradient-neutral {
  background: linear-gradient(135deg, #747474 0%, #262626 100%);
}
```

---

## 3. Типографика

### Шрифты

**Основной шрифт:** SF Pro Display (iOS) / Roboto (Android) / System Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

**Моноширинный:** SF Mono / Roboto Mono
```css
font-family: 'SF Mono', 'Roboto Mono', 'Courier New', monospace;
```

### Mobile типографическая шкала

| Назначение | Размер | Line Height | Weight | Использование |
|------------|--------|-------------|--------|---------------|
| **H1 Mobile** | 28px (1.75rem) | 34px | 700 | Главный заголовок |
| **H2 Mobile** | 24px (1.5rem) | 30px | 600 | Заголовки секций |
| **H3 Mobile** | 20px (1.25rem) | 26px | 600 | Подзаголовки |
| **Body Large** | 17px (1.0625rem) | 24px | 400 | Основной крупный текст |
| **Body Regular** | 15px (0.9375rem) | 22px | 400 | Основной текст |
| **Body Small** | 13px (0.8125rem) | 18px | 400 | Вторичный текст |
| **Caption** | 11px (0.6875rem) | 14px | 400 | Подписи, метки |

### Desktop типографическая шкала (расширение)

| Назначение | Размер | Line Height | Weight |
|------------|--------|-------------|--------|
| **H1 Desktop** | 48px (3rem) | 56px | 700 |
| **H2 Desktop** | 36px (2.25rem) | 44px | 600 |
| **H3 Desktop** | 28px (1.75rem) | 36px | 600 |
| **Body** | 16px (1rem) | 24px | 400 |

### Правила адаптивности

```css
/* Mobile First */
h1 {
  font-size: 1.75rem; /* 28px */
}

/* Desktop */
@media (min-width: 768px) {
  h1 {
    font-size: 3rem; /* 48px */
  }
}
```

---

## 4. Компоненты (Mobile First)

### 4.1 Bottom Navigation (Нижняя навигация)

**Зачем:** Основная навигация должна быть в зоне досягаемости большого пальца

```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
  <div className="flex items-center justify-around h-16">
    {/* Иконки навигации */}
    <button className="flex flex-col items-center justify-center flex-1 h-full">
      <svg className="w-6 h-6 mb-1" />
      <span className="text-xs">Главная</span>
    </button>
    {/* ... */}
  </div>
</nav>
```

**Характеристики:**
- **Высота:** 64px (h-16) + safe-area-inset-bottom (для iPhone)
- **Кнопок:** 3-5 (оптимально 4)
- **Touch target:** Минимум 44x44px
- **Активное состояние:** Красный цвет + bold шрифт

### 4.2 Mobile Header (Шапка)

```tsx
<header className="sticky top-0 z-50 bg-white border-b border-gray-200 safe-area-inset-top">
  <div className="flex items-center justify-between h-14 px-4">
    {/* Логотип HH */}
    <div className="flex items-center">
      <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
        hh
      </div>
    </div>
    
    {/* Действия */}
    <div className="flex items-center gap-2">
      <button className="w-10 h-10 flex items-center justify-center">
        {/* Иконка */}
      </button>
    </div>
  </div>
</header>
```

**Характеристики:**
- **Высота:** 56px (h-14) + safe-area-inset-top
- **Sticky:** Прилипает к верху при скролле
- **Z-index:** 50 (над контентом, под модалами)

### 4.3 Кнопки (Mobile)

#### Primary Button (Основная красная кнопка HH)

```tsx
<button className="w-full h-12 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium text-base rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none">
  Найти профессию
</button>
```

**Характеристики:**
- **Высота:** 48px (h-12) - удобно для нажатия
- **Ширина:** По умолчанию 100% на мобильных
- **Border radius:** 12px (rounded-xl)
- **Typography:** font-medium, 16px
- **Touch feedback:** active:bg-red-800

#### Secondary Button

```tsx
<button className="w-full h-12 bg-white border-2 border-gray-300 hover:border-gray-400 active:bg-gray-50 text-gray-800 font-medium text-base rounded-xl transition-colors">
  Назад
</button>
```

#### Button с иконкой

```tsx
<button className="flex items-center justify-center gap-2 w-full h-12 bg-blue-600 text-white font-medium rounded-xl">
  <svg className="w-5 h-5" />
  <span>Открыть чат</span>
</button>
```

#### Floating Action Button (FAB)

```tsx
<button className="fixed bottom-20 right-4 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center z-40">
  <svg className="w-6 h-6" />
</button>
```

**Использование:** Основное действие на странице (например, "Начать разговор")

### 4.4 Карточки (Cards)

#### Карточка профессии (Mobile)

```tsx
<div className="bg-white rounded-2xl border border-gray-200 overflow-hidden active:scale-98 transition-transform">
  {/* Изображение */}
  <div className="aspect-[16/9] relative bg-gray-100">
    <img src={image} alt={title} className="w-full h-full object-cover" />
    {/* Badge поверх изображения */}
    <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium">
      IT
    </div>
  </div>
  
  {/* Контент */}
  <div className="p-4">
    <h3 className="text-lg font-semibold text-gray-900 mb-1">
      Frontend-разработчик
    </h3>
    <p className="text-sm text-gray-600 mb-3">
      Junior • Стартап
    </p>
    
    {/* Статистика */}
    <div className="flex items-center justify-between text-xs">
      <span className="text-green-600 font-medium">
        ✓ 1 234 вакансий
      </span>
      <span className="text-gray-500">
        Средняя конкуренция
      </span>
    </div>
  </div>
</div>
```

**Характеристики:**
- **Padding:** 16px (p-4)
- **Border radius:** 16px (rounded-2xl)
- **Aspect ratio:** 16:9 для изображения
- **Touch feedback:** active:scale-98

#### Compact Card (Горизонтальная)

```tsx
<div className="flex gap-3 p-3 bg-white rounded-xl border border-gray-200">
  {/* Иконка/изображение */}
  <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
    <img src={icon} className="w-full h-full object-cover" />
  </div>
  
  {/* Контент */}
  <div className="flex-1 min-w-0">
    <h4 className="text-sm font-semibold text-gray-900 truncate">
      Дизайнер
    </h4>
    <p className="text-xs text-gray-600 truncate">
      Средний уровень
    </p>
  </div>
  
  {/* Действие */}
  <button className="flex-shrink-0 text-blue-600">
    <svg className="w-5 h-5" />
  </button>
</div>
```

### 4.5 Чат (Mobile)

#### Chat Container (Полноэкранный)

```tsx
<div className="fixed inset-0 bg-white flex flex-col z-50">
  {/* Header */}
  <div className="flex-shrink-0 h-14 border-b border-gray-200 flex items-center px-4 safe-area-inset-top">
    <button className="mr-3">
      <svg className="w-6 h-6" /> {/* Назад */}
    </button>
    <div className="flex-1">
      <h2 className="font-semibold text-base">AI Ассистент</h2>
      <p className="text-xs text-gray-600">Онлайн</p>
    </div>
  </div>
  
  {/* Messages */}
  <div className="flex-1 overflow-y-auto px-4 py-4">
    {/* Сообщения */}
  </div>
  
  {/* Input - ВНИЗУ */}
  <div className="flex-shrink-0 border-t border-gray-200 p-3 safe-area-inset-bottom bg-white">
    <div className="flex items-end gap-2">
      <input 
        type="text"
        placeholder="Сообщение..."
        className="flex-1 min-h-10 max-h-32 px-4 py-2 bg-gray-100 rounded-full text-base resize-none"
      />
      <button className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5" />
      </button>
    </div>
  </div>
</div>
```

**Особенности:**
- **Полноэкранный режим** - занимает весь экран
- **Input внизу** - в зоне досягаемости
- **Safe area insets** - учет вырезов на iPhone
- **Скругленный input** - rounded-full (стиль iMessage)

#### Message Bubble - Пользователь (справа)

```tsx
<div className="flex justify-end mb-3">
  <div className="max-w-[75%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5">
    <p className="text-base">
      Привет! Расскажи про frontend-разработчика
    </p>
    <span className="text-xs opacity-75 mt-1 block">
      15:30
    </span>
  </div>
</div>
```

#### Message Bubble - AI (слева)

```tsx
<div className="flex mb-3">
  <div className="flex items-start gap-2 max-w-[80%]">
    {/* Аватар */}
    <div className="w-8 h-8 flex-shrink-0 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
      hh
    </div>
    
    {/* Сообщение */}
    <div>
      <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2.5">
        <p className="text-base">
          Конечно! Давай уточню несколько деталей...
        </p>
      </div>
      <span className="text-xs text-gray-500 mt-1 ml-2 block">
        15:30
      </span>
    </div>
  </div>
</div>
```

**Характеристики:**
- **Max width:** 75-80% экрана
- **Bubble tail:** rounded-tr-sm / rounded-tl-sm (имитация хвостика)
- **Typography:** 16px для читаемости
- **Time:** Мелкий текст под сообщением

#### Quick Reply Buttons (Быстрые ответы)

```tsx
<div className="flex flex-wrap gap-2 mb-3">
  <button className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-800 rounded-full text-sm font-medium active:bg-gray-50">
    Junior
  </button>
  <button className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-800 rounded-full text-sm font-medium active:bg-gray-50">
    Middle
  </button>
  <button className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-800 rounded-full text-sm font-medium active:bg-gray-50">
    Senior
  </button>
</div>
```

**Использование:** Предложения вариантов ответа от AI

### 4.6 Inputs (Формы)

#### Text Input (Mobile)

```tsx
<input
  type="text"
  placeholder="Введите название профессии"
  className="w-full h-12 px-4 bg-white border-2 border-gray-300 rounded-xl text-base focus:outline-none focus:border-blue-600 transition-colors"
/>
```

#### Textarea (Авторасширяемый)

```tsx
<textarea
  placeholder="Расскажите подробнее..."
  rows={3}
  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-base resize-none focus:outline-none focus:border-blue-600 transition-colors"
/>
```

#### Search Input

```tsx
<div className="relative">
  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
  <input
    type="search"
    placeholder="Поиск профессии..."
    className="w-full h-12 pl-12 pr-4 bg-gray-100 border-0 rounded-xl text-base focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
  />
</div>
```

### 4.7 Badges & Tags

#### Tech Stack Badge

```tsx
<span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
  React.js
</span>
```

#### Status Badge

```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
  <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
  Много вакансий
</span>
```

### 4.8 Lists (Списки)

#### Timeline Item (Расписание дня)

```tsx
<div className="flex gap-3 mb-4">
  {/* Время */}
  <div className="flex-shrink-0 w-12 text-right">
    <span className="text-sm font-mono font-semibold text-gray-900">10:00</span>
  </div>
  
  {/* Линия */}
  <div className="flex flex-col items-center flex-shrink-0">
    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
    <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
  </div>
  
  {/* Контент */}
  <div className="flex-1 pb-6">
    <h4 className="font-semibold text-base text-gray-900 mb-1">
      Утренний стендап
    </h4>
    <p className="text-sm text-gray-600">
      Обсуждение задач на день с командой
    </p>
  </div>
</div>
```

#### Skill Item

```tsx
<div className="mb-4">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-gray-900">JavaScript</span>
    <span className="text-sm font-semibold text-red-600">85%</span>
  </div>
  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
    <div 
      className="h-full bg-red-600 transition-all duration-500"
      style={{ width: '85%' }}
    ></div>
  </div>
</div>
```

### 4.9 Tabs (Вкладки)

```tsx
<div className="flex border-b border-gray-200 -mx-4 px-4 overflow-x-auto">
  <button className="px-4 py-3 text-sm font-medium text-red-600 border-b-2 border-red-600 whitespace-nowrap">
    Обзор
  </button>
  <button className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
    Расписание
  </button>
  <button className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
    Навыки
  </button>
  <button className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
    Карьера
  </button>
</div>
```

**Особенности:**
- **Горизонтальный скролл** - overflow-x-auto
- **Активная вкладка** - красная граница снизу
- **Whitespace:** nowrap для предотвращения переносов

### 4.10 Модальные окна (Bottom Sheet)

```tsx
{/* Overlay */}
<div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}></div>

{/* Bottom Sheet */}
<div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 safe-area-inset-bottom max-h-[90vh] overflow-hidden">
  {/* Handle */}
  <div className="flex justify-center pt-3 pb-2">
    <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
  </div>
  
  {/* Header */}
  <div className="px-4 py-3 border-b border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900">
      Выберите уровень
    </h3>
  </div>
  
  {/* Content */}
  <div className="px-4 py-4 overflow-y-auto">
    {/* Контент */}
  </div>
</div>
```

**Особенности:**
- **Bottom Sheet** - появляется снизу (стандарт для мобильных)
- **Handle** - "ручка" для свайпа вниз
- **Max height** - 90vh, чтобы видеть край экрана
- **Rounded top** - rounded-t-3xl

---

## 5. Страницы (Структура)

### 5.1 Главная страница (Mobile)

```tsx
<div className="min-h-screen bg-gray-50 pb-16"> {/* pb-16 для bottom nav */}
  {/* Header */}
  <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
    {/* ... */}
  </header>
  
  {/* Hero Section */}
  <section className="px-4 pt-6 pb-8 bg-gradient-to-br from-red-600 to-red-700 text-white">
    <h1 className="text-2xl font-bold mb-2">
      Найди свою профессию
    </h1>
    <p className="text-base opacity-90 mb-6">
      Почувствуй вайб работы мечты
    </p>
    
    {/* Search */}
    <div className="relative">
      <input 
        type="search"
        placeholder="Какая профессия интересна?"
        className="w-full h-12 px-4 rounded-xl text-gray-900"
      />
    </div>
  </section>
  
  {/* Quick Actions */}
  <section className="px-4 py-6 bg-white border-b border-gray-200">
    <div className="grid grid-cols-4 gap-4">
      <button className="flex flex-col items-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
          💻
        </div>
        <span className="text-xs text-gray-700 text-center">IT</span>
      </button>
      {/* ... еще 3 кнопки */}
    </div>
  </section>
  
  {/* Профессии */}
  <section className="px-4 py-6">
    <h2 className="text-xl font-bold text-gray-900 mb-4">
      Популярные профессии
    </h2>
    <div className="space-y-4">
      {/* Карточки профессий */}
    </div>
  </section>
  
  {/* Bottom Navigation */}
  <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
    {/* ... */}
  </nav>
  
  {/* FAB - Начать чат */}
  <button className="fixed bottom-20 right-4 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg">
    💬
  </button>
</div>
```

**Структура:**
1. **Sticky Header** - логотип + меню
2. **Hero с градиентом** - поиск и заголовок
3. **Quick Actions** - 4 категории профессий
4. **Список профессий** - карточки
5. **Bottom Navigation** - основная навигация
6. **FAB** - быстрый вход в чат

### 5.2 Страница профессии (Mobile)

```tsx
<div className="min-h-screen bg-white pb-16">
  {/* Header с фоном */}
  <div className="relative h-48 bg-gradient-to-br from-blue-600 to-purple-600">
    {/* Back button */}
    <button className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
      ←
    </button>
    
    {/* Название профессии */}
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
      <h1 className="text-2xl font-bold text-white">
        Frontend-разработчик
      </h1>
      <p className="text-sm text-white/90">
        Junior • Стартап
      </p>
    </div>
  </div>
  
  {/* Tabs */}
  <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
    {/* Вкладки */}
  </div>
  
  {/* Content */}
  <div className="px-4 py-6">
    {/* Секции контента в зависимости от активной вкладки */}
  </div>
  
  {/* Bottom Bar - Действие */}
  <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-area-inset-bottom">
    <button className="w-full h-12 bg-red-600 text-white font-medium rounded-xl">
      Откликнуться на вакансию
    </button>
  </div>
</div>
```

**Секции контента:**

#### 1. Обзор (Overview)
```tsx
<div className="space-y-6">
  {/* Статистика */}
  <div className="grid grid-cols-3 gap-3">
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-2xl font-bold text-gray-900">1 234</div>
      <div className="text-xs text-gray-600 mt-1">Вакансий</div>
    </div>
    {/* ... еще 2 статы */}
  </div>
  
  {/* Описание */}
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      О профессии
    </h3>
    <p className="text-base text-gray-700 leading-relaxed">
      Описание профессии...
    </p>
  </div>
  
  {/* Визуальный вайб (4 изображения) */}
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-3">
      Визуальный вайб
    </h3>
    <div className="grid grid-cols-2 gap-2">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <img src={img} className="w-full h-full object-cover" />
      </div>
      {/* ... еще 3 картинки */}
    </div>
  </div>
</div>
```

#### 2. Расписание дня (Schedule)
```tsx
<div className="space-y-4">
  {schedule.map((item, idx) => (
    <div key={idx} className="flex gap-3">
      {/* Timeline component */}
    </div>
  ))}
</div>
```

#### 3. Навыки (Skills)
```tsx
<div className="space-y-6">
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">
      Технический стек
    </h3>
    <div className="flex flex-wrap gap-2">
      {techStack.map(tech => (
        <span key={tech} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {tech}
        </span>
      ))}
    </div>
  </div>
  
  <div>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">
      Уровень навыков
    </h3>
    <div className="space-y-4">
      {skills.map(skill => (
        <div key={skill.name}>
          {/* Skill progress bar */}
        </div>
      ))}
    </div>
  </div>
</div>
```

#### 4. Карьерный путь (Career Path)
```tsx
<div className="space-y-4">
  {careerPath.map((stage, idx) => (
    <div key={idx} className="relative pl-8">
      {/* Timeline dot */}
      <div className="absolute left-0 top-2 w-4 h-4 bg-red-600 rounded-full border-4 border-red-100"></div>
      
      {/* Content */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-base text-gray-900 mb-1">
          {stage.level}
        </h4>
        <p className="text-sm text-gray-600 mb-2">
          {stage.experience}
        </p>
        <div className="text-sm font-medium text-red-600">
          {stage.salary}
        </div>
      </div>
      
      {/* Connecting line */}
      {idx < careerPath.length - 1 && (
        <div className="absolute left-2 top-6 w-0.5 h-full bg-gray-200 -translate-x-1/2"></div>
      )}
    </div>
  ))}
</div>
```

### 5.3 Чат (Fullscreen Modal)

```tsx
<div className="fixed inset-0 bg-white z-50 flex flex-col">
  {/* Header */}
  <div className="flex-shrink-0 h-14 border-b border-gray-200 flex items-center px-4 safe-area-inset-top">
    <button onClick={onClose} className="mr-3">
      ← Назад
    </button>
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
        hh
      </div>
      <div>
        <div className="font-semibold text-sm">AI Ассистент</div>
        <div className="text-xs text-gray-600">Онлайн</div>
      </div>
    </div>
  </div>
  
  {/* Messages */}
  <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
    {messages.map((msg, idx) => (
      <div key={idx}>
        {/* Message bubble */}
      </div>
    ))}
    
    {/* Typing indicator */}
    {isTyping && (
      <div className="flex mb-3">
        <div className="bg-gray-200 rounded-2xl px-4 py-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    )}
    
    <div ref={messagesEndRef} />
  </div>
  
  {/* Input */}
  <div className="flex-shrink-0 border-t border-gray-200 p-3 bg-white safe-area-inset-bottom">
    <div className="flex items-end gap-2">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Сообщение..."
        className="flex-1 min-h-10 px-4 py-2 bg-gray-100 border-0 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <button
        onClick={handleSend}
        disabled={!inputValue.trim()}
        className="w-10 h-10 bg-red-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center flex-shrink-0"
      >
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
      </button>
    </div>
  </div>
</div>
```

---

## 6. Сетка и отступы (Mobile Layout)

### Container (Padding)

```css
/* Mobile padding */
.container-mobile {
  padding-left: 1rem;  /* 16px */
  padding-right: 1rem; /* 16px */
}

/* Desktop padding */
@media (min-width: 768px) {
  .container-mobile {
    padding-left: 2rem;  /* 32px */
    padding-right: 2rem; /* 32px */
  }
}
```

### Spacing Scale

| Назначение | Mobile | Desktop | Использование |
|------------|--------|---------|---------------|
| **XS** | 4px | 4px | Минимальный отступ |
| **SM** | 8px | 8px | Между близкими элементами |
| **MD** | 16px | 24px | Стандартный отступ |
| **LG** | 24px | 32px | Между секциями |
| **XL** | 32px | 48px | Между крупными блоками |

### Grid System

#### Mobile (Default)
```tsx
{/* 1 колонка */}
<div className="space-y-4">
  {/* Карточки */}
</div>

{/* 2 колонки для мелких элементов */}
<div className="grid grid-cols-2 gap-3">
  {/* Элементы */}
</div>
```

#### Tablet (md: 768px+)
```tsx
{/* 2 колонки */}
<div className="grid md:grid-cols-2 gap-4">
  {/* Карточки */}
</div>
```

#### Desktop (lg: 1024px+)
```tsx
{/* 3-4 колонки */}
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Карточки */}
</div>
```

### Safe Areas (iPhone notch, home indicator)

```css
/* Top safe area (notch) */
.safe-area-inset-top {
  padding-top: env(safe-area-inset-top);
}

/* Bottom safe area (home indicator) */
.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Комбинированный */
.safe-area-inset {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

---

## 7. Анимации и жесты (Mobile)

### Touch Feedback

```tsx
/* Стандартный touch feedback */
className="active:scale-95 active:opacity-80 transition-transform"

/* Для кнопок */
className="active:bg-red-700 transition-colors"

/* Для карточек */
className="active:scale-98 transition-transform"
```

### Swipe Gestures

#### Swipe to delete (список)
```tsx
// Используйте библиотеку react-swipeable или react-use-gesture
<SwipeableItem
  onSwipeLeft={() => handleDelete(id)}
  threshold={100}
>
  <div className="bg-white">
    {/* Контент */}
  </div>
</SwipeableItem>
```

#### Pull to refresh
```tsx
// Используйте react-pull-to-refresh или аналог
<PullToRefresh
  onRefresh={handleRefresh}
  pullingContent={<div>Потяните для обновления</div>}
  refreshingContent={<div className="animate-spin">⟳</div>}
>
  <div>
    {/* Контент */}
  </div>
</PullToRefresh>
```

### Transitions

```css
/* Быстрые (touch) */
transition: all 0.15s ease;

/* Стандартные */
transition: all 0.3s ease;

/* Медленные (модалы) */
transition: all 0.5s ease;
```

### Page Transitions (Route changes)

```tsx
// Fade in
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// Slide from right (как в iOS)
@keyframes slideFromRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

// Slide from bottom (модалы)
@keyframes slideFromBottom {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
```

---

## 8. Адаптивность (Breakpoints)

### Tailwind Breakpoints

```css
/* Mobile first (по умолчанию) */
/* xs: 0px - 639px */

sm: 640px   /* Large mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Примеры адаптивных классов

```tsx
{/* Padding */}
<div className="p-4 md:p-6 lg:p-8">

{/* Текст */}
<h1 className="text-2xl md:text-3xl lg:text-5xl">

{/* Сетка */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

{/* Видимость */}
<div className="block md:hidden"> {/* Только на мобильных */}
<div className="hidden md:block"> {/* Только на desktop */}

{/* Flex direction */}
<div className="flex flex-col md:flex-row">
```

### Адаптивная типографика

```tsx
// Автоматическое масштабирование текста
<h1 className="text-[clamp(1.75rem,5vw,3rem)] font-bold">
  Заголовок
</h1>

// Через Tailwind
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
  Заголовок
</h1>
```

---

## 9. Accessibility (A11y)

### Touch Targets

**Минимальный размер:** 44x44px (iOS) / 48x48px (Material Design)

```tsx
<button className="min-w-[44px] min-h-[44px] flex items-center justify-center">
  <svg className="w-6 h-6" />
</button>
```

### Focus States

```tsx
className="focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
```

### Aria Labels

```tsx
<button aria-label="Закрыть чат" onClick={onClose}>
  ✕
</button>

<input
  type="search"
  aria-label="Поиск профессии"
  placeholder="Введите название..."
/>

<nav aria-label="Основная навигация">
  {/* ... */}
</nav>
```

### Semantic HTML

```tsx
<header> {/* Шапка */}
<nav> {/* Навигация */}
<main> {/* Основной контент */}
<article> {/* Карточка профессии */}
<section> {/* Секция контента */}
<footer> {/* Подвал */}
<button> {/* Кнопка (не div!) */}
```

### Screen Reader Support

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {isLoading && 'Загрузка профессий...'}
</div>

<button aria-expanded={isOpen} aria-controls="menu-id">
  Меню
</button>
```

---

## 10. Состояния и паттерны

### 10.1 Loading States

#### Skeleton Screen (рекомендуется для mobile)

```tsx
<div className="animate-pulse space-y-4">
  {/* Изображение */}
  <div className="aspect-[16/9] bg-gray-200 rounded-xl"></div>
  
  {/* Текст */}
  <div className="space-y-2">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
</div>
```

#### Spinner (для кнопок)

```tsx
<button disabled className="flex items-center justify-center gap-2">
  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
  <span>Загрузка...</span>
</button>
```

### 10.2 Empty States

```tsx
<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
  <div className="text-6xl mb-4">📦</div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    Профессии не найдены
  </h3>
  <p className="text-sm text-gray-600 mb-6 max-w-sm">
    Попробуйте изменить параметры поиска или начать новый разговор с AI
  </p>
  <button className="px-6 py-3 bg-red-600 text-white font-medium rounded-xl">
    Начать заново
  </button>
</div>
```

### 10.3 Error States

```tsx
<div className="bg-red-50 border border-red-200 rounded-xl p-4">
  <div className="flex gap-3">
    <div className="flex-shrink-0 text-red-600">
      <svg className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-semibold text-red-900 mb-1">
        Ошибка загрузки
      </h4>
      <p className="text-sm text-red-700">
        Не удалось загрузить профессии. Проверьте подключение к интернету.
      </p>
    </div>
  </div>
  <button className="mt-3 text-sm font-medium text-red-600 underline">
    Попробовать снова
  </button>
</div>
```

### 10.4 Success States (Toast)

```tsx
<div className="fixed top-4 left-4 right-4 z-50 bg-green-600 text-white rounded-xl p-4 shadow-lg animate-slideDown">
  <div className="flex items-center gap-3">
    <svg className="w-5 h-5 flex-shrink-0" />
    <p className="flex-1 font-medium">
      Профессия сохранена в избранное!
    </p>
    <button onClick={onClose}>
      ✕
    </button>
  </div>
</div>
```

### 10.5 Offline State

```tsx
<div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white text-center py-2 text-sm">
  ⚠️ Нет подключения к интернету
</div>
```

---

## 11. Особенности реализации

### 11.1 PWA (Progressive Web App)

#### Meta tags для мобильных
```html
<!-- Viewport -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">

<!-- iOS -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Генератор Вайба">

<!-- Android -->
<meta name="theme-color" content="#FF0000">
<meta name="mobile-web-app-capable" content="yes">

<!-- Icons -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="manifest" href="/manifest.json">
```

#### manifest.json
```json
{
  "name": "Генератор Вайба - HH.ru",
  "short_name": "Вайб",
  "description": "Почувствуй атмосферу профессии изнутри",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#FF0000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 11.2 Performance

#### Image Optimization
```tsx
// Используйте next/image с priority для above-the-fold
<Image
  src={image}
  alt={alt}
  width={400}
  height={300}
  priority={isAboveFold}
  loading={isAboveFold ? 'eager' : 'lazy'}
  placeholder="blur"
/>
```

#### Code Splitting
```tsx
// Lazy load компонентов
const ChatInterface = dynamic(() => import('@/components/ChatInterface'), {
  loading: () => <div className="animate-pulse">Загрузка чата...</div>,
  ssr: false
});
```

#### Debounce Search
```tsx
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    performSearch(value);
  }, 300),
  []
);
```

### 11.3 Gestures Library

Используйте `framer-motion` или `react-use-gesture` для жестов:

```tsx
import { motion } from 'framer-motion';

<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(e, info) => {
    if (info.offset.x > 100) {
      handleSwipeRight();
    }
  }}
>
  {/* Контент */}
</motion.div>
```

### 11.4 Haptic Feedback (Вибрация)

```tsx
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    // Легкая вибрация (10ms)
    navigator.vibrate(10);
  }
  
  // Или используйте iOS Taptic Engine через wrapper
  if ('Haptics' in window) {
    window.Haptics.notification({ type: 'success' });
  }
};

// Использование
<button onClick={() => {
  triggerHaptic();
  handleAction();
}}>
  Нажми меня
</button>
```

---

## 12. Специфичные UX паттерны

### 12.1 Bottom Sheet для выбора

```tsx
// Используется для выбора из списка опций
<BottomSheet isOpen={isOpen} onClose={onClose}>
  <div className="space-y-2 p-4">
    {options.map(option => (
      <button
        key={option.id}
        onClick={() => handleSelect(option)}
        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors"
      >
        {option.label}
      </button>
    ))}
  </div>
</BottomSheet>
```

### 12.2 Infinite Scroll

```tsx
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

const { items, isLoading, loadMore } = useInfiniteScroll({
  fetchFn: fetchProfessions,
  pageSize: 10
});

<div>
  {items.map(item => (
    <ProfessionCard key={item.id} {...item} />
  ))}
  
  {isLoading && <div>Загрузка...</div>}
  
  <div ref={loadMoreRef} />
</div>
```

### 12.3 Search with Suggestions

```tsx
<div className="relative">
  <input
    type="search"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    className="w-full h-12 px-4 bg-gray-100 rounded-xl"
  />
  
  {/* Suggestions dropdown */}
  {query && suggestions.length > 0 && (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
      {suggestions.map(suggestion => (
        <button
          key={suggestion.id}
          onClick={() => handleSelect(suggestion)}
          className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          {suggestion.name}
        </button>
      ))}
    </div>
  )}
</div>
```

### 12.4 Voice Input (Голосовой ввод)

```tsx
<div className="relative">
  <input
    type="text"
    value={text}
    onChange={(e) => setText(e.target.value)}
    className="w-full h-12 pl-4 pr-12 bg-gray-100 rounded-xl"
  />
  
  <button
    onClick={handleVoiceInput}
    className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center ${
      isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-200 text-gray-600'
    }`}
  >
    🎤
  </button>
</div>
```

---

## 13. Аудио-визуальные эффекты (для вайба)

### 13.1 Audio Player (Фоновые звуки)

```tsx
<div className="bg-gray-50 rounded-xl p-4">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-3">
      <button
        onClick={togglePlay}
        className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center"
      >
        {isPlaying ? '⏸' : '▶️'}
      </button>
      <div>
        <div className="text-sm font-semibold text-gray-900">
          Звуки офиса
        </div>
        <div className="text-xs text-gray-600">
          Фоновая атмосфера
        </div>
      </div>
    </div>
    
    <button onClick={onClose} className="text-gray-400">
      ✕
    </button>
  </div>
  
  {/* Progress bar */}
  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
    <div
      className="h-full bg-red-600 transition-all"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
</div>
```

### 13.2 Moodboard Gallery (Визуальный вайб)

```tsx
<div className="grid grid-cols-2 gap-2 mb-4">
  {images.map((img, idx) => (
    <motion.div
      key={idx}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.1 }}
      className="aspect-square relative bg-gray-100 rounded-xl overflow-hidden"
      onClick={() => openLightbox(idx)}
    >
      <img
        src={img}
        alt={`Визуал ${idx + 1}`}
        className="w-full h-full object-cover"
      />
    </motion.div>
  ))}
</div>
```

### 13.3 Lightbox (Полноэкранный просмотр)

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black z-50 flex items-center justify-center"
  onClick={onClose}
>
  {/* Close button */}
  <button
    className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-10"
    onClick={onClose}
  >
    ✕
  </button>
  
  {/* Image */}
  <motion.img
    src={currentImage}
    alt="Полноэкранный просмотр"
    className="max-w-full max-h-full object-contain"
    initial={{ scale: 0.8 }}
    animate={{ scale: 1 }}
  />
  
  {/* Navigation */}
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
    <button
      onClick={(e) => { e.stopPropagation(); handlePrev(); }}
      className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
    >
      ←
    </button>
    <button
      onClick={(e) => { e.stopPropagation(); handleNext(); }}
      className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
    >
      →
    </button>
  </div>
</motion.div>
```

---

## 14. Статистика и визуализация данных

### 14.1 Stats Cards

```tsx
<div className="grid grid-cols-3 gap-3">
  <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
    <div className="text-2xl font-bold text-gray-900 mb-1">
      {vacancies.toLocaleString()}
    </div>
    <div className="text-xs text-gray-600">
      Вакансий
    </div>
  </div>
  
  <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
    <div className="text-2xl font-bold text-green-600 mb-1">
      {salary}
    </div>
    <div className="text-xs text-gray-600">
      Средняя ЗП
    </div>
  </div>
  
  <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
    <div className="text-2xl font-bold text-blue-600 mb-1">
      {competition}
    </div>
    <div className="text-xs text-gray-600">
      Конкуренция
    </div>
  </div>
</div>
```

### 14.2 Progress Ring (Круговой прогресс)

```tsx
<div className="relative w-24 h-24">
  <svg className="w-full h-full -rotate-90">
    {/* Background */}
    <circle
      cx="48"
      cy="48"
      r="40"
      stroke="#E5E7EB"
      strokeWidth="8"
      fill="none"
    />
    {/* Progress */}
    <circle
      cx="48"
      cy="48"
      r="40"
      stroke="#FF0000"
      strokeWidth="8"
      fill="none"
      strokeDasharray={`${2 * Math.PI * 40}`}
      strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
      strokeLinecap="round"
      className="transition-all duration-500"
    />
  </svg>
  
  {/* Center text */}
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="text-lg font-bold text-gray-900">
      {percentage}%
    </span>
  </div>
</div>
```

### 14.3 Bar Chart (Простой)

```tsx
<div className="space-y-3">
  {skills.map(skill => (
    <div key={skill.name}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-900">
          {skill.name}
        </span>
        <span className="text-sm font-semibold text-red-600">
          {skill.value}%
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-red-600"
          initial={{ width: 0 }}
          animate={{ width: `${skill.value}%` }}
          transition={{ duration: 1, delay: 0.2 }}
        />
      </div>
    </div>
  ))}
</div>
```

---

## 15. Темная тема (Dark Mode)

### Поддержка темной темы

```tsx
// tailwind.config.ts
module.exports = {
  darkMode: 'class', // или 'media' для системной темы
  // ...
}

// Использование
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  {/* Контент */}
</div>
```

### Основные цвета для темной темы

| Элемент | Light Mode | Dark Mode |
|---------|-----------|-----------|
| **Фон страницы** | `#F5F5F5` | `#000000` |
| **Фон карточки** | `#FFFFFF` | `#1A1A1A` |
| **Текст основной** | `#262626` | `#FFFFFF` |
| **Текст вторичный** | `#747474` | `#A3A3A3` |
| **Бордер** | `#E0E0E0` | `#333333` |

### Toggle Dark Mode

```tsx
<button
  onClick={toggleDarkMode}
  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center"
>
  {isDark ? '🌙' : '☀️'}
</button>
```

---

## 16. Производительность и оптимизация

### 16.1 Lighthouse Score Goals

- **Performance:** > 90
- **Accessibility:** > 95
- **Best Practices:** > 90
- **SEO:** > 90

### 16.2 Bundle Size

- **Initial load:** < 200KB (gzipped)
- **Total JavaScript:** < 500KB (gzipped)
- **Images:** WebP format, lazy loading

### 16.3 Core Web Vitals

- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### 16.4 Оптимизация

```tsx
// Ленивая загрузка изображений
<img
  src={image}
  loading="lazy"
  decoding="async"
/>

// Prefetch для следующей страницы
<link rel="prefetch" href="/profession/frontend" />

// Preload критичных ресурсов
<link rel="preload" as="image" href="/hero-image.webp" />
```

---

## 17. Брендирование HH.ru

### Ключевые элементы бренда

1. **Красный цвет (#FF0000)** - основной цвет бренда
2. **Логотип "hh"** - в красном квадрате со скругленными углами
3. **Чистый, минималистичный дизайн**
4. **Белый фон** с красными акцентами
5. **Крупные, читаемые шрифты**
6. **Пространство между элементами**

### История ребрендинга HH.ru

Согласно [интервью с дизайн-директором hh.group](https://www.setters.media/post/rebranding-headhunter):

#### 2016 год - Сокращение до "hh"
- **HeadHunter → hh.ru**
- Две строчные буквы вместо длинного названия
- Проблема: произношение ("хэ-хэ", "хэ-ха", "эйч-эйч")
- Решение: Узнаваемый визуальный ярлык

#### 2022-2024 - Look & Feel Revolution
> *"Был функциональный продукт, но он не вызывал эмоций"*

**Задачи ребрендинга:**
1. Создать эмоциональную связь с продуктом
2. Сделать интерфейс не просто инструментом, а приятным опытом
3. Соответствовать современному рыночному восприятию
4. Привлечь зумеров

**Ключевой инсайт:**
> *"Когда все одинаково, ты выбираешь по эмоции, по тому, что тебе кажется приятнее"*

### Применение к "Генератору Вайба"

Наш проект **уже в названии содержит слово "вайб"**, которое HH использует для описания своего нового подхода к дизайну!

#### Что мы берем из философии HH:

1. **Эмоциональность превыше всего**
   - Каждая профессия должна передавать свой уникальный "вайб"
   - Визуал + Звук + Интерактивность = Погружение

2. **Современный визуал**
   - Актуальные дизайн-тренды
   - Живые, не стоковые фото
   - Динамичные анимации

3. **Простота и узнаваемость**
   - Минималистичный интерфейс
   - Четкая визуальная иерархия
   - Интуитивная навигация

4. **Фокус на зумеров**
   - Быстрые интерфейсы
   - Визуальный контент
   - Мобильный опыт

### Логотип

```tsx
<div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
  <span className="text-white font-bold text-sm">hh</span>
</div>
```

### Использование красного цвета

- **Кнопки CTA** - красный фон
- **Активные элементы** - красный border
- **Акценты** - красный текст
- **Иконки** - красная заливка

### "Вайб" каждой профессии

Следуя философии HH, каждая профессия должна создавать свой уникальный **Look & Feel**:

#### IT-профессии (Frontend, DevOps)
- **Цвета:** Холодные синие, фиолетовые
- **Вайб:** Технологичность, современность
- **Звуки:** Клики клавиатуры, уведомления Slack

#### Креативные профессии (Дизайнер, UX)
- **Цвета:** Яркие, градиентные
- **Вайб:** Креативность, свобода
- **Звуки:** Музыка, шум кофейни

#### Традиционные профессии (Бариста, Менеджер)
- **Цвета:** Теплые, естественные
- **Вайб:** Человечность, общение
- **Звуки:** Разговоры, звуки заведения

---

## 18. Чек-лист разработчика

### ✅ Перед началом разработки

- [ ] Прочитана вся UI спецификация
- [ ] Установлены Tailwind CSS и необходимые библиотеки
- [ ] Настроены breakpoints и цвета в tailwind.config
- [ ] Добавлены PWA манифест и иконки

### ✅ Во время разработки

- [ ] Начинаю с мобильной версии (mobile-first)
- [ ] Использую правильные touch targets (min 44x44px)
- [ ] Добавляю safe-area-insets для iOS
- [ ] Тестирую на реальном мобильном устройстве
- [ ] Проверяю анимации и transitions
- [ ] Использую semantic HTML
- [ ] Добавляю aria-labels

### ✅ Перед релизом

- [ ] Тестирование на iOS (Safari)
- [ ] Тестирование на Android (Chrome)
- [ ] Проверка Lighthouse score
- [ ] Проверка accessibility (a11y)
- [ ] Тестирование offline режима
- [ ] Оптимизация изображений
- [ ] Проверка Core Web Vitals
- [ ] Тестирование на разных размерах экранов

---

## 19. Референсы и примеры

### Приложения для вдохновения

1. **HH.ru App** - основной референс для стиля и UX
2. **Telegram** - чат интерфейс, bottom sheets
3. **Instagram** - галерея изображений, истории
4. **Tinder** - swipe gestures, карточки
5. **Notion Mobile** - content layout, bottom navigation

### UI Kit библиотеки (опционально)

- **Headless UI** - доступные компоненты без стилей
- **Radix UI** - примитивы для компонентов
- **React Aria** - accessibility хуки
- **Framer Motion** - анимации и жесты

---

## 20. Заключение

Эта mobile-first UI спецификация создает современный, быстрый и удобный интерфейс для "Генератора Вайба", оптимизированный для мобильных устройств и следующий гайдлайнам HH.ru.

### Ключевые принципы

1. **Mobile First** - разработка начинается с мобильной версии
2. **Touch Friendly** - все элементы удобны для нажатия
3. **Performance** - быстрая загрузка на любых устройствах
4. **Accessibility** - доступность для всех пользователей
5. **HH.ru Branding** - следование фирменному стилю HH.ru

### Приоритеты

1. **UX > Визуал** - удобство важнее красоты
2. **Скорость > Функции** - быстрая работа важнее лишних возможностей
3. **Контент > Декорации** - контент на первом месте

---

**Версия:** 2.0 (Mobile First)  
**Дата:** 30 октября 2025  
**Проект:** Генератор Вайба (Хакатон HH.ru)  
**Платформа:** Progressive Web App (PWA)  
**Основной экран:** Mobile (375px+)
