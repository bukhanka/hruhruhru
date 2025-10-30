import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ChatRequest, ChatResponse, UserPersona, Message } from '@/types/chat';
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error('Intent parsing error:', error);
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error('Persona detection error:', error);
    return currentPersona || { isUncertain: false };
  }
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error('Clarifying questions error:', error);
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
    const response = await ai.models.generateContent({
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
      content: result.content,
      cards: selectedProfessions.map((p) => ({
        slug: p.slug,
        profession: p.profession,
        level: p.level,
        company: p.company,
        image: p.image,
      })),
    };
  } catch (error) {
    console.error('Profession suggestion error:', error);
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
): Promise<{ content: string; cards: any[] }> {
  const professions = getAvailableProfessions();
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Найди профессии, соответствующие запросу пользователя.

Запрос: "${query}"
Извлеченная информация: ${JSON.stringify(extractedInfo)}

Доступные профессии:
${professions.map((p, i) => `${i + 1}. ${p.profession} (${p.level}, ${p.company})`).join('\n')}

Выбери наиболее релевантные профессии (1-3 штуки).

Ответь ТОЛЬКО в формате JSON:
{
  "content": "короткий комментарий о найденных профессиях",
  "professionSlugs": ["slug1", "slug2"]
}`;

  try {
    const response = await ai.models.generateContent({
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
      return {
        content: 'К сожалению, пока нет профессий, точно соответствующих твоему запросу. Вот что есть:',
        cards: professions.slice(0, 3),
      };
    }

    return {
      content: result.content,
      cards: selectedProfessions,
    };
  } catch (error) {
    console.error('Search error:', error);
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

    // Step 3: Decide response based on intent
    let responseMessage: any = {
      type: 'text',
      content: 'Как я могу помочь?',
    };

    let stage: ChatResponse['stage'] = 'initial';

    if (intent.intent === 'uncertain' || persona.isUncertain) {
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
      responseMessage = {
        type: 'cards',
        content: results.content,
        cards: results.cards,
      };
      stage = 'showing_results';
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

      const response = await ai.models.generateContent({
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

    const chatResponse: ChatResponse = {
      message: responseMessage,
      persona,
      stage,
    };

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

