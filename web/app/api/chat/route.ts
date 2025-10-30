
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ChatRequest, ChatResponse, UserPersona, Message } from '@/types/chat';
import fs from 'fs';
import path from 'path';
import { setupProxy } from '@/lib/proxy-config'; // Настройка прокси
import { logger } from '@/lib/logger';
import { 
  generateCard, 
  transliterate, 
  getCachedCard,
  generateProfessionClarificationQuestion,
  extractProfessionDescription
} from '@/lib/card-generator';

// Настраиваем прокси перед созданием клиента
setupProxy();

// Ленивая инициализация клиента Google AI
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY не найден в переменных окружения');
    }
    
    // Убеждаемся, что прокси настроен
    setupProxy();
    
    console.log('Инициализация GoogleGenAI клиента...');
    console.log('Прокси настроен:', {
      HTTP_PROXY: process.env.HTTP_PROXY ? 'да' : 'нет',
      HTTPS_PROXY: process.env.HTTPS_PROXY ? 'да' : 'нет',
    });
    
    aiClient = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }
  return aiClient;
}

// Load available professions
function getAvailableProfessions() {
  const dataDir = path.join(process.cwd(), 'data', 'professions');
  try {
    const files = fs.readdirSync(dataDir);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'));
        return {
          slug: data.slug,
          profession: data.profession,
          level: data.level,
          company: data.company,
          image: data.images?.[0] || null,
        };
      });
  } catch (error) {
    return [];
  }
}

// Intent Parser: определяет намерение пользователя
async function parseIntent(message: string, history: Message[]): Promise<{
  intent: 'search_profession' | 'uncertain' | 'clarification' | 'general_chat' | 'scenario_choice' | 'game_day' | 'compare_professions' | 'show_impact' | 'show_similar' | 'show_tasks' | 'show_career_details' | 'explain_levels' | 'save_card' | 'share_card';
  confidence: number;
  extractedInfo: Record<string, any>;
}> {
  const prompt = `Ты AI-ассистент для карьерного консультирования. Проанализируй сообщение пользователя и определи его намерение.

Возможные намерения:
- "search_profession": пользователь знает, какую профессию ищет или упоминает конкретные навыки/должности
- "uncertain": пользователь не знает, чего хочет, использует фразы типа "не знаю", "помоги выбрать", "что посоветуешь"
- "clarification": пользователь отвечает на уточняющий вопрос
- "scenario_choice": пользователь выбирает между "знаю профессию" или "не знаю"
- "game_day": пользователь хочет прожить день в профессии (фразы: "прожить день", "игровой день", "симуляция")
- "compare_professions": пользователь хочет сравнить профессии (фразы: "сравни", "в чем разница", "отличия")
- "show_impact": пользователь спрашивает о влиянии/ценности профессии (фразы: "какая польза", "зачем", "влияние")
- "show_similar": пользователь хочет похожие профессии (фразы: "похожие", "аналогичные", "альтернативы", "что еще")
- "show_tasks": пользователь хочет примеры задач (фразы: "пример задач", "что делает", "задачи", "обязанности")
- "show_career_details": пользователь спрашивает о карьерном росте (фразы: "карьера", "рост", "что дальше", "развитие")
- "explain_levels": пользователь спрашивает о различиях уровней (фразы: "отличие junior", "чем отличается middle", "разница между")
- "save_card": пользователь хочет сохранить карточку (фразы: "сохранить", "скачать", "PDF", "избранное")
- "share_card": пользователь хочет поделиться (фразы: "поделиться", "отправить", "ссылка")
- "general_chat": общение, приветствие, вопросы о сервисе

История диалога:
${history.slice(-3).map((m) => `${m.role}: ${m.content}`).join('\n')}

Текущее сообщение: "${message}"

Ответь ТОЛЬКО в формате JSON:
{
  "intent": "...",
  "confidence": 0.0-1.0,
  "extractedInfo": {
    "profession": "название профессии если упоминается",
    "skills": ["навык1", "навык2"],
    "level": "junior/middle/senior если упоминается",
    "interests": ["интерес1", "интерес2"],
    "professionsToCompare": ["профессия1", "профессия2"] - если хочет сравнить,
    "levelsToCompare": ["junior", "senior"] - если спрашивает о различиях уровней
  }
}`;

  try {
    const response = await getAIClient().models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error: any) {
    console.error('Intent parsing error:', error);
    console.error('Intent parsing error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      statusText: error?.statusText,
    });
    return {
      intent: 'general_chat',
      confidence: 0.5,
      extractedInfo: {},
    };
  }
}

// Persona Detector: анализирует и обновляет персону пользователя
async function detectPersona(
  message: string,
  history: Message[],
  currentPersona: UserPersona | null
): Promise<UserPersona> {
  const prompt = `Ты AI-ассистент для карьерного консультирования. На основе диалога определи профиль пользователя.

Текущий профиль: ${JSON.stringify(currentPersona || {})}

История диалога:
${history.slice(-5).map((m) => `${m.role}: ${m.content}`).join('\n')}

Новое сообщение: "${message}"

Определи и обнови профиль пользователя. Ответь ТОЛЬКО в формате JSON:
{
  "experience": "junior/middle/senior/none",
  "interests": ["интерес1", "интерес2"],
  "currentRole": "текущая роль если упоминается",
  "goals": ["цель1", "цель2"],
  "isUncertain": true/false
}`;

  try {
    const response = await getAIClient().models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error: any) {
    console.error('Persona detection error:', error);
    console.error('Persona detection error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
    });
    return currentPersona || { isUncertain: false };
  }
}

// Приветствие с выбором сценария
async function generateGreeting(): Promise<{ content: string; buttons: string[] }> {
  return {
    content: '👋 Привет! Хочешь почувствовать, каково быть в роли конкретного специалиста — или помочь тебе подобрать профессию, которая тебе подойдёт?',
    buttons: [
      '🎯 Я уже знаю профессию',
      '🤔 Помоги мне выбрать',
      '🎮 Прожить день в профессии',
      '⚖️ Сравнить профессии',
    ],
  };
}

// Генерация мягких вопросов для неопределившихся (Сценарий 2)
async function generateSoftQuestions(step: number, history: Message[]): Promise<{ content: string; buttons: string[] }> {
  const questions = [
    {
      content: 'Что тебе больше по душе?',
      buttons: ['⚙️ Логика', '🎨 Креатив', '💬 Общение', '📊 Аналитика'],
    },
    {
      content: 'Ты любишь работать в команде или сам по себе?',
      buttons: ['👥 В команде', '🧘 Самостоятельно', '⚖️ И так, и так'],
    },
    {
      content: 'Что тебе важнее в работе?',
      buttons: ['💰 Стабильность', '🚀 Драйв стартапа', '🎯 Смысл и польза', '🌟 Творчество'],
    },
  ];
  
  if (step >= 0 && step < questions.length) {
    return questions[step];
  }
  
  // Если все вопросы заданы, подбираем профессии
  return {
    content: 'Отлично! Сейчас подберу профессии под твой стиль 🎯',
    buttons: [],
  };
}

// Генерация игрового дня для профессии
async function generateGameDay(profession: string): Promise<{ content: string; buttons: string[]; metadata?: any }> {
  const ai = getAIClient();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Создай интерактивный "игровой день" для профессии "${profession}".

Опиши первую ситуацию рабочего дня (утро, 9:00-10:00), где пользователь должен сделать выбор.

Формат:
{
  "content": "Описание ситуации (2-3 предложения)",
  "situation": "короткое описание что происходит",
  "time": "09:00",
  "buttons": ["Действие 1", "Действие 2", "Действие 3"]
}

Пример для Frontend-разработчика:
{
  "content": "☕ 9:00 - Ты пришел в офис. На Slack 5 новых сообщений: коллега просит помочь с багом, PM напоминает о дедлайне, и тимлид приглашает на код-ревью. Что делаешь первым делом?",
  "situation": "morning_decisions",
  "time": "09:00",
  "buttons": ["Помочь с багом", "Идти на код-ревью", "Проверить свои задачи"]
}

Создай первую ситуацию для "${profession}":`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      content: result.content || `Начинаем игровой день в профессии ${profession}!`,
      buttons: result.buttons || ['Начать день', 'Выбрать другую профессию'],
      metadata: {
        isGameDay: true,
        profession,
        situation: result.situation || 'start',
        time: result.time || '09:00',
        step: 1,
      },
    };
  } catch (error: any) {
    console.error('Game day generation error:', error);
    return {
      content: `🎮 Игровой день для ${profession}! Представь, что ты начинаешь свой рабочий день. Что делаешь первым?`,
      buttons: ['Проверить почту', 'Выпить кофе', 'Начать работу'],
      metadata: {
        isGameDay: true,
        profession,
        step: 1,
      },
    };
  }
}

// Продолжение игрового дня (следующий шаг)
async function continueGameDay(
  profession: string,
  userChoice: string,
  currentStep: number,
  currentTime: string,
  currentSituation: string
): Promise<{ content: string; buttons: string[]; metadata?: any }> {
  const ai = getAIClient();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Продолжи интерактивный "игровой день" для профессии "${profession}".

Текущая ситуация: ${currentSituation}
Время: ${currentTime}
Шаг: ${currentStep}
Выбор пользователя: "${userChoice}"

Создай следующую ситуацию (через 1-2 часа). Всего должно быть 5-6 ситуаций за день.

Формат JSON:
{
  "content": "Описание что произошло после выбора + новая ситуация",
  "situation": "краткое описание",
  "time": "новое время (HH:00)",
  "buttons": ["Действие 1", "Действие 2", "Действие 3"],
  "isLastStep": false
}

Если это последняя ситуация дня (шаг 5-6), установи "isLastStep": true и добавь кнопки:
["Завершить день", "Начать заново", "Выбрать другую профессию"]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    const nextStep = currentStep + 1;
    
    return {
      content: result.content || 'Продолжаем день...',
      buttons: result.buttons || ['Продолжить', 'Завершить'],
      metadata: {
        isGameDay: true,
        profession,
        situation: result.situation || 'continue',
        time: result.time || currentTime,
        step: nextStep,
        isLastStep: result.isLastStep || nextStep >= 6,
      },
    };
  } catch (error: any) {
    console.error('Continue game day error:', error);
    return {
      content: 'День продолжается... Что делаешь дальше?',
      buttons: ['Продолжить работу', 'Сделать перерыв', 'Завершить день'],
      metadata: {
        isGameDay: true,
        profession,
        step: currentStep + 1,
      },
    };
  }
}

// Сравнение профессий
async function compareProfessions(profession1: string, profession2: string): Promise<{ content: string; comparison: any }> {
  const ai = getAIClient();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Сравни две профессии: "${profession1}" и "${profession2}".

Создай подробное сравнение по критериям:
- График работы
- Уровень стресса
- Навыки (hard/soft)
- Карьерный рост
- Влияние на продукт/компанию
- Формат работы (офис/удаленка)
- Зарплатная вилка

Формат JSON:
{
  "content": "Краткий вывод о главных различиях (2-3 предложения)",
  "comparison": {
    "schedule": {"profession1": "описание", "profession2": "описание"},
    "stress": {"profession1": "описание", "profession2": "описание"},
    "skills": {"profession1": ["навык1", "навык2"], "profession2": ["навык1", "навык2"]},
    "growth": {"profession1": "описание", "profession2": "описание"},
    "impact": {"profession1": "описание", "profession2": "описание"},
    "format": {"profession1": "описание", "profession2": "описание"},
    "salary": {"profession1": "диапазон", "profession2": "диапазон"}
  }
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      content: result.content || `Вот сравнение ${profession1} и ${profession2}:`,
      comparison: result.comparison || {},
    };
  } catch (error: any) {
    console.error('Compare professions error:', error);
    return {
      content: `Сравнение ${profession1} и ${profession2}. Обе профессии интересны по-своему!`,
      comparison: {},
    };
  }
}

// Показать похожие профессии
async function showSimilarProfessions(profession: string): Promise<{ content: string; cards: any[] }> {
  const ai = getAIClient();
  const professions = getAvailableProfessions();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Найди 3-4 профессии, похожие на "${profession}".

Доступные профессии:
${professions.map((p, i) => `${i + 1}. ${p.profession} (${p.level}, ${p.company}) - slug: ${p.slug}`).join('\n')}

Выбери профессии, которые:
- Имеют схожие навыки
- Похожи по типу работы
- Могут быть интересны специалисту из "${profession}"

Формат JSON:
{
  "content": "Краткое объяснение почему эти профессии похожи (1-2 предложения)",
  "professionSlugs": ["slug1", "slug2", "slug3"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    const selectedProfessions = professions.filter((p) =>
      result.professionSlugs?.includes(p.slug)
    );

    return {
      content: result.content || `Вот профессии, похожие на ${profession}:`,
      cards: selectedProfessions.map((p) => ({
        slug: p.slug,
        profession: p.profession,
        level: p.level,
        company: p.company,
        image: p.image,
      })),
    };
  } catch (error: any) {
    console.error('Similar professions error:', error);
    // Fallback: возвращаем несколько случайных профессий
    return {
      content: `Вот несколько интересных профессий, похожих на ${profession}:`,
      cards: professions.slice(0, 3),
    };
  }
}

// Показать примеры задач для профессии
async function showTaskExamples(profession: string): Promise<{ content: string; tasks: string[] }> {
  const ai = getAIClient();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Опиши типичные задачи для профессии "${profession}".

Создай 5-7 конкретных примеров задач, которые выполняет этот специалист в течение дня/недели.
Задачи должны быть реалистичными и понятными.

Формат JSON:
{
  "content": "Краткое введение (1 предложение)",
  "tasks": [
    "Задача 1 - конкретное описание",
    "Задача 2 - конкретное описание",
    "Задача 3 - конкретное описание",
    "..."
  ]
}

Пример для Frontend-разработчика:
{
  "content": "Вот типичные задачи Frontend-разработчика в течение рабочей недели:",
  "tasks": [
    "Реализовать адаптивную форму регистрации с валидацией полей",
    "Оптимизировать загрузку изображений для улучшения производительности сайта",
    "Провести код-ревью Pull Request коллеги",
    "Исправить баг с отображением модального окна на мобильных устройствах",
    "Интегрировать новый API для получения данных профиля пользователя"
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      content: result.content || `Типичные задачи для ${profession}:`,
      tasks: result.tasks || [],
    };
  } catch (error: any) {
    console.error('Task examples error:', error);
    return {
      content: `Типичные задачи для ${profession}:`,
      tasks: [
        'Работа над текущими проектами',
        'Общение с коллегами и командой',
        'Решение технических задач',
        'Участие в встречах и планировании',
      ],
    };
  }
}

// Детальная информация о карьерном пути
async function showCareerDetails(profession: string, currentLevel?: string): Promise<{ content: string; details: any }> {
  const ai = getAIClient();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Опиши детальный карьерный путь для профессии "${profession}"${currentLevel ? ` (текущий уровень: ${currentLevel})` : ''}.

Создай подробное описание карьерного роста с конкретными примерами и советами.

Формат JSON:
{
  "content": "Общее описание карьерного пути (2-3 предложения)",
  "levels": [
    {
      "level": "Junior",
      "duration": "1-2 года",
      "skills": ["навык1", "навык2"],
      "responsibilities": "Что делает на этом уровне",
      "salary": "диапазон зарплаты",
      "tips": "Советы для перехода на следующий уровень"
    },
    // ... для Middle, Senior, Lead/Principal
  ],
  "nextSteps": "Что делать для карьерного роста (если указан текущий уровень)"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.6,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      content: result.content || `Карьерный путь для ${profession}:`,
      details: result,
    };
  } catch (error: any) {
    console.error('Career details error:', error);
    return {
      content: `Карьерный путь для ${profession} обычно включает несколько уровней роста.`,
      details: {},
    };
  }
}

// Объяснить различия между уровнями
async function explainLevelDifferences(profession: string, levels: string[]): Promise<{ content: string; comparison: any }> {
  const ai = getAIClient();
  
  const level1 = levels[0] || 'Junior';
  const level2 = levels[1] || 'Senior';
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Объясни разницу между уровнями ${level1} и ${level2} для профессии "${profession}".

Создай детальное сравнение по ключевым критериям.

Формат JSON:
{
  "content": "Краткое резюме главных различий (2-3 предложения)",
  "comparison": {
    "experience": {
      "${level1}": "описание опыта",
      "${level2}": "описание опыта"
    },
    "responsibilities": {
      "${level1}": "описание обязанностей",
      "${level2}": "описание обязанностей"
    },
    "skills": {
      "${level1}": ["навык1", "навык2"],
      "${level2}": ["навык1", "навык2"]
    },
    "autonomy": {
      "${level1}": "уровень самостоятельности",
      "${level2}": "уровень самостоятельности"
    },
    "impact": {
      "${level1}": "влияние на проект/команду",
      "${level2}": "влияние на проект/команду"
    },
    "salary": {
      "${level1}": "диапазон",
      "${level2}": "диапазон"
    }
  }
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      content: result.content || `Вот главные различия между ${level1} и ${level2}:`,
      comparison: result.comparison || {},
    };
  } catch (error: any) {
    console.error('Level differences error:', error);
    return {
      content: `${level2} отличается от ${level1} более высоким уровнем ответственности, опыта и влияния на проект.`,
      comparison: {},
    };
  }
}

// Показать влияние профессии
async function showProfessionImpact(profession: string): Promise<{ content: string; impact: any }> {
  const ai = getAIClient();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Опиши влияние и ценность профессии "${profession}".

Покажи:
- Какую конкретную пользу приносит специалист
- Как его работа влияет на продукт/компанию
- Реальные примеры влияния (с цифрами если возможно)
- Почему эта профессия важна

Формат JSON:
{
  "content": "Эмоциональное описание влияния (2-3 предложения)",
  "impact": {
    "direct": "прямое влияние на продукт",
    "indirect": "косвенное влияние на компанию",
    "examples": ["пример 1 с цифрами", "пример 2"],
    "importance": "почему это важно"
  }
}

Пример для Data Scientist:
"Ты как Data Scientist сокращаешь время аналитики на 40% — это помогает компании экономить 1 млн рублей в год и принимать решения в 3 раза быстрее."`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.6,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      content: result.content || `Профессия ${profession} важна и приносит реальную пользу!`,
      impact: result.impact || {},
    };
  } catch (error: any) {
    console.error('Show impact error:', error);
    return {
      content: `Профессия ${profession} играет важную роль!`,
      impact: {},
    };
  }
}

// Генерация уточняющего вопроса об уровне опыта (адаптивный)
async function generateLevelQuestion(profession: string): Promise<{ content: string; buttons: string[] }> {
  const ai = getAIClient();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Для профессии "${profession}" создай вопрос об уровне опыта с релевантными вариантами ответов.

Важно:
- Для IT-профессий: Студент, Джун, Мидл, Сеньор
- Для рабочих профессий: Начинающий, Опытный, Мастер
- Для творческих профессий: Начинающий, С опытом, Профессионал
- Для других: адаптируй под профессию

Формат JSON:
{
  "content": "Вопрос об опыте",
  "buttons": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"]
}

Вопрос должен быть кратким и естественным.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      content: result.content || 'Какой у тебя уровень опыта?',
      buttons: result.buttons || ['Студент', 'Джун (Junior)', 'Мидл (Middle)', 'Сеньор (Senior)'],
    };
  } catch (error: any) {
    console.error('Ошибка генерации вопроса об уровне:', error);
    return {
      content: 'Какой у тебя уровень опыта?',
      buttons: ['Начинающий', 'С опытом', 'Опытный', 'Мастер'],
    };
  }
}

// Генерация уточняющего вопроса о формате работы (адаптивный)
async function generateWorkFormatQuestion(profession: string): Promise<{ content: string; buttons: string[] } | null> {
  const ai = getAIClient();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Для профессии "${profession}" определи, нужно ли спрашивать о формате работы (офис/удаленка).

Важно:
- Если профессия требует ФИЗИЧЕСКОГО ПРИСУТСТВИЯ (строитель, водитель, повар, массажист, специалист по канализации и т.д.) - верни null
- Если профессия может быть удаленной (IT, дизайн, маркетинг, аналитика) - создай вопрос

Формат JSON:
{
  "isRelevant": true/false,
  "content": "Вопрос о формате работы (если isRelevant=true)",
  "buttons": ["Офис", "Удалёнка", "Гибрид", "Не важно"] (если isRelevant=true)
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    if (!result.isRelevant) {
      return null; // Вопрос не релевантен для этой профессии
    }
    
    return {
      content: result.content || 'Предпочитаешь офис или удалёнку?',
      buttons: result.buttons || ['Офис', 'Удалёнка', 'Гибрид', 'Не важно'],
    };
  } catch (error: any) {
    console.error('Ошибка генерации вопроса о формате работы:', error);
    // В случае ошибки предполагаем, что вопрос не релевантен
    return null;
  }
}

// Генерация уточняющего вопроса о размере компании (адаптивный)
async function generateCompanySizeQuestion(profession: string): Promise<{ content: string; buttons: string[] }> {
  const ai = getAIClient();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Для профессии "${profession}" создай вопрос о месте работы с релевантными вариантами.

Важно:
- Для IT-профессий: Стартап, Средняя компания, Крупная корпорация, Не важно
- Для рабочих профессий: Частная фирма, Муниципальное предприятие, Крупная организация, Не важно
- Для творческих: Агентство, Фриланс, Крупная студия, Не важно
- Для медицинских: Частная клиника, Государственная больница, Медицинский центр, Не важно

Адаптируй варианты под конкретную профессию!

Формат JSON:
{
  "content": "Вопрос о месте работы",
  "buttons": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      content: result.content || 'Где ты хотел бы работать?',
      buttons: result.buttons || ['Частная организация', 'Государственная', 'Крупная компания', 'Не важно'],
    };
  } catch (error: any) {
    console.error('Ошибка генерации вопроса о месте работы:', error);
    return {
      content: 'Где ты хотел бы работать?',
      buttons: ['Частная организация', 'Государственная', 'Крупная компания', 'Не важно'],
    };
  }
}

// Генерация уточняющего вопроса о локации (адаптивный)
async function generateLocationQuestion(profession: string): Promise<{ content: string; buttons: string[] }> {
  const ai = getAIClient();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Для профессии "${profession}" создай вопрос о локации работы.

Формат JSON:
{
  "content": "В каком городе ты планируешь работать?",
  "buttons": ["Москва", "Санкт-Петербург", "Другой город", "Не важно"]
}

Вопрос должен быть естественным для этой профессии.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      content: result.content || 'В каком городе ты планируешь работать?',
      buttons: result.buttons || ['Москва', 'Санкт-Петербург', 'Другой город', 'Не важно'],
    };
  } catch (error: any) {
    console.error('Ошибка генерации вопроса о локации:', error);
    return {
      content: 'В каком городе ты планируешь работать?',
      buttons: ['Москва', 'Санкт-Петербург', 'Другой город', 'Не важно'],
    };
  }
}

// Генерация уточняющего вопроса о специализации
async function generateSpecializationQuestion(profession: string): Promise<{ content: string; buttons: string[] }> {
  const ai = getAIClient();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Для профессии "${profession}" предложи 3-4 возможные специализации или направления внутри этой профессии.

Например:
- Для "Бариста": "Кофейня в ТЦ", "Специализированная кофейня", "Кофейня в отеле", "Кофе-трак"
- Для "Frontend разработчик": "Финтех", "E-commerce", "Образовательные платформы", "Не важно"
- Для "Массажист": "Классический массаж", "Спортивный массаж", "Лечебный массаж", "Не важно"

Ответь ТОЛЬКО в формате JSON:
{
  "content": "В какой сфере внутри профессии вы бы хотели попробовать?",
  "buttons": ["Вариант 1", "Вариант 2", "Вариант 3", "Не важно"]
}

Кнопки должны быть короткими (2-4 слова) и релевантными для профессии "${profession}".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      content: result.content || 'В какой сфере внутри профессии вы бы хотели попробовать?',
      buttons: result.buttons || ['Вариант 1', 'Вариант 2', 'Вариант 3', 'Не важно'],
    };
  } catch (error: any) {
    console.error('Ошибка генерации вопроса о специализации:', error);
    return {
      content: 'В какой сфере внутри профессии вы бы хотели попробовать?',
      buttons: ['Финтех', 'Ритейл', 'Продуктовый магазин', 'Не важно'],
    };
  }
}

// Преобразование ответа пользователя в параметры
// Учитываем как полный текст кнопки, так и частичные совпадения
function mapLevelAnswer(answer: string): 'junior' | 'middle' | 'senior' | 'student' {
  const answerLower = answer.toLowerCase();
  // Проверяем полные совпадения с кнопками
  if (answerLower === 'студент' || answerLower.includes('студент')) return 'student';
  if (answerLower === 'джун (junior)' || answerLower.includes('джун') || answerLower.includes('junior')) return 'junior';
  if (answerLower === 'мидл (middle)' || answerLower.includes('мидл') || answerLower.includes('middle')) return 'middle';
  if (answerLower === 'сеньор (senior)' || answerLower.includes('сеньор') || answerLower.includes('senior')) return 'senior';
  return 'middle'; // По умолчанию
}

function mapWorkFormatAnswer(answer: string): 'office' | 'remote' | 'hybrid' | 'any' {
  const answerLower = answer.toLowerCase();
  // Проверяем полные совпадения с кнопками
  if (answerLower === 'офис' || answerLower.includes('офис')) return 'office';
  if (answerLower === 'удалёнка' || answerLower.includes('удален') || answerLower.includes('remote')) return 'remote';
  if (answerLower === 'гибрид' || answerLower.includes('гибрид')) return 'hybrid';
  if (answerLower === 'не важно' || answerLower.includes('не важно')) return 'any';
  return 'any';
}

function mapCompanySizeAnswer(answer: string): 'startup' | 'medium' | 'large' | 'any' {
  const answerLower = answer.toLowerCase();
  // Проверяем полные совпадения с кнопками
  if (answerLower === 'стартап' || answerLower.includes('стартап')) return 'startup';
  if (answerLower === 'средняя компания' || answerLower.includes('средн')) return 'medium';
  if (answerLower === 'крупная корпорация' || answerLower.includes('крупн') || answerLower.includes('корпорац')) return 'large';
  if (answerLower === 'не важно' || answerLower.includes('не важно') || answerLower.includes('любое')) return 'any';
  return 'any';
}

function mapLocationAnswer(answer: string): 'moscow' | 'spb' | 'other' | 'remote' {
  const answerLower = answer.toLowerCase();
  // Проверяем полные совпадения с кнопками
  if (answerLower === 'москва' || answerLower.includes('москв')) return 'moscow';
  if (answerLower === 'санкт-петербург' || answerLower.includes('санкт') || answerLower.includes('петербург') || answerLower.includes('спб')) return 'spb';
  if (answerLower === 'удалённо' || answerLower.includes('удален') || answerLower.includes('remote')) return 'remote';
  if (answerLower === 'другой город' || answerLower.includes('другой') || answerLower.includes('не важно')) return 'other';
  return 'other';
}

// Clarifier: генерирует уточняющие вопросы
async function generateClarifyingQuestions(
  intent: any,
  persona: UserPersona
): Promise<{ content: string; buttons: string[] }> {
  const professions = getAvailableProfessions();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Сгенерируй 2-3 уточняющих вопроса для пользователя.

Намерение: ${intent.intent}
Извлеченная информация: ${JSON.stringify(intent.extractedInfo)}
Профиль пользователя: ${JSON.stringify(persona)}

Доступные профессии: ${professions.map((p) => p.profession).join(', ')}

${persona.isUncertain ? `
ВАЖНО: Пользователь не знает, чего хочет. Задай вопросы, которые помогут определить:
- Его интересы и хобби
- Что ему нравится делать
- Какие навыки у него есть
- Что для него важно в работе (стабильность, творчество, деньги, помощь людям и т.д.)
` : `
ВАЖНО: Пользователь ищет конкретную профессию или направление. Уточни:
- Уровень опыта
- Предпочитаемую сферу
- Что важно в работе
`}

Ответь ТОЛЬКО в формате JSON:
{
  "content": "текст вопроса",
  "buttons": ["вариант 1", "вариант 2", "вариант 3"]
}

Кнопки должны быть короткими (2-4 слова) и конкретными.`;

  try {
    const response = await getAIClient().models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    // Гарантируем наличие обязательных полей
    return {
      content: result.content || 'Расскажи подробнее о том, что тебя интересует?',
      buttons: result.buttons || ['Разработка', 'Дизайн', 'Менеджмент', 'Не уверен'],
    };
  } catch (error: any) {
    console.error('Clarifying questions error:', error);
    console.error('Clarifying questions error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
    });
    return {
      content: 'Расскажи подробнее о том, что тебя интересует?',
      buttons: ['Разработка', 'Дизайн', 'Менеджмент', 'Не уверен'],
    };
  }
}

// Получение списка профессий из HH API на основе ключевых слов
async function fetchProfessionsFromHH(
  keywords: string[],
  limit: number = 20
): Promise<Array<{ name: string; count: number; area?: string }>> {
  try {
    // Собираем уникальные профессии из HH API
    const professionsMap = new Map<string, number>();
    
    // Для каждого ключевого слова делаем запрос к HH API
    for (const keyword of keywords) {
      try {
        const response = await fetch(
          `https://api.hh.ru/vacancies?text=${encodeURIComponent(keyword)}&per_page=100&area=113&order_by=relevance`,
          { headers: { 'User-Agent': 'HH-Vibe-Career-App/1.0' } }
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Извлекаем названия профессий из вакансий
        data.items?.forEach((vacancy: any) => {
          if (!vacancy.name) return;
          
          // Очищаем название от компании и лишних слов
          let professionName = vacancy.name
            .replace(/\(.*?\)/g, '') // Убираем скобки
            .replace(/\s*в\s+компани[юи].*$/i, '') // Убираем "в компании X"
            .replace(/\s*-\s*удалённо.*$/i, '') // Убираем "- удалённо"
            .replace(/\s+/g, ' ')
            .trim();
          
          // Берем только первую часть до запятой или слеша
          professionName = professionName.split(/[,/]/)[0].trim();
          
          // Пропускаем слишком длинные или короткие названия
          if (professionName.length < 3 || professionName.length > 50) return;
          
          // Считаем частоту встречаемости
          const currentCount = professionsMap.get(professionName) || 0;
          professionsMap.set(professionName, currentCount + 1);
        });
      } catch (err) {
        logger.error('Ошибка запроса к HH API', err, { keyword });
        continue;
      }
    }
    
    // Сортируем по частоте и берем топ
    const sortedProfessions = Array.from(professionsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
    
    logger.info('Получены профессии из HH API', { 
      count: sortedProfessions.length, 
      keywords 
    });
    
    return sortedProfessions;
  } catch (error: any) {
    logger.error('Ошибка получения профессий из HH API', error);
    return [];
  }
}

// Uncertain User Flow: подбор профессий для неопределившихся (с использованием HH API)
async function suggestProfessionsForUncertainUser(
  persona: UserPersona,
  history: Message[]
): Promise<{ content: string; cards: any[] }> {
  const conversationContext = history
    .slice(-10)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  // Шаг 1: Используем LLM для анализа интересов и генерации ключевых слов для HH
  const keywordsPrompt = `Ты AI-ассистент для карьерного консультирования. Проанализируй диалог с пользователем и определи, какие профессии могут ему подойти.

Профиль пользователя: ${JSON.stringify(persona)}

История диалога:
${conversationContext}

На основе интересов, навыков и предпочтений пользователя, сгенерируй 5-7 ключевых слов для поиска профессий в базе вакансий (например: "разработка", "дизайн", "продажи", "менеджмент", "аналитика" и т.д.).

Ключевые слова должны быть:
- Конкретными и релевантными интересам пользователя
- На русском языке
- Подходящими для поиска вакансий

Ответь ТОЛЬКО в формате JSON:
{
  "keywords": ["ключевое слово 1", "ключевое слово 2", ...],
  "reasoning": "короткое объяснение почему выбраны эти направления"
}`;

  let keywords: string[] = [];
  let reasoning = '';
  
  try {
    const keywordsResponse = await getAIClient().models.generateContent({
      model: 'gemini-2.0-flash',
      contents: keywordsPrompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    const keywordsResult = JSON.parse(keywordsResponse.text || '{}');
    keywords = keywordsResult.keywords || [];
    reasoning = keywordsResult.reasoning || '';
    
    logger.info('Сгенерированы ключевые слова для HH', { keywords, reasoning });
  } catch (error: any) {
    logger.error('Ошибка генерации ключевых слов', error);
    // Fallback: используем базовые ключевые слова
    keywords = ['разработка', 'менеджмент', 'дизайн', 'аналитика'];
  }

  // Шаг 2: Получаем список профессий из HH API
  const hhProfessions = await fetchProfessionsFromHH(keywords, 30);
  
  // Шаг 3: Также получаем уже существующие профессии для возможности показа готовых карточек
  const existingProfessions = getAvailableProfessions();
  
  // Шаг 4: Используем LLM для выбора наиболее подходящих профессий
  const selectionPrompt = `Ты AI-ассистент для карьерного консультирования. Из списка профессий выбери 3-5 наиболее подходящих для пользователя.

Профиль пользователя: ${JSON.stringify(persona)}

История диалога:
${conversationContext}

Доступные профессии из HeadHunter (актуальные вакансии):
${hhProfessions.map((p, i) => `${i + 1}. ${p.name} (${p.count} вакансий)`).join('\n')}

Существующие готовые карточки профессий:
${existingProfessions.map((p, i) => `${i + 1}. ${p.profession} (${p.level}) - slug: ${p.slug}`).join('\n')}

ВАЖНО:
1. Приоритетно выбирай профессии из "Существующих готовых карточек", так как для них уже есть детальная информация
2. Если в готовых карточках нет подходящих вариантов, выбирай из списка HH
3. Выбирай профессии, которые реально соответствуют интересам и навыкам пользователя
4. Учитывай количество вакансий - больше вакансий = больше возможностей

Ответь ТОЛЬКО в формате JSON:
{
  "content": "короткое персональное объяснение (2-3 предложения) почему эти профессии подходят",
  "selectedProfessions": [
    {
      "name": "название профессии",
      "source": "existing" или "hh",
      "slug": "slug если source=existing, иначе null",
      "reason": "почему эта профессия подходит (1 предложение)"
    }
  ]
}`;

  try {
    const selectionResponse = await getAIClient().models.generateContent({
      model: 'gemini-2.0-flash',
      contents: selectionPrompt,
      config: {
        temperature: 0.6,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(selectionResponse.text || '{}');
    const selectedProfessions = result.selectedProfessions || [];
    
    // Формируем карточки для ответа
    const cards: any[] = [];
    
    for (const selected of selectedProfessions) {
      if (selected.source === 'existing' && selected.slug) {
        // Используем существующую карточку
        const existing = existingProfessions.find(p => p.slug === selected.slug);
        if (existing) {
          cards.push({
            slug: existing.slug,
            profession: existing.profession,
            level: existing.level,
            company: existing.company,
            image: existing.image,
          });
        }
      } else if (selected.source === 'hh') {
        // Для профессий из HH создаем "виртуальную" карточку
        // которая будет сгенерирована при клике
        const professionSlug = transliterate(selected.name);
        cards.push({
          slug: professionSlug,
          profession: selected.name,
          level: 'Middle', // По умолчанию
          company: 'IT-компания',
          image: null,
          isVirtual: true, // Флаг что карточка будет сгенерирована
        });
      }
    }
    
    // Ограничиваем до 5 карточек
    const finalCards = cards.slice(0, 5);
    
    logger.info('Подобраны профессии для пользователя', { 
      count: finalCards.length,
      existing: finalCards.filter(c => !c.isVirtual).length,
      virtual: finalCards.filter(c => c.isVirtual).length
    });

    return {
      content: result.content || 'Вот несколько интересных профессий для тебя:',
      cards: finalCards,
    };
  } catch (error: any) {
    logger.error('Ошибка подбора профессий', error);
    
    // Fallback: возвращаем существующие профессии
    return {
      content: 'Вот несколько интересных профессий для тебя:',
      cards: existingProfessions.slice(0, 3).map((p) => ({
        slug: p.slug,
        profession: p.profession,
        level: p.level,
        company: p.company,
        image: p.image,
      })),
    };
  }
}

// Search Professions: поиск профессий по запросу
async function searchProfessions(
  query: string,
  extractedInfo: any
): Promise<{ content: string; cards: any[]; shouldGenerate?: boolean; professionToGenerate?: string }> {
  const professions = getAvailableProfessions();
  const queryTrimmed = query.trim();
  
  // Прямая проверка: если есть название профессии в extractedInfo, ищем по slug
  if (extractedInfo?.profession) {
    const professionName = extractedInfo.profession.trim();
    const professionSlug = transliterate(professionName);
    
    // Проверяем кеш напрямую
    const cachedProfession = await getCachedCard(professionSlug);
    if (cachedProfession) {
      return {
        content: 'Вот что я нашел:',
        cards: [{
          slug: cachedProfession.slug,
          profession: cachedProfession.profession,
          level: cachedProfession.level,
          company: cachedProfession.company,
          image: cachedProfession.images?.[0] || null,
        }],
      };
    }
    
    // Ищем по точному совпадению названия в существующих профессиях
    const exactMatch = professions.find((p) => 
      p.profession.toLowerCase() === professionName.toLowerCase() ||
      p.slug === professionSlug
    );
    
    if (exactMatch) {
      return {
        content: 'Вот что я нашел:',
        cards: [exactMatch],
      };
    }
    
    // Если профессия не найдена, но есть название - запускаем генерацию
    return {
      content: `Профессия "${professionName}" не найдена в базе. Генерирую карточку...`,
      cards: [],
      shouldGenerate: true,
      professionToGenerate: professionName,
    };
  }
  
  // Прямая проверка по запросу пользователя (если запрос короткий и похож на название профессии)
  if (queryTrimmed.length > 0 && queryTrimmed.length < 50) {
    const querySlug = transliterate(queryTrimmed);
    
    // Проверяем кеш напрямую
    const cachedProfession = await getCachedCard(querySlug);
    if (cachedProfession) {
      return {
        content: 'Вот что я нашел:',
        cards: [{
          slug: cachedProfession.slug,
          profession: cachedProfession.profession,
          level: cachedProfession.level,
          company: cachedProfession.company,
          image: cachedProfession.images?.[0] || null,
        }],
      };
    }
    
    // Ищем по точному совпадению названия в существующих профессиях
    const exactMatch = professions.find((p) => 
      p.profession.toLowerCase() === queryTrimmed.toLowerCase() ||
      p.slug === querySlug ||
      queryTrimmed.toLowerCase().includes(p.profession.toLowerCase()) ||
      p.profession.toLowerCase().includes(queryTrimmed.toLowerCase())
    );
    
    if (exactMatch) {
      return {
        content: 'Вот что я нашел:',
        cards: [exactMatch],
      };
    }
  }
  
  // Если нет точного названия профессии, используем AI для поиска
  const prompt = `Ты AI-ассистент для карьерного консультирования. Найди профессии, соответствующие запросу пользователя.

Запрос: "${query}"
Извлеченная информация: ${JSON.stringify(extractedInfo)}

Доступные профессии (формат: название профессии -> slug):
${professions.map((p, i) => `${i + 1}. "${p.profession}" -> slug: "${p.slug}" (${p.level}, ${p.company})`).join('\n')}

ВАЖНО: Если запрос пользователя точно соответствует названию профессии из списка, верни её slug. Если запрос похож на профессию из списка, верни соответствующий slug.

Ответь ТОЛЬКО в формате JSON:
{
  "content": "короткий комментарий о найденных профессиях",
  "professionSlugs": ["slug1", "slug2"]
}`;

  try {
    const response = await getAIClient().models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    const selectedProfessions = professions.filter((p) =>
      result.professionSlugs?.includes(p.slug)
    );

    if (selectedProfessions.length === 0) {
      // Пробуем найти по частичному совпадению названия
      const queryLower = query.toLowerCase();
      const partialMatches = professions.filter((p) =>
        p.profession.toLowerCase().includes(queryLower) ||
        queryLower.includes(p.profession.toLowerCase())
      );
      
      if (partialMatches.length > 0) {
        return {
          content: result.content || 'Вот что я нашел:',
          cards: partialMatches.slice(0, 3),
        };
      }
      
      // Если не найдено в существующих профессиях, пробуем найти в HH
      logger.info('Поиск профессий в HH API', { query });
      try {
        const hhProfessions = await fetchProfessionsFromHH([query], 10);
        
        if (hhProfessions.length > 0) {
          // Используем LLM для выбора наиболее релевантной профессии
          const hhSelectionPrompt = `Из списка профессий выбери 1-3 наиболее точно соответствующих запросу пользователя "${query}".

Доступные профессии из HeadHunter:
${hhProfessions.map((p, i) => `${i + 1}. ${p.name} (${p.count} вакансий)`).join('\n')}

Выбирай профессии, которые максимально точно соответствуют запросу.

Ответь ТОЛЬКО в формате JSON:
{
  "content": "короткое объяснение",
  "selectedNames": ["название профессии 1", "название профессии 2"]
}`;

          const hhSelectionResponse = await getAIClient().models.generateContent({
            model: 'gemini-2.0-flash',
            contents: hhSelectionPrompt,
            config: {
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          });

          const hhResult = JSON.parse(hhSelectionResponse.text || '{}');
          const selectedHHProfessions = hhProfessions.filter(p => 
            hhResult.selectedNames?.includes(p.name)
          );
          
          if (selectedHHProfessions.length > 0) {
            // Возвращаем виртуальные карточки из HH
            const hhCards = selectedHHProfessions.map(p => ({
              slug: transliterate(p.name),
              profession: p.name,
              level: 'Middle',
              company: 'IT-компания',
              image: null,
              isVirtual: true,
              vacanciesCount: p.count,
            }));
            
            return {
              content: hhResult.content || `Нашел ${hhCards.length} ${hhCards.length === 1 ? 'профессию' : 'профессии'} по запросу "${query}" в базе вакансий:`,
              cards: hhCards,
            };
          }
        }
      } catch (error: any) {
        logger.error('Ошибка поиска в HH API', error, { query });
      }
      
      // Если не найдено и запрос похож на название профессии, пытаемся сгенерировать
      if (queryTrimmed.length > 0 && queryTrimmed.length < 50) {
        return {
          content: `Ищу информацию о профессии "${queryTrimmed}"...`,
          cards: [],
          shouldGenerate: true,
          professionToGenerate: queryTrimmed,
        };
      }
      
      return {
        content: 'К сожалению, пока нет профессий, точно соответствующих твоему запросу. Вот что есть:',
        cards: professions.slice(0, 3),
      };
    }

    return {
      content: result.content || 'Вот что я нашел:',
      cards: selectedProfessions,
    };
  } catch (error: any) {
    console.error('Search error:', error);
    console.error('Search error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
    });
    return {
      content: 'Вот что я нашел:',
      cards: professions.slice(0, 2),
    };
  }
}

// Main handler
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  try {
    const body: ChatRequest = await request.json();
    const { message, history, persona: currentPersona } = body;
    
    logger.info('Chat API: получен запрос', { 
      messageLength: message.length, 
      historyLength: history.length,
      hasPersona: !!currentPersona
    });

    // Шаг 0: Если это первое сообщение - показываем приветствие с выбором сценария
    if (history.length === 0) {
      logger.debug('Chat API: первое сообщение, показываем приветствие');
      const greeting = await generateGreeting();
      const chatResponse: ChatResponse = {
        message: {
          type: 'buttons',
          content: greeting.content,
          buttons: greeting.buttons,
          metadata: {
            isGreeting: true,
          },
        },
        persona: currentPersona || { isUncertain: false },
        stage: 'initial',
      };
      logger.info('Chat API: ответ (приветствие)', { duration: Date.now() - requestStartTime });
      return NextResponse.json(chatResponse);
    }

    // Step 1: Parse intent
    logger.trace('Chat API: парсинг intent', { message });
    const intentStartTime = Date.now();
    const intent = await parseIntent(message, history);
    logger.debug('Chat API: intent определен', { 
      intent: intent.intent, 
      confidence: intent.confidence,
      duration: Date.now() - intentStartTime
    });

    // Step 2: Detect/update persona
    const personaStartTime = Date.now();
    const persona = await detectPersona(message, history, currentPersona || null);
    logger.debug('Chat API: persona обновлена', { 
      persona, 
      duration: Date.now() - personaStartTime 
    });

    // Step 3: Проверяем контекст предыдущего сообщения
    const lastAssistantMessage = history
      .slice()
      .reverse()
      .find((m) => m.role === 'assistant');
    
    const isAnsweringProfessionClarification = lastAssistantMessage?.metadata?.isProfessionClarification === true;
    const professionToClarify = lastAssistantMessage?.metadata?.professionToClarify;
    
    // Проверяем, на каком этапе уточняющих вопросов мы находимся
    const clarificationStep = lastAssistantMessage?.metadata?.clarificationStep;
    const professionForClarification = lastAssistantMessage?.metadata?.professionForClarification;
    
    // Проверяем игровой день
    const isInGameDay = lastAssistantMessage?.metadata?.isGameDay === true;
    const gameDayProfession = lastAssistantMessage?.metadata?.profession;
    const gameDayStep = lastAssistantMessage?.metadata?.step || 1;
    const gameDayTime = lastAssistantMessage?.metadata?.time || '09:00';
    const gameDaySituation = lastAssistantMessage?.metadata?.situation || 'start';
    const isLastGameDayStep = lastAssistantMessage?.metadata?.isLastStep === true;
    
    // Проверяем сценарий "не знаю профессию"
    const isInUncertainFlow = lastAssistantMessage?.metadata?.uncertainFlow === true;
    const uncertainFlowStep = lastAssistantMessage?.metadata?.uncertainFlowStep || 0;

    // Step 4: Decide response based on intent and context
    let responseMessage: any = {
      type: 'text',
      content: 'Как я могу помочь?',
    };

    let stage: ChatResponse['stage'] = 'initial';

    // Обработка выбора сценария из приветствия
    if (lastAssistantMessage?.metadata?.isGreeting === true) {
      const messageLower = message.toLowerCase();
      
      if (messageLower.includes('знаю профессию') || messageLower.includes('🎯')) {
        // Сценарий 1: Знаю профессию
        responseMessage = {
          type: 'text',
          content: 'Отлично! Напиши название профессии, которая тебя интересует, и я покажу её вайб ✨',
        };
        stage = 'initial';
      } else if (messageLower.includes('помоги') || messageLower.includes('выбрать') || messageLower.includes('🤔')) {
        // Сценарий 2: Не знаю профессию
        persona.isUncertain = true;
        const questions = await generateSoftQuestions(0, history);
        responseMessage = {
          type: 'buttons',
          content: `Окей, давай нащупаем твой вайб 🌿\n\n${questions.content}`,
          buttons: questions.buttons,
          metadata: {
            uncertainFlow: true,
            uncertainFlowStep: 0,
          },
        };
        stage = 'clarifying';
      } else if (messageLower.includes('прожить день') || messageLower.includes('🎮')) {
        // Сценарий 3: Игровой день
        responseMessage = {
          type: 'text',
          content: 'Круто! Напиши название профессии, и ты проживёшь целый рабочий день в этой роли 🎮',
          metadata: {
            awaitingGameDayProfession: true,
          },
        };
        stage = 'initial';
      } else if (messageLower.includes('сравнить') || messageLower.includes('⚖️')) {
        // Сценарий 4: Сравнить профессии
        responseMessage = {
          type: 'text',
          content: 'Интересно! Напиши две профессии через запятую, и я сравню их для тебя. Например: "Frontend-разработчик, Backend-разработчик"',
          metadata: {
            awaitingCompareProfessions: true,
          },
        };
        stage = 'initial';
      } else {
        // Если непонятный ответ, повторяем приветствие
        const greeting = await generateGreeting();
        responseMessage = {
          type: 'buttons',
          content: greeting.content,
          buttons: greeting.buttons,
          metadata: {
            isGreeting: true,
          },
        };
        stage = 'initial';
      }
    }
    // Обработка игрового дня
    else if (isInGameDay && gameDayProfession) {
      if (isLastGameDayStep || message.toLowerCase().includes('завершить')) {
        // Конец игрового дня
        responseMessage = {
          type: 'text',
          content: `🎉 Отличная работа! Ты прожил день как ${gameDayProfession}. Теперь ты лучше понимаешь, каково работать в этой профессии!\n\nХочешь посмотреть полную карточку профессии или выбрать другую?`,
          buttons: ['Показать карточку', 'Выбрать другую профессию', 'Главное меню'],
        };
        stage = 'showing_results';
      } else {
        // Продолжаем игровой день
        const nextStep = await continueGameDay(
          gameDayProfession,
          message,
          gameDayStep,
          gameDayTime,
          gameDaySituation
        );
        responseMessage = {
          type: 'buttons',
          content: nextStep.content,
          buttons: nextStep.buttons,
          metadata: nextStep.metadata,
        };
        stage = 'clarifying';
      }
    }
    // Ожидаем профессию для игрового дня
    else if (lastAssistantMessage?.metadata?.awaitingGameDayProfession === true) {
      const professionName = intent.extractedInfo?.profession || message.trim();
      const gameDay = await generateGameDay(professionName);
      responseMessage = {
        type: 'buttons',
        content: gameDay.content,
        buttons: gameDay.buttons,
        metadata: gameDay.metadata,
      };
      stage = 'clarifying';
    }
    // Ожидаем профессии для сравнения
    else if (lastAssistantMessage?.metadata?.awaitingCompareProfessions === true) {
      const parts = message.split(',').map((s) => s.trim());
      if (parts.length >= 2) {
        const comparison = await compareProfessions(parts[0], parts[1]);
        
        // Форматируем сравнение для отображения
        let comparisonText = `${comparison.content}\n\n`;
        if (comparison.comparison && Object.keys(comparison.comparison).length > 0) {
          comparisonText += `📊 **${parts[0]}** vs **${parts[1]}**\n\n`;
          
          const labels: Record<string, string> = {
            schedule: '📅 График',
            stress: '😰 Стресс',
            skills: '🎯 Навыки',
            growth: '📈 Карьерный рост',
            impact: '💡 Влияние',
            format: '🏢 Формат работы',
            salary: '💰 Зарплата',
          };
          
          for (const [key, label] of Object.entries(labels)) {
            if (comparison.comparison[key]) {
              comparisonText += `${label}:\n`;
              comparisonText += `• ${parts[0]}: ${comparison.comparison[key].profession1}\n`;
              comparisonText += `• ${parts[1]}: ${comparison.comparison[key].profession2}\n\n`;
            }
          }
        }
        
        responseMessage = {
          type: 'text',
          content: comparisonText,
        };
        stage = 'showing_results';
      } else {
        responseMessage = {
          type: 'text',
          content: 'Пожалуйста, укажи две профессии через запятую. Например: "Бариста, Массажист"',
          metadata: {
            awaitingCompareProfessions: true,
          },
        };
        stage = 'initial';
      }
    }
    // Сценарий 2: Обработка мягких вопросов для неопределившихся
    else if (isInUncertainFlow && uncertainFlowStep < 3) {
      // Сохраняем ответ в персону
      if (uncertainFlowStep === 0) {
        persona.interests = persona.interests || [];
        persona.interests.push(message);
      } else if (uncertainFlowStep === 1) {
        persona.workStyle = message;
      } else if (uncertainFlowStep === 2) {
        persona.values = message;
      }
      
      const nextStep = uncertainFlowStep + 1;
      
      if (nextStep < 3) {
        // Задаем следующий вопрос
        const questions = await generateSoftQuestions(nextStep, history);
        responseMessage = {
          type: 'buttons',
          content: questions.content,
          buttons: questions.buttons,
          metadata: {
            uncertainFlow: true,
            uncertainFlowStep: nextStep,
          },
        };
        stage = 'clarifying';
      } else {
        // Все вопросы заданы, подбираем профессии
        const suggestions = await suggestProfessionsForUncertainUser(persona, history);
        responseMessage = {
          type: 'cards',
          content: `${suggestions.content}\n\nВыбери любую, чтобы узнать больше!`,
          cards: suggestions.cards,
        };
        stage = 'showing_results';
      }
    }
    // Обработка запроса о влиянии профессии
    else if (intent.intent === 'show_impact') {
      const professionName = intent.extractedInfo?.profession || 'Frontend разработчик';
      const impactInfo = await showProfessionImpact(professionName);
      
      let impactText = `${impactInfo.content}\n\n`;
      if (impactInfo.impact && Object.keys(impactInfo.impact).length > 0) {
        impactText += `💡 **Влияние ${professionName}:**\n\n`;
        if (impactInfo.impact.direct) {
          impactText += `🎯 Прямое влияние: ${impactInfo.impact.direct}\n\n`;
        }
        if (impactInfo.impact.indirect) {
          impactText += `🌊 Косвенное влияние: ${impactInfo.impact.indirect}\n\n`;
        }
        if (impactInfo.impact.examples && impactInfo.impact.examples.length > 0) {
          impactText += `📊 Примеры:\n`;
          impactInfo.impact.examples.forEach((ex: string) => {
            impactText += `• ${ex}\n`;
          });
          impactText += '\n';
        }
        if (impactInfo.impact.importance) {
          impactText += `⭐ Почему это важно: ${impactInfo.impact.importance}`;
        }
      }
      
      responseMessage = {
        type: 'text',
        content: impactText,
      };
      stage = 'showing_results';
    }
    // Обработка запроса похожих профессий
    else if (intent.intent === 'show_similar') {
      const professionName = intent.extractedInfo?.profession || 
        (lastAssistantMessage?.cards?.[0]?.profession) || 
        'Frontend разработчик';
      
      const similarInfo = await showSimilarProfessions(professionName);
      
      responseMessage = {
        type: 'cards',
        content: similarInfo.content,
        cards: similarInfo.cards,
      };
      stage = 'showing_results';
    }
    // Обработка запроса примеров задач
    else if (intent.intent === 'show_tasks') {
      const professionName = intent.extractedInfo?.profession || 
        (lastAssistantMessage?.cards?.[0]?.profession) || 
        'Frontend разработчик';
      
      const tasksInfo = await showTaskExamples(professionName);
      
      let tasksText = `${tasksInfo.content}\n\n`;
      if (tasksInfo.tasks && tasksInfo.tasks.length > 0) {
        tasksInfo.tasks.forEach((task: string, index: number) => {
          tasksText += `${index + 1}. ${task}\n`;
        });
      }
      
      responseMessage = {
        type: 'text',
        content: tasksText,
        buttons: ['Показать похожие профессии', 'Карьерный путь', 'Главное меню'],
      };
      stage = 'showing_results';
    }
    // Обработка запроса о карьерном росте
    else if (intent.intent === 'show_career_details') {
      const professionName = intent.extractedInfo?.profession || 
        (lastAssistantMessage?.cards?.[0]?.profession) || 
        'Frontend разработчик';
      const currentLevel = intent.extractedInfo?.level;
      
      const careerInfo = await showCareerDetails(professionName, currentLevel);
      
      let careerText = `${careerInfo.content}\n\n`;
      if (careerInfo.details?.levels && careerInfo.details.levels.length > 0) {
        careerText += `📈 **Уровни карьерного роста:**\n\n`;
        careerInfo.details.levels.forEach((level: any) => {
          careerText += `**${level.level}** (${level.duration})\n`;
          careerText += `💼 Обязанности: ${level.responsibilities}\n`;
          careerText += `💰 Зарплата: ${level.salary}\n`;
          if (level.tips) {
            careerText += `💡 Советы: ${level.tips}\n`;
          }
          careerText += '\n';
        });
      }
      if (careerInfo.details?.nextSteps) {
        careerText += `🎯 **Следующие шаги:** ${careerInfo.details.nextSteps}`;
      }
      
      responseMessage = {
        type: 'text',
        content: careerText,
        buttons: ['Показать похожие профессии', 'Примеры задач', 'Главное меню'],
      };
      stage = 'showing_results';
    }
    // Обработка запроса о различиях уровней
    else if (intent.intent === 'explain_levels') {
      const professionName = intent.extractedInfo?.profession || 
        (lastAssistantMessage?.cards?.[0]?.profession) || 
        'Frontend разработчик';
      const levels = intent.extractedInfo?.levelsToCompare || ['Junior', 'Senior'];
      
      const levelInfo = await explainLevelDifferences(professionName, levels);
      
      let levelText = `${levelInfo.content}\n\n`;
      if (levelInfo.comparison && Object.keys(levelInfo.comparison).length > 0) {
        levelText += `📊 **Сравнение ${levels[0]} vs ${levels[1]}:**\n\n`;
        
        const labels: Record<string, string> = {
          experience: '📚 Опыт',
          responsibilities: '💼 Обязанности',
          skills: '🎯 Навыки',
          autonomy: '🚀 Самостоятельность',
          impact: '💡 Влияние',
          salary: '💰 Зарплата',
        };
        
        for (const [key, label] of Object.entries(labels)) {
          if (levelInfo.comparison[key]) {
            levelText += `${label}:\n`;
            levelText += `• ${levels[0]}: ${Array.isArray(levelInfo.comparison[key][levels[0]]) ? levelInfo.comparison[key][levels[0]].join(', ') : levelInfo.comparison[key][levels[0]]}\n`;
            levelText += `• ${levels[1]}: ${Array.isArray(levelInfo.comparison[key][levels[1]]) ? levelInfo.comparison[key][levels[1]].join(', ') : levelInfo.comparison[key][levels[1]]}\n\n`;
          }
        }
      }
      
      responseMessage = {
        type: 'text',
        content: levelText,
        buttons: ['Карьерный путь', 'Примеры задач', 'Главное меню'],
      };
      stage = 'showing_results';
    }
    // Обработка запроса сохранения карточки
    else if (intent.intent === 'save_card') {
      const professionSlug = lastAssistantMessage?.cards?.[0]?.slug;
      
      if (professionSlug) {
        responseMessage = {
          type: 'text',
          content: `✅ Отлично! Ты можешь:\n\n1. 📥 **Скачать PDF** — перейди на страницу профессии и нажми кнопку "Скачать PDF карточку"\n2. ⭐ **Добавить в избранное** — открой карточку в браузере и добавь в закладки\n3. 🔗 **Сохранить ссылку**: /profession/${professionSlug}\n\nХочешь посмотреть полную карточку профессии?`,
          buttons: ['Открыть карточку', 'Похожие профессии', 'Главное меню'],
          metadata: {
            professionSlug,
          },
        };
      } else {
        responseMessage = {
          type: 'text',
          content: 'Сначала выбери профессию, которую хочешь сохранить 😊',
        };
      }
      stage = 'showing_results';
    }
    // Обработка запроса поделиться
    else if (intent.intent === 'share_card') {
      const professionSlug = lastAssistantMessage?.cards?.[0]?.slug;
      const professionName = lastAssistantMessage?.cards?.[0]?.profession;
      
      if (professionSlug) {
        const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://hh-vibe.ru'}/profession/${professionSlug}`;
        responseMessage = {
          type: 'text',
          content: `🔗 **Поделиться профессией "${professionName}"**\n\nСсылка для отправки:\n${shareUrl}\n\nСкопируй эту ссылку и отправь друзьям! Они смогут посмотреть полную карточку профессии с расписанием дня, навыками и карьерным путём.`,
          buttons: ['Открыть карточку', 'Похожие профессии', 'Главное меню'],
        };
      } else {
        responseMessage = {
          type: 'text',
          content: 'Сначала выбери профессию, которой хочешь поделиться 😊',
        };
      }
      stage = 'showing_results';
    }
    // Обработка сравнения профессий из intent
    else if (intent.intent === 'compare_professions') {
      if (intent.extractedInfo?.professionsToCompare && intent.extractedInfo.professionsToCompare.length >= 2) {
        const prof1 = intent.extractedInfo.professionsToCompare[0];
        const prof2 = intent.extractedInfo.professionsToCompare[1];
        
        const comparison = await compareProfessions(prof1, prof2);
        
        let comparisonText = `${comparison.content}\n\n`;
        if (comparison.comparison && Object.keys(comparison.comparison).length > 0) {
          comparisonText += `📊 **${prof1}** vs **${prof2}**\n\n`;
          
          const labels: Record<string, string> = {
            schedule: '📅 График',
            stress: '😰 Стресс',
            skills: '🎯 Навыки',
            growth: '📈 Карьерный рост',
            impact: '💡 Влияние',
            format: '🏢 Формат работы',
            salary: '💰 Зарплата',
          };
          
          for (const [key, label] of Object.entries(labels)) {
            if (comparison.comparison[key]) {
              comparisonText += `${label}:\n`;
              comparisonText += `• ${prof1}: ${comparison.comparison[key].profession1}\n`;
              comparisonText += `• ${prof2}: ${comparison.comparison[key].profession2}\n\n`;
            }
          }
        }
        
        responseMessage = {
          type: 'text',
          content: comparisonText,
        };
        stage = 'showing_results';
      } else {
        responseMessage = {
          type: 'text',
          content: 'Скажи, какие две профессии ты хочешь сравнить? Например: "Frontend-разработчик и Backend-разработчик"',
          metadata: {
            awaitingCompareProfessions: true,
          },
        };
        stage = 'initial';
      }
    }
    // Обработка запроса игрового дня из intent
    else if (intent.intent === 'game_day') {
      const professionName = intent.extractedInfo?.profession;
      if (professionName) {
        const gameDay = await generateGameDay(professionName);
        responseMessage = {
          type: 'buttons',
          content: gameDay.content,
          buttons: gameDay.buttons,
          metadata: gameDay.metadata,
        };
        stage = 'clarifying';
      } else {
        responseMessage = {
          type: 'text',
          content: 'Круто! Напиши название профессии, и ты проживёшь целый рабочий день в этой роли 🎮',
          metadata: {
            awaitingGameDayProfession: true,
          },
        };
        stage = 'initial';
      }
    }
    // Обработка уточняющих вопросов (пять шагов: уровень, формат работы, размер компании, локация, специализация)
    else if (clarificationStep && professionForClarification) {
      // Обновляем персону с ответом пользователя
      if (clarificationStep === 'level') {
        const mappedLevel = mapLevelAnswer(message);
        persona.experience = mappedLevel;
        
        // Задаем следующий вопрос о формате работы (если релевантен)
        const workFormatQuestion = await generateWorkFormatQuestion(professionForClarification);
        
        if (workFormatQuestion) {
          // Вопрос релевантен - задаем его
          responseMessage = {
            type: 'buttons',
            content: workFormatQuestion.content,
            buttons: workFormatQuestion.buttons,
            metadata: {
              clarificationStep: 'work_format',
              professionForClarification,
              professionDescription: lastAssistantMessage?.metadata?.professionDescription,
            },
          };
          stage = 'clarifying';
        } else {
          // Вопрос не релевантен - пропускаем и сразу переходим к размеру компании
          const companySizeQuestion = await generateCompanySizeQuestion(professionForClarification);
          responseMessage = {
            type: 'buttons',
            content: companySizeQuestion.content,
            buttons: companySizeQuestion.buttons,
            metadata: {
              clarificationStep: 'company_size',
              professionForClarification,
              professionDescription: lastAssistantMessage?.metadata?.professionDescription,
            },
          };
          stage = 'clarifying';
        }
      } else if (clarificationStep === 'work_format') {
        const workFormat = mapWorkFormatAnswer(message);
        // Если выбрана удаленка или гибрид, устанавливаем location в remote
        if (workFormat === 'remote' || workFormat === 'hybrid') {
          persona.location = 'remote';
        }
        persona.workStyle = workFormat;
        
        // Задаем следующий вопрос о размере компании
        const companySizeQuestion = await generateCompanySizeQuestion(professionForClarification);
        responseMessage = {
          type: 'buttons',
          content: companySizeQuestion.content,
          buttons: companySizeQuestion.buttons,
          metadata: {
            clarificationStep: 'company_size',
            professionForClarification,
            professionDescription: lastAssistantMessage?.metadata?.professionDescription,
          },
        };
        stage = 'clarifying';
      } else if (clarificationStep === 'company_size') {
        persona.companySize = mapCompanySizeAnswer(message);
        
        // Если локация еще не установлена (не удаленка), задаем вопрос о локации
        if (!persona.location || persona.location !== 'remote') {
          const locationQuestion = await generateLocationQuestion(professionForClarification);
          responseMessage = {
            type: 'buttons',
            content: locationQuestion.content,
            buttons: locationQuestion.buttons,
            metadata: {
              clarificationStep: 'location',
              professionForClarification,
              professionDescription: lastAssistantMessage?.metadata?.professionDescription,
            },
          };
          stage = 'clarifying';
        } else {
          // Если уже удаленка, переходим к специализации
          const specializationQuestion = await generateSpecializationQuestion(professionForClarification);
          responseMessage = {
            type: 'buttons',
            content: specializationQuestion.content,
            buttons: specializationQuestion.buttons,
            metadata: {
              clarificationStep: 'specialization',
              professionForClarification,
              professionDescription: lastAssistantMessage?.metadata?.professionDescription,
            },
          };
          stage = 'clarifying';
        }
      } else if (clarificationStep === 'location') {
        persona.location = mapLocationAnswer(message);
        
        // Задаем следующий вопрос о специализации
        const specializationQuestion = await generateSpecializationQuestion(professionForClarification);
        responseMessage = {
          type: 'buttons',
          content: specializationQuestion.content,
          buttons: specializationQuestion.buttons,
          metadata: {
            clarificationStep: 'specialization',
            professionForClarification,
            professionDescription: lastAssistantMessage?.metadata?.professionDescription,
          },
        };
        stage = 'clarifying';
      } else if (clarificationStep === 'specialization') {
        persona.specialization = message;
        
        // Все вопросы заданы, генерируем карточку
        try {
          // Преобразуем уровень опыта в формат для генерации
          const levelMap: Record<string, string> = {
            'student': 'Junior',
            'junior': 'Junior',
            'middle': 'Middle',
            'senior': 'Senior'
          };
          const level = levelMap[persona.experience || 'middle'] || 'Middle';
          
          // Определяем тип компании на основе размера
          const companyMap: Record<string, string> = {
            'startup': 'стартап',
            'medium': 'средняя компания',
            'large': 'крупная корпорация',
            'any': 'IT-компания'
          };
          const company = companyMap[persona.companySize || 'any'] || 'IT-компания';
          
          // Генерируем карточку с учетом всех параметров
          const generatedCard = await generateCard(
            professionForClarification,
            level,
            company,
            {
              companySize: persona.companySize,
              location: persona.location,
              specialization: persona.specialization,
              professionDescription: lastAssistantMessage?.metadata?.professionDescription,
            }
          );
          
        responseMessage = {
          type: 'cards',
          content: `Отлично! Я сгенерировал карточку для профессии "${professionForClarification}" с учетом ваших предпочтений:\n\n• Уровень: ${level}\n• Формат: ${persona.workStyle === 'remote' ? 'Удалёнка' : persona.workStyle === 'office' ? 'Офис' : 'Гибрид'}\n• Компания: ${company}\n• Локация: ${persona.location === 'moscow' ? 'Москва' : persona.location === 'spb' ? 'Санкт-Петербург' : persona.location === 'remote' ? 'Удалённо' : 'Другой город'}\n${persona.specialization ? `• Специализация: ${persona.specialization}` : ''}\n\nЧто хочешь узнать дополнительно?`,
          cards: [{
            slug: generatedCard.slug,
            profession: generatedCard.profession,
            level: generatedCard.level,
            company: generatedCard.company,
            image: generatedCard.images?.[0] || null,
          }],
          buttons: ['📋 Примеры задач', '📈 Карьерный рост', '🔍 Похожие профессии', '💾 Сохранить'],
          metadata: {
            showingProfessionCard: true,
            currentProfession: professionForClarification,
          },
        };
        stage = 'showing_results';
        } catch (error: any) {
          console.error('Generation error:', error);
          responseMessage = {
            type: 'text',
            content: `К сожалению, не удалось сгенерировать карточку для "${professionForClarification}". Ошибка: ${error.message}`,
          };
          stage = 'initial';
        }
      }
    } else if (isAnsweringProfessionClarification && professionToClarify) {
      // Старая логика уточнения профессии - теперь после нее запускаем три новых вопроса
      try {
        // Извлекаем уточненное описание из ответа пользователя
        const professionDescription = await extractProfessionDescription(
          professionToClarify,
          message,
          history
        );
        
        // Теперь не генерируем карточку сразу, а задаем первый уточняющий вопрос об уровне
        const levelQuestion = await generateLevelQuestion(professionToClarify);
        responseMessage = {
          type: 'buttons',
          content: `Отлично! Перед тем как сгенерирую карточку для "${professionToClarify}", уточни пару деталей 👇\n\n${levelQuestion.content}`,
          buttons: levelQuestion.buttons,
          metadata: {
            clarificationStep: 'level',
            professionForClarification: professionToClarify,
            professionDescription: professionDescription || undefined,
          },
        };
        stage = 'clarifying';
      } catch (error: any) {
        console.error('Clarification error:', error);
        responseMessage = {
          type: 'text',
          content: `К сожалению, произошла ошибка при обработке вашего ответа. Попробуйте еще раз.`,
        };
        stage = 'initial';
      }
    } else if (intent.intent === 'uncertain' || persona.isUncertain) {
      // Uncertain flow
      if (history.length <= 2) {
        // First interaction - ask clarifying questions
        const questions = await generateClarifyingQuestions(intent, persona);
        responseMessage = {
          type: 'buttons',
          content: questions.content,
          buttons: questions.buttons,
        };
        stage = 'clarifying';
      } else {
        // After some questions - suggest professions
        const suggestions = await suggestProfessionsForUncertainUser(persona, history);
        responseMessage = {
          type: 'cards',
          content: `${suggestions.content}\n\nВыбери любую, чтобы узнать больше!`,
          cards: suggestions.cards,
        };
        stage = 'showing_results';
      }
    } else if (intent.intent === 'search_profession') {
      // Search flow
      const results = await searchProfessions(message, intent.extractedInfo);
      
      // Если профессия не найдена, но нужно её сгенерировать
      if (results.shouldGenerate && results.professionToGenerate) {
        try {
          const professionName = results.professionToGenerate;
          
          // Генерируем уточняющий вопрос о профессии
          const clarification = await generateProfessionClarificationQuestion(professionName, history);
          
          responseMessage = {
            type: 'buttons',
            content: clarification.content,
            buttons: clarification.buttons,
            metadata: {
              isProfessionClarification: true,
              professionToClarify: professionName,
            },
          };
          stage = 'clarifying';
        } catch (error: any) {
          console.error('Clarification question generation error:', error);
          // Если не удалось сгенерировать уточняющий вопрос, сразу задаем первый уточняющий вопрос об уровне
          const professionName = results.professionToGenerate;
          const levelQuestion = await generateLevelQuestion(professionName);
          
          responseMessage = {
            type: 'buttons',
            content: `Перед тем как сгенерирую карточку для "${professionName}", уточни пару деталей 👇\n\n${levelQuestion.content}`,
            buttons: levelQuestion.buttons,
            metadata: {
              clarificationStep: 'level',
              professionForClarification: professionName,
            },
          };
          stage = 'clarifying';
        }
      } else if (results.cards && results.cards.length === 1) {
        // Если найдена ровно одна профессия, задаем уточняющие вопросы перед показом карточки
        const professionName = results.cards[0].profession;
        const levelQuestion = await generateLevelQuestion(professionName);
        
        responseMessage = {
          type: 'buttons',
          content: `Отлично! Я нашел профессию "${professionName}". Перед тем как покажу карточку, уточни пару деталей 👇\n\n${levelQuestion.content}`,
          buttons: levelQuestion.buttons,
          metadata: {
            clarificationStep: 'level',
            professionForClarification: professionName,
            existingProfessionSlug: results.cards[0].slug,
          },
        };
        stage = 'clarifying';
      } else {
        // Обычный результат поиска (несколько профессий)
        const hasMultipleCards = results.cards && results.cards.length > 1;
        responseMessage = {
          type: 'cards',
          content: hasMultipleCards ? `${results.content}\n\nВыбери любую, чтобы узнать больше!` : `${results.content}\n\nЧто хочешь узнать дополнительно?`,
          cards: results.cards,
          buttons: hasMultipleCards ? undefined : ['📋 Примеры задач', '📈 Карьерный рост', '🔍 Похожие профессии', '💾 Сохранить'],
          metadata: hasMultipleCards ? undefined : {
            showingProfessionCard: true,
            currentProfession: results.cards[0]?.profession,
          },
        };
        stage = 'showing_results';
      }
    } else if (intent.intent === 'clarification') {
      // Continue clarifying
      if (history.length < 8) {
        const questions = await generateClarifyingQuestions(intent, persona);
        responseMessage = {
          type: 'buttons',
          content: questions.content,
          buttons: questions.buttons,
        };
        stage = 'clarifying';
      } else {
        // Enough info - show results
        const suggestions = await suggestProfessionsForUncertainUser(persona, history);
        responseMessage = {
          type: 'cards',
          content: suggestions.content,
          cards: suggestions.cards,
        };
        stage = 'showing_results';
      }
    } else {
      // General chat
      const prompt = `Ты дружелюбный AI-ассистент для карьерного консультирования. 
Пользователь написал: "${message}"
Ответь коротко и по-дружески. Направь разговор к обсуждению карьеры.`;

      const response = await getAIClient().models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { temperature: 0.8 },
      });

      responseMessage = {
        type: 'text',
        content: response.text || '',
      };
      stage = 'initial';
    }

    // Гарантируем наличие content в ответе
    if (!responseMessage.content) {
      responseMessage.content = 'Как я могу помочь?';
    }

    const chatResponse: ChatResponse = {
      message: responseMessage,
      persona,
      stage,
    };

    const totalDuration = Date.now() - requestStartTime;
    logger.performance('Chat API: обработка запроса', totalDuration, { 
      intent: intent.intent, 
      stage,
      messageType: responseMessage.type
    });
    logger.info('Chat API: ответ отправлен', { duration: totalDuration });

    return NextResponse.json(chatResponse);
  } catch (error: any) {
    const totalDuration = Date.now() - requestStartTime;
    logger.error('Chat API: ошибка обработки запроса', error, {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      HTTP_PROXY: process.env.HTTP_PROXY ? 'настроен' : 'не настроен',
      HTTPS_PROXY: process.env.HTTPS_PROXY ? 'настроен' : 'не настроен',
      duration: totalDuration
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || 'Произошла ошибка при обработке запроса',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

