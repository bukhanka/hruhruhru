// Система логирования с метриками времени

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  duration?: number;
  metadata?: Record<string, any>;
}

class Logger {
  private enabled: boolean;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor() {
    this.enabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_LOGS === 'true';
  }

  private formatMessage(entry: LogEntry): string {
    const duration = entry.duration !== undefined ? ` [${entry.duration.toFixed(2)}ms]` : '';
    const metadata = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}${duration}${metadata}`;
  }

  private log(level: LogLevel, category: string, message: string, metadata?: Record<string, any>, duration?: number) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      duration,
      metadata,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.enabled) {
      const formatted = this.formatMessage(entry);
      switch (level) {
        case 'debug':
          console.debug(formatted);
          break;
        case 'info':
          console.log(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'error':
          console.error(formatted);
          break;
      }
    }
  }

  debug(category: string, message: string, metadata?: Record<string, any>) {
    this.log('debug', category, message, metadata);
  }

  info(category: string, message: string, metadata?: Record<string, any>) {
    this.log('info', category, message, metadata);
  }

  warn(category: string, message: string, metadata?: Record<string, any>) {
    this.log('warn', category, message, metadata);
  }

  error(category: string, message: string, error?: any, metadata?: Record<string, any>) {
    const errorMetadata = {
      ...metadata,
      error: error?.message || error,
      stack: error?.stack,
    };
    this.log('error', category, error?.message || String(error), errorMetadata);
  }

  // Метрика времени выполнения
  async time<T>(category: string, operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const start = Date.now();
    this.info(category, `⏱️  Начало: ${operation}`, metadata);
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(category, `✅ Завершено: ${operation}`, { ...metadata, duration }, duration);
      return result;
    } catch (error: any) {
      const duration = Date.now() - start;
      this.error(category, `❌ Ошибка: ${operation}`, error, { ...metadata, duration });
      throw error;
    }
  }

  // Получить все логи по категории
  getLogs(category?: string, level?: LogLevel): LogEntry[] {
    return this.logs.filter(log => {
      if (category && log.category !== category) return false;
      if (level && log.level !== level) return false;
      return true;
    });
  }

  // Получить статистику по категории
  getStats(category: string): { count: number; avgDuration: number; totalDuration: number } {
    const categoryLogs = this.getLogs(category);
    const withDuration = categoryLogs.filter(log => log.duration !== undefined);
    const totalDuration = withDuration.reduce((sum, log) => sum + (log.duration || 0), 0);
    const avgDuration = withDuration.length > 0 ? totalDuration / withDuration.length : 0;

    return {
      count: categoryLogs.length,
      avgDuration,
      totalDuration,
    };
  }

  // Очистить логи
  clear() {
    this.logs = [];
  }
}

export const logger = new Logger();

