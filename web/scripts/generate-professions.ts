import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Загружаем переменные окружения из .env.local
dotenv.config({ path: '.env.local' });

// Единый клиент для Gemini + Imagen
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

// Список профессий для генерации (3 штуки по требованиям хакатона)
const professions = [
  { name: "DevOps Engineer", level: "Middle", company: "стартап" },
  { name: "Frontend Developer", level: "Junior", company: "стартап" },
  { name: "Бариста", level: "Junior", company: "кофейня" }, // не-IT
];

async function generateProfessionData(profession: string, level: string, company: string) {
  console.log(`  Генерирую текстовый контент...`);

  const prompt = `
Создай детальную карточку профессии для "${profession}" уровня ${level} в ${company}.

Верни ТОЛЬКО валидный JSON (без markdown, без комментариев) со следующей структурой:

{
  "profession": "${profession}",
  "level": "${level}",
  "company": "${company}",
  "schedule": [
    {
      "time": "10:00",
      "title": "название активности",
      "emoji": "⏰",
      "description": "короткое описание или цитата",
      "detail": "детальное описание что происходит, что делаешь, какие инструменты используешь"
    }
  ],
  "stack": ["технология1", "технология2", "инструмент1"],
  "benefits": [
    {
      "icon": "✨",
      "text": "конкретная польза с цифрами или метриками"
    }
  ],
  "careerPath": [
    {
      "level": "Junior",
      "years": "1-2г",
      "salary": "80k-150k"
    }
  ],
  "skills": [
    {
      "name": "название скилла",
      "level": 80
    }
  ],
  "dialog": {
    "message": "сообщение от коллеги или клиента",
    "options": ["вариант ответа 1", "вариант ответа 2", "вариант ответа 3"],
    "response": "реакция на первый вариант ответа"
  }
}

ВАЖНЫЕ ТРЕБОВАНИЯ:
- schedule: ровно 6 событий за рабочий день (с 10:00 до 18:00)
- stack: 8-10 технологий/инструментов конкретно для этой профессии
- benefits: ровно 4 пункта с конкретными цифрами и метриками
- careerPath: ровно 4 этапа карьеры с реальными зарплатами в рублях
- skills: ровно 5 ключевых скиллов с уровнем от 40 до 90
- dialog: реалистичный диалог с коллегой/клиентом
- Всё на русском языке
- Эмоционально, живо, с деталями атмосферы
- Используй разные эмодзи для каждого события в schedule
- В description используй цитаты или короткие фразы из рабочего процесса
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.9,
      responseMimeType: "application/json", // Принудительно JSON
    },
  });
  
  const jsonText = response.text || '{}';
  return JSON.parse(jsonText);
}

async function generateImages(profession: string, slug: string) {
  console.log(`  Генерирую изображения...`);
  
  const prompts = [
    `Professional workspace for ${profession}, modern office desk setup, realistic photo, high quality`,
    `Computer screen showing dashboard and tools for ${profession}, close-up view, professional lighting`,
    `${profession} team collaboration, people working together, candid workplace photo`,
    `Tools and equipment used by ${profession}, organized workspace, professional photography`,
  ];

  const images = [];
  
  for (let i = 0; i < prompts.length; i++) {
    try {
      console.log(`    Изображение ${i + 1}/4...`);
      
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-fast-generate-001', // Быстрая модель для хакатона
        prompt: prompts[i],
        config: {
          numberOfImages: 1,
          aspectRatio: "1:1",
        },
      });

      const image = response.generatedImages[0];
      const imageDir = path.join(process.cwd(), 'public', 'generated', slug);
      
      if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
      }

      const filename = `image-${i + 1}.png`;
      const filepath = path.join(imageDir, filename);
      
      // Сохраняем base64 в файл
      const buffer = Buffer.from(image.image.imageBytes, 'base64');
      fs.writeFileSync(filepath, buffer);
      
      images.push(`/generated/${slug}/${filename}`);
      console.log(`    ✓ Сохранено: ${filename}`);
      
      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error(`    ✗ Ошибка генерации изображения ${i + 1}:`, error.message);
      // Используем плейсхолдер если генерация не удалась
      images.push(`https://placehold.co/400x400/1e293b/9333ea?text=Image+${i + 1}`);
    }
  }

  return images;
}

async function fetchYouTubeVideos(profession: string) {
  console.log(`  Ищу видео на YouTube...`);
  
  if (!process.env.YOUTUBE_API_KEY) {
    console.log(`    ⚠ YOUTUBE_API_KEY не найден, пропускаю...`);
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
      console.error(`    ✗ YouTube API ошибка:`, data.error.message);
      return [];
    }
    
    const videos = data.items?.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
    })) || [];
    
    console.log(`    ✓ Найдено ${videos.length} видео`);
    
    return videos;
  } catch (error: any) {
    console.error(`    ✗ Ошибка поиска видео:`, error.message);
    return [];
  }
}

async function fetchVacanciesStats(profession: string) {
  console.log(`  Получаю статистику вакансий с HH.ru...`);
  
  try {
    // Получаем топ-20 вакансий для анализа
    const response = await fetch(
      `https://api.hh.ru/vacancies?text=${encodeURIComponent(profession)}&per_page=20&order_by=relevance`
    );
    const data = await response.json();
    
    const found = data.found || 0;
    const competition = found > 1000 ? 'высокая' : 
                       found > 500 ? 'средняя' : 'низкая';
    
    // Парсим зарплаты и компании
    const salaries: number[] = [];
    const companies: string[] = [];
    
    data.items?.forEach((vacancy: any) => {
      if (vacancy.salary?.from) {
        salaries.push(vacancy.salary.from);
      }
      if (vacancy.salary?.to) {
        salaries.push(vacancy.salary.to);
      }
      if (vacancy.employer?.name) {
        companies.push(vacancy.employer.name);
      }
    });
    
    // Средняя зарплата
    const avgSalary = salaries.length > 0 
      ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
      : null;
    
    // Топ компании (уникальные, первые 5)
    const topCompanies = [...new Set(companies)].slice(0, 5);
    
    console.log(`    ✓ Найдено вакансий: ${found}`);
    if (avgSalary) {
      console.log(`    ✓ Средняя зарплата: ${avgSalary.toLocaleString('ru-RU')} ₽`);
    }
    if (topCompanies.length > 0) {
      console.log(`    ✓ Топ компании: ${topCompanies.slice(0, 3).join(', ')}`);
    }
    
    return {
      vacancies: found,
      competition,
      avgSalary,
      topCompanies,
    };
  } catch (error: any) {
    console.error(`    ✗ Ошибка получения вакансий:`, error.message);
    return {
      vacancies: 0,
      competition: 'неизвестно',
      avgSalary: null,
      topCompanies: [],
    };
  }
}

async function generateAll() {
  console.log('\n🚀 Начинаем генерацию профессий...\n');
  console.log(`Всего профессий: ${professions.length}\n`);
  
  if (!process.env.GOOGLE_API_KEY) {
    console.error('❌ ОШИБКА: Не найден GOOGLE_API_KEY в .env.local');
    console.error('   Создай файл .env.local и добавь: GOOGLE_API_KEY=твой_ключ');
    process.exit(1);
  }
  
  const dataDir = path.join(process.cwd(), 'data', 'professions');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const results = [];

  for (let i = 0; i < professions.length; i++) {
    const prof = professions[i];
    console.log(`\n[${ i + 1}/${professions.length}] 📝 ${prof.name} (${prof.level} в ${prof.company})`);
    console.log('─'.repeat(60));
    
    try {
      // 1. Генерация текстового контента через Gemini
      const data = await generateProfessionData(prof.name, prof.level, prof.company);
      
      // Транслитерация для кириллицы
      const translitMap: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      
      const slug = prof.name
        .toLowerCase()
        .split('')
        .map(char => translitMap[char] || char)
        .join('')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '');
      
      // 2. Генерация изображений через Imagen
      const images = await generateImages(prof.name, slug);
      
      // 3. Статистика вакансий из HH.ru API
      const vacanciesStats = await fetchVacanciesStats(prof.name);
      
      // 4. Поиск видео на YouTube
      const videos = await fetchYouTubeVideos(prof.name);
      
      // 5. Объединяем всё в один объект
      const fullData = {
        ...data,
        slug,
        images,
        ...vacanciesStats,
        videos,
        generatedAt: new Date().toISOString(),
      };

      // 5. Сохраняем в JSON файл
      const filepath = path.join(dataDir, `${slug}.json`);
      fs.writeFileSync(filepath, JSON.stringify(fullData, null, 2), 'utf-8');
      
      console.log(`  ✅ Сохранено: data/professions/${slug}.json`);
      
      results.push({ slug, profession: prof.name, success: true });
      
      // Задержка между профессиями чтобы не превысить rate limits
      if (i < professions.length - 1) {
        console.log('\n  ⏳ Пауза 3 секунды...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
    } catch (error: any) {
      console.error(`  ❌ ОШИБКА для ${prof.name}:`, error.message);
      results.push({ slug: '', profession: prof.name, success: false, error: error.message });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 ГЕНЕРАЦИЯ ЗАВЕРШЕНА!\n');
  
  console.log('Результаты:');
  results.forEach(r => {
    if (r.success) {
      console.log(`  ✅ ${r.profession} → data/professions/${r.slug}.json`);
    } else {
      console.log(`  ❌ ${r.profession} → ОШИБКА`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\nУспешно: ${successCount}/${results.length}`);
  
  if (successCount > 0) {
    console.log('\n💡 Теперь можно запустить: npm run dev');
  }
}

generateAll().catch(console.error);

