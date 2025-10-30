import { NextRequest } from 'next/server';
import { generateCard, generateBaseCard, transliterate, getCachedCard } from '@/lib/card-generator';

// Явно загружаем переменные окружения для API routes
// Next.js должен загружать их автоматически, но иногда требуется явная загрузка
if (typeof window === 'undefined') {
  try {
    const dotenv = require('dotenv');
    const path = require('path');
    dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  } catch (e) {
    // dotenv может быть не установлен или файл не найден - это нормально для Next.js
    console.log('Note: dotenv not needed, Next.js handles env vars automatically');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      profession, 
      level = "Middle", 
      company = "стартап",
      companySize,
      location,
      specialization,
      generateAudio = false,
      fastMode = false // Режим быстрой генерации - только базовая карточка
    } = body;

    if (!profession || typeof profession !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Профессия обязательна' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const slug = transliterate(profession);
    
    // Создаем ReadableStream для SSE
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (message: string, progress: number) => {
          const data = JSON.stringify({ message, progress });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        try {
          // Проверяем кеш
          const cached = await getCachedCard(slug);
          if (cached) {
            sendProgress('Найдена кешированная карточка ✅', 100);
            const finalData = JSON.stringify({ 
              ...cached,
              cached: true,
              done: true 
            });
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
            controller.close();
            return;
          }

          // Проверяем наличие GOOGLE_API_KEY перед генерацией
          if (!process.env.GOOGLE_API_KEY) {
            throw new Error('GOOGLE_API_KEY не настроен. Убедитесь, что файл .env.local содержит GOOGLE_API_KEY и перезапустите сервер.');
          }

          sendProgress('Начинаю генерацию карточки...', 0);
          
          if (fastMode) {
            // Быстрый режим: генерируем только базовую карточку
            const baseCard = await generateBaseCard(
              profession,
              level,
              company,
              {
                onProgress: sendProgress,
                companySize,
                location,
                specialization
              }
            );
            
            // Отправляем базовую карточку сразу
            const baseData = JSON.stringify({ 
              ...baseCard,
              cached: false,
              done: false, // Не done, так как остальное будет догружено
              isPartial: true
            });
            controller.enqueue(encoder.encode(`data: ${baseData}\n\n`));
            
            // Продолжаем генерацию остального контента в фоне
            generateCard(
              profession,
              level,
              company,
              {
                generateAudio,
                companySize,
                location,
                specialization,
                onProgress: (msg, prog) => {
                  // Отправляем прогресс догрузки
                  const updateData = JSON.stringify({ 
                    message: msg,
                    progress: prog,
                    type: 'update'
                  });
                  controller.enqueue(encoder.encode(`data: ${updateData}\n\n`));
                }
              }
            ).then((fullCard) => {
              // Отправляем полную карточку когда готова
              const fullData = JSON.stringify({ 
                ...fullCard,
                cached: false,
                done: true,
                isPartial: false
              });
              controller.enqueue(encoder.encode(`data: ${fullData}\n\n`));
              controller.close();
            }).catch((error: any) => {
              console.error('Error generating full card:', error);
              controller.close();
            });
          } else {
            // Полный режим: генерируем всё сразу
            const cardData = await generateCard(
              profession,
              level,
              company,
              {
                generateAudio,
                onProgress: sendProgress,
                companySize,
                location,
                specialization
              }
            );

            // Отправляем финальный результат
            const finalData = JSON.stringify({ 
              ...cardData,
              cached: false,
              done: true 
            });
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
            
            controller.close();
          }
        } catch (error: any) {
          // Извлекаем понятное сообщение об ошибке
          let errorMessage = 'Ошибка генерации';
          if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          // Добавляем дополнительную информацию для ошибок локации
          if (errorMessage.includes('location') || errorMessage.includes('FAILED_PRECONDITION')) {
            errorMessage = `Ошибка API: ${errorMessage}. Google AI API может быть недоступен в вашем регионе. Попробуйте использовать VPN или другой API ключ с поддержкой вашего региона.`;
          }
          
          const errorData = JSON.stringify({ 
            error: errorMessage,
            done: true 
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in generate-card:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Внутренняя ошибка сервера' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

