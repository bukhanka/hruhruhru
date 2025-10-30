'use client';

import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { Message } from '@/types/chat';
import Link from 'next/link';

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
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col bg-white">
      <ChatHeader onClose={onClose} onReset={handleNewChat} />

      <div className="flex-1 overflow-y-auto bg-hh-gray-50 px-4 py-5 sm:px-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-5xl">🤖</div>
            <h3 className="mt-4 text-lg font-semibold text-text-primary">
              Привет! Я помогу почувствовать профессию
            </h3>
            <p className="mt-2 max-w-sm text-sm text-text-secondary">
              Напиши, чем хочешь заниматься, или выбери готовую подсказку ниже — я уточню детали и соберу для тебя
              персональный вайб.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['Frontend разработчик', 'Бариста в кофейне', 'DevOps-инженер'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleButtonClick(preset)}
                  className="rounded-full border border-hh-gray-200 bg-white px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-hh-red hover:text-hh-red"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} onButtonClick={handleButtonClick} />
          ))}

          {isTyping && (
            <div className="flex items-end gap-2">
              <AssistantAvatar />
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <TypingDot delay="0ms" />
                  <TypingDot delay="120ms" />
                  <TypingDot delay="240ms" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-hh-gray-200 bg-white px-4 py-3 safe-area-inset-bottom sm:px-6">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Сообщение..."
            disabled={isTyping}
            className="flex-1 rounded-full border border-hh-gray-200 bg-hh-gray-50 px-4 py-3 text-base text-text-primary shadow-sm placeholder:text-text-secondary focus:border-hh-blue focus:outline-none focus:ring-2 focus:ring-hh-blue/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isTyping || !inputValue.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-hh-red text-white transition hover:bg-hh-red-dark disabled:bg-hh-gray-200"
            aria-label="Отправить сообщение"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onButtonClick,
}: {
  message: Message;
  onButtonClick: (text: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <AssistantAvatar />}

      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${isUser ? 'rounded-br-sm bg-hh-blue text-white' : 'rounded-bl-sm bg-white text-text-primary shadow'} `}>
        <p className="whitespace-pre-wrap text-base leading-relaxed">
          {message.content}
        </p>

        {message.buttons && message.buttons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.buttons.map((button, index) => (
              <button
                key={index}
                onClick={() => onButtonClick(button)}
                className="rounded-full border border-hh-gray-200 bg-white px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-hh-red hover:text-hh-red"
              >
                {button}
              </button>
            ))}
          </div>
        )}

        {message.cards && message.cards.length > 0 && (
          <div className="mt-4 grid gap-3">
            {message.cards.map((card) => (
              <Link
                key={card.slug}
                href={`/profession/${card.slug}`}
                className="flex flex-col gap-3 rounded-2xl border border-hh-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {card.image && (
                  <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-hh-gray-100">
                    <img src={card.image} alt={card.profession} className="h-full w-full object-cover" />
                  </div>
                )}
                <div>
                  <h4 className="text-base font-semibold text-text-primary">{card.profession}</h4>
                  <p className="mt-1 text-xs uppercase tracking-wide text-text-secondary">
                    {card.level} • {card.company}
                  </p>
                  {card.description && (
                    <p className="mt-2 text-sm text-text-secondary">{card.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-hh-blue text-xs font-semibold text-white">
          Ты
        </div>
      )}
    </div>
  );
}

function ChatHeader({ onClose, onReset }: { onClose?: () => void; onReset: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-hh-gray-200 bg-white px-4 py-3 safe-area-inset-top sm:px-6">
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Закрыть чат"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-hh-gray-200 text-lg"
        >
          ←
        </button>
      )}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hh-red text-sm font-bold text-white">
          hh
        </div>
        <div>
          <div className="text-sm font-semibold text-text-primary">AI ассистент</div>
          <div className="text-xs text-[#00a854]">Онлайн</div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onReset}
          className="rounded-full border border-hh-gray-200 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-hh-blue hover:text-hh-blue"
        >
          Новый диалог
        </button>
      </div>
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-hh-red text-xs font-semibold text-white">
      hh
    </div>
  );
}

function TypingDot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-text-secondary"
      style={{ animationDelay: delay }}
    ></span>
  );
}

