'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const [availableProfessions, setAvailableProfessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем список доступных профессий
    fetch('/api/professions')
      .then(res => res.json())
      .then(data => {
        setAvailableProfessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading professions:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">
            Генератор <span className="text-purple-400">Вайба</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Почувствуй атмосферу профессии изнутри. Узнай, каково это — работать в той или иной роли
          </p>
        </div>

        {/* Chat Interface */}
        {!showChat ? (
          <div className="max-w-3xl mx-auto mb-12">
            <div 
              onClick={() => setShowChat(true)}
              className="cursor-pointer p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:border-purple-500 transition-all hover:scale-105"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Начни разговор с AI-ассистентом
                </h3>
                <p className="text-gray-300 mb-4">
                  Расскажи, какую профессию ищешь, или просто напиши "не знаю" — я помогу разобраться
                </p>
                <div className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl font-medium">
                  Начать чат 🚀
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto mb-12 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden" style={{ height: '600px' }}>
            <ChatInterface onClose={() => setShowChat(false)} />
          </div>
        )}

        {/* Available Professions */}
        {availableProfessions.length > 0 && (
          <div className="max-w-5xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Доступные профессии:
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {availableProfessions.map((prof) => (
                <Link
                  key={prof.slug}
                  href={`/profession/${prof.slug}`}
                  className="group p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:border-purple-500/50 transition-all hover:scale-105"
                >
                  {prof.image && (
                    <div className="aspect-square relative rounded-lg overflow-hidden mb-4 bg-slate-700/50">
                      {prof.image.startsWith('http') ? (
                        <img
                          src={prof.image}
                          alt={prof.profession}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={prof.image}
                          alt={prof.profession}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {prof.profession}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    {prof.level} • {prof.company}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-400">
                      {prof.vacancies ? `${prof.vacancies.toLocaleString()} вакансий` : 'N/A'}
                    </span>
                    <span className="text-gray-500">
                      {prof.competition || 'средняя'} конкуренция
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No professions generated yet */}
        {!loading && availableProfessions.length === 0 && (
          <div className="text-center max-w-2xl mx-auto mb-12 p-8 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Профессии ещё не сгенерированы
            </h3>
            <p className="text-gray-300 mb-4">
              Запусти скрипт генерации чтобы создать контент:
            </p>
            <code className="block bg-slate-800 px-4 py-3 rounded-lg text-purple-400 font-mono text-sm mb-4">
              npm run generate
            </code>
            <p className="text-gray-400 text-sm">
              Убедись что добавил GOOGLE_API_KEY в .env.local
            </p>
          </div>
        )}

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          <div className="p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-xl font-semibold text-white mb-2">Типичный день</h3>
            <p className="text-gray-400">Узнай, как проходит рабочий день от утра до вечера</p>
          </div>
          
          <div className="p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
            <div className="text-4xl mb-3">🎧</div>
            <h3 className="text-xl font-semibold text-white mb-2">Атмосфера</h3>
            <p className="text-gray-400">Слушай звуки рабочего процесса и окружения</p>
          </div>
          
          <div className="p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-xl font-semibold text-white mb-2">Живое общение</h3>
            <p className="text-gray-400">Интерактивные диалоги с коллегами из команды</p>
          </div>
        </div>
      </div>
    </div>
  );
}
