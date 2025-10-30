/**
 * WebSocket Server для проксирования Gemini Live API
 * Server-to-Server архитектура для обхода геоблокировок
 */

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { GoogleGenAI, Modality } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const PORT = process.env.VOICE_WS_PORT || 3001;
const CLIENT_URL = process.env.NEXT_PUBLIC_URL || 'https://hhhack.agiin2024.ru';

const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

console.log('🚀 Starting Voice Chat WebSocket Server...');
console.log('📡 Client URL:', CLIENT_URL);
console.log('🔑 API Key:', process.env.GOOGLE_AI_API_KEY ? 'Found' : 'Missing');

io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);
  
  let geminiSession: any = null;
  let isConnected = false;

  // Инициализация соединения с Gemini
  socket.on('init', async (data) => {
    try {
      const { professionName, professionData } = data;
      
      console.log('🎯 Initializing for profession:', professionName);

      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        socket.emit('error', { message: 'API key not configured' });
        return;
      }

      // Создаем system instruction
      const systemInstruction = `Ты - живой, реальный представитель профессии "${professionName}"${professionData?.company ? ` в компании ${professionData.company}` : ''}.
Ты разговариваешь с кандидатом, который интересуется этой профессией.

ВАЖНО - СТИЛЬ РЕЧИ И ГОЛОС:
- Говори ТОЛЬКО на русском языке
- Говори естественно, как обычный человек в реальном разговоре
- Используй живые интонации, паузы, эмоции
- Можешь использовать междометия типа "ну", "вот", "знаешь", "понимаешь"
- Звучи увлечённо и заинтересованно, но без излишнего энтузиазма
- Говори в разговорном стиле, как будто рассказываешь коллеге за чашкой кофе
- Избегай формальностей и канцеляризмов
- НЕ звучи как робот или автоответчик
- Отвечай довольно кратко (20-40 секунд), но содержательно
- Можешь добавлять личный опыт и примеры из жизни

ИНФОРМАЦИЯ О ВАКАНСИИ:
${professionData?.level ? `Уровень: ${professionData.level}` : ''}
${professionData?.benefits?.length ? `\nПреимущества:\n${professionData.benefits.map((b: any) => `- ${b.text}`).join('\n')}` : ''}
${professionData?.skills?.length ? `\nНужные навыки:\n${professionData.skills.map((s: any) => `- ${s.name}`).join('\n')}` : ''}
${professionData?.schedule?.length ? `\nТипичный день:\n${professionData.schedule.slice(0, 3).map((s: any) => `- ${s.time}: ${s.title} - ${s.description}`).join('\n')}` : ''}

ТВОЯ ЗАДАЧА:
- Отвечать на вопросы о работе, условиях, требованиях, карьере
- Делиться инсайтами о профессии
- Помогать понять, подходит ли человеку эта работа
- Если спрашивают о чём-то не связанном с профессией, вежливо возвращай к теме

Помни: ты говоришь вслух, поэтому твоя речь должна звучать максимально естественно и по-человечески!`;

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { apiVersion: "v1alpha" }
      });

      const model = "gemini-2.5-flash-native-audio-preview-09-2025";
      
      // Подключаемся к Gemini Live API на сервере (в Нидерландах)
      geminiSession = await ai.live.connect({
        model,
        callbacks: {
          onopen: () => {
            console.log('✅ Connected to Gemini Live API for', socket.id);
            isConnected = true;
            socket.emit('connected');
          },
          onmessage: (message: any) => {
            // Пересылаем сообщения от Gemini клиенту
            socket.emit('gemini-message', message);
          },
          onerror: (e: any) => {
            console.error('❌ Gemini API error:', e);
            socket.emit('error', { message: e.message || 'Gemini API error' });
          },
          onclose: (e: any) => {
            console.log('🔴 Gemini connection closed:', e.reason);
            isConnected = false;
            socket.emit('disconnected', { reason: e.reason });
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede"
              }
            }
          },
          enableAffectiveDialog: true,
          proactivity: { 
            proactiveAudio: true
          },
          generationConfig: {
            temperature: 0.9,
            candidateCount: 1,
          }
        },
      });

    } catch (error: any) {
      console.error('Failed to initialize Gemini session:', error);
      socket.emit('error', { message: error.message || 'Failed to connect to Gemini' });
    }
  });

  // Получение аудио от клиента
  socket.on('audio', async (data) => {
    if (!isConnected || !geminiSession) {
      console.warn('⚠️ Received audio but not connected');
      return;
    }

    try {
      // Пересылаем аудио в Gemini
      geminiSession.sendRealtimeInput({
        audio: {
          data: data.audio,
          mimeType: data.mimeType || "audio/pcm;rate=16000"
        }
      });
    } catch (error: any) {
      console.error('Error sending audio to Gemini:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Закрытие соединения
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
    if (geminiSession) {
      try {
        geminiSession.close();
      } catch (e) {
        // ignore
      }
      geminiSession = null;
    }
    isConnected = false;
  });

  // Явное закрытие
  socket.on('close', () => {
    if (geminiSession) {
      try {
        geminiSession.close();
      } catch (e) {
        // ignore
      }
      geminiSession = null;
    }
    isConnected = false;
    socket.disconnect();
  });
});

httpServer.listen(PORT, () => {
  console.log(`✅ Voice Chat WebSocket Server running on port ${PORT}`);
  console.log(`🌐 Accepting connections from ${CLIENT_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, closing server...');
  httpServer.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

