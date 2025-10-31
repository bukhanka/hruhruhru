/**
 * Быстрый тест нового ElevenLabs API ключа через прокси
 */
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

const API_KEY = 'sk_9f67d8858f37a8ec4c0696ee22c6c99fd5fd085312adc7c1';
const PROXY_URL = 'http://user325386:6qea5s@195.64.117.160:7591';

async function testKey() {
  console.log('\n🧪 Тестирование ElevenLabs API ключа через прокси...\n');
  console.log('🔑 API ключ:', API_KEY.substring(0, 20) + '...');
  console.log('🌐 Прокси:', PROXY_URL.replace(/:[^:@]+@/, ':****@'));
  
  const agent = new HttpsProxyAgent(PROXY_URL);
  
  try {
    // Тест 1: Проверка информации о пользователе
    console.log('\n📋 Тест 1: Получение информации о пользователе...');
    
    const userResponse = await fetch('https://api.elevenlabs.io/v1/user', {
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY,
      },
      // @ts-ignore
      agent,
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error(`❌ Ошибка ${userResponse.status}:`, errorText);
      
      if (userResponse.status === 401) {
        console.log('\n💡 Возможные причины:');
        console.log('   - Неверный API ключ');
        console.log('   - Проблема с оплатой подписки');
        console.log('   - API ключ отозван');
      }
      return;
    }
    
    const userData = await userResponse.json();
    console.log('✅ Пользователь найден:', JSON.stringify(userData, null, 2));
    
    // Тест 2: Генерация тестового звука
    console.log('\n📋 Тест 2: Генерация тестового звука...');
    console.log('⏳ Генерирую "simple keyboard click sound"...');
    
    const soundResponse = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'simple keyboard click sound',
        duration_seconds: 1,
        prompt_influence: 0.5,
      }),
      // @ts-ignore
      agent,
    });
    
    if (!soundResponse.ok) {
      const errorText = await soundResponse.text();
      console.error(`❌ Ошибка генерации ${soundResponse.status}:`, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail?.status === 'payment_issue') {
          console.log('\n💳 Проблема с оплатой подписки');
          console.log('   Проверьте: https://elevenlabs.io/app/subscription');
        }
      } catch (e) {
        // Не JSON ответ
      }
      return;
    }
    
    const soundBlob = await soundResponse.arrayBuffer();
    console.log(`✅ Звук сгенерирован: ${soundBlob.byteLength} байт`);
    console.log('\n✅ Все тесты пройдены! Ключ работает через прокси.');
    
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Проблема с подключением через прокси');
    }
  }
}

testKey().catch(console.error);

