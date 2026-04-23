import { Injectable } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, ...meta }) =>
            `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
          ),
        ),
      }),
    ];

    if (process.env.LOKI_URL) {
      try {
        const LokiTransport = require('winston-loki');
        transports.push(new LokiTransport({
          host: process.env.LOKI_URL,
          labels: { app: 'url-shortener' },
          json: true,
          format: winston.format.json(),
          replaceTimestamp: true,
          onConnectionError: (err) => console.error('Loki error:', err),
        }));
      } catch (e) { console.warn('Loki not available'); }
    }

    this.logger = winston.createLogger({ level: 'info', transports });
  }

  log(message: string, meta?: Record<string, any>) { this.logger.info(message, meta); }
  error(message: string, meta?: Record<string, any>) { this.logger.error(message, meta); }
  warn(message: string, meta?: Record<string, any>) { this.logger.warn(message, meta); }
}
