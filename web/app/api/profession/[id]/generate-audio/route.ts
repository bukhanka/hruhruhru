import { NextRequest } from 'next/server';
import { getCachedCard, saveCardToCache } from '@/lib/card-generator';
import { generateProfessionAudio, loadCachedAudio } from '@/lib/audio-generator';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // Загружаем карточку из кеша
    const cardData = await getCachedCard(id);
    
    if (!cardData) {
      return new Response(
        JSON.stringify({ error: 'Карточка не найдена' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!cardData.schedule || cardData.schedule.length === 0) {
      return new Response(
        JSON.stringify({ error: 'В карточке нет расписания для генерации звуков' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Проверяем API ключ
    if (!process.env.ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ELEVENLABS_API_KEY не настроен' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Создаем SSE stream для прогресса
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (message: string, progress: number) => {
          const data = JSON.stringify({ message, progress, type: 'progress' });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        try {
          sendProgress('Начинаю генерацию звуков...', 0);

          // Генерируем аудио
          const audioData = await generateProfessionAudio(
            id,
            sendProgress,
            {
              profession: cardData.profession,
              schedule: cardData.schedule,
              isIT: cardData.isIT || false,
            }
          );

          // Обогащаем schedule элементами soundId
          const enrichedSchedule = cardData.schedule.map(scheduleItem => {
            const matchingSound = audioData.timelineSounds.find(
              sound => sound.timeSlot === scheduleItem.time
            );
            
            if (matchingSound) {
              return {
                ...scheduleItem,
                soundId: matchingSound.id,
              };
            }
            
            return scheduleItem;
          });

          // Обновляем карточку
          const updatedCard = {
            ...cardData,
            schedule: enrichedSchedule,
            audio: audioData,
          };

          // Сохраняем в кеш
          await saveCardToCache(updatedCard, id);

          sendProgress('Звуки успешно сгенерированы! ✅', 100);

          // Отправляем финальный результат
          const finalData = JSON.stringify({
            success: true,
            schedule: enrichedSchedule,
            audio: audioData,
            done: true,
          });
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
          controller.close();

        } catch (error: any) {
          logger.error('Generate Audio API: ошибка генерации', error, { id });
          
          const errorMessage = error?.message || 'Ошибка генерации звуков';
          const errorData = JSON.stringify({
            error: errorMessage,
            done: true,
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
    logger.error('Generate Audio API: критическая ошибка', error, { id });
    return new Response(
      JSON.stringify({ error: error.message || 'Внутренняя ошибка сервера' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

