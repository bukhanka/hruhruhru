'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ProfessionPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [dialogAnswer, setDialogAnswer] = useState<string | null>(null);
  const [soundPlaying, setSoundPlaying] = useState(false);

  useEffect(() => {
    // Загружаем данные из сгенерированного JSON
    fetch(`/api/profession/${unwrappedParams.id}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading profession:', err);
        setLoading(false);
      });
  }, [unwrappedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-white text-xl">Загрузка профессии...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-white text-xl mb-4">Профессия не найдена</p>
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-slate-900 border-b border-white/10">
        <div className="container mx-auto px-4 py-8">
          <Link href="/" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
            ← Назад к поиску
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                🎯 {data.profession} <span className="text-gray-400">({data.level})</span>
              </h1>
              <p className="text-xl text-gray-300">
                📊 Найдено {data.vacancies?.toLocaleString() || 0} вакансий | Конкуренция: {data.competition || 'средняя'}
              </p>
            </div>
            <button
              onClick={() => setSoundPlaying(!soundPlaying)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition-colors"
            >
              {soundPlaying ? '🔊 Звук играет' : '🎧 Включить звук'}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Moodboard Visual */}
        <div className="mb-8 p-8 bg-slate-800/50 rounded-2xl border border-white/10">
          <h3 className="text-2xl font-semibold text-white mb-4">📸 Визуальная атмосфера</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.images?.map((img: string, i: number) => (
              <div key={i} className="aspect-square relative rounded-xl overflow-hidden border border-white/10 bg-slate-700/30">
                {img.startsWith('http') ? (
                  <img
                    src={img}
                    alt={`Визуал ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={img}
                    alt={`Визуал ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Timeline */}
        <div className="mb-8 p-8 bg-slate-800/50 rounded-2xl border border-white/10">
          <h3 className="text-2xl font-semibold text-white mb-6">📅 Твой типичный день</h3>
          <div className="space-y-4">
            {data.schedule?.map((item: any, i: number) => (
              <div key={i}>
                <div 
                  onClick={() => setSelectedTime(selectedTime === i ? null : i)}
                  className="p-4 bg-slate-700/50 rounded-xl border border-white/10 hover:border-purple-500 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{item.emoji}</span>
                      <div>
                        <div className="text-purple-400 font-mono font-semibold">{item.time}</div>
                        <div className="text-white font-medium">{item.title}</div>
                        <div className="text-gray-400 text-sm mt-1">{item.description}</div>
                      </div>
                    </div>
                    <div className="text-gray-500">
                      {selectedTime === i ? '▼' : '▶'}
                    </div>
                  </div>
                </div>
                {selectedTime === i && (
                  <div className="mt-2 ml-16 p-4 bg-slate-600/30 rounded-lg border-l-4 border-purple-500">
                    <p className="text-gray-300">{item.detail}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-8 p-8 bg-slate-800/50 rounded-2xl border border-white/10">
          <h3 className="text-2xl font-semibold text-white mb-6">🛠 Твой стек</h3>
          <div className="flex flex-wrap gap-3">
            {data.stack?.map((tech: string) => (
              <span key={tech} className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-300 font-medium hover:bg-purple-600/30 transition-colors">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Interactive Chat */}
        {data.dialog && (
          <div className="mb-8 p-8 bg-slate-800/50 rounded-2xl border border-white/10">
            <h3 className="text-2xl font-semibold text-white mb-6">💬 Диалог с командой</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-xl border border-white/10">
                <p className="text-white">{data.dialog.message}</p>
              </div>

              {!dialogAnswer ? (
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm">Выбери ответ:</p>
                  {data.dialog.options?.map((option: string) => (
                    <button
                      key={option}
                      onClick={() => setDialogAnswer(option)}
                      className="w-full p-3 bg-slate-700/30 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/50 rounded-lg text-white text-left transition-all"
                    >
                      ○ {option}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-purple-600/20 border border-purple-500/30 rounded-xl">
                    <p className="text-purple-300">Ты: {dialogAnswer}</p>
                  </div>
                  <div className="p-4 bg-green-600/20 border border-green-500/30 rounded-xl">
                    <p className="text-green-300">{data.dialog.response}</p>
                  </div>
                  <button 
                    onClick={() => setDialogAnswer(null)}
                    className="text-purple-400 hover:text-purple-300 text-sm"
                  >
                    ↺ Попробовать другой ответ
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="mb-8 p-8 bg-slate-800/50 rounded-2xl border border-white/10">
          <h3 className="text-2xl font-semibold text-white mb-6">💰 Твоя польза</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {data.benefits?.map((benefit: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-lg">
                <span className="text-2xl">{benefit.icon}</span>
                <p className="text-gray-300">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Job Market from HH.ru */}
        {(data.avgSalary || data.topCompanies?.length > 0) && (
          <div className="mb-8 p-8 bg-slate-800/50 rounded-2xl border border-white/10">
            <h3 className="text-2xl font-semibold text-white mb-6">💼 Рынок труда (данные HH.ru)</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {data.avgSalary && (
                <div className="p-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl">
                  <div className="text-gray-400 mb-2 text-sm">Средняя зарплата</div>
                  <div className="text-4xl font-bold text-purple-300">
                    {data.avgSalary.toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-gray-500 text-xs mt-1">на основе реальных вакансий</div>
                </div>
              )}
              
              <div className="p-4 bg-slate-700/30 rounded-xl">
                <div className="text-gray-400 mb-2 text-sm">Всего вакансий</div>
                <div className="text-3xl font-bold text-white">
                  {data.vacancies?.toLocaleString('ru-RU') || 0}
                </div>
                <div className="mt-2 inline-block px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm text-purple-300">
                  {data.competition} конкуренция
                </div>
              </div>
            </div>

            {data.topCompanies && data.topCompanies.length > 0 && (
              <div className="mt-6">
                <div className="text-gray-400 mb-3 text-sm font-medium">Топ работодатели:</div>
                <div className="flex flex-wrap gap-2">
                  {data.topCompanies.map((company: string, i: number) => (
                    <div key={i} className="px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-sm">
                      {company}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Career Path */}
        <div className="mb-8 p-8 bg-slate-800/50 rounded-2xl border border-white/10">
          <h3 className="text-2xl font-semibold text-white mb-6">📈 Карьерный путь</h3>
          <div className="relative">
            <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 hidden md:block"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
              {data.careerPath?.map((stage: any, i: number) => (
                <div key={i} className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${stage.current ? 'bg-purple-600 ring-4 ring-purple-400/30 text-2xl' : 'bg-slate-700 text-xl'}`}>
                    {stage.current ? '👤' : ''}
                  </div>
                  <div className={`font-semibold mb-1 ${stage.current ? 'text-purple-400' : 'text-white'}`}>
                    {stage.level}
                  </div>
                  <div className="text-gray-400 text-sm">{stage.years}</div>
                  <div className="text-gray-500 text-sm mt-1">{stage.salary}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-8 p-8 bg-slate-800/50 rounded-2xl border border-white/10">
          <h3 className="text-2xl font-semibold text-white mb-6">🎯 Скиллы для входа</h3>
          <div className="space-y-4">
            {data.skills?.map((skill: any) => (
              <div key={skill.name}>
                <div className="flex justify-between mb-2">
                  <span className="text-white font-medium">{skill.name}</span>
                  <span className="text-purple-400">{skill.level}%</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-1000"
                    style={{ width: `${skill.level}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* YouTube Videos */}
        {data.videos && data.videos.length > 0 && (
          <div className="mb-8 p-8 bg-slate-800/50 rounded-2xl border border-white/10">
            <h3 className="text-2xl font-semibold text-white mb-6">
              🎥 День в профессии (видео)
            </h3>
            
            {/* Главное видео */}
            <div className="mb-6">
              <div className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-900">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${data.videos[0].videoId}`}
                  title={data.videos[0].title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="mt-2 text-gray-300 text-sm">
                {data.videos[0].title}
              </div>
              <div className="text-gray-500 text-xs">
                {data.videos[0].channelTitle}
              </div>
            </div>

            {/* Дополнительные видео */}
            {data.videos.length > 1 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Ещё видео:</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  {data.videos.slice(1, 4).map((video: any) => (
                    <a
                      key={video.videoId}
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block bg-slate-700/30 rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all"
                    >
                      <div className="relative aspect-video bg-slate-700">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h5 className="text-white text-sm font-medium line-clamp-2">
                          {video.title}
                        </h5>
                        <p className="text-gray-400 text-xs mt-1">
                          {video.channelTitle}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link 
            href="/"
            className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
          >
            Попробовать другую профессию
          </Link>
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all">
            Скачать PDF карточку
          </button>
        </div>

        {/* Generation Info */}
        {data.generatedAt && (
          <div className="mt-8 text-center text-gray-500 text-sm">
            Сгенерировано: {new Date(data.generatedAt).toLocaleString('ru-RU')}
          </div>
        )}
      </div>
    </div>
  );
}
