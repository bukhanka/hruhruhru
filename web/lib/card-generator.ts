import { GoogleGenAI, Type } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import "./proxy-config"; // Настройка прокси

// Инициализация клиента Google AI
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY не найден в переменных окружения');
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }
  return aiClient;
}

// Функция для извлечения сообщения об ошибке из Google AI API
function extractErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  // Google AI API часто возвращает ошибки в формате error.error.message
  if (error?.error?.message) {
    return error.error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.statusText) {
    return error.statusText;
  }
  
  return 'Неизвестная ошибка API';
}

// Retry функция для надежности
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const errorMessage = extractErrorMessage(error);
      
      // Некоторые ошибки не стоит повторять (например, ошибки локации)
      if (errorMessage.includes('location') || errorMessage.includes('FAILED_PRECONDITION')) {
        throw new Error(`Ошибка API: ${errorMessage}. Возможно, API недоступен в вашем регионе.`);
      }
      
      if (isLastAttempt) {
        throw new Error(`Ошибка после ${maxRetries} попыток: ${errorMessage}`);
      }
      
      console.log(`Попытка ${attempt} не удалась: ${errorMessage}. Повторяю через ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Unreachable');
}

// Функция определения IT/не IT профессии
export async function determineProfessionType(profession: string): Promise<boolean> {
  const itKeywords = [
    'developer', 'разработчик', 'программист', 'engineer', 'инженер',
    'devops', 'системный администратор', 'сисадмин', 'qa', 'тестировщик',
    'data scientist', 'дата саентист', 'analyst', 'аналитик', 'architect',
    'архитектор', 'tech lead', 'team lead', 'frontend', 'backend', 'fullstack',
    'ui/ux', 'designer', 'дизайнер', 'product manager', 'продакт менеджер',
    'scrum master', 'project manager', 'менеджер проектов'
  ];
  
  const professionLower = profession.toLowerCase();
  
  // Проверяем наличие IT ключевых слов
  const hasITKeyword = itKeywords.some(keyword => professionLower.includes(keyword));
  
  if (hasITKeyword) {
    return true;
  }
  
  // Используем AI для более точного определения, если не нашли явных маркеров
  try {
    const ai = getAIClient();
    const prompt = `Определи, является ли профессия "${profession}" IT-профессией.

IT-профессии связаны с разработкой программного обеспечения, информационными технологиями, программированием, системным администрированием, тестированием ПО, дизайном интерфейсов в IT, управлением IT-проектами.

НЕ IT-профессии: массажист, повар, каменщик, водитель, врач, учитель, менеджер по продажам (не IT), HR-менеджер (не IT), бухгалтер и т.д.

Ответь ТОЛЬКО в формате JSON:
{
  "isIT": true или false
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const result = JSON.parse(response.text || '{"isIT": false}');
    return result.isIT === true;
  } catch (error: any) {
    console.error('Ошибка определения типа профессии:', error);
    // По умолчанию считаем не IT, если не можем определить
    return false;
  }
}

// Функция транслитерации для slug
export function transliterate(text: string): string {
  const translitMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  
  return text
    .toLowerCase()
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

// Проверка кеша
export async function getCachedCard(slug: string): Promise<any | null> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'professions', `${slug}.json`);
    if (fs.existsSync(filePath)) {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }
  return null;
}

// Сохранение в кеш
export async function saveCardToCache(data: any, slug: string): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data', 'professions');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const filePath = path.join(dataDir, `${slug}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Генерация данных профессии
export async function generateProfessionData(
  profession: string,
  level: string,
  company: string,
  onProgress?: (message: string, progress: number) => void
) {
  if (onProgress) onProgress('Определяю тип профессии...', 5);
  
  // Определяем тип профессии
  const isIT = await determineProfessionType(profession);
  
  if (onProgress) onProgress('Генерирую текстовый контент...', 10);

  const stackLabel = isIT ? 'стек технологий' : 'рабочие навыки и инструменты';
  const stackDescription = isIT 
    ? '8-10 технологий/инструментов конкретно для этой профессии (например: React.js, TypeScript, Docker и т.д.)'
    : '8-10 рабочих навыков, инструментов и оборудования конкретно для этой профессии (например: профессиональные масла, массажный стол, система онлайн-бронирования и т.д.)';
  
  const careerPathDescription = isIT
    ? '4 этапа карьеры с названиями типа "Junior [Профессия]", "Middle [Профессия]", "Senior [Профессия]", "Tech Lead / Architect" или аналогичными IT-названиями'
    : '4 этапа карьеры с реальными названиями должностей для этой профессии (НЕ используй "Junior", "Middle", "Senior" - используй реальные названия должностей, например: "Массажист", "Старший массажист", "Ведущий специалист", "Руководитель отдела" или аналогичные)';

  const prompt = `
Создай детальную карточку профессии для "${profession}" уровня ${level} в ${company}.

ВАЖНЫЕ ТРЕБОВАНИЯ:
- schedule: ровно 6 событий за рабочий день (с 10:00 до 18:00)
- stack: ${stackDescription}
- benefits: ровно 4 пункта с конкретными цифрами и метриками
- careerPath: ${careerPathDescription} с реальными зарплатами в рублях
- skills: ровно 5 ключевых скиллов с уровнем от 40 до 90
- dialog: реалистичный диалог с коллегой/клиентом
- Всё на русском языке
- Эмоционально, живо, с деталями атмосферы
- Используй разные эмодзи для каждого события в schedule
- В description используй цитаты или короткие фразы из рабочего процесса

${!isIT ? `
КРИТИЧЕСКИ ВАЖНО для НЕ IT профессии:
- В careerPath НЕ используй слова "Junior", "Middle", "Senior" - используй реальные названия должностей из данной профессии
- В stack указывай рабочие навыки, инструменты и оборудование, а не технологические стеки
` : ''}
`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      profession: { type: Type.STRING },
      level: { type: Type.STRING },
      company: { type: Type.STRING },
      schedule: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING },
            title: { type: Type.STRING },
            emoji: { type: Type.STRING },
            description: { type: Type.STRING },
            detail: { type: Type.STRING },
          },
          required: ["time", "title", "emoji", "description", "detail"],
        },
      },
      stack: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      benefits: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            icon: { type: Type.STRING },
            text: { type: Type.STRING },
          },
          required: ["icon", "text"],
        },
      },
      careerPath: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.STRING },
            years: { type: Type.STRING },
            salary: { type: Type.STRING },
          },
          required: ["level", "years", "salary"],
        },
      },
      skills: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            level: { type: Type.NUMBER },
          },
          required: ["name", "level"],
        },
      },
      dialog: {
        type: Type.OBJECT,
        properties: {
          message: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          response: { type: Type.STRING },
        },
        required: ["message", "options", "response"],
      },
    },
    required: ["profession", "level", "company", "schedule", "stack", "benefits", "careerPath", "skills", "dialog"],
  };

  const ai = getAIClient();
  
  return await withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.9,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });
      
      const jsonText = response.text || '{}';
      if (onProgress) onProgress('Текстовый контент готов ✅', 30);
      const data = JSON.parse(jsonText);
      // Добавляем флаг isIT к данным
      data.isIT = isIT;
      return data;
    } catch (error: any) {
      // Пробрасываем ошибку через extractErrorMessage для корректной обработки
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  }, 3, 2000);
}

// Генерация изображений
export async function generateImages(
  profession: string,
  slug: string,
  onProgress?: (message: string, progress: number) => void,
  professionDescription?: string // Уточненное описание профессии для более точных промптов
): Promise<string[]> {
  if (onProgress) onProgress('Генерирую изображения...', 35);
  
  const isITProfession = profession.toLowerCase().includes('developer') || 
                         profession.toLowerCase().includes('devops') ||
                         profession.toLowerCase().includes('engineer') ||
                         profession.toLowerCase().includes('программист') ||
                         profession.toLowerCase().includes('разработчик');
  
  let prompts: string[];
  
  if (isITProfession) {
    prompts = [
      `First-person view POV: ${profession} hands typing on mechanical keyboard, RGB backlight, dual monitors showing real code editor and terminal with commands, energy drink can, sticky notes with passwords on monitor frame, tangled cables, warm desk lamp light, 2am vibe, authentic programmer workspace chaos, ultrarealistic`,
      `Extreme close-up: computer screen showing authentic ${profession} work - IDE with code, terminal logs scrolling, browser with Stack Overflow tabs, Slack message notifications popping, GitHub commits, blinking cursor, slight screen glare, coffee stain on desk visible in corner, person's tired reflection in screen, dim room lighting, cinematic`,
      `Flat lay top-down: ${profession} messy workspace during active work - laptop covered with developer stickers (Linux, GitHub, etc), second monitor, mechanical keyboard, gaming mouse, smartphone showing work messages, open notebook with handwritten schemas and bugs, 3 coffee mugs, snack wrappers, USB cables everywhere, AirPods, smartwatch, afternoon natural light, authentic chaos`,
      `Cinematic wide shot: ${profession} deep in flow state at night, wearing hoodie, side profile, face illuminated only by multiple monitor glow in dark room, messy hair, intense focused expression, can of energy drink in hand, pizza box on desk, headphones on, code visible on screens, moody cyberpunk aesthetic, realistic photography`,
    ];
  } else {
    // Используем уточненное описание если оно есть, иначе используем название профессии
    // Если есть уточненное описание, используем его для более точных промптов
    const mainContext = professionDescription 
      ? `${profession} - ${professionDescription}`
      : profession;
    
    prompts = [
      `First-person POV: ${mainContext} hands actively working, professional tools and equipment specific to this profession in use, realistic workplace environment${professionDescription ? ` showing ${professionDescription}` : ''}, customers or colleagues visible in background, natural lighting, candid authentic moment, movement and energy, real-life mess and activity`,
      `Close-up shot: ${mainContext} professional equipment and tools being used, hands in action, detailed view of craft${professionDescription ? `, showing ${professionDescription}` : ''}, authentic wear and tear on tools, workspace details, natural lighting, professional photography, realistic working conditions`,
      `Flat lay overhead view: ${mainContext} workspace during busy shift - all necessary tools laid out${professionDescription ? ` for ${professionDescription}` : ''}, work in progress, organized chaos, professional equipment, order receipts or work documents, smartphone, keys, water bottle, authentic workspace mess, natural daylight`,
      `Cinematic environmental shot: ${mainContext} in action during peak hours${professionDescription ? `, showing ${professionDescription}` : ''}, dynamic movement, real customers or team around, authentic workplace atmosphere, natural expressions, busy environment, professional uniform or work attire, realistic lighting, documentary photography style, capturing the vibe and energy`,
    ];
  }

  const ai = getAIClient();
  const images = [];
  
  for (let i = 0; i < prompts.length; i++) {
    if (onProgress) {
      onProgress(`Генерирую изображение ${i + 1}/4...`, 35 + (i + 1) * 10);
    }
    
    try {
      const imagePath = await withRetry(async () => {
        try {
          const response = await ai.models.generateImages({
            model: 'imagen-4.0-fast-generate-001',
            prompt: prompts[i],
            config: {
              numberOfImages: 1,
              aspectRatio: "1:1",
            },
          });

          if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error('No images generated');
          }

          const image = response.generatedImages[0];
          if (!image.image?.imageBytes) {
            throw new Error('Image data is missing');
          }

          const imageDir = path.join(process.cwd(), 'public', 'generated', slug);
          
          if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
          }

          const filename = `image-${i + 1}.png`;
          const filepath = path.join(imageDir, filename);
          
          const buffer = Buffer.from(image.image.imageBytes, 'base64');
          fs.writeFileSync(filepath, buffer);
          
          return `/generated/${slug}/${filename}`;
        } catch (error: any) {
          // Пробрасываем ошибку через extractErrorMessage
          const errorMessage = extractErrorMessage(error);
          throw new Error(errorMessage);
        }
      }, 2, 1500);
      
      images.push(imagePath);
      
      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`Ошибка генерации изображения ${i + 1}:`, error.message);
      images.push(`https://placehold.co/400x400/1e293b/9333ea?text=Image+${i + 1}`);
    }
  }

  if (onProgress) onProgress('Изображения готовы ✅', 75);
  return images;
}

// Получение статистики вакансий
export async function fetchVacanciesStats(
  profession: string,
  onProgress?: (message: string, progress: number) => void
) {
  if (onProgress) onProgress('Получаю статистику вакансий...', 77);
  
  try {
    const response = await fetch(
      `https://api.hh.ru/vacancies?text=${encodeURIComponent(profession)}&per_page=20&order_by=relevance&area=113`
    );
    const data = await response.json();
    
    const found = data.found || 0;
    const competition = found > 1000 ? 'высокая' : 
                       found > 500 ? 'средняя' : 'низкая';
    
    const salaries: number[] = [];
    const companies: string[] = [];
    
    data.items?.forEach((vacancy: any) => {
      if (vacancy.salary && vacancy.salary.currency === 'RUR') {
        const from = vacancy.salary.from;
        const to = vacancy.salary.to;
        
        if (from && to) {
          salaries.push((from + to) / 2);
        } else if (from) {
          salaries.push(from);
        } else if (to) {
          salaries.push(to);
        }
      }
      
      if (vacancy.employer?.name) {
        companies.push(vacancy.employer.name);
      }
    });
    
    const avgSalary = salaries.length > 0 
      ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length / 1000) * 1000
      : null;
    
    const topCompanies = [...new Set(companies)].slice(0, 5);
    
    if (onProgress) onProgress('Статистика вакансий получена ✅', 85);
    
    return {
      vacancies: found,
      competition,
      avgSalary,
      topCompanies,
    };
  } catch (error: any) {
    console.error('Ошибка получения вакансий:', error.message);
    if (onProgress) onProgress('Статистика вакансий получена ✅', 85);
    return {
      vacancies: 0,
      competition: 'неизвестно',
      avgSalary: null,
      topCompanies: [],
    };
  }
}

// Получение видео с YouTube
export async function fetchYouTubeVideos(
  profession: string,
  onProgress?: (message: string, progress: number) => void
) {
  if (onProgress) onProgress('Ищу видео на YouTube...', 87);
  
  if (!process.env.YOUTUBE_API_KEY) {
    if (onProgress) onProgress('YouTube API ключ не найден, пропускаю...', 90);
    return [];
  }
  
  try {
    const query = `${profession} день в профессии`;
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&q=${encodeURIComponent(query)}&` +
      `type=video&videoDuration=short&maxResults=6&` +
      `order=relevance&key=${process.env.YOUTUBE_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error('YouTube API ошибка:', data.error.message);
      if (onProgress) onProgress('Видео получены ✅', 95);
      return [];
    }
    
    const videos = data.items?.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
    })) || [];
    
    if (onProgress) onProgress('Видео получены ✅', 95);
    return videos;
  } catch (error: any) {
    console.error('Ошибка поиска видео:', error.message);
    if (onProgress) onProgress('Видео получены ✅', 95);
    return [];
  }
}

// Основная функция генерации карточки
export async function generateCard(
  profession: string,
  level: string = "Middle",
  company: string = "стартап",
  onProgress?: (message: string, progress: number) => void,
  professionDescription?: string // Уточненное описание профессии
) {
  const slug = transliterate(profession);
  
  // Проверяем кеш
  const cached = await getCachedCard(slug);
  if (cached) {
    if (onProgress) onProgress('Найдена кешированная карточка ✅', 100);
    return cached;
  }
  
  if (onProgress) onProgress('Начинаю генерацию...', 0);
  
  // 1. Генерация текстового контента
  const data = await generateProfessionData(profession, level, company, onProgress);
  
  // 2-4. Параллельная генерация изображений, статистики и видео
  if (onProgress) onProgress('Запускаю параллельную генерацию контента...', 30);
  
  // Отслеживаем прогресс изображений (самая долгая задача)
  const [images, vacanciesStats, videos] = await Promise.all([
    generateImages(profession, slug, (msg, prog) => {
      if (onProgress) {
        // Прогресс: 30% (текст) + до 60% (изображения) = 30-90%
        const totalProgress = 30 + (prog / 100) * 60;
        onProgress(msg, totalProgress);
      }
    }, professionDescription), // Передаем уточненное описание
    fetchVacanciesStats(profession, () => {
      // Статистика быстрая, не отслеживаем прогресс отдельно
    }),
    fetchYouTubeVideos(profession, () => {
      // Видео быстрые, не отслеживаем прогресс отдельно
    }),
  ]);
  
  if (onProgress) onProgress('Завершаю генерацию...', 95);
  
  // 5. Объединяем всё в один объект
  const fullData = {
    ...data,
    slug,
    images,
    ...vacanciesStats,
    videos,
    generatedAt: new Date().toISOString(),
  };

  // 6. Сохраняем в кеш
  await saveCardToCache(fullData, slug);
  
  if (onProgress) onProgress('Генерация завершена! ✅', 100);
  
  return fullData;
}

// Генерация уточняющих вопросов о профессии
export async function generateProfessionClarificationQuestion(
  profession: string,
  history: any[]
): Promise<{ content: string; buttons: string[] }> {
  const ai = getAIClient();
  
  const conversationContext = history
    .slice(-5)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Пользователь хочет узнать о профессии "${profession}".

Профессия может иметь разные значения или специализации. Например:
- "Крановщик" может означать человека, который работает на кране, или человека, который работает с машинами
- "Массажист" может быть классическим массажистом или спортивным массажистом
- И т.д.

История диалога:
${conversationContext}

Проанализируй профессию "${profession}" и сгенерируй уточняющий вопрос с вариантами ответов, чтобы понять, что именно имеет в виду пользователь.

Ответь ТОЛЬКО в формате JSON:
{
  "content": "короткий уточняющий вопрос (например: 'Вы имеете в виду человека, который работает на кране?')",
  "buttons": ["Да, именно он", "Нет, человек который работает с машинами", "Другое"]
}

Кнопки должны быть короткими (до 6 слов) и конкретными, отражающими возможные варианты значения профессии.`;

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
      content: result.content || `Вы имеете в виду человека, который работает как ${profession}?`,
      buttons: result.buttons || ['Да', 'Нет, другое'],
    };
  } catch (error: any) {
    console.error('Ошибка генерации уточняющего вопроса:', error);
    return {
      content: `Вы имеете в виду человека, который работает как ${profession}?`,
      buttons: ['Да', 'Нет, другое'],
    };
  }
}

// Извлечение уточненного описания профессии из ответа пользователя
export async function extractProfessionDescription(
  profession: string,
  userAnswer: string,
  history: any[]
): Promise<string | null> {
  const ai = getAIClient();
  
  const conversationContext = history
    .slice(-5)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Пользователь уточняет профессию "${profession}".

Вопрос был задан об этой профессии, и пользователь ответил: "${userAnswer}"

История диалога:
${conversationContext}

Определи, что именно имеет в виду пользователь под профессией "${profession}" на основе его ответа.

Ответь ТОЛЬКО в формате JSON:
{
  "description": "краткое описание того, что именно делает этот специалист (например: 'человек, который работает на башенном кране на строительной площадке' или 'человек, который работает с машинами и механизмами')"
}

Если пользователь подтвердил первоначальное понимание (ответил "Да", "Именно так" и т.д.), верни описание первоначального понимания профессии.`;

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
    return result.description || null;
  } catch (error: any) {
    console.error('Ошибка извлечения описания профессии:', error);
    return null;
  }
}

