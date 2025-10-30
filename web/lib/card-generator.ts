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
      model: 'gemini-2.0-flash',
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
  onProgress?: (message: string, progress: number) => void,
  companySize?: 'startup' | 'medium' | 'large' | 'any',
  location?: 'moscow' | 'spb' | 'other' | 'remote',
  specialization?: string
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

  const dialogInstructions = isIT
    ? 'dialog: реалистичный диалог с коллегой/клиентом в IT-контексте (может быть про код, деплой, баги, проекты и т.д.)'
    : `dialog: реалистичный диалог с коллегой/клиентом, КОНКРЕТНО связанный с профессией "${profession}". 
       КРИТИЧЕСКИ ВАЖНО: 
       - Диалог должен быть про РЕАЛЬНУЮ работу этой профессии (например, для ассенизатора - про канализацию, дренаж, вызовы на объекты; для массажиста - про сеансы, клиентов, техники массажа; для крановщика - про работу крана, строительные объекты и т.д.)
       - НЕ используй IT-термины (серверы, код, деплой, баги, серверная и т.д.) если это не IT-профессия
       - Диалог должен отражать типичные рабочие ситуации именно для профессии "${profession}"`;

  // Построение контекста на основе уточняющих параметров
  const companySizeContext = companySize ? (() => {
    switch(companySize) {
      case 'startup': return 'В стартапе: небольшая команда, быстрое принятие решений, меньше бюрократии, больше ответственности на каждого, возможно совмещение задач. В рабочем дне меньше встреч, больше практической работы.';
      case 'medium': return 'В средней компании: структурированные процессы, есть командные встречи (дейлики, планирования), баланс между бюрократией и гибкостью, возможности роста.';
      case 'large': return 'В крупной корпорации: много встреч (дейлики, планирования, ретро, синки), строгие процессы, много документации, четкая иерархия, большая команда. Рабочий день включает много коммуникации и координации.';
      default: return '';
    }
  })() : '';

  const locationContext = location ? (() => {
    switch(location) {
      case 'moscow': return 'Москва: высокая конкуренция, больше возможностей, выше зарплаты. Учитывай московские реалии в рабочем дне и статистике.';
      case 'spb': return 'Санкт-Петербург: развитый рынок, чуть ниже зарплаты чем в Москве. Учитывай питерские реалии в рабочем дне и статистике.';
      case 'other': return 'Другой город (регион): более размеренный темп, ниже стоимость жизни, меньше конкуренция. Учитывай региональную специфику.';
      case 'remote': return 'Удаленная работа: гибкий график, работа из дома, онлайн встречи, самоорганизация. Рабочий день должен отражать удаленный формат работы (онлайн встречи, мессенджеры, видеозвонки).';
      default: return '';
    }
  })() : '';

  const specializationContext = specialization ? `Специализация внутри профессии: ${specialization}. Это должно влиять на конкретные задачи, инструменты, стек технологий и рабочий процесс.` : '';

  const contextualInstructions = `
КРИТИЧЕСКИ ВАЖНО - учитывай следующий контекст:
${companySizeContext}
${locationContext}
${specializationContext}

Эти параметры должны влиять на:
1. Рабочий день (schedule): ${companySizeContext ? 'количество и типы встреч, темп работы, характер задач' : ''} ${locationContext ? 'особенности локации или удаленки' : ''}
2. ${isIT ? 'Стек технологий' : 'Инструменты'} (stack): ${specializationContext ? 'специфичные для выбранной специализации' : 'релевантные инструменты'}
3. Диалоги (dialog): ${companySizeContext ? 'стиль коммуникации, упоминание процессов компании' : ''} ${specializationContext ? 'контекст специализации' : ''}
4. Преимущества (benefits): ${companySizeContext ? 'характерные для размера компании' : ''}
`;

  const prompt = `
Создай детальную карточку профессии для "${profession}" уровня ${level} в ${company}.

${contextualInstructions}

ВАЖНЫЕ ТРЕБОВАНИЯ:
- schedule: ровно 6 событий за рабочий день (с 10:00 до 18:00)
- stack: ${stackDescription}
- benefits: ровно 4 пункта с конкретными цифрами и метриками
- careerPath: ${careerPathDescription} с реальными зарплатами в рублях
- skills: ровно 5 ключевых скиллов с уровнем от 40 до 90
- ${dialogInstructions}
- Всё на русском языке
- Эмоционально, живо, с деталями атмосферы
- Используй разные эмодзи для каждого события в schedule
- В description используй цитаты или короткие фразы из рабочего процесса

${!isIT ? `
КРИТИЧЕСКИ ВАЖНО для НЕ IT профессии:
- В careerPath НЕ используй слова "Junior", "Middle", "Senior" - используй реальные названия должностей из данной профессии
- В stack указывай рабочие навыки, инструменты и оборудование, а не технологические стеки
- В dialog НЕ используй IT-контекст, серверы, код, деплой и т.д. - используй реальные рабочие ситуации профессии "${profession}"
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
        model: "gemini-2.0-flash",
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

// Генерация детальных описаний профессии для промптов изображений
async function generateProfessionImageDetails(
  profession: string,
  professionDescription?: string
): Promise<{
  mainActivity: string;
  specificTools: string;
  workplaceSetting: string;
  professionalAttire: string;
  keyVisualElements: string;
  toolsAndEquipment: string;
  actionVerb: string;
  specificTask: string;
  materialDetails: string;
  workspaceLayout: string;
  allToolsLaidOut: string;
  workDocuments: string;
  timeOfDay: string;
  fullContextActivity: string;
  surroundingEnvironment: string;
  teamOrClients: string;
}> {
  const ai = getAIClient();
  
  const prompt = `Ты эксперт по визуализации профессиональных сцен. Для профессии "${profession}"${professionDescription ? ` (${professionDescription})` : ''} создай детальное описание ключевых визуальных элементов для генерации изображений.

ВАЖНО: Описание должно быть очень конкретным и специфичным именно для профессии "${profession}". НЕ используй общие фразы. Для каждой категории укажи конкретные детали.

Ответь ТОЛЬКО в формате JSON:
{
  "mainActivity": "основное действие, которое выполняет специалист (например, для ассенизатора: 'работа с ассенизационной машиной, подключение шланга к канализационному колодцу')",
  "specificTools": "конкретные инструменты и оборудование, характерные для этой профессии (например, для ассенизатора: 'вакуумный насос, гибкие шланги большого диаметра, ассенизационная машина с цистерной')",
  "workplaceSetting": "конкретное место работы (например, для ассенизатора: 'у канализационного колодца на улице, рядом с ассенизационной машиной')",
  "professionalAttire": "специфичная рабочая одежда и защитное оборудование (например, для ассенизатора: 'рабочий комбинезон, резиновые перчатки, защитные сапоги, респиратор')",
  "keyVisualElements": "ключевые визуальные элементы, которые должны быть видны (например, для ассенизатора: 'специальная машина с цистерной, шланги, колодец, предупреждающие знаки')",
  "toolsAndEquipment": "детальное описание инструментов (например, для ассенизатора: 'вакуумный насос с рукавами, шланги различного диаметра, инструменты для обслуживания')",
  "actionVerb": "действие в процессе работы (например, для ассенизатора: 'откачивающий', 'подключающий')",
  "specificTask": "конкретная задача (например, для ассенизатора: 'откачку канализационных стоков из колодца')",
  "materialDetails": "детали материалов и их состояния (например, для ассенизатора: 'металлические поверхности машин, изношенные резиновые шланги, чистящие средства')",
  "workspaceLayout": "организация рабочего пространства (например, для ассенизатора: 'рабочая зона вокруг колодца с разложенными инструментами и шлангами')",
  "allToolsLaidOut": "все инструменты, разложенные для работы (например, для ассенизатора: 'шланги, соединители, ключи, инструменты для обслуживания насоса, средства защиты')",
  "workDocuments": "документы, связанные с работой (например, для ассенизатора: 'путевые листы, заявки на выезд, отчеты о выполненных работах')",
  "timeOfDay": "время дня для съемки (например: 'дневное время' или 'раннее утро')",
  "fullContextActivity": "полная картина деятельности (например, для ассенизатора: 'откачивание канализационных стоков из городского колодца')",
  "surroundingEnvironment": "окружающая среда (например, для ассенизатора: 'городская улица, тротуар, ближайшие здания, дорожные знаки')",
  "teamOrClients": "команда или клиенты (например, для ассенизатора: 'напарник-помощник или диспетчер по рации')"
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
    
    // Возвращаем результат с дефолтными значениями на случай отсутствия некоторых полей
    return {
      mainActivity: result.mainActivity || `${profession} выполняет основные рабочие задачи`,
      specificTools: result.specificTools || `профессиональные инструменты для ${profession}`,
      workplaceSetting: result.workplaceSetting || `рабочее место ${profession}`,
      professionalAttire: result.professionalAttire || `рабочая одежда ${profession}`,
      keyVisualElements: result.keyVisualElements || `ключевые элементы профессии ${profession}`,
      toolsAndEquipment: result.toolsAndEquipment || `инструменты и оборудование ${profession}`,
      actionVerb: result.actionVerb || 'работающий',
      specificTask: result.specificTask || `выполнение задач профессии ${profession}`,
      materialDetails: result.materialDetails || `материалы и инструменты ${profession}`,
      workspaceLayout: result.workspaceLayout || `организованное рабочее пространство ${profession}`,
      allToolsLaidOut: result.allToolsLaidOut || `все необходимые инструменты для ${profession}`,
      workDocuments: result.workDocuments || `рабочие документы и записи ${profession}`,
      timeOfDay: result.timeOfDay || 'дневное время',
      fullContextActivity: result.fullContextActivity || `выполнение работы ${profession}`,
      surroundingEnvironment: result.surroundingEnvironment || `рабочая среда ${profession}`,
      teamOrClients: result.teamOrClients || `коллеги или клиенты ${profession}`,
    };
  } catch (error: any) {
    console.error('Ошибка генерации деталей профессии для изображений:', error);
    // Возвращаем базовые значения в случае ошибки
    return {
      mainActivity: `${profession} выполняет основные рабочие задачи`,
      specificTools: `профессиональные инструменты для ${profession}`,
      workplaceSetting: `рабочее место ${profession}`,
      professionalAttire: `рабочая одежда ${profession}`,
      keyVisualElements: `ключевые элементы профессии ${profession}`,
      toolsAndEquipment: `инструменты и оборудование ${profession}`,
      actionVerb: 'работающий',
      specificTask: `выполнение задач профессии ${profession}`,
      materialDetails: `материалы и инструменты ${profession}`,
      workspaceLayout: `организованное рабочее пространство ${profession}`,
      allToolsLaidOut: `все необходимые инструменты для ${profession}`,
      workDocuments: `рабочие документы и записи ${profession}`,
      timeOfDay: 'дневное время',
      fullContextActivity: `выполнение работы ${profession}`,
      surroundingEnvironment: `рабочая среда ${profession}`,
      teamOrClients: `коллеги или клиенты ${profession}`,
    };
  }
}

// Генерация изображений
export async function generateImages(
  profession: string,
  slug: string,
  onProgress?: (message: string, progress: number) => void,
  professionDescription?: string, // Уточненное описание профессии для более точных промптов
  companySize?: 'startup' | 'medium' | 'large' | 'any',
  location?: 'moscow' | 'spb' | 'other' | 'remote',
  specialization?: string
): Promise<string[]> {
  if (onProgress) onProgress('Генерирую изображения...', 35);
  
  const isITProfession = profession.toLowerCase().includes('developer') || 
                         profession.toLowerCase().includes('devops') ||
                         profession.toLowerCase().includes('engineer') ||
                         profession.toLowerCase().includes('программист') ||
                         profession.toLowerCase().includes('разработчик');
  
  // Контекстные дополнения для промптов изображений
  const companySizeImageContext = companySize ? (() => {
    switch(companySize) {
      case 'startup': return 'startup environment, small team, casual atmosphere, modern minimalist office';
      case 'medium': return 'medium-sized company, organized workspace, professional but relaxed setting';
      case 'large': return 'corporate office, structured environment, modern corporate interior, professional setting';
      default: return '';
    }
  })() : '';

  const locationImageContext = location ? (() => {
    switch(location) {
      case 'remote': return 'home office setup, cozy workspace, personal touches, comfortable home environment';
      case 'moscow': return 'modern Moscow office, city views visible through windows';
      case 'spb': return 'Saint Petersburg office, architectural details, European style';
      default: return '';
    }
  })() : '';

  const specializationImageContext = specialization ? `specialized for ${specialization}` : '';
  
  const contextualPromptAddition = [companySizeImageContext, locationImageContext, specializationImageContext]
    .filter(Boolean)
    .join(', ');
  
  let prompts: string[];
  
  if (isITProfession) {
    const baseContext = contextualPromptAddition ? `, ${contextualPromptAddition}` : '';
    prompts = [
      `First-person view POV: ${profession} hands typing on mechanical keyboard, RGB backlight, dual monitors showing real code editor and terminal with commands, energy drink can, sticky notes with passwords on monitor frame, tangled cables, warm desk lamp light, 2am vibe, authentic programmer workspace chaos${baseContext}, ultrarealistic`,
      `Extreme close-up: computer screen showing authentic ${profession} work - IDE with code, terminal logs scrolling, browser with Stack Overflow tabs, Slack message notifications popping, GitHub commits, blinking cursor, slight screen glare, coffee stain on desk visible in corner, person's tired reflection in screen, dim room lighting${baseContext}, cinematic`,
      `Flat lay top-down: ${profession} messy workspace during active work - laptop covered with developer stickers (Linux, GitHub, etc), second monitor, mechanical keyboard, gaming mouse, smartphone showing work messages, open notebook with handwritten schemas and bugs, 3 coffee mugs, snack wrappers, USB cables everywhere, AirPods, smartwatch${baseContext}, afternoon natural light, authentic chaos`,
      `Cinematic wide shot: ${profession} deep in flow state at night, wearing hoodie, side profile, face illuminated only by multiple monitor glow in dark room, messy hair, intense focused expression, can of energy drink in hand, pizza box on desk, headphones on, code visible on screens${baseContext}, moody cyberpunk aesthetic, realistic photography`,
    ];
  } else {
    // Генерируем детальные промпты с использованием AI для получения специфичных деталей профессии
    const professionDetails = await generateProfessionImageDetails(profession, professionDescription);
    
    const baseContext = contextualPromptAddition ? `, ${contextualPromptAddition}` : '';
    
    prompts = [
      `First-person POV hands-on view: ${professionDetails.mainActivity}, ${professionDetails.specificTools} visible and in use, ${professionDetails.workplaceSetting}, ${professionDetails.professionalAttire}, authentic working moment, ${professionDetails.keyVisualElements}${baseContext}, natural lighting, realistic detail, candid photography style`,
      `Close-up detail shot: ${professionDetails.toolsAndEquipment} being actively used by ${profession} professional, ${professionDetails.actionVerb} ${professionDetails.specificTask}, hands in action, ${professionDetails.materialDetails}, authentic wear and use marks${baseContext}, professional quality photography, natural daylight`,
      `Overhead flat lay view: ${professionDetails.workspaceLayout} during active work shift, ${professionDetails.allToolsLaidOut}, work in progress visible, ${professionDetails.workDocuments}, authentic workspace organization${baseContext}, realistic professional equipment, natural daylight, detailed composition`,
      `Cinematic environmental portrait: ${profession} professional in action at ${professionDetails.timeOfDay}, ${professionDetails.fullContextActivity}, ${professionDetails.surroundingEnvironment}, ${professionDetails.teamOrClients}, authentic workplace atmosphere, ${professionDetails.professionalAttire}${baseContext}, dynamic movement, realistic lighting, documentary photography style, capturing authentic professional moment`,
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
            model: 'imagen-3.0-generate-002',
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
  onProgress?: (message: string, progress: number) => void,
  location?: 'moscow' | 'spb' | 'other' | 'remote'
) {
  if (onProgress) onProgress('Получаю статистику вакансий...', 77);
  
  // Определяем area ID для HH.ru API
  // 113 - Россия, 1 - Москва, 2 - Санкт-Петербург
  const areaId = location ? (() => {
    switch(location) {
      case 'moscow': return '1';
      case 'spb': return '2';
      case 'remote': return '113'; // Вся Россия, но будем фильтровать по schedule: remote
      default: return '113'; // Вся Россия для "другой город"
    }
  })() : '113';
  
  try {
    const response = await fetch(
      `https://api.hh.ru/vacancies?text=${encodeURIComponent(profession)}&per_page=20&order_by=relevance&area=${areaId}${location === 'remote' ? '&schedule=remote' : ''}`
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

// Генерация древовидной roadmap на основе навыков
export async function generateCareerTree(
  profession: string,
  level: string,
  currentSkills: { name: string; level: number }[],
  stack: string[],
  isIT: boolean,
  onProgress?: (message: string, progress: number) => void,
  location?: 'moscow' | 'spb' | 'other' | 'remote'
): Promise<any> {
  if (onProgress) onProgress('Генерирую древовидную roadmap...', 78);
  
  const ai = getAIClient();
  
  // Получаем реальные навыки из вакансий hh.ru
  if (onProgress) onProgress('Анализирую реальные вакансии для навыков...', 78.5);
  const realSkillsData = await fetchRealSkillsFromVacancies(profession, location, 15);
  const realSkillsList = realSkillsData.skills.length > 0 
    ? `\n\nРЕАЛЬНЫЕ НАВЫКИ ИЗ ВАКАНСИЙ HH.RU (${realSkillsData.skills.length} топ навыков):\n${realSkillsData.skills.slice(0, 15).join(', ')}`
    : '';
  
  const skillsList = currentSkills.map(s => `${s.name} (${s.level}%)`).join(', ');
  const stackList = stack.join(', ');
  
  const prompt = `Ты AI-ассистент для карьерного консультирования. Создай ДРЕВОВИДНУЮ карьерную roadmap для профессии "${profession}" уровня ${level}.

ВАЖНО: Вместо линейного пути (Junior → Senior) создай структуру, где:
1. Корень - текущая позиция "${profession}"
2. Ветви - возможные пути развития на основе РАЗНЫХ навыков
3. Каждый путь показывает конкретные навыки, которые нужно развить
4. Покажи связанные профессии и вакансии

Текущие навыки специалиста: ${skillsList}
Текущий стек: ${stackList}${realSkillsList}

ВАЖНО: Используй реальные навыки из вакансий hh.ru при создании путей развития. Навыки должны быть актуальными и востребованными на рынке.

Примеры путей развития:
- Для Frontend Developer: Fullstack (через Node.js), Mobile Developer (через React Native), UI/UX Designer (через дизайн), Tech Lead (через управление)
- Для DevOps: SRE (через углубление в надежность), Cloud Architect (через AWS/Azure), Security Engineer (через безопасность)
- Для не IT профессий: переход в смежные специальности через развитие конкретных навыков

Формат JSON:
{
  "currentRole": {
    "title": "${profession}",
    "skills": ["основной навык1", "основной навык2", "основной навык3"],
    "level": "${level}"
  },
  "paths": [
    {
      "id": "path1",
      "title": "Название следующей роли (например: Fullstack Developer)",
      "type": "vertical|horizontal|alternative",
      "skills": ["навык1", "навык2"],
      "skillsRequired": ["конкретный навык для развития", "еще один навык"],
      "timeToReach": "1-2 года",
      "salaryRange": "120 000 - 180 000 ₽",
      "relatedProfessions": ["связанная профессия1", "связанная профессия2"],
      "difficulty": "easy|medium|hard",
      "benefits": ["что дает этот путь", "преимущество 2"],
      "description": "краткое описание пути (1-2 предложения)"
    }
  ],
  "skillTree": {
    "skills": [
      {
        "id": "skill1",
        "name": "название навыка",
        "level": 60,
        "description": "что дает этот навык",
        "opensRoles": ["path1", "path2"]
      }
    ]
  }
}

Создай 4-6 различных путей развития. Пути должны быть реалистичными и основанными на навыках, а не только на грейдах.`;

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
    
    // Добавляем ID к путям, если их нет
    if (result.paths && Array.isArray(result.paths)) {
      result.paths = result.paths.map((path: any, index: number) => ({
        ...path,
        id: path.id || `path-${index + 1}`,
      }));
    }
    
    if (onProgress) onProgress('Roadmap сгенерирована ✅', 79);
    return result;
  } catch (error: any) {
    console.error('Career tree generation error:', error);
    // Возвращаем базовую структуру в случае ошибки
    return {
      currentRole: {
        title: profession,
        skills: currentSkills.map(s => s.name),
        level: level,
      },
      paths: [],
      skillTree: { skills: [] },
    };
  }
}

// Получение количества вакансий для профессии
async function getVacanciesCount(profession: string, location?: 'moscow' | 'spb' | 'other' | 'remote'): Promise<number> {
  try {
    const areaId = location ? (() => {
      switch(location) {
        case 'moscow': return '1';
        case 'spb': return '2';
        case 'remote': return '113';
        default: return '113';
      }
    })() : '113';
    
    const response = await fetch(
      `https://api.hh.ru/vacancies?text=${encodeURIComponent(profession)}&per_page=1&area=${areaId}${location === 'remote' ? '&schedule=remote' : ''}`
    );
    const data = await response.json();
    return data.found || 0;
  } catch (error) {
    console.error(`Error fetching vacancies for ${profession}:`, error);
    return 0;
  }
}

// Получение навыков из реальных вакансий hh.ru
export async function fetchRealSkillsFromVacancies(
  profession: string,
  location?: 'moscow' | 'spb' | 'other' | 'remote',
  limit: number = 20
): Promise<{ skills: string[]; skillFrequency: Record<string, number> }> {
  try {
    const areaId = location ? (() => {
      switch(location) {
        case 'moscow': return '1';
        case 'spb': return '2';
        case 'remote': return '113';
        default: return '113';
      }
    })() : '113';
    
    // Получаем список вакансий
    const listResponse = await fetch(
      `https://api.hh.ru/vacancies?text=${encodeURIComponent(profession)}&per_page=${limit}&order_by=relevance&area=${areaId}${location === 'remote' ? '&schedule=remote' : ''}`
    );
    const listData = await listResponse.json();
    
    if (!listData.items || listData.items.length === 0) {
      return { skills: [], skillFrequency: {} };
    }
    
    // Получаем детальную информацию о вакансиях (с навыками)
    const skillFrequency: Record<string, number> = {};
    const vacancyIds = listData.items.slice(0, Math.min(limit, 10)).map((item: any) => item.id);
    
    // Делаем запросы с задержкой, чтобы не превысить лимит 10 запросов/сек
    for (const vacancyId of vacancyIds) {
      try {
        await new Promise(resolve => setTimeout(resolve, 150)); // Задержка 150ms между запросами
        
        const detailResponse = await fetch(`https://api.hh.ru/vacancies/${vacancyId}`);
        const detailData = await detailResponse.json();
        
        if (detailData.key_skills && Array.isArray(detailData.key_skills)) {
          detailData.key_skills.forEach((skill: { name: string }) => {
            const skillName = skill.name.trim();
            if (skillName) {
              skillFrequency[skillName] = (skillFrequency[skillName] || 0) + 1;
            }
          });
        }
      } catch (error) {
        console.error(`Error fetching vacancy ${vacancyId}:`, error);
        // Продолжаем обработку других вакансий
      }
    }
    
    // Сортируем навыки по частоте и берем топ
    const sortedSkills = Object.entries(skillFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill]) => skill);
    
    return {
      skills: sortedSkills,
      skillFrequency,
    };
  } catch (error) {
    console.error(`Error fetching skills from vacancies for ${profession}:`, error);
    return { skills: [], skillFrequency: {} };
  }
}

// Основная функция генерации карточки
export async function generateCard(
  profession: string,
  level: string = "Middle",
  company: string = "стартап",
  options?: {
    generateAudio?: boolean;
    onProgress?: (message: string, progress: number) => void;
    professionDescription?: string;
    companySize?: 'startup' | 'medium' | 'large' | 'any';
    location?: 'moscow' | 'spb' | 'other' | 'remote';
    specialization?: string;
  }
) {
  const { 
    generateAudio = false,
    onProgress,
    professionDescription,
    companySize,
    location,
    specialization
  } = options || {};
  
  const slug = transliterate(profession);
  
  // Проверяем кеш
  const cached = await getCachedCard(slug);
  if (cached) {
    if (onProgress) onProgress('Найдена кешированная карточка ✅', 100);
    return cached;
  }
  
  if (onProgress) onProgress('Начинаю генерацию...', 0);
  
  // 1. Генерация текстового контента
  const data = await generateProfessionData(profession, level, company, onProgress, companySize, location, specialization);
  
  // 2-4. Параллельная генерация изображений, статистики и видео
  if (onProgress) onProgress('Запускаю параллельную генерацию контента...', 30);
  
  // Отслеживаем прогресс изображений (самая долгая задача)
  const [images, vacanciesStats, videos] = await Promise.all([
    generateImages(profession, slug, (msg, prog) => {
      if (onProgress) {
        // Прогресс: 30% (текст) + до 50% (изображения) = 30-80%
        const totalProgress = 30 + (prog / 100) * 50;
        onProgress(msg, totalProgress);
      }
    }, professionDescription, companySize, location, specialization), // Передаем все параметры
    fetchVacanciesStats(profession, () => {
      // Статистика быстрая, не отслеживаем прогресс отдельно
    }, location), // Передаем локацию для фильтрации вакансий
    fetchYouTubeVideos(profession, () => {
      // Видео быстрые, не отслеживаем прогресс отдельно
    }),
  ]);
  
  if (onProgress) onProgress('Завершаю генерацию...', 80);
  
  // 5. Генерация древовидной roadmap
  let careerTree = null;
  try {
    careerTree = await generateCareerTree(
      profession,
      level,
      data.skills || [],
      data.stack || [],
      data.isIT || false,
      onProgress,
      location
    );
    
    // Добавляем количество вакансий для каждого пути (параллельно)
    if (careerTree && careerTree.paths && careerTree.paths.length > 0) {
      const vacanciesPromises = careerTree.paths.map(async (path: any) => {
        if (!path.vacancies) {
          const count = await getVacanciesCount(path.title, location);
          return { ...path, vacancies: count };
        }
        return path;
      });
      careerTree.paths = await Promise.all(vacanciesPromises);
    }
  } catch (error: any) {
    console.error('Error generating career tree:', error.message);
    // Не прерываем генерацию из-за ошибки roadmap
  }
  
  // 6. Генерация звуков (опционально)
  let audioData = null;
  if (generateAudio) {
    try {
      if (onProgress) onProgress('Генерирую звуковые эффекты...', 85);
      
      // Импортируем audio-generator динамически
      const { generateProfessionAudio, checkCachedAudio } = await import('./audio-generator');
      
      const hasAudio = await checkCachedAudio(slug);
      if (!hasAudio) {
        audioData = await generateProfessionAudio(slug, (msg, prog) => {
          if (onProgress) {
            // Прогресс: 85% + до 10% (звуки) = 85-95%
            const totalProgress = 85 + (prog / 100) * 10;
            onProgress(msg, totalProgress);
          }
        });
      } else {
        if (onProgress) onProgress('Звуки уже сгенерированы ✅', 95);
      }
    } catch (error: any) {
      console.error('Error generating audio:', error.message);
      // Не прерываем генерацию из-за звуков
      if (onProgress) onProgress('⚠️ Ошибка генерации звуков, продолжаем...', 95);
    }
  }
  
  if (onProgress) onProgress('Финализирую...', 95);
  
  // 7. Объединяем всё в один объект
  const fullData = {
    ...data,
    slug,
    images,
    ...vacanciesStats,
    videos,
    ...(audioData ? { audio: audioData } : {}),
    ...(careerTree ? { careerTree } : {}),
    generatedAt: new Date().toISOString(),
    // Сохраняем контекстные параметры
    companySize: companySize || undefined,
    location: location || undefined,
    specialization: specialization || undefined,
  };

  // 8. Сохраняем в кеш
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
      model: 'gemini-2.0-flash',
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
      model: 'gemini-2.0-flash',
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

