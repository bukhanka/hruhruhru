
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ChatRequest, ChatResponse, UserPersona, Message } from '@/types/chat';
import fs from 'fs';
import path from 'path';
import { setupProxy } from '@/lib/proxy-config'; // Настройка прокси
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
  intent: 'search_profession' | 'uncertain' | 'clarification' | 'general_chat';
  confidence: number;
  extractedInfo: Record<string, any>;
}> {
  const prompt = `Ты AI-ассистент для карьерного консультирования. Проанализируй сообщение пользователя и определи его намерение.

Возможные намерения:
- "search_profession": пользователь знает, какую профессию ищет или упоминает конкретные навыки/должности
- "uncertain": пользователь не знает, чего хочет, использует фразы типа "не знаю", "помоги выбрать", "что посоветуешь"
- "clarification": пользователь отвечает на уточняющий вопрос
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
    "interests": ["интерес1", "интерес2"]
  }
}`;

  try {
    const response = await getAIClient().models.generateContent({
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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

// Генерация уточняющего вопроса о размере компании
async function generateCompanySizeQuestion(): Promise<{ content: string; buttons: string[] }> {
  return {
    content: 'Какой тип компании вам интересен?',
    buttons: ['Стартап', 'Средняя компания', 'Крупная корпорация', 'Не важно'],
  };
}

// Генерация уточняющего вопроса о локации
async function generateLocationQuestion(): Promise<{ content: string; buttons: string[] }> {
  return {
    content: 'В каком городе/регионе вы собираетесь работать?',
    buttons: ['Москва', 'Санкт-Петербург', 'Другой город', 'Удаленно'],
  };
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
      model: 'gemini-2.5-flash',
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
function mapCompanySizeAnswer(answer: string): 'startup' | 'medium' | 'large' | 'any' {
  const answerLower = answer.toLowerCase();
  if (answerLower.includes('стартап')) return 'startup';
  if (answerLower.includes('средн')) return 'medium';
  if (answerLower.includes('крупн') || answerLower.includes('корпорац')) return 'large';
  return 'any';
}

function mapLocationAnswer(answer: string): 'moscow' | 'spb' | 'other' | 'remote' {
  const answerLower = answer.toLowerCase();
  if (answerLower.includes('москв')) return 'moscow';
  if (answerLower.includes('санкт') || answerLower.includes('петербург') || answerLower.includes('спб')) return 'spb';
  if (answerLower.includes('удален') || answerLower.includes('remote')) return 'remote';
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
      model: 'gemini-2.5-flash',
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

// Uncertain User Flow: подбор профессий для неопределившихся
async function suggestProfessionsForUncertainUser(
  persona: UserPersona,
  history: Message[]
): Promise<{ content: string; cards: any[] }> {
  const professions = getAvailableProfessions();
  
  const conversationContext = history
    .slice(-10)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const prompt = `Ты AI-ассистент для карьерного консультирования. На основе диалога подбери 3-5 наиболее подходящих профессий для пользователя.

Профиль пользователя: ${JSON.stringify(persona)}

История диалога:
${conversationContext}

Доступные профессии:
${professions.map((p, i) => `${i + 1}. ${p.profession} (${p.level})`).join('\n')}

Проанализируй интересы, навыки и цели пользователя и выбери наиболее подходящие профессии.

Ответь ТОЛЬКО в формате JSON:
{
  "content": "короткое персональное объяснение почему эти профессии подходят",
  "professionSlugs": ["slug1", "slug2", "slug3"]
}`;

  try {
    const response = await getAIClient().models.generateContent({
      model: 'gemini-2.5-flash',
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
      content: result.content || 'Вот несколько интересных профессий для тебя:',
      cards: selectedProfessions.map((p) => ({
        slug: p.slug,
        profession: p.profession,
        level: p.level,
        company: p.company,
        image: p.image,
      })),
    };
  } catch (error: any) {
    console.error('Profession suggestion error:', error);
    console.error('Profession suggestion error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
    });
    // Fallback: return first 3 professions
    return {
      content: 'Вот несколько интересных профессий для тебя:',
      cards: professions.slice(0, 3),
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
      model: 'gemini-2.5-flash',
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
      
      // Если не найдено и запрос похож на название профессии, пытаемся сгенерировать
      if (queryTrimmed.length > 0 && queryTrimmed.length < 50 && !queryTrimmed.includes(' ')) {
        return {
          content: `Профессия "${queryTrimmed}" не найдена в базе. Генерирую карточку...`,
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
  try {
    const body: ChatRequest = await request.json();
    const { message, history, persona: currentPersona } = body;

    // Step 1: Parse intent
    const intent = await parseIntent(message, history);

    // Step 2: Detect/update persona
    const persona = await detectPersona(message, history, currentPersona || null);

    // Step 3: Проверяем, отвечает ли пользователь на уточняющий вопрос о профессии
    const lastAssistantMessage = history
      .slice()
      .reverse()
      .find((m) => m.role === 'assistant');
    
    const isAnsweringProfessionClarification = lastAssistantMessage?.metadata?.isProfessionClarification === true;
    const professionToClarify = lastAssistantMessage?.metadata?.professionToClarify;
    
    // Проверяем, на каком этапе уточняющих вопросов мы находимся
    const clarificationStep = lastAssistantMessage?.metadata?.clarificationStep;
    const professionForClarification = lastAssistantMessage?.metadata?.professionForClarification;

    // Step 4: Decide response based on intent
    let responseMessage: any = {
      type: 'text',
      content: 'Как я могу помочь?',
    };

    let stage: ChatResponse['stage'] = 'initial';

    // Обработка уточняющих вопросов (три шага: размер компании, локация, специализация)
    if (clarificationStep && professionForClarification) {
      // Обновляем персону с ответом пользователя
      if (clarificationStep === 'company_size') {
        persona.companySize = mapCompanySizeAnswer(message);
        
        // Задаем следующий вопрос о локации
        const locationQuestion = await generateLocationQuestion();
        responseMessage = {
          type: 'buttons',
          content: locationQuestion.content,
          buttons: locationQuestion.buttons,
          metadata: {
            clarificationStep: 'location',
            professionForClarification,
          },
        };
        stage = 'clarifying';
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
          },
        };
        stage = 'clarifying';
      } else if (clarificationStep === 'specialization') {
        persona.specialization = message;
        
        // Все три вопроса заданы, генерируем карточку
        try {
          const level = intent.extractedInfo?.level || 'Middle';
          const company = intent.extractedInfo?.company || 'IT-компания';
          
          // Генерируем карточку с учетом всех параметров
          const generatedCard = await generateCard(
            professionForClarification,
            level,
            company,
            undefined,
            undefined,
            persona.companySize,
            persona.location,
            persona.specialization
          );
          
          responseMessage = {
            type: 'cards',
            content: `Отлично! Я сгенерировал карточку для профессии "${professionForClarification}" с учетом ваших предпочтений:`,
            cards: [{
              slug: generatedCard.slug,
              profession: generatedCard.profession,
              level: generatedCard.level,
              company: generatedCard.company,
              image: generatedCard.images?.[0] || null,
            }],
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
        
        // Теперь не генерируем карточку сразу, а задаем первый уточняющий вопрос
        const companySizeQuestion = await generateCompanySizeQuestion();
        responseMessage = {
          type: 'buttons',
          content: companySizeQuestion.content,
          buttons: companySizeQuestion.buttons,
          metadata: {
            clarificationStep: 'company_size',
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
          content: suggestions.content,
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
          // Если не удалось сгенерировать уточняющий вопрос, сразу задаем три уточняющих вопроса
          const professionName = results.professionToGenerate;
          const companySizeQuestion = await generateCompanySizeQuestion();
          
          responseMessage = {
            type: 'buttons',
            content: companySizeQuestion.content,
            buttons: companySizeQuestion.buttons,
            metadata: {
              clarificationStep: 'company_size',
              professionForClarification: professionName,
            },
          };
          stage = 'clarifying';
        }
      } else if (results.cards && results.cards.length === 1) {
        // Если найдена ровно одна профессия, задаем три уточняющих вопроса перед показом карточки
        const professionName = results.cards[0].profession;
        const companySizeQuestion = await generateCompanySizeQuestion();
        
        responseMessage = {
          type: 'buttons',
          content: `Отлично! Я нашел профессию "${professionName}". ${companySizeQuestion.content}`,
          buttons: companySizeQuestion.buttons,
          metadata: {
            clarificationStep: 'company_size',
            professionForClarification: professionName,
            existingProfessionSlug: results.cards[0].slug,
          },
        };
        stage = 'clarifying';
      } else {
        // Обычный результат поиска (несколько профессий)
        responseMessage = {
          type: 'cards',
          content: results.content,
          cards: results.cards,
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
        model: 'gemini-2.5-flash',
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

    return NextResponse.json(chatResponse);
  } catch (error: any) {
    console.error('Chat API error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      HTTP_PROXY: process.env.HTTP_PROXY ? 'настроен' : 'не настроен',
      HTTPS_PROXY: process.env.HTTPS_PROXY ? 'настроен' : 'не настроен',
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

