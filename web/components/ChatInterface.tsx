'use client';

import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { Message } from '@/types/chat';
import Link from 'next/link';
import Image from 'next/image';

export default function ChatInterface({ onClose }: { onClose?: () => void }) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    messages, 
    isTyping, 
    persona,
    addMessage, 
    setTyping, 
    setPersona,
    setConversationStage,
    clearChat,
  } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    addMessage({
      role: 'user',
      type: 'text',
      content: text,
    });

    setInputValue('');
    setTyping(true);

    try {
      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
          persona: persona,
        }),
      });

      const data = await response.json();

      // Update persona and stage
      if (data.persona) {
        setPersona(data.persona);
      }
      if (data.stage) {
        setConversationStage(data.stage);
      }

      // Add assistant response
      addMessage({
        role: 'assistant',
        type: data.message.type || 'text',
        content: data.message.content,
        buttons: data.message.buttons,
        cards: data.message.cards,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        role: 'assistant',
        type: 'text',
        content: 'Извини, произошла ошибка. Попробуй еще раз.',
      });
    } finally {
      setTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleButtonClick = (buttonText: string) => {
    sendMessage(buttonText);
  };

  const handleNewChat = () => {
    clearChat();
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      {onClose && (
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">AI-Ассистент</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleNewChat}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
            >
              Новый чат
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Привет! Я помогу тебе найти профессию мечты
            </h3>
            <p className="text-gray-400">
              Расскажи, что ищешь, или напиши "не знаю", если не уверен
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} onButtonClick={handleButtonClick} />
        ))}

        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
              AI
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl px-4 py-3 border border-white/20">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-white/10 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Напиши сообщение..."
            disabled={isTyping}
            className="flex-1 px-6 py-4 text-lg rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isTyping || !inputValue.trim()}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white rounded-2xl font-medium transition-colors"
          >
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ 
  message, 
  onButtonClick 
}: { 
  message: Message; 
  onButtonClick: (text: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          AI
        </div>
      )}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          You
        </div>
      )}

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`inline-block max-w-2xl rounded-2xl px-5 py-3 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-white/10 backdrop-blur-lg border border-white/20 text-white'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* Buttons */}
          {message.buttons && message.buttons.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.buttons.map((button, idx) => (
                <button
                  key={idx}
                  onClick={() => onButtonClick(button)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {button}
                </button>
              ))}
            </div>
          )}

          {/* Cards */}
          {message.cards && message.cards.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {message.cards.map((card) => (
                <Link
                  key={card.slug}
                  href={`/profession/${card.slug}`}
                  className="group p-4 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:border-purple-500/50 transition-all hover:scale-105"
                >
                  {card.image && (
                    <div className="aspect-video relative rounded-lg overflow-hidden mb-3 bg-slate-700/50">
                      {card.image.startsWith('http') ? (
                        <img
                          src={card.image}
                          alt={card.profession}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={card.image}
                          alt={card.profession}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  )}
                  <h4 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                    {card.profession}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {card.level} • {card.company}
                  </p>
                  {card.description && (
                    <p className="text-gray-300 text-sm mt-2">{card.description}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

